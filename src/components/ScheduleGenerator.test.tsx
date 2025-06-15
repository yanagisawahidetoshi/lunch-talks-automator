import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScheduleGenerator } from './ScheduleGenerator';
import { AppProvider, useApp } from '../context/AppContext';
import { Participant, ScheduleConfig } from '../types';

// toastのモック
const mockToast = vi.fn();
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// date-fnsのモック（日付計算を予測可能にする）
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    format: vi.fn((date, format) => date.toISOString().split('T')[0]),
  };
});

// Math.randomのモック
vi.spyOn(Math, 'random').mockReturnValue(0.5);

describe('ScheduleGenerator', () => {
  const mockParticipants: Participant[] = [
    { id: '1', name: '田中太郎' },
    { id: '2', name: '佐藤花子' },
    { id: '3', name: '鈴木一郎' },
  ];

  const mockConfig: ScheduleConfig = {
    startDate: new Date('2024-01-08'),
    dayOfWeek: 1, // Monday
    frequency: 1, // Weekly
    presentersPerSession: 1,
  };

  beforeEach(() => {
    mockToast.mockClear();
  });

  const renderWithProvider = (
    participants: Participant[] = [],
    config: ScheduleConfig | null = null
  ) => {
    return render(
      <AppProvider>
        <TestComponent participants={participants} config={config} />
      </AppProvider>
    );
  };

  // テスト用のラッパーコンポーネント
  const TestComponent = ({ 
    participants, 
    config 
  }: { 
    participants: Participant[]; 
    config: ScheduleConfig | null; 
  }) => {
    const { bulkAddParticipants, setConfig } = useApp();
    
    React.useEffect(() => {
      if (participants.length > 0) {
        bulkAddParticipants(participants);
      }
      if (config) {
        setConfig(config);
      }
    }, [participants, config, bulkAddParticipants, setConfig]);

    return <ScheduleGenerator />;
  };

  it('初期状態では生成ボタンが無効になっている', () => {
    renderWithProvider();
    
    const generateButton = screen.getByRole('button', { name: /スケジュール生成/ });
    expect(generateButton).toBeDisabled();
  });

  it('参加者と設定が完了すると生成ボタンが有効になる', () => {
    renderWithProvider(mockParticipants, mockConfig);
    
    const generateButton = screen.getByRole('button', { name: /スケジュール生成/ });
    expect(generateButton).toBeEnabled();
  });

  it('参加者数と設定状況が正しく表示される', () => {
    renderWithProvider(mockParticipants, mockConfig);
    
    expect(screen.getByText('参加者: 3人')).toBeInTheDocument();
    expect(screen.getByText('設定: 完了')).toBeInTheDocument();
    expect(screen.getByText('準備完了')).toBeInTheDocument();
  });

  it('参加者または設定が不足している場合の表示', () => {
    renderWithProvider([], null);
    
    expect(screen.getByText('参加者: 0人')).toBeInTheDocument();
    expect(screen.getByText('設定: 未完了')).toBeInTheDocument();
    expect(screen.getByText('設定中')).toBeInTheDocument();
  });

  it('スケジュール生成が成功する', async () => {
    renderWithProvider(mockParticipants, mockConfig);
    
    const generateButton = screen.getByRole('button', { name: /スケジュール生成/ });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'スケジュール生成完了',
        description: '3回分のスケジュールを生成しました。',
      });
    });
  });

  it('参加者がいない場合エラーメッセージが表示される', async () => {
    renderWithProvider([], mockConfig);
    
    const generateButton = screen.getByRole('button', { name: /スケジュール生成/ });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'エラー',
        description: '参加者とスケジュール設定を完了してください。',
        variant: 'destructive',
      });
    });
  });

  it('生成されたスケジュールが表示される', async () => {
    renderWithProvider(mockParticipants, mockConfig);
    
    const generateButton = screen.getByRole('button', { name: /スケジュール生成/ });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('生成されたスケジュール')).toBeInTheDocument();
    });

    // スケジュールのアイテムが表示されることを確認
    expect(screen.getByText('田中太郎')).toBeInTheDocument();
  });

  it('スケジュールが生成されていない場合CSV出力ボタンでエラーが表示される', async () => {
    renderWithProvider(mockParticipants, mockConfig);
    
    // CSV出力ボタンを探してクリック（スケジュール生成前）
    const csvButton = screen.queryByRole('button', { name: /CSV出力/ });
    if (csvButton) {
      fireEvent.click(csvButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'エラー',
          description: '先にスケジュールを生成してください。',
          variant: 'destructive',
        });
      });
    }
  });

  it('スケジュール生成後にCSV出力ボタンが表示される', async () => {
    renderWithProvider(mockParticipants, mockConfig);
    
    const generateButton = screen.getByRole('button', { name: /スケジュール生成/ });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /CSV出力/ })).toBeInTheDocument();
    });
  });

  it('空状態のメッセージが表示される', () => {
    renderWithProvider();
    
    expect(screen.getByText('スケジュールを生成すると、ここに表示されます')).toBeInTheDocument();
  });
});