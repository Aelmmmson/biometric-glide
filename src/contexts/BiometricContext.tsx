import { createContext, useContext, useReducer, ReactNode } from 'react';

interface BiometricData {
  photo: string | null;
  signature: string | null;
  passport: string | null;
  fingerprint: string | null;
}

interface BiometricState {
  currentStep: number;
  data: BiometricData;
  isSubmitted: boolean;
}

type BiometricAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_PHOTO'; photo: string }
  | { type: 'SET_SIGNATURE'; signature: string }
  | { type: 'SET_PASSPORT'; passport: string }
  | { type: 'SET_FINGERPRINT'; fingerprint: string }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'RESET' };

const initialState: BiometricState = {
  currentStep: 1,
  data: {
    photo: null,
    signature: null,
    passport: null,
    fingerprint: null,
  },
  isSubmitted: false,
};

function biometricReducer(state: BiometricState, action: BiometricAction): BiometricState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'SET_PHOTO':
      return { ...state, data: { ...state.data, photo: action.photo } };
    case 'SET_SIGNATURE':
      return { ...state, data: { ...state.data, signature: action.signature } };
    case 'SET_PASSPORT':
      return { ...state, data: { ...state.data, passport: action.passport } };
    case 'SET_FINGERPRINT':
      return { ...state, data: { ...state.data, fingerprint: action.fingerprint } };
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitted: true };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const BiometricContext = createContext<{
  state: BiometricState;
  dispatch: React.Dispatch<BiometricAction>;
} | null>(null);

export function BiometricProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(biometricReducer, initialState);

  return (
    <BiometricContext.Provider value={{ state, dispatch }}>
      {children}
    </BiometricContext.Provider>
  );
}

export function useBiometric() {
  const context = useContext(BiometricContext);
  if (!context) {
    throw new Error('useBiometric must be used within a BiometricProvider');
  }
  return context;
}