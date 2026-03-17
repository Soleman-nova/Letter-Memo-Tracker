import React, { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext()

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export function SettingsProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    // Prefer the same key used by NavBar; fall back to legacy key
    const theme = localStorage.getItem('theme')
    const saved = localStorage.getItem('eeu-dark-mode')
    if (theme) return theme === 'dark'
    return saved ? JSON.parse(saved) : false
  })

  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    // Write to both keys to keep NavBar and Settings in sync
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('eeu-dark-mode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Sync when localStorage changes outside this context (e.g., NavBar toggle)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue
        if (newTheme === 'dark' || newTheme === 'light') {
          setDarkMode(newTheme === 'dark')
        }
      } else if (e.key === 'eeu-dark-mode') {
        const raw = e.newValue
        if (raw === 'true' || raw === 'false') {
          setDarkMode(raw === 'true')
        }
      }
    }
    // Also listen to a custom event for same-tab sync (NavBar toggle)
    const handleThemeChange = (e) => {
      setDarkMode(e.detail.isDark)
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('themechange', handleThemeChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('themechange', handleThemeChange)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    // Dispatch a custom event so NavBar updates immediately in the same tab
    window.dispatchEvent(new CustomEvent('themechange', { detail: { isDark: next } }))
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  const value = {
    darkMode,
    toggleDarkMode,
    isFullscreen,
    toggleFullscreen,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
