# TORISETSU - マニュアル作成自動化アプリ

TORISETSUは、画面操作を録画し、AIを使用して自動的にステップバイステップのマニュアルを生成するWebアプリケーションです。

## 機能

- 🎥 画面録画機能（MediaRecorder API使用）
- 🤖 AI駆動のマニュアル自動生成（Google Gemini API）
- ✏️ リッチテキストエディターによるマニュアル編集
- 📁 ワークスペース・プロジェクト・マニュアルの階層的管理
- 👥 チームでのコラボレーション機能

## 技術スタック

- **フロントエンド**: React.js + TypeScript
- **バックエンド**: Python + FastAPI
- **データベース**: PostgreSQL（Dockerコンテナー）
- **AI**: Google Gemini API
- **コンテナー**: Docker & Docker Compose

## セットアップ

### 前提条件

- Docker Desktop
- Google Gemini API キー

### 環境変数の設定

1. `.env.example`をコピーして`.env`を作成：
```bash
cp .env.example .env
```

2. `.env`ファイルを編集して、必要な環境変数を設定：
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 起動方法

1. Dockerコンテナーを起動：
```bash
docker-compose up -d
```

2. アプリケーションにアクセス：
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8000
- API ドキュメント: http://localhost:8000/docs

### 開発モード

開発時は以下のコマンドで起動：

```bash
# データベースのみ起動
docker-compose up -d postgres

# バックエンド起動
cd backend
poetry install
poetry run uvicorn main:app --reload

# フロントエンド起動
cd frontend
yarn install
yarn start
```

## 使い方

1. アカウントを作成してログイン
2. ワークスペースを作成
3. プロジェクトを作成
4. 画面録画を開始
5. 操作を録画
6. AIがマニュアルを自動生成
7. 必要に応じてマニュアルを編集

## ライセンス

このプロジェクトはプライベートプロジェクトです。