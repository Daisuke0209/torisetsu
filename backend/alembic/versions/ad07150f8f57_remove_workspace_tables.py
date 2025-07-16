"""remove_workspace_tables

Revision ID: ad07150f8f57
Revises: 51ea96f8c3cb
Create Date: 2025-07-12 22:15:44.703479

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ad07150f8f57'
down_revision: Union[str, None] = '51ea96f8c3cb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove workspace_id foreign key constraint from projects table
    op.drop_constraint('projects_workspace_id_fkey', 'projects', type_='foreignkey')
    
    # Remove workspace_id column from projects table
    op.drop_column('projects', 'workspace_id')
    
    # Add creator_id column to projects table (nullable first, then populate with default values)
    op.add_column('projects', sa.Column('creator_id', sa.String(), nullable=True))
    
    # Get the first user ID to use as default creator
    from sqlalchemy import text
    connection = op.get_bind()
    result = connection.execute(text("SELECT id FROM users LIMIT 1"))
    first_user = result.fetchone()
    
    if first_user:
        # Update all existing projects to have the first user as creator
        connection.execute(text("UPDATE projects SET creator_id = :user_id WHERE creator_id IS NULL"), {"user_id": first_user[0]})
    
    # Now make the column non-nullable
    op.alter_column('projects', 'creator_id', nullable=False)
    
    # Add foreign key constraint for creator_id
    op.create_foreign_key('projects_creator_id_fkey', 'projects', 'users', ['creator_id'], ['id'])
    
    # Drop workspace_members table
    op.drop_table('workspace_members')
    
    # Drop workspaces table
    op.drop_table('workspaces')


def downgrade() -> None:
    # Recreate workspaces table
    op.create_table('workspaces',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('creator_id', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Recreate workspace_members table
    op.create_table('workspace_members',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('workspace_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('joined_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add workspace_id column back to projects table
    op.add_column('projects', sa.Column('workspace_id', sa.String(), nullable=True))
    
    # Add foreign key constraint back
    op.create_foreign_key('projects_workspace_id_fkey', 'projects', 'workspaces', ['workspace_id'], ['id'])
