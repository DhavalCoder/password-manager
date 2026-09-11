from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.models import Category
from app.schemas.schemas import CategoryBase, CategoryResponse
from app.api.dependencies import get_current_active_user

router = APIRouter(prefix="/api/categories", tags=["categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    return db.query(Category).all()

@router.post("", response_model=CategoryResponse, status_code=201)
def create_category(
    cat_in: CategoryBase,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Depending on rules, you might restrict this to admin/team
    existing = db.query(Category).filter(Category.name == cat_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category exists")
    
    cat = Category(name=cat_in.name, is_default=False)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{cat_id}")
def delete_category(
    cat_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    if cat.is_default:
        raise HTTPException(status_code=400, detail="Default categories cannot be deleted")
    db.delete(cat)
    db.commit()
    return {"message": "Category deleted successfully"}

@router.put("/{cat_id}", response_model=CategoryResponse)
def update_category(
    cat_id: UUID,
    cat_in: CategoryBase,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    if cat.is_default:
        raise HTTPException(status_code=400, detail="Cannot rename a default category")
    existing = db.query(Category).filter(Category.name == cat_in.name, Category.id != cat_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already in use")
    cat.name = cat_in.name
    db.commit()
    db.refresh(cat)
    return cat
