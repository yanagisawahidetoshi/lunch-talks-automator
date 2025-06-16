import { supabase } from './supabase'
import type { Participant } from '@/types'

export async function getAllParticipantsFromSupabase() {
  try {
    const { data: participants, error } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    // Supabaseの形式からAppStateの形式に変換
    const convertedParticipants: Participant[] = (participants || []).map(p => ({
      id: p.id,
      name: p.name,
      slackId: p.slack_id || undefined
    }))

    return { success: true, participants: convertedParticipants }
  } catch (error) {
    console.error('Error fetching participants from Supabase:', error)
    return { success: false, error, participants: [] }
  }
}

export async function addParticipantToSupabase(participant: Omit<Participant, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('participants')
      .insert({
        name: participant.name,
        slack_id: participant.slackId || null,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Supabaseの形式からAppStateの形式に変換
    const convertedParticipant: Participant = {
      id: data.id,
      name: data.name,
      slackId: data.slack_id || undefined
    }

    return { success: true, participant: convertedParticipant }
  } catch (error) {
    console.error('Error adding participant to Supabase:', error)
    return { success: false, error }
  }
}

export async function updateParticipantInSupabase(id: string, updates: Partial<Omit<Participant, 'id'>>) {
  try {
    const { data, error } = await supabase
      .from('participants')
      .update({
        name: updates.name,
        slack_id: updates.slackId || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Supabaseの形式からAppStateの形式に変換
    const convertedParticipant: Participant = {
      id: data.id,
      name: data.name,
      slackId: data.slack_id || undefined
    }

    return { success: true, participant: convertedParticipant }
  } catch (error) {
    console.error('Error updating participant in Supabase:', error)
    return { success: false, error }
  }
}

export async function deleteParticipantFromSupabase(id: string) {
  try {
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting participant from Supabase:', error)
    return { success: false, error }
  }
}