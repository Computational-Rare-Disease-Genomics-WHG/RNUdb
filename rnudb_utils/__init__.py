"""RNUdb utilities package"""

from .database import (
    SessionLocal,
    get_db,
    get_db_session,
    insert_genes,
    insert_variants,
    insert_literature,
    insert_literature_counts,
    insert_structures,
    insert_variant_links,
    get_linked_variants,
    get_user,
    create_user,
    update_user_role,
    list_pending_users,
    list_all_users,
    audit_log,
)

# Optional imports - only available if requests is installed
try:
    from .external_apis import query_gnomad_variants, query_all_of_us_variants
except ImportError:
    query_gnomad_variants = None
    query_all_of_us_variants = None

__version__ = "1.0.0"

__all__ = [
    "get_db",
    "get_db_session",
    "insert_genes",
    "insert_variants",
    "insert_literature",
    "insert_literature_counts",
    "insert_structures",
    "insert_variant_links",
    "get_linked_variants",
    "query_gnomad_variants",
    "query_all_of_us_variants",
]
