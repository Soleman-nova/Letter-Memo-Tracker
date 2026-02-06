import React from 'react'
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getAccessToken, clearTokens } from './store/auth'
import { LayoutDashboard, FileText, FilePlus, LogOut, Globe, ChevronDown, Settings as SettingsIcon } from 'lucide-react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DocumentsList from './pages/DocumentsList'
import DocumentForm from './pages/DocumentForm'
import DocumentDetail from './pages/DocumentDetail'
import Settings from './pages/Settings'

function RequireAuth({ children }) {
  const authed = !!getAccessToken()
  return authed ? children : <Navigate to="/login" replace />
}

function NavBar() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const logout = () => { clearTokens(); navigate('/login') }
  return (
    <header className="h-14 px-4 flex items-center justify-between bg-[#0B3C5D] dark:bg-slate-900 text-white border-b border-[#09324F] dark:border-slate-700">
      <div className="flex items-center gap-3">
        <img src="/eeu-logo.png" alt="EEU" className="h-8 w-8 rounded-full ring-1 ring-white/20" />
        <span className="font-semibold tracking-tight">{t('app_title')}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
            <Globe className="w-4 h-4" />
            <span>{i18n.language === 'am' ? 'አማ' : 'EN'}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <div className="absolute right-0 mt-1 w-28 rounded-lg bg-white text-slate-800 shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <button onClick={() => i18n.changeLanguage('en')} className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-t-lg ${i18n.language === 'en' ? 'font-semibold text-[#0B3C5D]' : ''}`}>English</button>
            <button onClick={() => i18n.changeLanguage('am')} className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-b-lg ${i18n.language === 'am' ? 'font-semibold text-[#0B3C5D]' : ''}`}>አማርኛ</button>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/80 text-sm font-medium transition-colors" title={t('logout')}>
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t('logout')}</span>
        </button>
      </div>
    </header>
  )
}

function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/documents', icon: FileText, label: t('documents') },
    { to: '/documents/new', icon: FilePlus, label: t('new_document') },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  ]
  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col">
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          // Exact match for all routes to avoid multiple highlights
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#0B3C5D] dark:bg-[#F0B429] text-white dark:text-[#0B3C5D] shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 text-center">
        © {new Date().getFullYear()} EEU
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><><NavBar /><div className="flex"><Sidebar /><div className="flex-1"><Dashboard /></div></div></></RequireAuth>} />
        <Route path="/documents" element={<RequireAuth><><NavBar /><div className="flex"><Sidebar /><div className="flex-1"><DocumentsList /></div></div></></RequireAuth>} />
        <Route path="/documents/new" element={<RequireAuth><><NavBar /><div className="flex"><Sidebar /><div className="flex-1"><DocumentForm /></div></div></></RequireAuth>} />
        <Route path="/documents/:id" element={<RequireAuth><><NavBar /><div className="flex"><Sidebar /><div className="flex-1"><DocumentDetail /></div></div></></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><><NavBar /><div className="flex"><Sidebar /><div className="flex-1"><Settings /></div></div></></RequireAuth>} />
      </Routes>
    </div>
  )
}
