import firebase_admin
from firebase_admin import credentials, auth
from config import settings
import json
import os

# Firebase Admin SDK の初期化
def initialize_firebase():
    """Firebase Admin SDKを初期化する"""
    if firebase_admin._apps:
        return True
        
    try:
        # 環境変数から Firebase の認証情報を取得
        if os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
            # サービスアカウントキーファイルのパスが設定されている場合
            cred = credentials.Certificate(os.getenv('GOOGLE_APPLICATION_CREDENTIALS'))
        else:
            # 環境変数から直接認証情報を構築する場合
            required_fields = ["project_id", "private_key", "client_email"]
            firebase_config = {
                "type": "service_account",
                "project_id": settings.firebase_project_id,
                "private_key_id": settings.firebase_private_key_id,
                "private_key": settings.firebase_private_key.replace('\\n', '\n') if settings.firebase_private_key else None,
                "client_email": settings.firebase_client_email,
                "client_id": settings.firebase_client_id,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": settings.firebase_client_cert_url
            }
            
            # Noneの値を除外
            firebase_config = {k: v for k, v in firebase_config.items() if v is not None}
            
            # 必須フィールドの確認
            if not all(firebase_config.get(key) for key in required_fields):
                print("⚠️  Firebase設定が不完全です。Google認証が利用できません。")
                return False
                
            cred = credentials.Certificate(firebase_config)
        
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK初期化完了")
        return True
        
    except Exception as e:
        print(f"❌ Firebase初期化エラー: {e}")
        return False

# Firebase認証を初期化
initialize_firebase()

def verify_firebase_token(id_token: str):
    """Firebase IDトークンを検証してユーザー情報を取得する"""
    if not firebase_admin._apps:
        print("Firebase が初期化されていません")
        return None
        
    try:
        # IDトークンを検証
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except auth.InvalidIdTokenError as e:
        print(f"無効なFirebase IDトークン: {e}")
        return None
    except auth.ExpiredIdTokenError as e:
        print(f"期限切れのFirebase IDトークン: {e}")
        return None
    except Exception as e:
        print(f"Firebase token verification error: {e}")
        return None

def get_or_create_firebase_user(user_info):
    """Firebaseユーザー情報から内部ユーザーを取得または作成する"""
    uid = user_info.get('uid')
    email = user_info.get('email')
    display_name = user_info.get('name', user_info.get('display_name', ''))
    photo_url = user_info.get('picture', user_info.get('photo_url', ''))
    
    return {
        'uid': uid,
        'email': email,
        'display_name': display_name,
        'photo_url': photo_url
    }