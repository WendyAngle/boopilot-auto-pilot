// Simple mock auth state stored in localStorage
const KEY = "boopilot.auth";
const PWD_KEY = "boopilot.pwd";

export const DEFAULT_USER = { username: "admin", password: "admin123" };

export type AuthUser = {
  username: string;
  displayName: string;
};

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function getStoredPassword(): string {
  if (typeof window === "undefined") return DEFAULT_USER.password;
  return localStorage.getItem(PWD_KEY) ?? DEFAULT_USER.password;
}

export function login(username: string, password: string): AuthUser | null {
  const pwd = getStoredPassword();
  if (username === DEFAULT_USER.username && password === pwd) {
    const user: AuthUser = { username, displayName: "管理员" };
    localStorage.setItem(KEY, JSON.stringify(user));
    return user;
  }
  return null;
}

export function logout() {
  localStorage.removeItem(KEY);
}

export function changePassword(oldPwd: string, newPwd: string): boolean {
  if (oldPwd !== getStoredPassword()) return false;
  localStorage.setItem(PWD_KEY, newPwd);
  return true;
}
