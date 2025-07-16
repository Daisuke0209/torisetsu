#!/usr/bin/env python3
"""
Script to create a test user for development purposes
"""
import uuid
from database import SessionLocal
from models import User
from utils.auth import get_password_hash

def create_test_user():
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == "testuser").first()
        if existing_user:
            print("Test user already exists!")
            print(f"Username: testuser")
            print(f"Email: test@example.com") 
            print(f"Password: testpass")
            return
        
        # Create test user
        test_user = User(
            email="test@example.com",
            username="testuser",
            hashed_password=get_password_hash("testpass"),
            is_active=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print("✅ Test user created successfully!")
        print(f"Username: testuser")
        print(f"Email: test@example.com")
        print(f"Password: testpass")
        print(f"User ID: {test_user.id}")
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()