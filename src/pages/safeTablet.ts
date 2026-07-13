import { stopTablet as originalStopTablet } from './SigWebTablet';

let isUnmounting = false;
let originalSend: typeof XMLHttpRequest.prototype.send | null = null;
let originalOpen: typeof XMLHttpRequest.prototype.open | null = null;

export const enableSafeMode = () => {
  if (isUnmounting) return;
  isUnmounting = true;

  // Save original methods
  if (!originalSend) {
    originalSend = XMLHttpRequest.prototype.send;
    originalOpen = XMLHttpRequest.prototype.open;
  }

  // Override XMLHttpRequest to intercept tablet requests
  XMLHttpRequest.prototype.open = function(
    method: string,
    url: string | URL,
    async: boolean = true,
    username?: string | null,
    password?: string | null
  ) {
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (urlStr.includes('tablet.sigwebtablet.com') || urlStr.includes('localhost:')) {
      (this as any).__isTabletRequest = true;
    }
    return originalOpen!.call(this, method, url, async, username, password);
  };

  XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
    if ((this as any).__isTabletRequest && isUnmounting) {
      // During unmount, just return without sending
      console.debug('Blocked tablet request during unmount');
      try {
        Object.defineProperty(this, 'readyState', { value: 4, configurable: true });
        Object.defineProperty(this, 'status', { value: 200, configurable: true });
        Object.defineProperty(this, 'responseText', { value: '1', configurable: true });
      } catch (error) {
        console.warn('Failed to mock readonly XHR properties:', error);
      }

      if (this.onreadystatechange) {
        try {
          this.onreadystatechange.call(this);
        } catch (e) {
          // Ignore
        }
      }
      return;
    }
    return originalSend!.call(this, body);
  };
};

export const disableSafeMode = () => {
  isUnmounting = false;
  if (originalSend && originalOpen) {
    XMLHttpRequest.prototype.send = originalSend;
    XMLHttpRequest.prototype.open = originalOpen;
    originalSend = null;
    originalOpen = null;
  }
};

// Safe wrapper that won't cause errors
export const safeStopTablet = () => {
  try {
    originalStopTablet();
  } catch (error) {
    // Ignore all errors
  }
};
