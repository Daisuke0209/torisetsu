#!/usr/bin/env python3
"""
データベースの初期化スクリプト
既存のマイグレーションをスキップして、モデルから直接テーブルを作成します
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Base, engine
from models.user import User
from models.project import Project
from models.torisetsu import Torisetsu
from models.manual import Manual

def init_database():
    """データベースのテーブルを作成"""
    print("データベースの初期化を開始します...")
    
    # 全てのテーブルを作成
    Base.metadata.create_all(bind=engine)
    
    print("データベースの初期化が完了しました！")
    print("作成されたテーブル:")
    print("- users")
    print("- projects")
    print("- torisetsu")
    print("- manuals")

if __name__ == "__main__":
    init_database()