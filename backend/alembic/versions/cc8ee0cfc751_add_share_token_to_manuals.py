"""add_share_token_to_manuals

Revision ID: cc8ee0cfc751
Revises: eff233a339fd
Create Date: 2025-07-15 23:16:24.286150

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cc8ee0cfc751'
down_revision: Union[str, None] = 'eff233a339fd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add share_token column to manuals table
    op.add_column('manuals', sa.Column('share_token', sa.String(), nullable=True))
    op.add_column('manuals', sa.Column('share_enabled', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('manuals', sa.Column('share_expires_at', sa.DateTime(), nullable=True))
    
    # Create index on share_token for faster lookups
    op.create_index('ix_manuals_share_token', 'manuals', ['share_token'])


def downgrade() -> None:
    # Remove the added columns
    op.drop_index('ix_manuals_share_token', table_name='manuals')
    op.drop_column('manuals', 'share_expires_at')
    op.drop_column('manuals', 'share_enabled')
    op.drop_column('manuals', 'share_token')
