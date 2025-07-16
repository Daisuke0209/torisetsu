from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from database import engine, Base
from routers import auth, projects, manuals, upload
from config import settings

# .envファイルから環境変数を読み込む
load_dotenv()

# データベーステーブルを作成
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 起動時
    Base.metadata.create_all(bind=engine)
    
    # アップロードディレクトリを作成
    os.makedirs(settings.upload_folder, exist_ok=True)
    
    yield
    # 終了時

app = FastAPI(
    title="TORISETSU API",
    description="マニュアル作成自動化アプリケーションのAPI",
    version="1.0.0",
    lifespan=lifespan
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターを登録
app.include_router(auth.router, prefix="/api/auth", tags=["認証"])
app.include_router(projects.router, prefix="/api/projects", tags=["プロジェクト"])
app.include_router(manuals.router, prefix="/api/manuals", tags=["マニュアル"])
app.include_router(upload.router, prefix="/api/upload", tags=["アップロード"])

# 静的ファイル配信（動画ファイル）
app.mount("/uploads", StaticFiles(directory=settings.upload_folder), name="uploads")

@app.get("/")
async def root():
    return {"message": "TORISETSU API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}