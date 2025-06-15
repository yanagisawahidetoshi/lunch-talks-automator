# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ランチライトニングトークスケジューラーは、会社のランチタイムライトニングトーク（LT）のスケジュールを自動生成するReactアプリケーションです。参加者の管理、スケジュール設定、自動ローテーション、CSV出力機能を提供します。

## Common Commands

- `npm run dev` - Vite開発サーバーを起動
- `npm run build` - 本番用ビルドを生成
- `npm run build:dev` - 開発モードでビルド
- `npm run lint` - ESLintでコードをチェック
- `npm run preview` - ビルド後のアプリをプレビュー
- `npm test` - Vitestでテスト実行
- `npm run test:ui` - テストUIでテスト実行
- `npm run test:coverage` - カバレッジ付きでテスト実行

## Architecture

### Core Components Structure

1. **AppContext** (`src/context/AppContext.tsx`)
   - 全体の状態管理（参加者、スケジュール設定、生成されたスケジュール）
   - useReducerベースの状態管理
   - localStorage連携（参加者データのみ永続化）

2. **Main Components**
   - `ParticipantManager` - 参加者の追加・削除・管理
   - `ScheduleConfig` - スケジュール設定（開始日、曜日、頻度、発表者数）
   - `ScheduleGenerator` - スケジュール生成・プレビュー・CSV出力

3. **Type Definitions** (`src/types/index.ts`)
   - `Participant` - 参加者情報（id, name, slackId）
   - `ScheduleConfig` - スケジュール設定
   - `ScheduleSession` - 生成されたスケジュール
   - `AppState` - アプリケーション全体の状態

### Data Flow

1. ユーザーが参加者を登録（参加者管理）
2. スケジュール設定を行う（開始日、曜日、頻度、発表者数）
3. スケジュール生成ボタンでローテーション生成
4. 生成されたスケジュールをプレビュー・CSV出力

### Key Features

- **Smart Rotation**: 参加者をシャッフルして公平なローテーション
- **Flexible Scheduling**: 週次/隔週等の頻度設定
- **Data Persistence**: 参加者データのみlocalStorageで永続化
- **CSV Export**: スケジュールの横展開形式でのCSV出力

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui components + Tailwind CSS
- **State Management**: React Context + useReducer
- **Date Handling**: date-fns
- **Icons**: lucide-react
- **Routing**: React Router
- **Styling**: Tailwind CSS with custom animations

## File Organization

- `src/components/` - メインコンポーネント
- `src/components/ui/` - shadcn/ui再利用可能コンポーネント
- `src/context/` - React Context定義
- `src/hooks/` - カスタムフック
- `src/types/` - TypeScript型定義
- `src/pages/` - ページコンポーネント
- `src/utils/` - ユーティリティ関数
- `src/test/` - テスト設定ファイル

## Testing

- **Test Framework**: Vitest + @testing-library/react
- **Test Files**: `*.test.ts` または `*.test.tsx`
- **Coverage**: 主要なビジネスロジックとコンポーネントをカバー
- **Key Test Areas**:
  - `src/utils/scheduleGenerator.test.ts` - スケジュール生成ロジック
  - `src/context/AppContext.test.tsx` - 状態管理
  - `src/components/ScheduleGenerator.test.tsx` - UI統合テスト