.PHONY: install dev test lint format type-check clean

# 依存関係のインストール
install:
	poetry install

# 開発サーバーの起動
dev:
	poetry run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# テストの実行
test:
	poetry run pytest

# リントの実行
lint:
	poetry run flake8 .

# コードフォーマット
format:
	poetry run black .
	poetry run isort .

# 型チェック
type-check:
	poetry run mypy .

# キャッシュのクリア
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +

# 全てのチェックを実行
check: lint type-check test

# 依存関係の更新
update:
	poetry update

# 本番用のビルド
build:
	poetry build

# 依存関係のエクスポート（Docker用）
export-requirements:
	poetry export -f requirements.txt --output requirements.txt --without-hashes