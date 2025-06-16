import { addWeeks, addDays } from 'date-fns';
import { Participant, ScheduleConfig, ScheduleSession } from '../types';

// Fisher-Yates シャッフルアルゴリズムによる真のランダムシャッフル
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const generateSchedule = (
  participants: Participant[],
  config: ScheduleConfig
): ScheduleSession[] => {
  if (!config || participants.length === 0) {
    return [];
  }

  const { startDate, dayOfWeek, frequency, presentersPerSession } = config;
  const schedule: ScheduleSession[] = [];
  
  // 参加者を真にランダムにシャッフル
  const shuffledParticipants = shuffleArray(participants);
  
  // 開始日を設定された曜日に調整
  let currentDate = new Date(startDate);
  const startDayOfWeek = currentDate.getDay();
  
  if (startDayOfWeek !== dayOfWeek) {
    // 次の指定曜日まで日付を進める
    const daysToAdd = (dayOfWeek - startDayOfWeek + 7) % 7;
    if (daysToAdd > 0) {
      currentDate = addDays(currentDate, daysToAdd);
    }
  }
  
  let weekNumber = 1;
  let participantIndex = 0;
  
  // 全員が発表するまでスケジュールを生成
  while (participantIndex < shuffledParticipants.length) {
    const presenters: Participant[] = [];
    
    // 1回あたりの発表者数分を選択
    for (let i = 0; i < presentersPerSession && participantIndex < shuffledParticipants.length; i++) {
      presenters.push(shuffledParticipants[participantIndex]);
      participantIndex++;
    }
    
    if (presenters.length > 0) {
      schedule.push({
        date: new Date(currentDate),
        presenters,
        weekNumber
      });
      
      // 次の開催日を計算
      currentDate = addWeeks(currentDate, frequency);
      weekNumber += frequency;
    }
  }
  
  return schedule;
};