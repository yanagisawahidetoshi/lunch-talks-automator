import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSchedule } from './scheduleGenerator';
import { Participant, ScheduleConfig } from '../types';

describe('generateSchedule', () => {
  const mockParticipants: Participant[] = [
    { id: '1', name: '田中太郎' },
    { id: '2', name: '佐藤花子' },
    { id: '3', name: '鈴木一郎' },
    { id: '4', name: '高橋美咲' },
  ];

  const baseConfig: ScheduleConfig = {
    startDate: new Date('2024-01-08'), // 月曜日
    dayOfWeek: 1, // 月曜日
    frequency: 1, // 毎週
    presentersPerSession: 1
  };

  beforeEach(() => {
    // Math.randomをモック化してテストを予測可能にする
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('参加者が0人の場合、空の配列を返す', () => {
    const result = generateSchedule([], baseConfig);
    expect(result).toEqual([]);
  });

  it('設定がnullの場合、空の配列を返す', () => {
    const result = generateSchedule(mockParticipants, null as any);
    expect(result).toEqual([]);
  });

  it('基本的なスケジュール生成が正常に動作する', () => {
    const result = generateSchedule(mockParticipants, baseConfig);
    
    expect(result).toHaveLength(4); // 参加者4人、1回1人なので4回
    expect(result[0].presenters).toHaveLength(1);
    expect(result[0].weekNumber).toBe(1);
    expect(result[1].weekNumber).toBe(2);
  });

  it('1回あたりの発表者数が2人の場合、正しく分割される', () => {
    const config: ScheduleConfig = {
      ...baseConfig,
      presentersPerSession: 2
    };
    
    const result = generateSchedule(mockParticipants, config);
    
    expect(result).toHaveLength(2); // 参加者4人、1回2人なので2回
    expect(result[0].presenters).toHaveLength(2);
    expect(result[1].presenters).toHaveLength(2);
  });

  it('隔週開催の場合、週番号が正しく設定される', () => {
    const config: ScheduleConfig = {
      ...baseConfig,
      frequency: 2 // 隔週
    };
    
    const result = generateSchedule(mockParticipants, config);
    
    expect(result[0].weekNumber).toBe(1);
    expect(result[1].weekNumber).toBe(3); // 隔週なので+2
    expect(result[2].weekNumber).toBe(5);
  });

  it('開始日の曜日が異なる場合、正しい曜日に調整される', () => {
    const config: ScheduleConfig = {
      ...baseConfig,
      startDate: new Date('2024-01-07'), // 日曜日
      dayOfWeek: 1 // 月曜日に調整されるべき
    };
    
    const result = generateSchedule(mockParticipants, config);
    
    // 最初のスケジュールの日付が月曜日（dayOfWeek: 1）になっているはず
    expect(result[0].date.getDay()).toBe(1);
    expect(result[0].date.getDate()).toBe(8); // 1/7の次の月曜日は1/8
  });

  it('開始日が既に正しい曜日の場合、そのまま使用される', () => {
    const config: ScheduleConfig = {
      ...baseConfig,
      startDate: new Date('2024-01-08'), // 月曜日
      dayOfWeek: 1 // 月曜日
    };
    
    const result = generateSchedule(mockParticipants, config);
    
    expect(result[0].date.getDate()).toBe(8); // そのまま1/8が使用される
  });

  it('参加者数が発表者数で割り切れない場合、最後のセッションに残りが含まれる', () => {
    const config: ScheduleConfig = {
      ...baseConfig,
      presentersPerSession: 3 // 参加者4人、1回3人
    };
    
    const result = generateSchedule(mockParticipants, config);
    
    expect(result).toHaveLength(2);
    expect(result[0].presenters).toHaveLength(3);
    expect(result[1].presenters).toHaveLength(1); // 残り1人
  });

  it('週番号が正しく連続して設定される', () => {
    const result = generateSchedule(mockParticipants, baseConfig);
    
    for (let i = 0; i < result.length; i++) {
      expect(result[i].weekNumber).toBe(i + 1);
    }
  });

  it('日付が正しく週間隔で設定される', () => {
    const result = generateSchedule(mockParticipants, baseConfig);
    
    for (let i = 1; i < result.length; i++) {
      const prevDate = result[i - 1].date;
      const currentDate = result[i].date;
      const diffInDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffInDays).toBe(7); // 1週間 = 7日
    }
  });
});