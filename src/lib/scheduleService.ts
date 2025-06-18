import { supabase } from './supabase'
import type { ScheduleSession } from '@/types'
import type { ScheduleRecord, ScheduleSessionRecord } from '@/types/supabase'
import { format } from 'date-fns'

export async function saveScheduleToSupabase(
  name: string,
  config: {
    startDate: Date
    dayOfWeek: number
    frequency: number
    presentersPerSession: number
  },
  sessions: ScheduleSession[]
) {
  try {
    // frequencyを文字列に変換（1: weekly, 2: biweekly）
    const frequencyString = config.frequency === 1 ? 'weekly' : 'biweekly';
    
    // 1. スケジュールのメインレコードを作成
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .insert({
        name,
        start_date: format(config.startDate, 'yyyy-MM-dd'),
        days_of_week: [config.dayOfWeek], // 単一の曜日を配列に変換
        frequency: frequencyString,
        presenters_per_session: config.presentersPerSession,
      })
      .select()
      .single()

    if (scheduleError) {
      throw scheduleError
    }

    // 2. セッションレコードを作成
    const sessionRecords: Omit<ScheduleSessionRecord, 'id'>[] = sessions.map(session => ({
      schedule_id: schedule.id,
      date: format(session.date, 'yyyy-MM-dd'),
      presenters: session.presenters.map(p => ({
        participant_id: p.id,
        participant_name: p.name,
        slack_id: p.slackId,
      })),
    }))

    const { error: sessionsError } = await supabase
      .from('schedule_sessions')
      .insert(sessionRecords)

    if (sessionsError) {
      throw sessionsError
    }

    return { success: true, scheduleId: schedule.id }
  } catch (error) {
    console.error('Error saving schedule to Supabase:', error)
    return { success: false, error }
  }
}

export async function getScheduleFromSupabase(scheduleId: string) {
  try {
    // スケジュールメインレコードを取得
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()

    if (scheduleError) {
      throw scheduleError
    }

    // セッションレコードを取得
    const { data: sessions, error: sessionsError } = await supabase
      .from('schedule_sessions')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('date', { ascending: true })

    if (sessionsError) {
      throw sessionsError
    }

    return { 
      success: true, 
      schedule: {
        ...schedule,
        sessions
      }
    }
  } catch (error) {
    console.error('Error fetching schedule from Supabase:', error)
    return { success: false, error }
  }
}

export async function getAllSchedulesFromSupabase() {
  try {
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return { success: true, schedules }
  } catch (error) {
    console.error('Error fetching schedules from Supabase:', error)
    return { success: false, error }
  }
}

export async function getLatestScheduleWithSessions() {
  try {
    // 最新のスケジュールを取得
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (scheduleError) {
      if (scheduleError.code === 'PGRST116') {
        // データが存在しない場合
        return { success: true, schedule: null, sessions: [] }
      }
      throw scheduleError
    }

    // そのスケジュールのセッションを取得
    const { data: sessions, error: sessionsError } = await supabase
      .from('schedule_sessions')
      .select('*')
      .eq('schedule_id', schedule.id)
      .order('date', { ascending: true })

    if (sessionsError) {
      throw sessionsError
    }

    return { 
      success: true, 
      schedule,
      sessions: sessions || []
    }
  } catch (error) {
    console.error('Error fetching latest schedule from Supabase:', error)
    return { success: false, error }
  }
}
