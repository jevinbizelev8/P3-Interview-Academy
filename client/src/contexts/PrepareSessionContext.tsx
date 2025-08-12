import { createContext, useContext, useState, ReactNode } from 'react';
import type { Session, Question, Response } from '@shared/schema';

interface PrepareSessionContextType {
  currentSession: Session | null;
  currentQuestion: Question | null;
  currentResponse: Response | null;
  setCurrentSession: (session: Session | null) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setCurrentResponse: (response: Response | null) => void;
}

const PrepareSessionContext = createContext<PrepareSessionContextType | undefined>(undefined);

export function PrepareSessionProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentResponse, setCurrentResponse] = useState<Response | null>(null);

  const value = {
    currentSession,
    currentQuestion,
    currentResponse,
    setCurrentSession,
    setCurrentQuestion,
    setCurrentResponse,
  };

  return (
    <PrepareSessionContext.Provider value={value}>
      {children}
    </PrepareSessionContext.Provider>
  );
}

export function usePrepareSession() {
  const context = useContext(PrepareSessionContext);
  if (context === undefined) {
    throw new Error('usePrepareSession must be used within a PrepareSessionProvider');
  }
  return context;
}