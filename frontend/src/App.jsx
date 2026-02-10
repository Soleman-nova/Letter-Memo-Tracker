import React from 'react'
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getAccessToken, clearTokens } from './store/auth'
import { useAuth } from './contexts/AuthContext'
import { LayoutDashboard, FileText, FilePlus, LogOut, Globe, ChevronDown, Settings as SettingsIcon, Users } from 'lucide-react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DocumentsList from './pages/DocumentsList'
import DocumentForm from './pages/DocumentForm'
import DocumentDetail from './pages/DocumentDetail'
import Settings from './pages/Settings'
import UserManagement from './pages/UserManagement'

function RequireAuth({ children }) {
  const authed = !!getAccessToken()
  return authed ? children : <Navigate to="/" replace />
}

function PublicOnly({ children }) {
  const authed = !!getAccessToken()
  return authed ? <Navigate to="/dashboard" replace /> : children
}

function NavBar() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const logout = () => { clearTokens(); navigate('/') }
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
  const { canManageUsers, canCreateDocuments, user } = useAuth()
  
  // Build nav items based on permissions
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), show: true },
    { to: '/documents', icon: FileText, label: t('documents'), show: true },
    { to: '/documents/new', icon: FilePlus, label: t('new_document'), show: canCreateDocuments },
    { to: '/users', icon: Users, label: t('user_management'), show: canManageUsers },
    { to: '/settings', icon: SettingsIcon, label: t('settings'), show: true },
  ].filter(item => item.show)

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col">
      {/* User role badge */}
      {user?.profile && (
        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400">{t('logged_in_as')}</div>
          <div className="font-medium text-sm text-slate-700 dark:text-slate-200">{user.first_name || user.username}</div>
          <div className="text-xs mt-1 px-2 py-0.5 rounded-full bg-[#0B3C5D]/10 text-[#0B3C5D] dark:bg-[#F0B429]/20 dark:text-[#F0B429] inline-block">
            {user.profile.role_display}
          </div>
          {user.profile.department && (
            <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">{user.profile.department.code} - {user.profile.department.name}</div>
          )}
        </div>
      )}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = to === '/documents' 
            ? location.pathname === '/documents' || (location.pathname.startsWith('/documents/') && location.pathname !== '/documents/new')
            : location.pathname === to || (to !== '/documents' && location.pathname.startsWith(to + '/'))
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
        <Route path="/" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/dashboard" element={<RequireAuth><><NavBar /><div className="flex"><Sidebar /><div className="flex-1"><Dashboard /></div></div></></RequireAuth>} />
        <Route path="/documents" element={<RequireAuth><><NavBar /><div className="flex"><Sidebar /><div className="flex-1"><DocumentsList /></div></div></></RequireAuth>} />
        <Route path="/documents/new" element={<RequireAuth><><NavBar /><div className="flex"><Sidebar /><div className="flex-1"><DocumentForm /></div></div></></RequireAuth>} />
        <Route path="/documents/:id" element={<RequireAuth><><NavBar /><div className="flex"><Sidebar /><div className="flex-1"><DocumentDetail /></div></div></></RequireAuth>} />
        <Route path="/documents/:id/edit" element={<RequireAuth><><NavBar /><div className="flex"><Sidebar /><div className="flex-1"><DocumentForm /></div></div></></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><><NavBar /><div className="flex"><Sidebar /><div className="flex-1"><Settings /></div></div></></RequireAuth>} />
        <Route path="/users" element={<RequireAuth><><NavBar /><div className="flex"><Sidebar /><div className="flex-1"><UserManagement /></div></div></></RequireAuth>} />
      </Routes>
    </div>
  )
}
