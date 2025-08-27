"""External API queries for genomic data"""

import requests
import time
from typing import List, Dict, Any, Optional
import re


def query_gnomad_variants(chromosome: str, start: int, end: int, reference_genome: str = "GRCh38") -> List[Dict[str, Any]]:
    """
    Query gnomAD API for variants in a genomic region
    
    Args:
        chromosome: Chromosome (e.g., "1", "2", "X")
        start: Start position (1-based)
        end: End position (1-based)
        reference_genome: "GRCh37" or "GRCh38"
    
    Returns:
        List of variants with ac and homozygote counts
    """
    
    # Construct GraphQL query for region
    query = f"""
    query VariantsInRegion {{
      region(chrom: "{chromosome}", start: {start}, stop: {end}, reference_genome: {reference_genome}) {{
        variants(dataset: gnomad_r4) {{
          variant_id
          pos
          ref
          alt
          rsids
          consequence
          
          # Get genome data (prioritize over exome)
          genome {{
            ac
            ac_hom
            an
            af
          }}
          
          # Fallback to exome if genome not available
          exome {{
            ac
            ac_hom
            an
            af
          }}
          
          # Joint data for latest datasets
          joint {{
            ac
            homozygote_count
            an
          }}
        }}
      }}
    }}
    """
    
    url = "https://gnomad.broadinstitute.org/api"
    headers = {
        'Content-Type': 'application/json',
    }
    
    try:
        response = requests.post(
            url,
            json={'query': query},
            headers=headers,
            timeout=30
        )
        response.raise_for_status()
        
        data = response.json()
        if 'errors' in data:
            print(f"gnomAD API errors: {data['errors']}")
            return []
            
        variants = data.get('data', {}).get('region', {}).get('variants', [])
        
        # Process variants to extract AC and homozygote counts
        processed_variants = []
        for variant in variants:
            processed_variant = {
                'variant_id': variant.get('variant_id'),
                'position': variant.get('pos'),
                'ref': variant.get('ref'),
                'alt': variant.get('alt'),
                'rsids': variant.get('rsids', []),
                'consequence': variant.get('consequence'),
                'gnomad_ac': None,
                'gnomad_hom': None,
                'gnomad_an': None,
                'gnomad_af': None
            }
            
            # Prioritize joint > genome > exome data
            if variant.get('joint'):
                processed_variant['gnomad_ac'] = variant['joint'].get('ac')
                processed_variant['gnomad_hom'] = variant['joint'].get('homozygote_count')
                processed_variant['gnomad_an'] = variant['joint'].get('an')
            elif variant.get('genome'):
                processed_variant['gnomad_ac'] = variant['genome'].get('ac')
                processed_variant['gnomad_hom'] = variant['genome'].get('ac_hom')
                processed_variant['gnomad_an'] = variant['genome'].get('an')
                processed_variant['gnomad_af'] = variant['genome'].get('af')
            elif variant.get('exome'):
                processed_variant['gnomad_ac'] = variant['exome'].get('ac')
                processed_variant['gnomad_hom'] = variant['exome'].get('ac_hom')
                processed_variant['gnomad_an'] = variant['exome'].get('an')
                processed_variant['gnomad_af'] = variant['exome'].get('af')
                
            processed_variants.append(processed_variant)
            
        return processed_variants
        
    except requests.exceptions.RequestException as e:
        print(f"Error querying gnomAD API: {e}")
        return []
    except Exception as e:
        print(f"Error processing gnomAD response: {e}")
        return []


def query_all_of_us_variants(chromosome: str, start: int, end: int, page_size: int = 200) -> List[Dict[str, Any]]:
    """
    Query All of Us API for variants in a genomic region
    
    Args:
        chromosome: Chromosome (e.g., "1", "2", "X") 
        start: Start position (1-based)
        end: End position (1-based)
        page_size: Number of results per page
    
    Returns:
        List of variants with allele counts and homozygote counts
    """
    
    # Format genomic region query (All of Us expects chr prefix)
    if not chromosome.startswith('chr'):
        region_query = f"chr{chromosome}:{start}-{end}"
    else:
        region_query = f"{chromosome}:{start}-{end}"
    
    url = "https://public.api.researchallofus.org/v1/genomics/search-variants"
    headers = {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'User-Agent': 'curl/8.0.0',
    }
    
    all_variants = []
    page_number = 1
    
    try:
        while True:
            payload = {
                "query": region_query,
                "pageNumber": page_number,
                "rowCount": page_size,
                "sortMetadata": {
                    "variantId": {"sortActive": True, "sortDirection": "asc", "sortOrder": 1}
                },
                "filterMetadata": None
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract variants from response
            variants = data.get('items', [])
            if not variants:
                break
                
            # Process variants
            for variant in variants:
                processed_variant = {
                    'variant_id': variant.get('variantId'),
                    'genes': variant.get('genes'),  # Note: plural "genes" not "gene"
                    'position': None,  # Extract from variantId if needed
                    'ref': None,       # Extract from variantId if needed  
                    'alt': None,       # Extract from variantId if needed
                    'consequence': variant.get('consequence'),
                    'variant_type': variant.get('variantType'),
                    'clinical_significance': variant.get('clinicalSignificance'),
                    'aou_ac': variant.get('alleleCount'),
                    'aou_hom': variant.get('homozygoteCount'),
                    'aou_an': variant.get('alleleNumber'),
                    'aou_af': variant.get('alleleFrequency')
                }
                
                # Parse variant ID to extract position and alleles if in standard format
                variant_id = variant.get('variantId', '')
                if variant_id:
                    # Try to parse format like "1-123456-A-T"
                    parts = variant_id.split('-')
                    if len(parts) >= 4:
                        processed_variant['position'] = int(parts[1]) if parts[1].isdigit() else None
                        processed_variant['ref'] = parts[2]
                        processed_variant['alt'] = parts[3]
                
                all_variants.append(processed_variant)
            
            # Check if we have more pages
            # If we got fewer results than requested, we're at the end
            if len(variants) < page_size:
                break
                
            page_number += 1
            
            # Add small delay to be respectful to API
            time.sleep(0.1)
            
        return all_variants
        
    except requests.exceptions.RequestException as e:
        print(f"Error querying All of Us API: {e}")
        return []
    except Exception as e:
        print(f"Error processing All of Us response: {e}")
        return []


