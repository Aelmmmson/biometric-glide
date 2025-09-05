import { createContext, useContext, useReducer, ReactNode } from 'react';

interface BiometricData {
  photo: string | null;
  signature: string | null;
  idType: 'passport' | 'national-id' | 'voter-id' | 'drivers-license' | null;
  idFront: string | null;
  idBack: string | null;
  fingerprint: string | null;
}

interface BiometricState {
  currentStep: number;
  data: BiometricData;
  submissions: {
    photoSignature: boolean;
    identification: boolean;
    fingerprint: boolean;
  };
  isCompleted: boolean;
}

type BiometricAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_PHOTO'; photo: string | null }
  | { type: 'SET_SIGNATURE'; signature: string | null }
  | { type: 'SET_ID_TYPE'; idType: 'passport' | 'national-id' | 'voter-id' | 'drivers-license' }
  | { type: 'SET_ID_FRONT'; idFront: string | null }
  | { type: 'SET_ID_BACK'; idBack: string | null }
  | { type: 'SET_FINGERPRINT'; fingerprint: string | null }
  | { type: 'SUBMIT_PHOTO_SIGNATURE' }
  | { type: 'SUBMIT_IDENTIFICATION' }
  | { type: 'SUBMIT_FINGERPRINT' }
  | { type: 'COMPLETE_PROCESS' }
  | { type: 'RESET' };

const initialState: BiometricState = {
  currentStep: 1,
  data: {
    photo: null,
    signature: null,
    idType: null,
    idFront: null,
    idBack: null,
    fingerprint: null,
  },
  submissions: {
    photoSignature: false,
    identification: false,
    fingerprint: false,
  },
  isCompleted: false,
};

function biometricReducer(state: BiometricState, action: BiometricAction): BiometricState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'SET_PHOTO':
      return { ...state, data: { ...state.data, photo: action.photo } };
    case 'SET_SIGNATURE':
      return { ...state, data: { ...state.data, signature: action.signature } };
    case 'SET_ID_TYPE':
      return { ...state, data: { ...state.data, idType: action.idType, idFront: null, idBack: null } };
    case 'SET_ID_FRONT':
      return { ...state, data: { ...state.data, idFront: action.idFront } };
    case 'SET_ID_BACK':
      return { ...state, data: { ...state.data, idBack: action.idBack } };
    case 'SET_FINGERPRINT':
      return { ...state, data: { ...state.data, fingerprint: action.fingerprint } };
    case 'SUBMIT_PHOTO_SIGNATURE':
      return { ...state, submissions: { ...state.submissions, photoSignature: true } };
    case 'SUBMIT_IDENTIFICATION':
      return { ...state, submissions: { ...state.submissions, identification: true } };
    case 'SUBMIT_FINGERPRINT':
      return { ...state, submissions: { ...state.submissions, fingerprint: true } };
    case 'COMPLETE_PROCESS':
      return { ...state, isCompleted: true };
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