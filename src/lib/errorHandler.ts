export type ErrorCategory = 'Storage/Capacity' | 'Network/Connection' | 'Input/Validation' | 'Server/Database' | 'Unknown';

export interface UserFriendlyError {
  category: ErrorCategory;
  alert: string;
  action: string;
  devLog: string;
}

/**
 * Centralized Error Handler
 * Categorizes system exceptions and maps them to clean, concise, non-jargon, user-facing notifications
 * while maintaining technical stack logs for developer debugging.
 */
export function handleSystemError(error: unknown, context?: string): UserFriendlyError {
  let category: ErrorCategory = 'Unknown';
  let alert = 'An unexpected issue occurred. We could not complete your request.';
  let action = 'Please try again. If the issue persists, contact technical support.';
  let devMessage = '';

  // Extract message and type from the error
  if (error instanceof Error) {
    devMessage = `${error.name}: ${error.message}`;
    if (error.stack) {
      devMessage += `\nStack: ${error.stack}`;
    }
    
    const errName = error.name;
    const errMsgLower = error.message.toLowerCase();

    // 1. Storage/Capacity Error detection
    if (
      errName === 'QuotaExceededError' ||
      errName === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      errMsgLower.includes('quota') ||
      errMsgLower.includes('storage') ||
      errMsgLower.includes('localstorage') ||
      errMsgLower.includes('capacity') ||
      errMsgLower.includes('space') ||
      errMsgLower.includes('exceeded')
    ) {
      category = 'Storage/Capacity';
      alert = "We couldn't save your data. Your browser's storage space is full.";
      action = 'Please clear your recent browser cache or delete older saved profiles, then try again.';
    }
    // 2. Network/Connection Error detection
    else if (
      errMsgLower.includes('failed to fetch') ||
      errMsgLower.includes('fetch') ||
      errMsgLower.includes('network') ||
      errMsgLower.includes('connection') ||
      errMsgLower.includes('timeout') ||
      errMsgLower.includes('timed out') ||
      errMsgLower.includes('unreachable') ||
      errMsgLower.includes('cors') ||
      errMsgLower.includes('http error') ||
      errMsgLower.includes('offline') ||
      errMsgLower.includes('dns') ||
      errMsgLower.includes('refused')
    ) {
      category = 'Network/Connection';
      alert = 'Connection timed out or failed. The server is currently unreachable.';
      action = 'Please verify your network connection or intranet status, and try again.';
    }
    // 3. Input/Validation Error detection
    else if (
      errMsgLower.includes('validation') ||
      errMsgLower.includes('invalid') ||
      errMsgLower.includes('missing') ||
      errMsgLower.includes('malformed') ||
      errMsgLower.includes('format') ||
      errMsgLower.includes('parameters') ||
      errMsgLower.includes('date') ||
      errMsgLower.includes('relation') ||
      errMsgLower.includes('account') ||
      errMsgLower.includes('limit')
    ) {
      category = 'Input/Validation';
      alert = 'Some of the information provided appears to be incomplete or incorrect.';
      action = 'Please check that all fields are filled in correctly and try again.';
    }
    // 4. Server/Database Error detection
    else if (
      errMsgLower.includes('server error') ||
      errMsgLower.includes('database') ||
      errMsgLower.includes('internal') ||
      errMsgLower.includes('500') ||
      errMsgLower.includes('502') ||
      errMsgLower.includes('503') ||
      errMsgLower.includes('504') ||
      errMsgLower.includes('sql') ||
      errMsgLower.includes('oracle') ||
      errMsgLower.includes('postgres') ||
      errMsgLower.includes('query')
    ) {
      category = 'Server/Database';
      alert = 'Our system encountered an issue processing your request.';
      action = 'This transaction has been logged. Please wait a moment and try again.';
    }
  } else if (typeof error === 'string') {
    devMessage = error;
    const errLower = error.toLowerCase();

    if (
      errLower.includes('quota') ||
      errLower.includes('storage') ||
      errLower.includes('localstorage') ||
      errLower.includes('capacity') ||
      errLower.includes('exceeded')
    ) {
      category = 'Storage/Capacity';
      alert = "We couldn't save your data. Your browser's storage space is full.";
      action = 'Please clear your recent browser cache or delete older saved profiles, then try again.';
    } else if (
      errLower.includes('fetch') ||
      errLower.includes('network') ||
      errLower.includes('connection') ||
      errLower.includes('timeout') ||
      errLower.includes('unreachable')
    ) {
      category = 'Network/Connection';
      alert = 'Connection timed out or failed. The server is currently unreachable.';
      action = 'Please verify your network connection or intranet status, and try again.';
    } else if (
      errLower.includes('validation') ||
      errLower.includes('invalid') ||
      errLower.includes('missing') ||
      errLower.includes('format')
    ) {
      category = 'Input/Validation';
      alert = 'Some of the information provided appears to be incomplete or incorrect.';
      action = 'Please check that all fields are filled in correctly and try again.';
    } else if (
      errLower.includes('server') ||
      errLower.includes('database') ||
      errLower.includes('500') ||
      errLower.includes('sql') ||
      errLower.includes('oracle')
    ) {
      category = 'Server/Database';
      alert = 'Our system encountered an issue processing your request.';
      action = 'This transaction has been logged. Please wait a moment and try again.';
    }
  } else {
    devMessage = String(error);
  }

  const devLog = `[Dev-Log] Category: ${category} | Context: ${context || 'General'} | Message: ${devMessage}`;
  
  // Console logging is purely technical for developers (developer console)
  console.error(devLog, error);

  return {
    category,
    alert,
    action,
    devLog
  };
}
