FROM node:18-alpine

WORKDIR /app

# Yarnをインストール
RUN corepack enable && corepack prepare yarn@stable --activate

# package.jsonとyarn.lockをコピー
COPY package.json yarn.lock ./

# 依存関係をインストール
RUN yarn install --frozen-lockfile

# アプリケーションコードをコピー
COPY . .

# アプリケーションを実行
CMD ["yarn", "start"]