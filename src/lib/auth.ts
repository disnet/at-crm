export type AuthUser = {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
};

const KEY = 'crm_user';

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setUser(user: AuthUser): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(user));
  } catch {
    // localStorage unavailable (private mode, quota, etc.)
  }
}

export function clearUser(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // localStorage unavailable (private mode, quota, etc.)
  }
}
