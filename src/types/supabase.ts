export interface ScheduleRecord {
  id?: string
  created_at?: string
  name: string
  start_date: string
  days_of_week: number[]
  frequency: 'weekly' | 'biweekly'
  presenters_per_session: number
  sessions: ScheduleSessionRecord[]
}

export interface ScheduleSessionRecord {
  id?: string
  schedule_id?: string
  date: string
  presenters: PresenterRecord[]
}

export interface PresenterRecord {
  participant_id: string
  participant_name: string
  slack_id: string
}

export interface Database {
  public: {
    Tables: {
      participants: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          slack_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['participants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['participants']['Insert']>
      }
      schedules: {
        Row: {
          id: string
          created_at: string
          name: string
          start_date: string
          days_of_week: number[]
          frequency: 'weekly' | 'biweekly'
          presenters_per_session: number
        }
        Insert: Omit<Database['public']['Tables']['schedules']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['schedules']['Insert']>
      }
      schedule_sessions: {
        Row: {
          id: string
          schedule_id: string
          date: string
          presenters: PresenterRecord[]
        }
        Insert: Omit<Database['public']['Tables']['schedule_sessions']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['schedule_sessions']['Insert']>
      }
    }
  }
}