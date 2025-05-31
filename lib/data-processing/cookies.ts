// Example implementation - adjust based on your needs
export const cookies = {
  get: (name: string): string | undefined => {
    if (typeof document === 'undefined') return undefined;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift();
    }
    return undefined;
  },
  
  set: (name: string, value: string, maxAge?: number): void => {
    if (typeof document === 'undefined') return;
    
    let cookieString = `${name}=${value}; path=/`;
    if (maxAge) {
      cookieString += `; max-age=${maxAge}`;
    }
    document.cookie = cookieString;
  }
};