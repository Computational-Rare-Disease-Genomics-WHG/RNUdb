from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
from typing import List
from rnudb_utils.database import get_db_connection
from ..models import (
    SnRNAGene,
    Variant,
    Literature,
    RNAStructure,
    Nucleotide,
    BasePair,
    AnnotationLabel,
    StructuralFeature,
    StructuralFeatureLabel,
)

router = APIRouter()


@router.get("/genes", response_model=List[SnRNAGene])
async def get_all_genes():
    """Get all genes"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM genes")
        rows = cursor.fetchall()

        genes = []
        for row in rows:
            genes.append(SnRNAGene(**dict(row)))

        conn.close()
        return genes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/genes/{gene_id}", response_model=SnRNAGene)
async def get_gene(gene_id: str):
    """Get specific gene by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM genes WHERE id = ?", (gene_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Gene not found")

        gene = SnRNAGene(**dict(row))
        conn.close()
        return gene
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/genes/{gene_id}/variants", response_model=List[Variant])
async def get_gene_variants(gene_id: str):
    """Get all variants for a specific gene"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM variants WHERE geneId = ?", (gene_id,))
        rows = cursor.fetchall()

        variants = []
        for row in rows:
            variants.append(Variant(**dict(row)))

        conn.close()
        return variants
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/genes/{gene_id}/literature", response_model=List[Literature])
async def get_gene_literature(gene_id: str):
    """Get literature associated with a specific gene"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT l.*, GROUP_CONCAT(lg2.gene_id) as gene_ids
            FROM literature l
            JOIN literature_genes lg ON l.pmid = lg.pmid
            LEFT JOIN literature_genes lg2 ON l.pmid = lg2.pmid
            WHERE lg.gene_id = ?
            GROUP BY l.pmid
        """,
            (gene_id,),
        )
        rows = cursor.fetchall()

        literature = []
        for row in rows:
            row_dict = dict(row)
            gene_ids = row_dict.pop("gene_ids", "")
            associated_genes = gene_ids.split(",") if gene_ids else []
            row_dict["associatedGenes"] = associated_genes
            literature.append(Literature(**row_dict))

        conn.close()
        return literature
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/genes/{gene_id}/pdb", response_class=JSONResponse)
async def get_gene_pdb(gene_id: str):
    """Serve a static PDB file for a given gene (demo: rnu4-2 only)"""
    print(f"Requesting PDB for gene: {gene_id}")
    # For demo, only rnu4-2 is supported
    if gene_id != "RNU4-2":
        raise HTTPException(status_code=404, detail="PDB not found for this gene")
    pdb_path = Path(__file__).parent.parent.parent / "data" / "rnu4-2" / "structure.pdb"
    if not pdb_path.exists():
        raise HTTPException(status_code=404, detail="PDB file missing")
    return {
        "geneId": gene_id,
        "pdbData": pdb_path.read_text(),
    }


@router.get("/genes/{gene_id}/structure", response_model=RNAStructure)
async def get_gene_structure(gene_id: str):
    """Get RNA structure for a specific gene"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get structure info
        cursor.execute("SELECT * FROM rna_structures WHERE geneId = ?", (gene_id,))
        structure_row = cursor.fetchone()

        if not structure_row:
            raise HTTPException(status_code=404, detail="Structure not found")

        structure_id = structure_row["id"]

        # Get nucleotides
        cursor.execute(
            "SELECT * FROM nucleotides WHERE structure_id = ? ORDER BY id",
            (structure_id,),
        )
        nucleotide_rows = cursor.fetchall()

        nucleotides = []
        for row in nucleotide_rows:
            nucleotides.append(Nucleotide(**dict(row)))

        # Get base pairs
        cursor.execute(
            "SELECT * FROM base_pairs WHERE structure_id = ?", (structure_id,)
        )
        base_pair_rows = cursor.fetchall()

        base_pairs = []
        for row in base_pair_rows:
            row_dict = dict(row)
            base_pairs.append(
                BasePair(from_=row_dict["from_pos"], to=row_dict["to_pos"])
            )

        # Get annotations
        cursor.execute(
            "SELECT * FROM annotations WHERE structure_id = ?", (structure_id,)
        )
        annotation_rows = cursor.fetchall()

        annotations = []
        for row in annotation_rows:
            annotations.append(AnnotationLabel(**dict(row)))

        # Get structural features
        cursor.execute(
            "SELECT * FROM structural_features WHERE structure_id = ?", (structure_id,)
        )
        feature_rows = cursor.fetchall()

        structural_features = []
        for row in feature_rows:
            import json

            row_dict = dict(row)
            nucleotide_ids = json.loads(row_dict["nucleotide_ids"])

            structural_features.append(
                StructuralFeature(
                    id=row_dict["id"],
                    featureType=row_dict["feature_type"],
                    nucleotideIds=nucleotide_ids,
                    label=StructuralFeatureLabel(
                        text=row_dict["label_text"],
                        x=row_dict["label_x"],
                        y=row_dict["label_y"],
                        fontSize=row_dict["label_font_size"],
                        color=row_dict.get("label_color"),
                    ),
                    description=row_dict.get("description"),
                    color=row_dict.get("color"),
                )
            )

        structure = RNAStructure(
            id=structure_row["id"],
            geneId=structure_row["geneId"],
            nucleotides=nucleotides,
            basePairs=base_pairs,
            annotations=annotations,
            structuralFeatures=structural_features,
        )

        conn.close()
        return structure
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
