import React, { useState } from 'react'
import EtDatePicker from 'mui-ethiopian-datepicker'
import { EtLocalizationProvider } from 'mui-ethiopian-datepicker'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../contexts/SettingsContext'

/**
 * Wrapper around mui-ethiopian-datepicker that:
 * - Converts between YYYY-MM-DD strings (backend) and Date objects (picker)
 * - Supports Ethiopian (default) and Gregorian calendar toggle
 * - Matches the app's Tailwind styling with dark mode support
 * - Supports Amharic localization when language is 'am'
 */
export default function EthiopianDateInput({ label, value, onChange, required = false, className = '', disabled = false, placeholder = '' }) {
  const { i18n } = useTranslation()
  const { darkMode } = useSettings()
  const [mode, setMode] = useState('ethiopian') // 'ethiopian' or 'gregorian'

  // Convert YYYY-MM-DD string to Date object
  const dateValue = value ? new Date(value + 'T00:00:00') : null

  // Convert Date object back to YYYY-MM-DD string
  const handleChange = (selectedDate) => {
    if (!selectedDate || isNaN(selectedDate.getTime())) {
      onChange('')
      return
    }
    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.getDate()).padStart(2, '0')
    onChange(`${year}-${month}-${day}`)
  }

  const handleGregorianChange = (e) => {
    onChange(e.target.value)
  }

  const handleClear = () => {
    if (!disabled) {
      onChange('')
    }
  }

  const isAmharic = i18n.language === 'am'

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex items-center gap-2">
        {/* Calendar mode toggle */}
        <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden text-xs shrink-0">
          <button
            type="button"
            onClick={() => setMode('ethiopian')}
            className={`px-2 py-1.5 transition-colors ${
              mode === 'ethiopian'
                ? 'bg-[#0B3C5D] dark:bg-[#F0B429] text-white dark:text-[#0B3C5D] font-medium'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
            }`}
          >
            {isAmharic ? 'ኢት' : 'ET'}
          </button>
          <button
            type="button"
            onClick={() => setMode('gregorian')}
            className={`px-2 py-1.5 transition-colors ${
              mode === 'gregorian'
                ? 'bg-[#0B3C5D] dark:bg-[#F0B429] text-white dark:text-[#0B3C5D] font-medium'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
            }`}
          >
            {isAmharic ? 'ግሬ' : 'GC'}
          </button>
        </div>

        {/* Date picker */}
        <div className="flex-1">
          {mode === 'ethiopian' ? (
            <EtLocalizationProvider localType={isAmharic ? 'AMH' : undefined}>
              <div className={darkMode ? 'eeu-et-date dark' : 'eeu-et-date'}>
                <EtDatePicker
                  value={dateValue}
                  onChange={handleChange}
                  disabled={disabled}
                />
              </div>
            </EtLocalizationProvider>
          ) : (
            <input
              type="date"
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 focus:border-[#0B3C5D]"
              value={value || ''}
              onChange={handleGregorianChange}
              required={required}
              disabled={disabled}
              placeholder={placeholder}
            />
          )}
        </div>

        {/* Clear button - separate from date picker */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-lg transition-colors shrink-0 border border-slate-300 dark:border-slate-500"
            title={isAmharic ? 'አጽዳ' : 'Clear'}
          >
            {isAmharic ? 'አጽዳ' : 'Clear'}
          </button>
        )}
      </div>
    </div>
  )
}
