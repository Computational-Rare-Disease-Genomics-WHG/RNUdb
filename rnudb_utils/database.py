"""Database utility functions for RNUdb - SQLModel version."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, select, update
from sqlalchemy.orm import Session, sessionmaker

from api.models import (
    Annotation,
    AuditLog,
    BasePair,
    Gene,
    Literature,
    LiteratureCount,
    Nucleotide,
    RNAStructure,
    StructuralFeature,
    User,
    Variant,
    VariantLink,
)

DATABASE_PATH = Path(__file__).parent.parent / "data" / "database.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}, future=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency - yields a SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session() -> Session:
    """Get a new SQLAlchemy session (context manager)."""
    return SessionLocal()


# ---------------------------------------------------------------------------
# Gene operations
# ---------------------------------------------------------------------------


def insert_genes(genes_data: list[dict]) -> None:
    """Insert genes into the database (upsert with merge)."""
    with SessionLocal() as session:
        for g in genes_data:
            gene = Gene(
                id=g["id"],
                name=g["name"],
                fullName=g["fullName"],
                chromosome=g["chromosome"],
                start=g["start"],
                end=g["end"],
                strand=g["strand"],
                sequence=g["sequence"],
                description=g["description"],
            )
            session.merge(gene)
        session.commit()


def get_all_genes() -> list[dict]:
    """Get all genes."""
    with SessionLocal() as session:
        genes = session.execute(select(Gene)).scalars().all()
        return [g.model_dump() for g in genes]


def get_user(github_login: str) -> dict | None:
    """Get user by GitHub login."""
    with SessionLocal() as session:
        user = session.execute(
            select(User).where(User.github_login == github_login)
        ).scalar_one_or_none()
        return user.model_dump() if user else None


def create_user(
    github_login: str, name: str, email: str, avatar_url: str, role: str
) -> None:
    """Create a new user."""
    with SessionLocal() as session:
        user = User(
            github_login=github_login,
            name=name,
            email=email,
            avatar_url=avatar_url,
            role=role,
        )
        session.add(user)
        session.commit()


def update_user_role(github_login: str, role: str) -> None:
    """Update user role."""
    with SessionLocal() as session:
        session.execute(
            update(User)
            .where(User.github_login == github_login)
            .values(role=role)
        )
        session.commit()


def list_pending_users() -> list[dict]:
    """List pending users."""
    with SessionLocal() as session:
        users = session.execute(
            select(User).where(User.role == "pending")
        ).scalars().all()
        return [u.model_dump() for u in users]


def list_all_users(limit: int = 100) -> list[dict]:
    """List all users."""
    with SessionLocal() as session:
        users = session.execute(
            select(User).limit(limit)
        ).scalars().all()
        return [u.model_dump() for u in users]


# ---------------------------------------------------------------------------
# Variant operations
# ---------------------------------------------------------------------------


def insert_variants(variants_data: list[dict], session=None) -> None:
    """Insert variants into the database (upsert with merge)."""
    def _do_insert(sess):
        for v in variants_data:
            variant = Variant(
                id=v["id"],
                geneId=v.get("geneId"),
                position=v.get("position"),
                nucleotidePosition=v.get("nucleotidePosition"),
                ref=v.get("ref"),
                alt=v.get("alt"),
                hgvs=v.get("hgvs"),
                consequence=v.get("consequence"),
                clinvar_significance=v.get("clinvar_significance"),
                clinical_significance=v.get("clinical_significance"),
                disease_type=v.get("disease_type"),
                pmid=v.get("pmid"),
                function_score=v.get("function_score"),
                pvalues=v.get("pvalues"),
                qvalues=v.get("qvalues"),
                depletion_group=v.get("depletion_group"),
                gnomad_ac=v.get("gnomad_ac"),
                gnomad_hom=v.get("gnomad_hom"),
                aou_ac=v.get("aou_ac"),
                aou_hom=v.get("aou_hom"),
                ukbb_ac=v.get("ukbb_ac"),
                ukbb_hom=v.get("ukbb_hom"),
                cadd_score=v.get("cadd_score"),
                zygosity=v.get("zygosity"),
                cohort=v.get("cohort"),
            )
            sess.merge(variant)
        sess.commit()

    if session is not None:
        _do_insert(session)
    else:
        with SessionLocal() as session:
            _do_insert(session)


# ---------------------------------------------------------------------------
# Literature operations
# ---------------------------------------------------------------------------


def insert_literature(literature_data: list[dict]) -> None:
    """Insert literature into the database (upsert with merge)."""
    with SessionLocal() as session:
        for lit in literature_data:
            literature = Literature(
                id=lit["id"],
                title=lit["title"],
                authors=lit["authors"],
                journal=lit["journal"],
                year=lit["year"],
                doi=lit["doi"],
            )
            session.merge(literature)
        session.commit()


def insert_literature_counts(counts_data: list[dict]) -> None:
    """Insert literature counts into the database (upsert with merge)."""
    with SessionLocal() as session:
        for c in counts_data:
            count = LiteratureCount(
                variant_id=c["variant_id"],
                literature_id=c["literature_id"],
                counts=c["counts"],
            )
            session.merge(count)
        session.commit()


# ---------------------------------------------------------------------------
# Structure operations
# ---------------------------------------------------------------------------


def insert_structures(structures_data: list[dict], session=None) -> None:
    """Insert RNA structures into the database (upsert with merge)."""
    def _do_insert(sess):
        for s in structures_data:
            structure = RNAStructure(id=s["id"], geneId=s["geneId"])
            sess.merge(structure)
            structure_id = s["id"]

            # Insert nucleotides
            for n in s.get("nucleotides", []):
                nucleotide = Nucleotide(
                    id=n["id"],
                    structure_id=structure_id,
                    base=n["base"],
                    x=n["x"],
                    y=n["y"],
                )
                sess.merge(nucleotide)

            # Insert base pairs (skip duplicates)
            seen_pairs = set()
            for bp in s.get("base_pairs", []):
                from_pos = bp.get("from_pos", bp.get("from"))
                to_pos = bp.get("to_pos", bp.get("to"))
                key = (structure_id, from_pos, to_pos)
                if key in seen_pairs:
                    continue
                seen_pairs.add(key)
                base_pair = BasePair(
                    structure_id=structure_id,
                    from_pos=from_pos,
                    to_pos=to_pos,
                )
                sess.merge(base_pair)

            # Insert annotations
            for a in s.get("annotations", []):
                annotation = Annotation(
                    id=a["id"],
                    structure_id=structure_id,
                    text=a["text"],
                    x=a["x"],
                    y=a["y"],
                    font_size=a["font_size"],
                    color=a.get("color"),
                )
                sess.merge(annotation)

            # Insert structural features
            for f in s.get("structural_features", []):
                feature = StructuralFeature(
                    id=f["id"],
                    structure_id=structure_id,
                    feature_type=f["feature_type"],
                    nucleotide_ids=str(f["nucleotide_ids"]),
                    label_text=f["label_text"],
                    label_x=f["label_x"],
                    label_y=f["label_y"],
                    label_font_size=f["label_font_size"],
                    label_color=f.get("label_color"),
                    description=f.get("description"),
                    color=f.get("color"),
                )
                sess.merge(feature)

        sess.commit()

    if session is not None:
        _do_insert(session)
    else:
        with SessionLocal() as session:
            _do_insert(session)


# ---------------------------------------------------------------------------
# Variant link operations
# ---------------------------------------------------------------------------


def insert_variant_links(links_data: list[dict]) -> None:
    """Insert variant links into the database (upsert with merge)."""
    with SessionLocal() as session:
        for link in links_data:
            vid1 = link["variant_id_1"]
            vid2 = link["variant_id_2"]
            if vid1 > vid2:
                vid1, vid2 = vid2, vid1
            variant_link = VariantLink(
                variant_id_1=vid1,
                variant_id_2=vid2,
            )
            session.merge(variant_link)
        session.commit()


def get_linked_variants(variant_id: str) -> list[str]:
    """Get all variant IDs linked to the given variant."""
    with SessionLocal() as session:
        # Query both directions
        result1 = session.execute(
            select(VariantLink.variant_id_2).where(
                VariantLink.variant_id_1 == variant_id
            )
        ).scalars().all()

        result2 = session.execute(
            select(VariantLink.variant_id_1).where(
                VariantLink.variant_id_2 == variant_id
            )
        ).scalars().all()

        return list(result1) + list(result2)


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------


def audit_log(
    table_name: str,
    record_id: str | None,
    action: str,
    old_values: Any,
    new_values: Any,
    user_login: str,
    session: Session | None = None,
) -> None:
    """Log an audit entry. Optionally accepts a session for testing."""
    if session is not None:
        entry = AuditLog(
            table_name=table_name,
            record_id=record_id,
            action=action,
            old_values=old_values,
            new_values=new_values,
            user_login=user_login,
        )
        session.merge(entry)
        session.commit()
        return

    with SessionLocal() as session:
        entry = AuditLog(
            table_name=table_name,
            record_id=record_id,
            action=action,
            old_values=old_values,
            new_values=new_values,
            user_login=user_login,
        )
        session.merge(entry)
        session.commit()
