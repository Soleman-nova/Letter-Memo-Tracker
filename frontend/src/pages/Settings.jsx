import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../contexts/SettingsContext'
import { Settings as SettingsIcon, Moon, Sun, Maximize, Minimize, Monitor, User, Bell, Shield } from 'lucide-react'

export default function Settings() {
  const { t } = useTranslation()
  const { darkMode, toggleDarkMode, isFullscreen, toggleFullscreen } = useSettings()

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-[#0B3C5D] dark:bg-[#F0B429] flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-white dark:text-[#0B3C5D]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold dark:text-white">Settings</h1>
          <div className="text-sm text-slate-500 dark:text-slate-400">Customize your experience</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Appearance Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-[#0B3C5D] dark:text-[#F0B429]" />
            <h2 className="text-lg font-semibold dark:text-white">Appearance</h2>
          </div>
          
          <div className="space-y-4">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                ) : (
                  <Sun className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                )}
                <div>
                  <div className="font-medium text-sm dark:text-white">Dark Mode</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {darkMode ? 'Dark theme enabled' : 'Light theme enabled'}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-[#0B3C5D]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <div className="flex items-center gap-3">
                {isFullscreen ? (
                  <Minimize className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                ) : (
                  <Maximize className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                )}
                <div>
                  <div className="font-medium text-sm dark:text-white">Fullscreen Mode</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleFullscreen}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B3C5D] dark:bg-[#F0B429] text-white dark:text-[#0B3C5D] px-3 py-1.5 text-sm font-medium hover:bg-[#09324F] dark:hover:bg-[#D9A020] transition-colors"
              >
                {isFullscreen ? 'Exit' : 'Enter'}
              </button>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-[#0B3C5D] dark:text-[#F0B429]" />
            <h2 className="text-lg font-semibold dark:text-white">Account</h2>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Username</div>
              <div className="font-medium text-sm dark:text-white">Current User</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Role</div>
              <div className="font-medium text-sm dark:text-white">Administrator</div>
            </div>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-[#0B3C5D] dark:text-[#F0B429]" />
            <h2 className="text-lg font-semibold dark:text-white">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <div>
                <div className="font-medium text-sm dark:text-white">Document Updates</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Get notified about document changes</div>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#0B3C5D]">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <div>
                <div className="font-medium text-sm dark:text-white">Assignment Alerts</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Receive alerts for new assignments</div>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#0B3C5D]">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#0B3C5D] dark:text-[#F0B429]" />
            <h2 className="text-lg font-semibold dark:text-white">Security</h2>
          </div>
          
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <div className="font-medium text-sm dark:text-white">Change Password</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Update your account password</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <div className="font-medium text-sm dark:text-white">Session Management</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">View and manage active sessions</div>
            </button>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Application Version</div>
            <div className="font-medium dark:text-white">v1.0.0</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Last Updated</div>
            <div className="font-medium dark:text-white">{new Date().toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Environment</div>
            <div className="font-medium dark:text-white">Production</div>
          </div>
        </div>
      </div>
    </div>
  )
}
