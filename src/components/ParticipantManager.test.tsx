import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParticipantManager } from './ParticipantManager';
import { AppProvider } from '../context/AppContext';
import { Participant } from '../types';
import * as participantService from '../lib/participantService';

// Supabaseサービス関数のモック
vi.mock('../lib/participantService', () => ({
  getAllParticipantsFromSupabase: vi.fn(),
  addParticipantToSupabase: vi.fn(),
  updateParticipantInSupabase: vi.fn(),
  deleteParticipantFromSupabase: vi.fn(),
}));

// Toast関数のモック
const mockToast = vi.fn();
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('ParticipantManager - 重複判定', () => {
  const existingParticipants: Participant[] = [
    { id: '1', name: '田中太郎' },
    { id: '2', name: '佐藤花子' },
    { id: '3', name: 'YAMADA Jiro' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 既存参加者データの取得をモック
    vi.mocked(participantService.getAllParticipantsFromSupabase).mockResolvedValue({
      success: true,
      participants: existingParticipants,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = () => {
    return render(
      <AppProvider>
        <ParticipantManager />
      </AppProvider>
    );
  };

  describe('単体参加者追加時の重複チェック', () => {
    it('完全一致の名前で重複を検出する', async () => {
      renderWithProvider();
      
      // 既存参加者の読み込み待ち
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('名前');
      const addButton = screen.getByRole('button', { name: /参加者を追加/ });

      // 既存の名前と完全一致する名前を入力
      await userEvent.type(nameInput, '田中太郎');
      await userEvent.click(addButton);

      // 重複エラーのトーストが表示されることを確認
      expect(mockToast).toHaveBeenCalledWith({
        title: '重複エラー',
        description: '「田中太郎」は既に登録されています。',
        variant: 'destructive',
      });

      // Supabaseへの追加が実行されないことを確認
      expect(participantService.addParticipantToSupabase).not.toHaveBeenCalled();
    });

    it('大文字小文字を無視して重複を検出する', async () => {
      renderWithProvider();
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('名前');
      const addButton = screen.getByRole('button', { name: /参加者を追加/ });

      // 大文字小文字が異なる同じ名前を入力
      await userEvent.type(nameInput, 'yamada jiro');
      await userEvent.click(addButton);

      // 重複エラーのトーストが表示されることを確認
      expect(mockToast).toHaveBeenCalledWith({
        title: '重複エラー',
        description: '「yamada jiro」は既に登録されています。',
        variant: 'destructive',
      });

      expect(participantService.addParticipantToSupabase).not.toHaveBeenCalled();
    });

    it('重複しない名前で正常に追加される', async () => {
      // 新しい参加者追加の成功をモック
      const newParticipant = { id: '4', name: '新規太郎' };
      vi.mocked(participantService.addParticipantToSupabase).mockResolvedValue({
        success: true,
        participant: newParticipant,
      });

      renderWithProvider();
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('名前');
      const addButton = screen.getByRole('button', { name: /参加者を追加/ });

      // 重複しない名前を入力
      await userEvent.type(nameInput, '新規太郎');
      await userEvent.click(addButton);

      // Supabaseへの追加が実行されることを確認
      await waitFor(() => {
        expect(participantService.addParticipantToSupabase).toHaveBeenCalledWith({
          name: '新規太郎',
        });
      });

      // 成功のトーストが表示されることを確認
      expect(mockToast).toHaveBeenCalledWith({
        title: '参加者を追加しました',
        description: '新規太郎 を追加しました。',
      });
    });

    it('前後の空白を除去して重複チェックする', async () => {
      renderWithProvider();
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('名前');
      const addButton = screen.getByRole('button', { name: /参加者を追加/ });

      // 前後に空白がある既存の名前を入力
      await userEvent.type(nameInput, '  田中太郎  ');
      await userEvent.click(addButton);

      // 重複エラーのトーストが表示されることを確認
      expect(mockToast).toHaveBeenCalledWith({
        title: '重複エラー',
        description: '「田中太郎」は既に登録されています。',
        variant: 'destructive',
      });

      expect(participantService.addParticipantToSupabase).not.toHaveBeenCalled();
    });
  });

  describe('一括インポート時の重複チェック', () => {
    it('重複データをスキップして新規データのみインポートする', async () => {
      // 新規参加者の追加成功をモック
      vi.mocked(participantService.addParticipantToSupabase)
        .mockResolvedValueOnce({
          success: true,
          participant: { id: '4', name: '新規太郎' },
        })
        .mockResolvedValueOnce({
          success: true,
          participant: { id: '5', name: '新規花子' },
        });

      renderWithProvider();
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument();
      });

      // 一括インポートボタンをクリック
      const bulkImportButton = screen.getByRole('button', { name: /一括インポート/ });
      await userEvent.click(bulkImportButton);

      // テキストエリアに混合データを入力（重複あり・なし）
      const textarea = screen.getByLabelText('一括データ (1行に1名ずつ)');
      await userEvent.type(textarea, '田中太郎\\n新規太郎\\n佐藤花子\\n新規花子\\nYAMADA Jiro');

      // インポートボタンをクリック（一括インポートボタンではない方）
      const importButton = screen.getByRole('button', { name: 'インポート' });
      await userEvent.click(importButton);

      // 新規データのみがSupabaseに追加されることを確認
      await waitFor(() => {
        expect(participantService.addParticipantToSupabase).toHaveBeenCalledTimes(2);
        expect(participantService.addParticipantToSupabase).toHaveBeenCalledWith({ name: '新規太郎' });
        expect(participantService.addParticipantToSupabase).toHaveBeenCalledWith({ name: '新規花子' });
      });

      // トーストの呼び出しを順番に確認
      await waitFor(() => {
        // 重複警告が最初に呼ばれること
        expect(mockToast).toHaveBeenNthCalledWith(1, {
          title: '重複データを検出',
          description: '以下の参加者は既に登録されているためスキップされます: 田中太郎, 佐藤花子, YAMADA Jiro',
          variant: 'destructive',
        });

        // 成功メッセージが2番目に呼ばれること
        expect(mockToast).toHaveBeenNthCalledWith(2, {
          title: '一括インポート完了',
          description: '2人の参加者を追加しました。3人の重複をスキップしました。',
        });
      });
    });

    it('すべて重複の場合はエラーメッセージを表示する', async () => {
      renderWithProvider();
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument();
      });

      const bulkImportButton = screen.getByRole('button', { name: /一括インポート/ });
      await userEvent.click(bulkImportButton);

      const textarea = screen.getByLabelText('一括データ (1行に1名ずつ)');
      await userEvent.type(textarea, '田中太郎\\n佐藤花子\\nYAMADA JIRO');

      const importButton = screen.getByRole('button', { name: 'インポート' });
      await userEvent.click(importButton);

      // 重複警告が表示される
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '重複データを検出',
          description: '以下の参加者は既に登録されているためスキップされます: 田中太郎, 佐藤花子, YAMADA JIRO',
          variant: 'destructive',
        });
      });

      // すべて重複のエラーメッセージが表示される
      expect(mockToast).toHaveBeenCalledWith({
        title: 'エラー',
        description: 'すべてのデータが重複のためインポートできませんでした。',
        variant: 'destructive',
      });

      // Supabaseへの追加が実行されないことを確認
      expect(participantService.addParticipantToSupabase).not.toHaveBeenCalled();
    });

    it('重複なしの場合は通常のインポートメッセージを表示する', async () => {
      // 新規参加者の追加成功をモック
      const newParticipants = [
        { id: '4', name: '新規太郎' },
        { id: '5', name: '新規花子' },
      ];

      let callCount = 0;
      vi.mocked(participantService.addParticipantToSupabase).mockImplementation((participant) => {
        return Promise.resolve({
          success: true,
          participant: newParticipants[callCount++],
        });
      });

      renderWithProvider();
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument();
      });

      const bulkImportButton = screen.getByRole('button', { name: /一括インポート/ });
      await userEvent.click(bulkImportButton);

      const textarea = screen.getByLabelText('一括データ (1行に1名ずつ)');
      await userEvent.type(textarea, '新規太郎\\n新規花子');

      const importButton = screen.getByRole('button', { name: 'インポート' });
      await userEvent.click(importButton);

      // 重複警告は表示されない
      expect(mockToast).not.toHaveBeenCalledWith(
        expect.objectContaining({
          title: '重複データを検出',
        })
      );

      // 通常の成功メッセージが表示される
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '一括インポート完了',
          description: '2人の参加者を追加しました。',
        });
      });
    });
  });

  describe('エッジケース', () => {
    it('空文字や空白のみの入力で重複チェックしない', async () => {
      renderWithProvider();
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('名前');
      const addButton = screen.getByRole('button', { name: /参加者を追加/ });

      // 空白のみを入力
      await userEvent.type(nameInput, '   ');
      await userEvent.click(addButton);

      // 名前入力エラーが表示される
      expect(mockToast).toHaveBeenCalledWith({
        title: 'エラー',
        description: '名前を入力してください。',
        variant: 'destructive',
      });

      expect(participantService.addParticipantToSupabase).not.toHaveBeenCalled();
    });

    it('参加者データが読み込まれる前は重複チェックができない', async () => {
      // 読み込み中状態のモック
      vi.mocked(participantService.getAllParticipantsFromSupabase).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, participants: [] }), 1000))
      );

      renderWithProvider();

      // ローディング状態では追加ボタンが無効化されることを確認
      const addButton = screen.getByRole('button', { name: /参加者を追加/ });
      expect(addButton).toBeDisabled();
    });
  });
});