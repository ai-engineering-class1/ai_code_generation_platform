"""create reports table

Revision ID: c2fcb629c5ca
Revises: 
Create Date: 2025-03-19 12:45:31.232374

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = 'c2fcb629c5ca'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'reports',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.String(36), nullable=True),
        sa.Column('session_id', sa.String(255), nullable=True),
        sa.Column('title', sa.String(255), nullable=False, index=True),
        sa.Column('subtitle', sa.String(255), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('createAt', sa.DateTime(), 
                 server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updateAt', sa.DateTime(), 
                 nullable=True,
                 server_default=sa.text('CURRENT_TIMESTAMP'),
                 server_onupdate=sa.text('CURRENT_TIMESTAMP'))
    )

def downgrade() -> None:
    op.drop_table('reports')# 在文件顶部添加 ↓