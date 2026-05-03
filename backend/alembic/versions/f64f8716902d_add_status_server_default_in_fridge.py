"""add status server_default in_fridge

Revision ID: f64f8716902d
Revises: bb5cd4e7d69d
Create Date: 2026-05-03 18:03:38.855058

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f64f8716902d'
down_revision: Union[str, None] = 'bb5cd4e7d69d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('items', 'status', server_default='in_fridge')


def downgrade() -> None:
    op.alter_column('items', 'status', server_default=None)
