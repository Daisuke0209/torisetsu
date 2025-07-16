# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code (claude.ai/code)へのガイダンスを提供します。

## プロジェクト概要

LimNは、ユーザーの画面操作を録画し、Google Gemini APIを使用して自動的にステップバイステップのマニュアルを生成するマニュアル作成自動化アプリです。プロジェクトは現在計画段階にあります。

## 技術スタック

- **フロントエンド**: React.js + TypeScript
- **バックエンド**: Python + FastAPI
- **データベース**: PostgreSQL（Dockerコンテナー）
- **AI統合**: Google Gemini API
- **画面録画**: WebRTC Screen Capture API、MediaRecorder API

## プロジェクト構成

現在は`project_spec.md`で要件が定義されている計画段階です。実装時には以下の構成が予想されます：
- 画面録画とマニュアル編集用のReactフロントエンドアプリ
- 処理とAI統合用のPython FastAPIバックエンド
- データ永続化用のDockerコンテナーで動作するPostgreSQLデータベース

## 開発コマンド

### 初期セットアップ（プロジェクト初期化後）
```bash
# データベース起動
docker-compose up -d postgres

# フロントエンド
cd frontend
yarn install
yarn dev

# バックエンド
cd backend
poetry install
poetry run uvicorn main:app --reload
```

## アーキテクチャ概要

アプリケーションはクライアント・サーバーアーキテクチャに従い、3つの主要なデータエンティティがあります：
1. **ワークスペース**: プロジェクトを整理するための最上位コンテナー
2. **プロジェクト**: 関連するマニュアルをグループ化するワークスペース内のコンテナー
3. **マニュアル**: ステップバイステップの手順を含む個別のドキュメント

主な機能：
- MediaRecorder APIによる画面録画
- 動画のアップロードと処理
- Gemini APIによるAI駆動のマニュアル生成
- マニュアルカスタマイズ用のリッチテキスト編集
- マニュアルのバージョンとステータス管理

## API設計

主要エンドポイント：
- `/api/workspaces` - ワークスペース管理
- `/api/projects` - プロジェクト管理
- `/api/manuals` - マニュアルのCRUD操作
- `/api/manuals/:id/generate` - AIマニュアル生成
- `/api/upload/video` - 動画ファイルアップロード

## 重要事項

- 最大動画ファイルサイズ: 100MB
- APIレスポンスタイムアウト: 30秒
- 認証: ローカル開発用のSimple JWTまたはBasic Auth
- ファイルストレージ: ローカルファイルシステム
- データベース: DockerコンテナーでPostgreSQL使用