"""remove_project_description

Revision ID: 4248d87c7fa9
Revises: ad07150f8f57
Create Date: 2025-07-12 22:36:40.244003

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '4248d87c7fa9'
down_revision: Union[str, None] = 'ad07150f8f57'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    # Workspace tables were already dropped in previous migration
    # Only drop the description column from projects
    op.drop_column('projects', 'description')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('projects', sa.Column('description', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.create_table('workspace_members',
    sa.Column('workspace_id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('user_id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('joined_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='workspace_members_user_id_fkey'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], name='workspace_members_workspace_id_fkey'),
    sa.PrimaryKeyConstraint('workspace_id', 'user_id', name='workspace_members_pkey')
    )
    op.create_table('workspaces',
    sa.Column('id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('name', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('description', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('owner_id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.Column('updated_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], name='workspaces_owner_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='workspaces_pkey')
    )
    op.create_index('ix_workspaces_id', 'workspaces', ['id'], unique=False)
    # ### end Alembic commands ###
