"""Gene-related API endpoints."""

import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from api.models import (
    Annotation,
    AnnotationModel,
    BasePair,
    BasePairModel,
    Gene,
    GeneCreate,
    GenePublic,
    GeneUpdate,
    Literature,
    LiteraturePublic,
    Nucleotide,
    NucleotideModel,
    RNAStructure,
    RNAStructureCreate,
    StructuralFeature,
    StructuralFeatureModel,
    VariantPublic,
)
from api.routers.auth import require_admin
from rnudb_utils.database import audit_log, get_db

router = APIRouter()

_ALLOWED_GENE_COLUMNS = {
    "name",
    "fullName",
    "chromosome",
    "start",
    "end",
    "strand",
    "sequence",
    "description",
}


@router.get("/genes", response_model=list[GenePublic])
async def get_all_genes(db: Session = Depends(get_db)):
    """Get all genes"""
    genes = db.execute(select(Gene)).scalars().all()
    return [GenePublic.model_validate(g) for g in genes]


@router.get("/genes/{gene_id}", response_model=GenePublic)
async def get_gene(gene_id: str, db: Session = Depends(get_db)):
    """Get specific gene by ID"""
    gene = db.get(Gene, gene_id)
    if not gene:
        raise HTTPException(status_code=404, detail="Gene not found")
    return GenePublic.model_validate(gene)


@router.post("/genes", response_model=GenePublic)
async def create_gene(
    gene: GeneCreate,
    request: Request,
    db: Session = Depends(get_db),
    fetch_population_data: bool = True,
):
    """Create a new gene (curator only)"""
    user = require_admin(request)

    if db.get(Gene, gene.id):
        raise HTTPException(status_code=409, detail=f"Gene {gene.id} already exists")

    new_gene = Gene.model_validate(gene)
    db.add(new_gene)
    db.commit()
    db.refresh(new_gene)

    audit_log("genes", gene.id, "CREATE", None, gene.model_dump(), user["github_login"])

    if fetch_population_data:
        from rnudb_utils import query_all_of_us_variants, query_gnomad_variants
        from rnudb_utils.database import SessionLocal

        chrom = (
            gene.chromosome
            if not gene.chromosome.startswith("chr")
            else gene.chromosome[3:]
        )

        gnomad_variants = query_gnomad_variants(chrom, gene.start, gene.end) if query_gnomad_variants else []
        aou_variants = query_all_of_us_variants(chrom, gene.start, gene.end) if query_all_of_us_variants else []

        gnomad_count = len(gnomad_variants)
        aou_count = len(aou_variants)

        variants_to_insert = []

        for v in gnomad_variants:
            variants_to_insert.append({
                "id": f"chr{chrom}-{v['position']}-{v['ref']}-{v['alt']}",
                "geneId": gene.id,
                "position": v["position"],
                "ref": v["ref"],
                "alt": v["alt"],
                "gnomad_ac": v.get("gnomad_ac"),
                "gnomad_hom": v.get("gnomad_hom"),
                "aou_ac": None,
                "aou_hom": None,
            })

        for v in aou_variants:
            vid = f"chr{chrom}-{v['position']}-{v.get('ref', '')}-{v.get('alt', '')}"
            existing = next((x for x in variants_to_insert if x["id"] == vid), None)
            if existing:
                existing["aou_ac"] = v.get("aou_ac")
                existing["aou_hom"] = v.get("aou_hom")
            else:
                variants_to_insert.append({
                    "id": vid,
                    "geneId": gene.id,
                    "position": v["position"],
                    "ref": v.get("ref", ""),
                    "alt": v.get("alt", ""),
                    "gnomad_ac": None,
                    "gnomad_hom": None,
                    "aou_ac": v.get("aou_ac"),
                    "aou_hom": v.get("aou_hom"),
                })

        for v in variants_to_insert:
            db.execute(
                text("""
                    INSERT INTO variants (id, geneId, position, ref, alt, gnomad_ac, gnomad_hom, aou_ac, aou_hom)
                    VALUES (:id, :geneId, :position, :ref, :alt, :gnomad_ac, :gnomad_hom, :aou_ac, :aou_hom)
                    ON CONFLICT(id) DO UPDATE SET
                        gnomad_ac = EXCLUDED.gnomad_ac,
                        gnomad_hom = EXCLUDED.gnomad_hom,
                        aou_ac = EXCLUDED.aou_ac,
                        aou_hom = EXCLUDED.aou_hom
                """),
                v
            )

        db.commit()

        audit_log(
            "variants",
            "population_import",
            "CREATE",
            None,
            {"geneId": gene.id, "gnomad_count": gnomad_count, "aou_count": aou_count},
            "system",
            db,
        )

    return GenePublic.model_validate(new_gene)


@router.put("/genes/{gene_id}", response_model=GenePublic)
async def update_gene(
    gene_id: str, gene: GeneUpdate, request: Request, db: Session = Depends(get_db)
):
    """Update an existing gene (curator only)"""
    user = require_admin(request)

    existing = db.get(Gene, gene_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Gene not found")

    old_values = existing.model_dump()

    for field, value in gene.model_dump(exclude_unset=True).items():
        if field in _ALLOWED_GENE_COLUMNS:
            setattr(existing, field, value)

    db.commit()

    audit_log(
        "genes",
        gene_id,
        "UPDATE",
        old_values,
        gene.model_dump(exclude_unset=True),
        user["github_login"],
    )

    updated = db.get(Gene, gene_id)
    return GenePublic.model_validate(updated)


@router.post("/genes/{gene_id}/refresh-variants", response_model=GenePublic)
async def refresh_gene_variants(
    gene_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """Refresh population data (gnomAD and All of Us) for a gene (curator only)"""
    user = require_admin(request)

    gene = db.get(Gene, gene_id)
    if not gene:
        raise HTTPException(status_code=404, detail="Gene not found")

    chrom = gene.chromosome
    if not chrom.startswith("chr"):
        chrom = chrom[3:]
    chrom = f"chr{chrom}"

    from rnudb_utils import query_all_of_us_variants, query_gnomad_variants

    gnomad_variants = query_gnomad_variants(chrom, gene.start, gene.end) if query_gnomad_variants else []
    aou_variants = query_all_of_us_variants(chrom, gene.start, gene.end) if query_all_of_us_variants else []

    gnomad_count = len(gnomad_variants)
    aou_count = len(aou_variants)

    variants_to_insert = []

    for v in gnomad_variants:
        variants_to_insert.append({
            "id": f"chr{chrom}-{v['position']}-{v['ref']}-{v['alt']}",
            "geneId": gene.id,
            "position": v["position"],
            "ref": v["ref"],
            "alt": v["alt"],
            "gnomad_ac": v.get("gnomad_ac"),
            "gnomad_hom": v.get("gnomad_hom"),
            "aou_ac": None,
            "aou_hom": None,
        })

    for v in aou_variants:
        vid = f"chr{chrom}-{v['position']}-{v.get('ref', '')}-{v.get('alt', '')}"
        existing = next((x for x in variants_to_insert if x["id"] == vid), None)
        if existing:
            existing["aou_ac"] = v.get("aou_ac")
            existing["aou_hom"] = v.get("aou_hom")
        else:
            variants_to_insert.append({
                "id": vid,
                "geneId": gene.id,
                "position": v["position"],
                "ref": v.get("ref", ""),
                "alt": v.get("alt", ""),
                "gnomad_ac": None,
                "gnomad_hom": None,
                "aou_ac": v.get("aou_ac"),
                "aou_hom": v.get("aou_hom"),
            })

    for v in variants_to_insert:
        db.execute(
            text("""
                INSERT INTO variants (id, geneId, position, ref, alt, gnomad_ac, gnomad_hom, aou_ac, aou_hom)
                VALUES (:id, :geneId, :position, :ref, :alt, :gnomad_ac, :gnomad_hom, :aou_ac, :aou_hom)
                ON CONFLICT(id) DO UPDATE SET
                    gnomad_ac = EXCLUDED.gnomad_ac,
                    gnomad_hom = EXCLUDED.gnomad_hom,
                    aou_ac = EXCLUDED.aou_ac,
                    aou_hom = EXCLUDED.aou_hom
            """),
            v
        )

    db.commit()

    audit_log(
        "variants",
        "population_refresh",
        "UPDATE",
        None,
        {"geneId": gene.id, "gnomad_count": gnomad_count, "aou_count": aou_count},
        user["github_login"],
        db,
    )

    return GenePublic.model_validate(gene)


@router.delete("/genes/{gene_id}")
async def delete_gene(gene_id: str, request: Request, db: Session = Depends(get_db)):
    """Delete a gene and all associated data (curator only)"""
    user = require_admin(request)

    existing = db.get(Gene, gene_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Gene not found")

    old_values = existing.model_dump()

    # Delete associated data
    db.execute(
        text("DELETE FROM variants WHERE geneId = :gene_id"), {"gene_id": gene_id}
    )
    db.execute(
        text("DELETE FROM rna_structures WHERE geneId = :gene_id"), {"gene_id": gene_id}
    )
    db.delete(existing)
    db.commit()

    audit_log("genes", gene_id, "DELETE", old_values, None, user["github_login"])

    return {"message": f"Gene {gene_id} deleted"}


@router.get("/genes/{gene_id}/variants", response_model=list[VariantPublic])
async def get_gene_variants(gene_id: str, db: Session = Depends(get_db)):
    """Get all variants for a specific gene"""
    sql = text("""
        SELECT v.*,
               GROUP_CONCAT(DISTINCT vl1.variant_id_2) as linked_ids_1,
               GROUP_CONCAT(DISTINCT vl2.variant_id_1) as linked_ids_2
        FROM variants v
        LEFT JOIN variant_links vl1 ON v.id = vl1.variant_id_1
        LEFT JOIN variant_links vl2 ON v.id = vl2.variant_id_2
        WHERE v.geneId = :gene_id
        GROUP BY v.id
    """)

    rows = db.execute(sql, {"gene_id": gene_id}).fetchall()

    variant_classifications_sql = text("""
        SELECT variant_id, literature_id, clinical_significance, zygosity,
               disease, linked_variant_ids
        FROM variant_classifications
    """)
    classifications_rows = db.execute(variant_classifications_sql).fetchall()

    classifications_by_variant = {}
    for row in classifications_rows:
        row_dict = dict(row._mapping)
        vid = row_dict["variant_id"]
        if vid not in classifications_by_variant:
            classifications_by_variant[vid] = []
        classifications_by_variant[vid].append(row_dict)

    hgvs_by_variant = {row["id"]: row["hgvs"] for row in rows if row.get("hgvs")}

    variants = []
    for row in rows:
        row_dict = dict(row._mapping)
        linked_ids = []
        if row_dict.get("linked_ids_1"):
            linked_ids.extend(row_dict["linked_ids_1"].split(","))
        if row_dict.get("linked_ids_2"):
            linked_ids.extend(row_dict["linked_ids_2"].split(","))
        row_dict.pop("linked_ids_1", None)
        row_dict.pop("linked_ids_2", None)
        if linked_ids:
            row_dict["linkedVariantIds"] = linked_ids

        variant_id = row_dict["id"]
        classifications = classifications_by_variant.get(variant_id, [])

        if classifications:
            primary_class = classifications[0]
            row_dict["clinical_significance"] = primary_class.get(
                "clinical_significance"
            )
            row_dict["disease_type"] = primary_class.get("disease")
            row_dict["zygosity"] = primary_class.get("zygosity")
            row_dict["clinvar_significance"] = primary_class.get("clinvar_significance")
            
            linked_ids = primary_class.get("linked_variant_ids")
            if linked_ids:
                linked_id_list = [v.strip() for v in linked_ids.split(",") if v.strip()]
                linked_hgvs = []
                for lid in linked_id_list:
                    hgvs = hgvs_by_variant.get(lid)
                    if hgvs:
                        linked_hgvs.append(hgvs)
                if linked_hgvs:
                    row_dict["linkedVariantIds"] = linked_hgvs

        variants.append(VariantPublic(**row_dict))

    return variants


@router.get("/genes/{gene_id}/literature", response_model=list[LiteraturePublic])
async def get_gene_literature(gene_id: str, db: Session = Depends(get_db)):
    """Get all literature (gene associations removed)"""
    literature = db.execute(select(Literature)).scalars().all()
    return [LiteraturePublic.model_validate(lit) for lit in literature]


@router.get("/genes/{gene_id}/pdb", response_class=JSONResponse)
async def get_gene_pdb(gene_id: str):
    """Serve a static PDB file for a given gene (demo: rnu4-2 only)"""
    if gene_id != "RNU4-2":
        raise HTTPException(status_code=404, detail="PDB not found for this gene")
    pdb_path = Path(__file__).parent.parent.parent / "data" / "rnu4-2" / "structure.pdb"
    if not pdb_path.exists():
        raise HTTPException(status_code=404, detail="PDB file missing")
    return {
        "geneId": gene_id,
        "pdbData": pdb_path.read_text(),
    }


@router.get("/genes/{gene_id}/structures", response_model=list[RNAStructureCreate])
async def get_gene_structures(gene_id: str, db: Session = Depends(get_db)):
    """Get all RNA structures for a specific gene"""
    structures = (
        db.execute(select(RNAStructure).where(RNAStructure.geneId == gene_id))
        .scalars()
        .all()
    )

    if not structures:
        raise HTTPException(status_code=404, detail="Structure not found")

    result = []
    for structure in structures:
        # Query nucleotides
        nucleotide_rows = (
            db.execute(
                select(Nucleotide).where(Nucleotide.structure_id == structure.id)
            )
            .scalars()
            .all()
        )
        nucleotides = [NucleotideModel.model_validate(row) for row in nucleotide_rows]

        # Query base pairs
        base_pair_rows = (
            db.execute(select(BasePair).where(BasePair.structure_id == structure.id))
            .scalars()
            .all()
        )
        base_pairs = [
            BasePairModel(from_pos=row.from_pos, to_pos=row.to_pos)
            for row in base_pair_rows
        ]

        # Query annotations
        annotation_rows = (
            db.execute(
                select(Annotation).where(Annotation.structure_id == structure.id)
            )
            .scalars()
            .all()
        )
        annotations = [AnnotationModel.model_validate(row) for row in annotation_rows]

        # Query structural features
        feature_rows = (
            db.execute(
                select(StructuralFeature).where(
                    StructuralFeature.structure_id == structure.id
                )
            )
            .scalars()
            .all()
        )
        structural_features = []
        for row in feature_rows:
            feature = {
                "id": row.id,
                "feature_type": row.feature_type,
                "nucleotide_ids": (
                    json.loads(row.nucleotide_ids) if row.nucleotide_ids else []
                ),
                "label_text": row.label_text,
                "label_x": row.label_x,
                "label_y": row.label_y,
                "label_font_size": row.label_font_size,
                "label_color": row.label_color,
                "description": row.description,
                "color": row.color,
            }
            structural_features.append(StructuralFeatureModel(**feature))

        result.append(
            RNAStructureCreate(
                id=structure.id,
                gene_id=structure.geneId,
                nucleotides=nucleotides,
                base_pairs=base_pairs,
                annotations=annotations,
                structural_features=structural_features,
            )
        )

    return result


@router.delete("/genes/{gene_id}/structures/{structure_id}")
async def delete_gene_structure(
    gene_id: str, structure_id: str, request: Request, db: Session = Depends(get_db)
):
    """Delete a specific RNA structure (curator only)"""
    user = require_admin(request)

    existing = db.execute(
        select(RNAStructure).where(
            RNAStructure.id == structure_id, RNAStructure.geneId == gene_id
        )
    ).scalar_one_or_none()

    if not existing:
        raise HTTPException(status_code=404, detail="Structure not found")

    old_values = existing.model_dump()

    # Delete related data
    db.execute(
        text("DELETE FROM structural_features WHERE structure_id = :sid"),
        {"sid": structure_id},
    )
    db.execute(
        text("DELETE FROM annotations WHERE structure_id = :sid"),
        {"sid": structure_id},
    )
    db.execute(
        text("DELETE FROM base_pairs WHERE structure_id = :sid"),
        {"sid": structure_id},
    )
    db.execute(
        text("DELETE FROM nucleotides WHERE structure_id = :sid"),
        {"sid": structure_id},
    )
    db.delete(existing)
    db.commit()

    audit_log(
        "rna_structures", structure_id, "DELETE", old_values, None, user["github_login"]
    )

    return {"message": f"Structure {structure_id} deleted"}
