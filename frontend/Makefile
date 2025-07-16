.PHONY: install dev build test lint format type-check clean

# 依存関係のインストール
install:
	yarn install

# 開発サーバーの起動
dev:
	yarn dev

# 本番ビルド
build:
	yarn build

# テストの実行
test:
	yarn test --watchAll=false

# カバレッジ付きテスト
test-coverage:
	yarn test:coverage

# リントの実行
lint:
	yarn lint

# リントの修正
lint-fix:
	yarn lint:fix

# コードフォーマット
format:
	yarn format

# 型チェック
type-check:
	yarn type-check

# キャッシュのクリア
clean:
	rm -rf node_modules build
	yarn cache clean

# 全てのチェックを実行
check: lint type-check test

# 依存関係の更新
update:
	yarn upgrade

# パッケージ情報の表示
info:
	yarn info

# 依存関係の監査
audit:
	yarn audit