from fastapi import APIRouter, HTTPException, Request
from typing import List
from rnudb_utils.database import get_db_connection, audit_log
from api.routers.auth import require_admin
from ..models import Literature, LiteratureCounts, LiteratureCreate, LiteratureUpdate

router = APIRouter()


@router.get("/literature", response_model=List[Literature])
async def get_all_literature():
    """Get all literature"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM literature")
        rows = cursor.fetchall()
        literature = [Literature(**dict(row)) for row in rows]
        conn.close()
        return literature
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/literature/{literature_id}", response_model=Literature)
async def get_literature(literature_id: str):
    """Get a specific literature entry"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM literature WHERE id = ?", (literature_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            raise HTTPException(status_code=404, detail="Literature not found")
        return Literature(**dict(row))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/literature", response_model=Literature)
async def create_literature(lit: LiteratureCreate, request: Request):
    """Create new literature (curator only)"""
    user = require_admin(request)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM literature WHERE id = ?", (lit.id,))
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail=f"Literature {lit.id} already exists")
        cursor.execute(
            "INSERT INTO literature (id, title, authors, journal, year, doi) VALUES (?, ?, ?, ?, ?, ?)",
            (lit.id, lit.title, lit.authors, lit.journal, lit.year, lit.doi),
        )
        conn.commit()
        audit_log("literature", lit.id, "CREATE", None, lit.dict(), user["github_login"])
        conn.close()
        return Literature(**lit.dict())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/literature/{literature_id}", response_model=Literature)
async def update_literature(literature_id: str, lit: LiteratureUpdate, request: Request):
    """Update literature (curator only)"""
    user = require_admin(request)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM literature WHERE id = ?", (literature_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Literature not found")
        old_values = dict(existing)
        updates = []
        params = []
        for field, value in lit.dict(exclude_unset=True).items():
            updates.append(f"{field} = ?")
            params.append(value)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        params.append(literature_id)
        cursor.execute(f"UPDATE literature SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()
        audit_log("literature", literature_id, "UPDATE", old_values, lit.dict(exclude_unset=True), user["github_login"])
        cursor.execute("SELECT * FROM literature WHERE id = ?", (literature_id,))
        updated = cursor.fetchone()
        conn.close()
        return Literature(**dict(updated))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/literature/{literature_id}")
async def delete_literature(literature_id: str, request: Request):
    """Delete literature (curator only)"""
    user = require_admin(request)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM literature WHERE id = ?", (literature_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Literature not found")
        old_values = dict(existing)
        cursor.execute("DELETE FROM literature WHERE id = ?", (literature_id,))
        conn.commit()
        audit_log("literature", literature_id, "DELETE", old_values, None, user["github_login"])
        conn.close()
        return {"message": f"Literature {literature_id} deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/literature-counts", response_model=List[LiteratureCounts])
async def get_literature_counts():
    """Get all literature counts"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM literature_counts")
        rows = cursor.fetchall()
        counts = [LiteratureCounts(**dict(row)) for row in rows]
        conn.close()
        return counts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
