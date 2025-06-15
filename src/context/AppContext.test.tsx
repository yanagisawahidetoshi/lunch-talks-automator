import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act, renderHook } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';
import { Participant, ScheduleConfig, ScheduleSession } from '../types';

// localStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

describe('AppContext', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  const renderWithProvider = (children: React.ReactNode) => {
    return render(<AppProvider>{children}</AppProvider>);
  };

  const useAppHook = () => {
    return renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
    });
  };

  it('初期状態が正しく設定される', () => {
    const { result } = useAppHook();

    expect(result.current.state.participants).toEqual([]);
    expect(result.current.state.config).toMatchObject({
      dayOfWeek: 5, // Friday
      frequency: 1, // Weekly
      presentersPerSession: 1
    });
    expect(result.current.state.schedule).toEqual([]);
    expect(result.current.state.lastGenerated).toBeNull();
  });

  it('参加者を追加できる', () => {
    const { result } = useAppHook();
    const newParticipant: Omit<Participant, 'id'> = {
      name: '田中太郎',
    };

    act(() => {
      result.current.addParticipant(newParticipant);
    });

    expect(result.current.state.participants).toHaveLength(1);
    expect(result.current.state.participants[0]).toMatchObject(newParticipant);
    expect(result.current.state.participants[0].id).toBeDefined();
  });

  it('参加者を削除できる', () => {
    const { result } = useAppHook();
    const newParticipant: Omit<Participant, 'id'> = {
      name: '田中太郎',
    };

    // 参加者を追加
    act(() => {
      result.current.addParticipant(newParticipant);
    });

    const participantId = result.current.state.participants[0].id;

    // 参加者を削除
    act(() => {
      result.current.removeParticipant(participantId);
    });

    expect(result.current.state.participants).toHaveLength(0);
  });

  it('参加者を更新できる', () => {
    const { result } = useAppHook();
    const newParticipant: Omit<Participant, 'id'> = {
      name: '田中太郎',
    };

    // 参加者を追加
    act(() => {
      result.current.addParticipant(newParticipant);
    });

    const participantId = result.current.state.participants[0].id;

    // 参加者を更新
    act(() => {
      result.current.updateParticipant(participantId, {
        name: '田中次郎',
      });
    });

    expect(result.current.state.participants[0].name).toBe('田中次郎');
  });

  it('複数の参加者を一括追加できる', () => {
    const { result } = useAppHook();
    const participants: Omit<Participant, 'id'>[] = [
      { name: '田中太郎' },
      { name: '佐藤花子' },
      { name: '鈴木一郎' },
    ];

    act(() => {
      result.current.bulkAddParticipants(participants);
    });

    expect(result.current.state.participants).toHaveLength(3);
    result.current.state.participants.forEach((p, index) => {
      expect(p).toMatchObject(participants[index]);
      expect(p.id).toBeDefined();
    });
  });

  it('設定を更新できる', () => {
    const { result } = useAppHook();
    const config: ScheduleConfig = {
      startDate: new Date('2024-01-08'),
      dayOfWeek: 1,
      frequency: 1,
      presentersPerSession: 2,
    };

    act(() => {
      result.current.setConfig(config);
    });

    expect(result.current.state.config).toEqual(config);
  });

  it('スケジュールを設定できる', () => {
    const { result } = useAppHook();
    const schedule: ScheduleSession[] = [
      {
        date: new Date('2024-01-08'),
        presenters: [
          { id: '1', name: '田中太郎' },
        ],
        weekNumber: 1,
      },
    ];

    act(() => {
      result.current.setSchedule(schedule);
    });

    expect(result.current.state.schedule).toEqual(schedule);
    expect(result.current.state.lastGenerated).toBeInstanceOf(Date);
  });

  it('全データをクリアできる', () => {
    const { result } = useAppHook();

    // データを追加
    act(() => {
      result.current.addParticipant({ name: '田中太郎' });
      result.current.setConfig({
        startDate: new Date('2024-01-08'),
        dayOfWeek: 1,
        frequency: 1,
        presentersPerSession: 1,
      });
    });

    // データをクリア
    act(() => {
      result.current.clearAll();
    });

    expect(result.current.state.participants).toEqual([]);
    expect(result.current.state.config).toMatchObject({
      dayOfWeek: 5, // Friday
      frequency: 1, // Weekly
      presentersPerSession: 1
    });
    expect(result.current.state.schedule).toEqual([]);
    expect(result.current.state.lastGenerated).toBeNull();
  });

  it('localStorageから参加者データを読み込む', () => {
    const savedParticipants = [
      { id: '1', name: '田中太郎' },
      { id: '2', name: '佐藤花子' },
    ];

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedParticipants));

    const { result } = useAppHook();

    expect(result.current.state.participants).toEqual(savedParticipants);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('ltSchedulerParticipants');
  });

  it('参加者データをlocalStorageに保存する', () => {
    const { result } = useAppHook();
    const newParticipant: Omit<Participant, 'id'> = {
      name: '田中太郎',
    };

    act(() => {
      result.current.addParticipant(newParticipant);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'ltSchedulerParticipants',
      expect.stringContaining('田中太郎')
    );
  });

  it('useAppが適切なコンテキスト外で使用された場合エラーを投げる', () => {
    expect(() => {
      renderHook(() => useApp());
    }).toThrow('useApp must be used within an AppProvider');
  });
});