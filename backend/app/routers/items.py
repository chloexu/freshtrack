from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter()


@router.get("", response_model=list[schemas.ItemResponse])
def get_items(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Item)
        .filter(models.Item.user_id == user.id, models.Item.status == "in_fridge")
        .all()
    )


@router.post("", response_model=list[schemas.ItemResponse])
def create_items(
    body: schemas.ItemCreateBatch,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    created = []
    for item_data in body.items:
        item = models.Item(user_id=user.id, **item_data.model_dump())
        db.add(item)
        created.append(item)
    db.commit()
    for item in created:
        db.refresh(item)
    return created


@router.patch("/{item_id}", response_model=schemas.ItemResponse)
def update_item(
    item_id: str,
    body: schemas.ItemUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    item = (
        db.query(models.Item)
        .filter(models.Item.id == item_id, models.Item.user_id == user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    patch = body.model_dump(exclude_unset=True)
    if "status" in patch and patch["status"] != "in_fridge":
        patch["status_at"] = datetime.now(timezone.utc)
    for key, value in patch.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    item = (
        db.query(models.Item)
        .filter(models.Item.id == item_id, models.Item.user_id == user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
