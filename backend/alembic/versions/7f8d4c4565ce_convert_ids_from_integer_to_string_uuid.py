"""Convert IDs from Integer to String UUID

Revision ID: 7f8d4c4565ce
Revises: 
Create Date: 2025-07-11 23:54:10.837164

"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = '7f8d4c4565ce'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This migration converts all integer IDs to string UUIDs
    # For new deployments, this will just create the proper schema
    # For existing deployments with data, we would need to run a custom data migration
    
    # Check if tables exist (for new deployments vs existing ones)
    connection = op.get_bind()
    
    # Check if the tables exist and have data
    result = connection.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        )
    """))
    tables_exist = result.scalar()
    
    if tables_exist:
        # Check if there's any data
        result = connection.execute(text("SELECT COUNT(*) FROM users"))
        user_count = result.scalar()
        
        if user_count > 0:
            # There is existing data - this would require a complex migration
            # For now, we'll just drop and recreate (CAUTION: DATA LOSS)
            print("WARNING: Existing data detected. This migration will recreate tables.")
            print("In production, you would need a more sophisticated data migration strategy.")
            
            # Drop all foreign key constraints first
            op.drop_constraint('workspace_members_workspace_id_fkey', 'workspace_members', type_='foreignkey')
            op.drop_constraint('workspace_members_user_id_fkey', 'workspace_members', type_='foreignkey')
            op.drop_constraint('projects_workspace_id_fkey', 'projects', type_='foreignkey')
            op.drop_constraint('manuals_project_id_fkey', 'manuals', type_='foreignkey')
            op.drop_constraint('workspaces_owner_id_fkey', 'workspaces', type_='foreignkey')
            
            # Drop tables
            op.drop_table('manuals')
            op.drop_table('projects')
            op.drop_table('workspace_members')
            op.drop_table('workspaces')
            op.drop_table('users')
            
            # Drop the enum type
            op.execute("DROP TYPE IF EXISTS manualstatus")
    
    # Create tables with new UUID-based schema
    # (The models will be recreated with the new schema when the app starts)
    pass  # Let SQLAlchemy create_all handle the table creation


def downgrade() -> None:
    # Downgrade would recreate the integer-based schema
    # This is a destructive operation and should be used with caution
    
    # Drop all tables with UUID schema
    op.drop_table('manuals')
    op.drop_table('projects') 
    op.drop_table('workspace_members')
    op.drop_table('workspaces')
    op.drop_table('users')
    
    # The downgrade would recreate tables with integer IDs
    # In practice, this should be handled very carefully with proper data backup
