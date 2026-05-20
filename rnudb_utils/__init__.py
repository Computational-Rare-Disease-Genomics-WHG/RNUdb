"""RNUdb utilities package"""

from .database import (
    SessionLocal,
    audit_log,
    create_user,
    get_db,
    get_db_session,
    get_linked_variants,
    get_user,
    insert_genes,
    insert_literature,
    insert_literature_counts,
    insert_structures,
    insert_variant_links,
    insert_variants,
    list_all_users,
    list_pending_users,
    update_user_role,
)

# Optional imports - only available if requests is installed
try:
    from .external_apis import query_all_of_us_variants, query_gnomad_variants
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
    "SessionLocal",
    "audit_log",
    "create_user",
    "get_user",
    "list_all_users",
    "list_pending_users",
    "update_user_role",
]
