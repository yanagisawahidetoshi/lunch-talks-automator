# Data Directory

このディレクトリにはインポート用のデータファイルを配置します。

## ファイル形式

- CSVファイル（UTF-8エンコーディング推奨）
- A列: 日付（YYYY/MM/DD形式）
- B列: 登壇者1
- E列: 登壇者2

## 使用方法

```bash
# dataディレクトリ内のCSVファイルをインポート
npm run seed:csv data/ランチLT当番表順番表.csv
```
