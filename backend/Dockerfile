FROM python:3.11-slim

WORKDIR /app

# システムの依存関係をインストール
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Poetryをインストール
RUN pip install poetry

# Poetryの設定（仮想環境を作成しない）
RUN poetry config virtualenvs.create false

# 依存関係ファイルをコピー
COPY pyproject.toml poetry.lock ./

# 依存関係をインストール
RUN poetry install --no-dev --no-root

# アプリケーションコードをコピー
COPY . .

# アップロードディレクトリを作成
RUN mkdir -p /app/uploads

# アプリケーションを実行
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]