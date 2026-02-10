import React from 'react'
import { EthiopianDateUtil } from 'mui-ethiopian-datepicker'
import { useTranslation } from 'react-i18next'

/**
 * Ethiopian month names in English transliteration
 */
const ETH_MONTHS_EN = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
]

/**
 * Convert a Gregorian date (string or Date) to Ethiopian date display string.
 * Uses EthiopianDateUtil.toEth() from mui-ethiopian-datepicker.
 * @param {string|Date} gregDate - Gregorian date (YYYY-MM-DD string or Date object or ISO string)
 * @param {string} lang - 'am' for Amharic, anything else for English
 * @param {boolean} includeTime - Whether to include time portion
 * @returns {string} Formatted Ethiopian date string
 */
export function formatEthiopianDate(gregDate, lang = 'en', includeTime = false) {
  if (!gregDate) return ''
  
  try {
    // Parse date string — append T00:00:00 for date-only strings to avoid timezone shift
    let dateObj
    if (typeof gregDate === 'string') {
      dateObj = gregDate.length === 10 ? new Date(gregDate + 'T00:00:00') : new Date(gregDate)
    } else {
      dateObj = gregDate
    }
    if (isNaN(dateObj.getTime())) return String(gregDate)
    
    // Convert Gregorian → Ethiopian using the library
    const ethDate = EthiopianDateUtil.toEth(dateObj)
    
    // ethDate = { Year, Month, Day }
    const isAmharic = lang === 'am'
    const monthName = isAmharic
      ? EthiopianDateUtil.ethMonths[ethDate.Month - 1]
      : ETH_MONTHS_EN[ethDate.Month - 1] || ''
    
    let result = `${monthName} ${ethDate.Day}, ${ethDate.Year}`
    
    if (includeTime) {
      const hours = dateObj.getHours()
      const minutes = String(dateObj.getMinutes()).padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const h12 = hours % 12 || 12
      result += ` ${h12}:${minutes} ${ampm}`
    }
    
    return result
  } catch (e) {
    console.warn('Ethiopian date conversion error:', e)
    return String(gregDate)
  }
}

/**
 * Displays a date in both Ethiopian and Gregorian formats.
 * Shows Ethiopian as primary and Gregorian as secondary (smaller text).
 * 
 * @param {string|Date} date - The date to display
 * @param {boolean} includeTime - Whether to show time
 * @param {boolean} inline - Render inline (no line break between ET and GC)
 * @param {string} className - Additional CSS classes
 */
export default function EthDateDisplay({ date, includeTime = false, inline = false, className = '' }) {
  const { i18n } = useTranslation()
  
  if (!date) return null
  
  const ethStr = formatEthiopianDate(date, i18n.language, includeTime)
  
  // Format Gregorian
  let gcStr = ''
  try {
    let dateObj
    if (typeof date === 'string') {
      dateObj = date.length === 10 ? new Date(date + 'T00:00:00') : new Date(date)
    } else {
      dateObj = date
    }
    if (!isNaN(dateObj.getTime())) {
      const options = { year: 'numeric', month: 'short', day: 'numeric' }
      if (includeTime) {
        options.hour = '2-digit'
        options.minute = '2-digit'
      }
      gcStr = dateObj.toLocaleDateString('en-US', options)
    }
  } catch (e) {
    gcStr = String(date)
  }
  
  if (inline) {
    return (
      <span className={className}>
        <span>{ethStr}</span>
        <span className="text-slate-400 dark:text-slate-500 ml-1 text-[0.85em]">({gcStr})</span>
      </span>
    )
  }
  
  return (
    <div className={className}>
      <div>{ethStr}</div>
      <div className="text-[0.8em] text-slate-400 dark:text-slate-500">{gcStr}</div>
    </div>
  )
}
