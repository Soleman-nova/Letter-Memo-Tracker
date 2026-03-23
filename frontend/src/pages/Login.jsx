import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '../store/auth'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

export default function Login() {
  const { t } = useTranslation()
  const { refreshUser } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(username, password, import.meta.env.VITE_API_BASE_URL)
      await refreshUser() // Refresh user profile after login
      navigate('/dashboard')
    } catch (e) {
      toast.error('Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Brand / Hero */}
      <div className="hidden lg:flex flex-col justify-center items-center p-12 text-white bg-gradient-to-br from-[#0B3C5D] via-[#0A4C86] to-[#0B3C5D] relative">
        <div className="absolute top-12 left-12 flex items-center gap-3">
          <img src="/eeu-logo.png" alt="EEU" className="h-20 w-20 rounded-full ring-1 ring-white/20 bg-white/10" />
          <div className="text-xl font-semibold tracking-tight">{t('app_title')}</div>
        </div>
        <div className="flex flex-col items-center text-center max-w-lg">
          <h2 className="text-3xl font-semibold leading-snug">{t('app_title')}</h2>
          <p className="mt-3 text-white/80">{t('login_subtitle')}</p>
        </div>
        <div className="absolute bottom-12 text-xs text-white/70">© {new Date().getFullYear()} Ethiopian Electric Utility. Developed by EEU IT.</div>
      </div>

      {/* Auth Card */}
      <div className="relative flex items-center justify-center p-6 sm:p-10 bg-slate-50 dark:bg-slate-900 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url('/edited_pattern-dark.png')",
            backgroundRepeat: 'repeat',
            backgroundSize: '220px auto',
            backgroundPosition: 'center',
            opacity: 0.12,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none hidden dark:block"
          style={{
            backgroundImage: "url('/edited_patten.png')",
            backgroundRepeat: 'repeat',
            backgroundSize: '220px auto',
            backgroundPosition: 'center',
            opacity: 0.12,
          }}
        />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/40 via-white/20 to-white/40 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-900/70" />
        <div className="relative w-full max-w-md">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur shadow-xl rounded-xl p-6 sm:p-8 border border-slate-200/60 dark:border-slate-700/60">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('login')}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('login_subtitle')}</p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('user_id')}</label>
                <input
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F0B429] focus:border-[#0B3C5D]"
                  value={username}
                  onChange={(e)=>setUsername(e.target.value)}
                  placeholder="e.g., 123456"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('password')}</label>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-2.5 pr-20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F0B429] focus:border-[#0B3C5D]"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={()=>setShowPassword(v=>!v)}
                    className="absolute inset-y-0 right-0 px-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 text-[#0B3C5D] focus:ring-[#F0B429]" />
                  {t('remember_me') || 'Remember me'}
                </label>
                <a href="#" className="text-sm text-[#0B3C5D] dark:text-[#F0B429] hover:text-[#083554] dark:hover:text-[#D9A020]">{t('forgot_password') || 'Forgot password?'}</a>
              </div>
              <button
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-lg bg-[#0B3C5D] text-white px-4 py-2.5 font-medium shadow-sm hover:bg-[#09324F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0B429] disabled:opacity-70 disabled:cursor-not-allowed"
                type="submit"
              >
                {loading && <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                {t('login')}
              </button>
            </form>
          </div>
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">{t('accept_policy') || 'By signing in you agree to the Acceptable Use Policy.'}</div>
        </div>
      </div>
    </div>
  )
}
