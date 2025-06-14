import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, Participant, ScheduleConfig, ScheduleSession } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface AppContextType {
  state: AppState;
  addParticipant: (participant: Omit<Participant, 'id'>) => void;
  removeParticipant: (id: string) => void;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  bulkAddParticipants: (participants: Omit<Participant, 'id'>[]) => void;
  setConfig: (config: ScheduleConfig) => void;
  setSchedule: (schedule: ScheduleSession[]) => void;
  clearAll: () => void;
}

type AppAction =
  | { type: 'ADD_PARTICIPANT'; payload: Omit<Participant, 'id'> }
  | { type: 'REMOVE_PARTICIPANT'; payload: string }
  | { type: 'UPDATE_PARTICIPANT'; payload: { id: string; updates: Partial<Participant> } }
  | { type: 'BULK_ADD_PARTICIPANTS'; payload: Omit<Participant, 'id'>[] }
  | { type: 'SET_CONFIG'; payload: ScheduleConfig }
  | { type: 'SET_SCHEDULE'; payload: ScheduleSession[] }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'CLEAR_ALL' };

const initialState: AppState = {
  participants: [],
  config: null,
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
    case 'LOAD_STATE':
      return action.payload;
    case 'CLEAR_ALL':
      return initialState;
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [storedState, setStoredState] = useLocalStorage('ltSchedulerState', initialState);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    if (!isInitialized && storedState && storedState.participants.length > 0) {
      // 日付オブジェクトを復元
      const restoredState = {
        ...storedState,
        config: storedState.config ? {
          ...storedState.config,
          startDate: storedState.config.startDate ? new Date(storedState.config.startDate) : null
        } : null,
        schedule: storedState.schedule.map(session => ({
          ...session,
          date: new Date(session.date)
        })),
        lastGenerated: storedState.lastGenerated ? new Date(storedState.lastGenerated) : null
      };
      dispatch({ type: 'LOAD_STATE', payload: restoredState });
      setIsInitialized(true);
    } else if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [isInitialized, storedState]);

  // Save state to localStorage whenever it changes (防止無限ループ)
  useEffect(() => {
    if (isInitialized) {
      // 日付をシリアライズ可能な形式に変換
      const serializableState = {
        ...state,
        config: state.config ? {
          ...state.config,
          startDate: state.config.startDate ? state.config.startDate.toISOString() : null
        } : null,
        schedule: state.schedule.map(session => ({
          ...session,
          date: session.date.toISOString()
        })),
        lastGenerated: state.lastGenerated ? state.lastGenerated.toISOString() : null
      };
      setStoredState(serializableState);
    }
  }, [state, setStoredState, isInitialized]);

  const addParticipant = (participant: Omit<Participant, 'id'>) => {
    dispatch({ type: 'ADD_PARTICIPANT', payload: participant });
  };

  const removeParticipant = (id: string) => {
    dispatch({ type: 'REMOVE_PARTICIPANT', payload: id });
  };

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    dispatch({ type: 'UPDATE_PARTICIPANT', payload: { id, updates } });
  };

  const bulkAddParticipants = (participants: Omit<Participant, 'id'>[]) => {
    dispatch({ type: 'BULK_ADD_PARTICIPANTS', payload: participants });
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
