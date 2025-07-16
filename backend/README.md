# Guidify Backend

GuidifyアプリケーションのバックエンドAPI

## 技術スタック

- **Python**: 3.11+
- **フレームワーク**: FastAPI
- **データベース**: PostgreSQL
- **ORM**: SQLAlchemy
- **認証**: JWT (python-jose)
- **パッケージ管理**: Poetry
- **AI**: Google Gemini API

## セットアップ

### 前提条件

- Python 3.11+
- Poetry
- PostgreSQL（Dockerでも可）

### インストール

```bash
# 依存関係のインストール
poetry install

# 環境変数の設定
cp ../.env.example ../.env
# .envファイルを編集してAPIキーなどを設定
```

### 開発サーバーの起動

```bash
# 開発サーバー起動
make dev

# または
poetry run uvicorn main:app --reload
```

## 開発コマンド

```bash
# 依存関係のインストール
make install

# 開発サーバーの起動
make dev

# テストの実行
make test

# リントの実行
make lint

# コードフォーマット
make format

# 型チェック
make type-check

# 全てのチェックを実行
make check

# 依存関係の更新
make update
```

## API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/token` - ログイン（トークン取得）
- `GET /api/auth/me` - 現在のユーザー情報

### ワークスペース
- `POST /api/workspaces` - ワークスペース作成
- `GET /api/workspaces` - ワークスペース一覧
- `GET /api/workspaces/{id}` - ワークスペース詳細
- `PUT /api/workspaces/{id}` - ワークスペース更新
- `DELETE /api/workspaces/{id}` - ワークスペース削除

### プロジェクト
- `POST /api/projects` - プロジェクト作成
- `GET /api/projects/{workspace_id}` - プロジェクト一覧
- `GET /api/projects/detail/{id}` - プロジェクト詳細
- `PUT /api/projects/{id}` - プロジェクト更新
- `DELETE /api/projects/{id}` - プロジェクト削除

### マニュアル
- `POST /api/manuals` - マニュアル作成
- `GET /api/manuals/{project_id}` - マニュアル一覧
- `GET /api/manuals/detail/{id}` - マニュアル詳細
- `PUT /api/manuals/{id}` - マニュアル更新
- `DELETE /api/manuals/{id}` - マニュアル削除
- `POST /api/manuals/{id}/generate` - AI マニュアル生成

### アップロード
- `POST /api/upload/video` - 動画ファイルアップロード

## データベースマイグレーション

```bash
# マイグレーションファイルの生成
poetry run alembic revision --autogenerate -m "Initial migration"

# マイグレーションの実行
poetry run alembic upgrade head
```

## テスト

```bash
# テストの実行
poetry run pytest

# カバレッジ付きテスト
poetry run pytest --cov=.
```

## 環境変数

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/database
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
```