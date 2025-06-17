import type { Participant } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || ''

export async function getAllParticipantsFromSupabase() {
  try {
    const response = await fetch(`${API_URL}/api/participants`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch participants')
    }

    const participants = await response.json()
    
    // APIの形式からAppStateの形式に変換
    const convertedParticipants: Participant[] = participants.map((p: any) => ({
      id: p.id,
      name: p.name,
      slackId: p.slackId || undefined
    }))

    return { success: true, participants: convertedParticipants }
  } catch (error) {
    console.error('Error fetching participants:', error)
    return { success: false, error, participants: [] }
  }
}

export async function addParticipantToSupabase(participant: Omit<Participant, 'id'>) {
  try {
    const response = await fetch(`${API_URL}/api/participants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: participant.name,
        slackId: participant.slackId || null,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to add participant')
    }

    const data = await response.json()

    // APIの形式からAppStateの形式に変換
    const convertedParticipant: Participant = {
      id: data.id,
      name: data.name,
      slackId: data.slackId || undefined
    }

    return { success: true, participant: convertedParticipant }
  } catch (error) {
    console.error('Error adding participant:', error)
    return { success: false, error }
  }
}

export async function updateParticipantInSupabase(id: string, updates: Partial<Omit<Participant, 'id'>>) {
  try {
    const response = await fetch(`${API_URL}/api/participants`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        name: updates.name,
        slackId: updates.slackId || null,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to update participant')
    }

    const data = await response.json()

    // APIの形式からAppStateの形式に変換
    const convertedParticipant: Participant = {
      id: data.id,
      name: data.name,
      slackId: data.slackId || undefined
    }

    return { success: true, participant: convertedParticipant }
  } catch (error) {
    console.error('Error updating participant:', error)
    return { success: false, error }
  }
}

export async function deleteParticipantFromSupabase(id: string) {
  try {
    const response = await fetch(`${API_URL}/api/participants?id=${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete participant')
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting participant:', error)
    return { success: false, error }
  }
}
