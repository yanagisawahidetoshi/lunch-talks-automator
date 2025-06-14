
export interface Participant {
  id: string;
  name: string;
  slackId: string;
}

export interface ScheduleConfig {
  startDate: Date;
  dayOfWeek: number; // 0-6, where 0 is Sunday
  frequency: number; // 1 for weekly, 2 for bi-weekly, etc.
  presentersPerSession: number;
}

export interface ScheduleSession {
  date: Date;
  presenters: Participant[];
  weekNumber: number;
}

export interface AppState {
  participants: Participant[];
  config: ScheduleConfig | null;
  schedule: ScheduleSession[];
  lastGenerated: Date | null;
}

export interface BulkImportData {
  name: string;
  slackId: string;
}
