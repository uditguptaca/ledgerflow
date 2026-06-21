export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ledgerflow_token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ledgerflow_token', token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ledgerflow_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
