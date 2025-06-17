# Vercel Postgres Migration Guide

## Vercel側での設定

### 1. Vercel Postgresのセットアップ

1. Vercelダッシュボードにログイン
2. プロジェクトを選択（または新規作成）
3. "Storage" タブをクリック
4. "Create Database" → "Postgres" を選択
5. データベース名とリージョンを設定
6. "Create" をクリック

### 2. 環境変数の取得

データベース作成後、以下の環境変数が自動的に設定されます：
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### 3. ローカル開発環境のセットアップ

1. `.env.local`ファイルを作成し、Vercelから環境変数をコピー：
```bash
POSTGRES_PRISMA_URL="************"
POSTGRES_URL_NON_POOLING="************"
VITE_API_URL="http://localhost:3000"
```

2. 依存関係をインストール：
```bash
npm install
```

3. Prismaクライアントを生成：
```bash
npm run prisma:generate
```

4. データベースにスキーマをプッシュ：
```bash
npm run prisma:push
```

### 4. Vercelへのデプロイ

1. GitHubにプッシュ：
```bash
git add .
git commit -m "feat: migrate to Vercel Postgres"
git push origin feature/migrate-to-vercel-postgres
```

2. Pull Requestを作成

3. Vercelでの環境変数設定：
   - プロジェクト設定 → Environment Variables
   - Production/Preview/Developmentで必要な環境変数が設定されていることを確認

### 5. データベースの初期化

Vercelにデプロイ後、以下のコマンドでテーブルを作成：

```bash
# Vercel CLIを使用（要インストール）
vercel env pull .env.production.local
npm run prisma:push
```

または、Vercel Postgres dashboardのQueryタブから直接SQLを実行することも可能です。

## APIエンドポイント

- `GET /api/participants` - 参加者一覧取得
- `POST /api/participants` - 参加者作成
- `PUT /api/participants` - 参加者更新
- `DELETE /api/participants?id={id}` - 参加者削除
- `GET /api/schedules` - スケジュール一覧取得
- `POST /api/schedules` - スケジュール作成
- `PUT /api/schedules` - スケジュール更新
- `DELETE /api/schedules?id={id}` - スケジュール削除

## トラブルシューティング

### ビルドエラーが出る場合

```bash
# Prismaクライアントを再生成
npm run prisma:generate
```

### データベース接続エラー

- 環境変数が正しく設定されているか確認
- Vercel Postgresがアクティブになっているか確認
