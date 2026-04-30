"""RNUdb utilities package"""

from .database import (
    get_database_path,
    get_db_connection,
    create_database,
    insert_genes,
    insert_variants,
    insert_literature,
    insert_literature_counts,
    insert_structures,
    insert_variant_links,
    get_linked_variants,
)

# Optional imports - only available if requests is installed
try:
    from .external_apis import query_gnomad_variants, query_all_of_us_variants
except ImportError:
    query_gnomad_variants = None
    query_all_of_us_variants = None

__version__ = "1.0.0"

__all__ = [
    "get_database_path",
    "get_db_connection",
    "create_database",
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
