import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { ActivityConfig } from '@/services/api';

interface BiometricData {
  photo: string | null;
  signature: string | null;
  idType: 'passport' | 'national-id' | 'voter-id' | 'drivers-license' | null;
  idFront: string | null;
  idBack: string | null;
  thumbprint1: string | null;
  thumbprint2: string | null;
}

interface BiometricState {
  currentStep: number;
  data: BiometricData;
  submissions: {
    photoSignature: boolean;
    identification: boolean;
    thumbprints: boolean;
  };
  isCompleted: boolean;
  activityConfig: ActivityConfig | null;
  isActivityConfigLoaded: boolean;
}

type BiometricAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_PHOTO'; photo: string | null }
  | { type: 'SET_SIGNATURE'; signature: string | null }
  | { type: 'SET_ID_TYPE'; idType: 'passport' | 'national-id' | 'voter-id' | 'drivers-license' | null }
  | { type: 'SET_ID_FRONT'; idFront: string | null }
  | { type: 'SET_ID_BACK'; idBack: string | null }
  | { type: 'SET_THUMBPRINT1'; thumbprint1: string | null }
  | { type: 'SET_THUMBPRINT2'; thumbprint2: string | null }
  | { type: 'SUBMIT_PHOTO_SIGNATURE' }
  | { type: 'SUBMIT_IDENTIFICATION' }
  | { type: 'SUBMIT_THUMBPRINTS' }
  | { type: 'COMPLETE_PROCESS' }
  | { type: 'RESET' }
  | { type: 'SET_ACTIVITY_CONFIG'; payload: ActivityConfig }
  | { type: 'SET_ACTIVITY_CONFIG_LOADED' };

const initialState: BiometricState = {
  currentStep: 1,
  data: {
    photo: null,
    signature: null,
    idType: null,
    idFront: null,
    idBack: null,
    thumbprint1: null,
    thumbprint2: null,
  },
  submissions: {
    photoSignature: false,
    identification: false,
    thumbprints: false,
  },
  isCompleted: false,
  activityConfig: null,
  isActivityConfigLoaded: false,
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
    case 'SET_THUMBPRINT1':
      return { ...state, data: { ...state.data, thumbprint1: action.thumbprint1 } };
    case 'SET_THUMBPRINT2':
      return { ...state, data: { ...state.data, thumbprint2: action.thumbprint2 } };
    case 'SUBMIT_PHOTO_SIGNATURE':
      return { ...state, submissions: { ...state.submissions, photoSignature: true } };
    case 'SUBMIT_IDENTIFICATION':
      return { ...state, submissions: { ...state.submissions, identification: true } };
    case 'SUBMIT_THUMBPRINTS':
      return { ...state, submissions: { ...state.submissions, thumbprints: true } };
    case 'COMPLETE_PROCESS':
      return { ...state, isCompleted: true };
    case 'RESET':
      return { ...initialState, activityConfig: state.activityConfig, isActivityConfigLoaded: state.isActivityConfigLoaded };
    case 'SET_ACTIVITY_CONFIG':
      return { ...state, activityConfig: action.payload };
    case 'SET_ACTIVITY_CONFIG_LOADED':
      return { ...state, isActivityConfigLoaded: true };
    default:
      return state;
  }
}

interface BiometricContextValue {
  state: BiometricState;
  dispatch: React.Dispatch<BiometricAction>;
  setActivityConfig: (config: ActivityConfig) => void;
  setActivityConfigLoaded: () => void;
}

const BiometricContext = createContext<BiometricContextValue | null>(null);

export function BiometricProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(biometricReducer, initialState);

  const setActivityConfig = (config: ActivityConfig) =>
    dispatch({ type: 'SET_ACTIVITY_CONFIG', payload: config });

  const setActivityConfigLoaded = () =>
    dispatch({ type: 'SET_ACTIVITY_CONFIG_LOADED' });

  return (
    <BiometricContext.Provider value={{ state, dispatch, setActivityConfig, setActivityConfigLoaded }}>
      {children}
    </BiometricContext.Provider>
  );
}

export function useBiometric() {
  const context = useContext(BiometricContext);
  if (!context) throw new Error('useBiometric must be used within BiometricProvider');
  return context;
}