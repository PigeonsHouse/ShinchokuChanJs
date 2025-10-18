# 進捗ちゃんNEO

## マイグレーション

### マイグレーションの作成

データベーススキーマを変更する際の手順です。

1. `prisma/schema.prisma`を編集してスキーマを変更
2. データベースコンテナが起動していることを確認
   ```bash
   docker compose up -d db
   ```
3. マイグレーションファイルを生成
   ```bash
   pnpm run prisma:generate
   ```

### マイグレーションの適用

作成したマイグレーションを本番環境やコンテナ環境に適用する場合は、以下のコマンドを実行します。

```bash
docker compose run --rm migrate
```

このコマンドは`prisma migrate deploy`を実行し、未適用のマイグレーションをデータベースに反映します。

### 補足

- マイグレーションファイルは`prisma/migrations/`ディレクトリに生成されます
- 生成されたマイグレーションファイルは必ずGitにコミットしてください
- ローカル開発環境では`.env.local`を使用して`localhost`のデータベースに接続します
