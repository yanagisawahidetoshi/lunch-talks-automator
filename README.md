# ランチライトニングトークスケジューラー

会社のランチタイムライトニングトーク（LT）のスケジュールを自動生成する React アプリケーションです。

## 機能

- 参加者の管理（追加・削除・一括インポート）
- スケジュール設定（開始日、曜日、頻度、発表者数）
- 自動ローテーション生成
- CSV 出力機能

## CSV 出力形式のカスタマイズ

CSV 出力の形式を変更したい場合は、`src/components/ScheduleGenerator.tsx`の`handleExportCSV`関数を編集してください。

### 現在の出力形式

```csv
日付,週番号,ユーザ名1,ユーザ名2,...
2024-01-12,1,田中太郎,佐藤花子
2024-01-19,2,山田次郎,鈴木一郎
```

### カスタマイズ例

#### 1. 縦展開形式（1 行 1 発表者）に変更する場合

`handleExportCSV`関数内の以下の部分を変更：

```typescript
// 変更前：横展開形式
const headers = ["日付", "週番号"];
for (let i = 1; i <= maxPresenters; i++) {
  headers.push(`ユーザ名${i}`);
}

// 変更後：縦展開形式
const headers = ["日付", "週番号", "ユーザ名"];
const csvContent: string[][] = [headers];

state.schedule.forEach((session) => {
  session.presenters.forEach((presenter) => {
    csvContent.push([
      format(session.date, "yyyy-MM-dd"),
      session.weekNumber.toString(),
      presenter.name,
    ]);
  });
});
```

#### 2. 日付形式を変更する場合

```typescript
// 変更前：yyyy-MM-dd形式
format(session.date, "yyyy-MM-dd");

// 変更後：M月d日形式
format(session.date, "M月d日", { locale: ja });
```

#### 3. 追加情報を含める場合

```typescript
const headers = ["日付", "曜日", "週番号", "ユーザ名"];

// 曜日情報を追加
const row = [
  format(session.date, "yyyy-MM-dd"),
  format(session.date, "EEEE", { locale: ja }),
  session.weekNumber.toString(),
];
```
