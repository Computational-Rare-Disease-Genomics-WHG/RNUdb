"""RNUdb utilities package"""

from .database import (
    get_database_path,
    get_db_connection, 
    create_database,
    insert_genes,
    insert_variants,
    insert_literature,
    insert_structures
)

from .external_apis import (
    query_gnomad_variants,
    query_all_of_us_variants
)

__version__ = "1.0.0"

__all__ = [
    "get_database_path",
    "get_db_connection",
    "create_database", 
    "insert_genes",
    "insert_variants",
    "insert_literature", 
    "insert_structures",
    "query_gnomad_variants",
    "query_all_of_us_variants"
]