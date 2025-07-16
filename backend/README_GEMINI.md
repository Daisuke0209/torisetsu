# Gemini API Integration

このドキュメントでは、Guidifyアプリケーションに統合されたGemini APIの使用方法について説明します。

## 環境設定

### 1. 環境変数の設定

`.env`ファイルに以下の環境変数を設定してください：

```bash
# Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.0-flash
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=8192
```

### 2. APIキーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey)にアクセス
2. 新しいAPIキーを作成
3. 作成されたAPIキーを`GEMINI_API_KEY`環境変数に設定

## 機能概要

### 自動マニュアル生成

動画ファイルからステップバイステップのマニュアルを自動生成します。

**エンドポイント**: `POST /api/manuals/{manual_id}/generate`

**機能**:
- 動画の内容を詳細に分析
- 操作手順を順序立てて抽出
- 日本語での分かりやすい説明文を生成
- 注意点やトラブルシューティング情報も含む

### マニュアル改善機能

既存のマニュアルコンテンツを向上させます。

**エンドポイント**: `POST /api/manuals/{manual_id}/enhance`

**改善タイプ**:
- `improve`: より詳細で分かりやすい内容に改善
- `translate`: 英語への翻訳
- `summarize`: 重要なポイントの要約

### ステータス確認

マニュアル生成の進行状況を確認できます。

**エンドポイント**: `GET /api/manuals/{manual_id}/status`

**ステータス**:
- `processing`: 生成中
- `completed`: 完了
- `failed`: 失敗

## 技術詳細

### 使用モデル

- **gemini-2.0-flash**: 最新の高性能マルチモーダルモデル
- 動画とテキストの両方を理解
- 高速な処理速度
- 高品質な出力

### セキュリティ設定

```python
safety_settings={
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
}
```

### エラーハンドリング

- **リトライ機能**: 一時的なエラーに対して自動的に再試行
- **タイムアウト処理**: 長時間の処理に対する適切なタイムアウト
- **ファイルクリーンアップ**: 処理後の一時ファイル自動削除

### ファイル制限

- **最大ファイルサイズ**: 100MB
- **対応形式**: MP4, AVI, MOV, WMV
- **処理タイムアウト**: 5分

## 使用例

### 1. マニュアル生成の開始

```bash
curl -X POST "http://localhost:8000/api/manuals/1/generate" \
  -H "Authorization: Bearer your-jwt-token"
```

### 2. 生成状況の確認

```bash
curl -X GET "http://localhost:8000/api/manuals/1/status" \
  -H "Authorization: Bearer your-jwt-token"
```

### 3. マニュアルの改善

```bash
curl -X POST "http://localhost:8000/api/manuals/1/enhance?enhancement_type=improve" \
  -H "Authorization: Bearer your-jwt-token"
```

## 生成されるマニュアルの構造

```json
{
  "title": "操作マニュアル",
  "overview": "操作の概要説明",
  "prerequisites": "前提条件",
  "steps": [
    {
      "title": "ステップ1: 初期設定",
      "action": "具体的な操作内容",
      "screen": "操作画面の説明",
      "notes": "注意点",
      "verification": "確認方法"
    }
  ],
  "troubleshooting": "トラブルシューティング",
  "additional_info": "補足情報",
  "raw_content": "生のマークダウンコンテンツ"
}
```

## トラブルシューティング

### よくある問題

1. **APIキーエラー**
   - 環境変数が正しく設定されているか確認
   - APIキーが有効であることを確認

2. **動画アップロードエラー**
   - ファイルサイズが制限内であることを確認
   - 対応形式であることを確認

3. **生成タイムアウト**
   - 動画が長すぎる場合は分割を検討
   - ネットワーク接続を確認

### ログの確認

```bash
# バックエンドのログを確認
tail -f logs/app.log | grep -i gemini
```

## 開発者向け情報

### サービスクラスの拡張

新しい機能を追加する場合は、`services/gemini_service.py`を拡張してください：

```python
async def custom_analysis(self, video_path: str) -> Dict[str, Any]:
    # カスタム分析機能の実装
    pass
```

### 新しいプロンプトの追加

異なる言語や形式のマニュアルを生成する場合は、`_create_manual_prompt`メソッドを拡張してください。

## 参考リンク

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Python SDK](https://github.com/google/generative-ai-python)