const ACCESS_KEY = 'eeu_access'
const REFRESH_KEY = 'eeu_refresh'

export function setTokens(access, refresh) {
  if (access) localStorage.setItem(ACCESS_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export async function login(username, password, apiBase) {
  const base = apiBase || (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8000'
  const res = await fetch(`${base}/api/auth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!res.ok) throw new Error('Invalid credentials')
  const data = await res.json()
  setTokens(data.access, data.refresh)
}
