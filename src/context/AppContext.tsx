import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, Participant, ScheduleConfig, ScheduleSession } from '../types';
import {
  getAllParticipantsFromSupabase,
  addParticipantToSupabase,
  updateParticipantInSupabase,
  deleteParticipantFromSupabase
} from '../lib/participantService';

interface AppContextType {
  state: AppState;
  addParticipant: (participant: Omit<Participant, 'id'>) => Promise<void>;
  removeParticipant: (id: string) => Promise<void>;
  updateParticipant: (id: string, updates: Partial<Participant>) => Promise<void>;
  bulkAddParticipants: (participants: Omit<Participant, 'id'>[]) => Promise<void>;
  setConfig: (config: ScheduleConfig) => void;
  setSchedule: (schedule: ScheduleSession[]) => void;
  clearAll: () => void;
  isLoadingParticipants: boolean;
}

type AppAction =
  | { type: 'ADD_PARTICIPANT'; payload: Omit<Participant, 'id'> }
  | { type: 'REMOVE_PARTICIPANT'; payload: string }
  | { type: 'UPDATE_PARTICIPANT'; payload: { id: string; updates: Partial<Participant> } }
  | { type: 'BULK_ADD_PARTICIPANTS'; payload: Omit<Participant, 'id'>[] }
  | { type: 'SET_CONFIG'; payload: ScheduleConfig }
  | { type: 'SET_SCHEDULE'; payload: ScheduleSession[] }
  | { type: 'LOAD_PARTICIPANTS'; payload: Participant[] }
  | { type: 'CLEAR_ALL' };

const initialState: AppState = {
  participants: [],
  config: {
    startDate: new Date(),
    dayOfWeek: 5, // Friday
    frequency: 1, // Weekly
    presentersPerSession: 1
  },
  schedule: [],
  lastGenerated: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_PARTICIPANT':
      return {
        ...state,
        participants: [...state.participants, { ...action.payload, id: crypto.randomUUID() }],
      };
    case 'REMOVE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.filter(p => p.id !== action.payload),
      };
    case 'UPDATE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };
    case 'BULK_ADD_PARTICIPANTS':
      return {
        ...state,
        participants: [
          ...state.participants,
          ...action.payload.map(p => ({ ...p, id: crypto.randomUUID() })),
        ],
      };
    case 'SET_CONFIG':
      return {
        ...state,
        config: action.payload,
      };
    case 'SET_SCHEDULE':
      return {
        ...state,
        schedule: action.payload,
        lastGenerated: new Date(),
      };
    case 'LOAD_PARTICIPANTS':
      return {
        ...state,
        participants: action.payload,
      };
    case 'CLEAR_ALL':
      return initialState;
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoadingParticipants, setIsLoadingParticipants] = React.useState(true);

  // 初期描画時にSupabaseから参加者データを読み込み
  useEffect(() => {
    const loadParticipants = async () => {
      try {
        const result = await getAllParticipantsFromSupabase();
        if (result.success) {
          dispatch({ type: 'LOAD_PARTICIPANTS', payload: result.participants });
        }
      } catch (error) {
        console.error('Failed to load participants from Supabase:', error);
      } finally {
        setIsLoadingParticipants(false);
      }
    };
    
    loadParticipants();
  }, []);

  const addParticipant = async (participant: Omit<Participant, 'id'>) => {
    const result = await addParticipantToSupabase(participant);
    if (result.success && result.participant) {
      dispatch({ type: 'LOAD_PARTICIPANTS', payload: [...state.participants, result.participant] });
    } else {
      throw new Error('参加者の追加に失敗しました');
    }
  };

  const removeParticipant = async (id: string) => {
    const result = await deleteParticipantFromSupabase(id);
    if (result.success) {
      dispatch({ type: 'REMOVE_PARTICIPANT', payload: id });
    } else {
      throw new Error('参加者の削除に失敗しました');
    }
  };

  const updateParticipant = async (id: string, updates: Partial<Participant>) => {
    const result = await updateParticipantInSupabase(id, updates);
    if (result.success && result.participant) {
      dispatch({ type: 'UPDATE_PARTICIPANT', payload: { id, updates } });
    } else {
      throw new Error('参加者の更新に失敗しました');
    }
  };

  const bulkAddParticipants = async (participants: Omit<Participant, 'id'>[]) => {
    try {
      const results = await Promise.all(
        participants.map(p => addParticipantToSupabase(p))
      );
      
      const successfulParticipants = results
        .filter(r => r.success && r.participant)
        .map(r => r.participant!);
      
      if (successfulParticipants.length > 0) {
        dispatch({ 
          type: 'LOAD_PARTICIPANTS', 
          payload: [...state.participants, ...successfulParticipants] 
        });
      }
      
      const failedCount = participants.length - successfulParticipants.length;
      if (failedCount > 0) {
        throw new Error(`${failedCount}件の参加者追加に失敗しました`);
      }
    } catch (error) {
      throw error;
    }
  };

  const setConfig = (config: ScheduleConfig) => {
    dispatch({ type: 'SET_CONFIG', payload: config });
  };

  const setSchedule = (schedule: ScheduleSession[]) => {
    dispatch({ type: 'SET_SCHEDULE', payload: schedule });
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        addParticipant,
        removeParticipant,
        updateParticipant,
        bulkAddParticipants,
        setConfig,
        setSchedule,
        clearAll,
        isLoadingParticipants,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
