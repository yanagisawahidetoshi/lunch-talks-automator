import type { ScheduleSession } from '@/types'
import { format } from 'date-fns'

const API_URL = import.meta.env.VITE_API_URL || ''

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
    // スケジュールを作成（セッションごとに）
    const promises = sessions.map(session => 
      fetch(`${API_URL}/api/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${name} - ${format(session.date, 'yyyy/MM/dd')}`,
          date: session.date.toISOString(),
          duration: 60, // デフォルト60分
          description: `発表者: ${session.presenters.map(p => p.name).join(', ')}`,
          participants: session.presenters.map((p, idx) => ({
            participantId: p.id,
            role: 'speaker',
            order: idx,
          })),
        }),
      })
    )

    const responses = await Promise.all(promises)
    const allOk = responses.every(r => r.ok)

    if (!allOk) {
      throw new Error('Failed to save some schedules')
    }

    return { success: true }
  } catch (error) {
    console.error('Error saving schedule:', error)
    return { success: false, error }
  }
}

export async function getScheduleFromSupabase(scheduleId: string) {
  try {
    const response = await fetch(`${API_URL}/api/schedules?id=${scheduleId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch schedule')
    }

    const schedule = await response.json()
    
    return { 
      success: true, 
      schedule
    }
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return { success: false, error }
  }
}

export async function getAllSchedulesFromSupabase() {
  try {
    const response = await fetch(`${API_URL}/api/schedules`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch schedules')
    }

    const schedules = await response.json()
    
    return { success: true, schedules }
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return { success: false, error }
  }
}

export async function getLatestScheduleWithSessions() {
  try {
    const response = await fetch(`${API_URL}/api/schedules`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch schedules')
    }

    const schedules = await response.json()
    
    if (schedules.length === 0) {
      return { success: true, schedule: null, sessions: [] }
    }

    // グループ化して最新のスケジュールグループを見つける
    // TODO: より良い実装に変更
    const latestSchedule = schedules[0]
    
    return { 
      success: true, 
      schedule: latestSchedule,
      sessions: schedules
    }
  } catch (error) {
    console.error('Error fetching latest schedule:', error)
    return { success: false, error }
  }
}
