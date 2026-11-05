"""External API queries for genomic data"""

import time
from typing import Any

import requests


def merge_population_variants(
    gene_id: str,
    chromosome: str,
    start: int,
    end: int,
) -> list[dict[str, Any]]:
    """Fetch gnomAD + All of Us variants for a gene region and merge them.

    Returns a list of variant insert dicts keyed by ``chr<chrom>-<pos>-<ref>-<alt>``,
    with gnomAD and All of Us allele counts merged onto matching variants. External
    API failures are swallowed (returning fewer/no variants) so callers can safely
    use this outside a DB transaction during the approval workflow.
    """
    chrom = chromosome[3:] if chromosome.startswith("chr") else chromosome

    gnomad_variants = query_gnomad_variants(chrom, start, end)
    aou_variants = query_all_of_us_variants(chrom, start, end)

    variants_to_insert: list[dict[str, Any]] = []

    for v in gnomad_variants:
        variants_to_insert.append(
            {
                "id": f"chr{chrom}-{v['position']}-{v['ref']}-{v['alt']}",
                "geneId": gene_id,
                "position": v["position"],
                "ref": v["ref"],
                "alt": v["alt"],
                "gnomad_ac": v.get("gnomad_ac"),
                "gnomad_hom": v.get("gnomad_hom"),
                "gnomad_af": v.get("gnomad_af"),
                "aou_ac": None,
                "aou_hom": None,
                "aou_af": None,
            }
        )

    for v in aou_variants:
        if not v.get("position"):
            continue
        vid = f"chr{chrom}-{v['position']}-{v.get('ref', '')}-{v.get('alt', '')}"
        existing = next((x for x in variants_to_insert if x["id"] == vid), None)
        if existing:
            existing["aou_ac"] = v.get("aou_ac")
            existing["aou_hom"] = v.get("aou_hom")
            existing["aou_af"] = v.get("aou_af")
        else:
            variants_to_insert.append(
                {
                    "id": vid,
                    "geneId": gene_id,
                    "position": v["position"],
                    "ref": v.get("ref", ""),
                    "alt": v.get("alt", ""),
                    "gnomad_ac": None,
                    "gnomad_hom": None,
                    "gnomad_af": None,
                    "aou_ac": v.get("aou_ac"),
                    "aou_hom": v.get("aou_hom"),
                    "aou_af": v.get("aou_af"),
                }
            )

    return variants_to_insert


def query_gnomad_variants(
    chromosome: str, start: int, end: int, reference_genome: str = "GRCh38"
) -> list[dict[str, Any]]:
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
      region(chrom: "{chromosome}", start: {start}, stop: {end},
             reference_genome: {reference_genome}) {{
        variants(dataset: gnomad_r4) {{
          variant_id
          pos
          ref
          alt
          rsids
          consequence

          # Get genome data
          genome {{
            ac
            ac_hom
            an
            af
          }}
        }}
      }}
    }}
    """

    url = "https://gnomad.broadinstitute.org/api"
    headers = {
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            url, json={"query": query}, headers=headers, timeout=30
        )
        response.raise_for_status()

        data = response.json()
        if "errors" in data:
            print(f"gnomAD API errors: {data['errors']}")
            return []

        variants = data.get("data", {}).get("region", {}).get("variants", [])

        # Process variants to extract AC and homozygote counts
        processed_variants = []
        for variant in variants:
            processed_variant = {
                "variant_id": variant.get("variant_id"),
                "position": variant.get("pos"),
                "ref": variant.get("ref"),
                "alt": variant.get("alt"),
                "rsids": variant.get("rsids", []),
                "consequence": variant.get("consequence"),
                "gnomad_ac": None,
                "gnomad_hom": None,
                "gnomad_an": None,
                "gnomad_af": None,
            }

            # Use genome data
            if variant.get("genome"):
                processed_variant["gnomad_ac"] = variant["genome"].get("ac")
                processed_variant["gnomad_hom"] = variant["genome"].get("ac_hom")
                processed_variant["gnomad_an"] = variant["genome"].get("an")
                processed_variant["gnomad_af"] = variant["genome"].get("af")

            processed_variants.append(processed_variant)

        return processed_variants

    except requests.exceptions.RequestException as e:
        print(f"Error querying gnomAD API: {e}")
        return []
    except Exception as e:
        print(f"Error processing gnomAD response: {e}")
        return []


def query_all_of_us_variants(
    chromosome: str, start: int, end: int, page_size: int = 200
) -> list[dict[str, Any]]:
    """
    Query All of Us API for variants in a genomic region

    NOTE: The All of Us public API now requires a valid Origin header and
    authentication. Direct API access may return 403 Forbidden.

    For programmatic access, consider:
    1. Using the All of Us Researcher Workbench
    2. Exporting data from the workbench and importing locally
    3. Using a registered application with proper credentials

    Args:
        chromosome: Chromosome (e.g., "1", "2", "X")
        start: Start position (1-based)
        end: End position (1-based)
        page_size: Number of results per page

    Returns:
        List of variants with allele counts and homozygote counts
    """

    if not chromosome.startswith("chr"):
        region_query = f"chr{chromosome}:{start}-{end}"
    else:
        region_query = f"{chromosome}:{start}-{end}"

    url = "https://public.api.researchallofus.org/v1/genomics/search-variants"
    headers = {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Origin": "https://databrowser.researchallofus.org",
        "Referer": "https://databrowser.researchallofus.org/",
        "User-Agent": (  # noqa: E501
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
            " AppleWebKit/605.1.15 (KHTML, like Gecko)"
            " Version/26.2 Safari/605.1.15"
        ),
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
                    "variantId": {
                        "sortActive": True,
                        "sortDirection": "asc",
                        "sortOrder": 1,
                    }
                },
                "filterMetadata": None,
            }

            response = requests.post(url, json=payload, headers=headers, timeout=30)

            if response.status_code == 403:
                print("ERROR: All of Us API returned 403 Forbidden.")
                print("The public API endpoint requires authentication.")
                print("To access All of Us data programmatically:")
                print("  1. Use the All of Us Researcher Workbench")
                print("  2. Export data to a local file and import to RNUdb")
                print("  3. Use a registered application with proper credentials")
                return []

            response.raise_for_status()

            data = response.json()

            variants = data.get("items", [])
            if not variants:
                break

            for variant in variants:
                processed_variant = {
                    "variant_id": variant.get("variantId"),
                    "genes": variant.get("genes"),
                    "position": None,
                    "ref": None,
                    "alt": None,
                    "consequence": variant.get("consequence"),
                    "variant_type": variant.get("variantType"),
                    "clinical_significance": variant.get("clinicalSignificance"),
                    "aou_ac": variant.get("alleleCount"),
                    "aou_hom": variant.get("homozygoteCount"),
                    "aou_an": variant.get("alleleNumber"),
                    "aou_af": variant.get("alleleFrequency"),
                }

                variant_id = variant.get("variantId", "")
                if variant_id:
                    parts = variant_id.split("-")
                    if len(parts) >= 4:
                        processed_variant["position"] = (
                            int(parts[1]) if parts[1].isdigit() else None
                        )
                        processed_variant["ref"] = parts[2]
                        processed_variant["alt"] = parts[3]

                all_variants.append(processed_variant)

            if len(variants) < page_size:
                break

            page_number += 1
            time.sleep(0.1)

        return all_variants

    except requests.exceptions.RequestException as e:
        print(f"Error querying All of Us API: {e}")
        return []
    except Exception as e:
        print(f"Error processing All of Us response: {e}")
        return []
