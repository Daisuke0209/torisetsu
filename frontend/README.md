# Guidify Frontend

GuidifyアプリケーションのフロントエンドWebアプリケーション

## 技術スタック

- **React**: 18.x
- **TypeScript**: 4.x
- **パッケージ管理**: Yarn
- **スタイリング**: CSS Modules
- **ルーティング**: React Router DOM
- **状態管理**: Context API
- **エディター**: React Quill
- **HTTP クライアント**: Axios

## セットアップ

### 前提条件

- Node.js 18+
- Yarn

### インストール

```bash
# 依存関係のインストール
yarn install
```

### 開発サーバーの起動

```bash
# 開発サーバー起動
make dev

# または
yarn dev
```

## 開発コマンド

```bash
# 依存関係のインストール
make install

# 開発サーバーの起動
make dev

# 本番ビルド
make build

# テストの実行
make test

# カバレッジ付きテスト
make test-coverage

# リントの実行
make lint

# リントの修正
make lint-fix

# コードフォーマット
make format

# 型チェック
make type-check

# 全てのチェックを実行
make check

# 依存関係の更新
make update

# キャッシュのクリア
make clean
```

## プロジェクト構造

```
src/
├── api/              # API クライアント
├── components/       # 再利用可能なコンポーネント
├── contexts/         # React Context
├── pages/           # ページコンポーネント
├── types/           # TypeScript 型定義
├── App.tsx          # メインアプリケーション
└── index.tsx        # エントリーポイント
```

## 主要機能

### 認証
- ユーザー登録・ログイン
- JWT トークンベースの認証
- プライベートルート保護

### ワークスペース管理
- ワークスペース作成・編集・削除
- メンバー管理

### プロジェクト管理
- プロジェクト作成・編集・削除
- カテゴリ管理

### マニュアル管理
- マニュアル作成・編集・削除
- ステータス管理（下書き・レビュー中・公開済み）
- バージョン管理

### 画面録画（実装予定）
- MediaRecorder API を使用した画面録画
- 録画ファイルのアップロード

### マニュアルエディター（実装予定）
- React Quill を使用したリッチテキストエディター
- 画像の挿入・編集
- ステップの追加・削除・並び替え

## 環境変数

```bash
REACT_APP_API_URL=http://localhost:8000
```

## コードスタイル

- **Prettier**: コードフォーマット
- **ESLint**: 静的解析
- **TypeScript**: 型チェック

設定ファイル:
- `.prettierrc`: Prettier 設定
- `.eslintrc.json`: ESLint 設定
- `tsconfig.json`: TypeScript 設定

## デプロイ

```bash
# 本番ビルド
yarn build

# ビルドされたファイルは build/ ディレクトリに出力されます
```