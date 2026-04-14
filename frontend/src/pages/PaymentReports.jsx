import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Calendar, Download, TrendingUp, FileSpreadsheet } from 'lucide-react'
import EtDatePicker from 'mui-ethiopian-datepicker'
import { EtLocalizationProvider } from 'mui-ethiopian-datepicker'
import * as XLSX from 'xlsx'

const PaymentReports = () => {
  const { t } = useTranslation()
  const { user, isCeoSecretary, isCeo, isCxoFinance } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState(null)
  
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  const [filters, setFilters] = useState({
    year: currentYear,
    month: currentMonth // Default to current month
  })
  const [useEthiopianCalendar, setUseEthiopianCalendar] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const months = [
    { value: '', label: t('all_months') || 'All Months' },
    { value: 1, label: t('january') || 'January' },
    { value: 2, label: t('february') || 'February' },
    { value: 3, label: t('march') || 'March' },
    { value: 4, label: t('april') || 'April' },
    { value: 5, label: t('may') || 'May' },
    { value: 6, label: t('june') || 'June' },
    { value: 7, label: t('july') || 'July' },
    { value: 8, label: t('august') || 'August' },
    { value: 9, label: t('september') || 'September' },
    { value: 10, label: t('october') || 'October' },
    { value: 11, label: t('november') || 'November' },
    { value: 12, label: t('december') || 'December' },
  ]

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  const handleEthiopianDateChange = (date) => {
    if (date) {
      setSelectedDate(date)
      setFilters({
        year: date.getFullYear(),
        month: date.getMonth() + 1
      })
    }
  }

  const isAmharic = useTranslation().i18n.language === 'am'

  useEffect(() => {
    if (isCeo || isCeoSecretary || isCxoFinance) {
      fetchSummary()
    }
  }, [filters, isCeo, isCeoSecretary, isCxoFinance])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('year', filters.year)
      if (filters.month) {
        params.append('month', filters.month)
      }
      
      const response = await api.get(`/api/payments/payments/monthly_summary/?${params.toString()}`)
      setSummary(response.data)
    } catch (error) {
      console.error('Error fetching summary:', error)
      toast.error('Failed to load payment summary')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!summary) return
    
    const monthName = filters.month ? months.find(m => m.value === parseInt(filters.month))?.label : t('all_months')
    const filename = `payment_summary_${filters.year}_${monthName.replace(/\s+/g, '_')}.csv`
    
    // Use translations for all CSV content
    let csv = `${t('payment_summary')} - ${filters.year} ${monthName}\n\n`
    csv += `${t('total_payments')},${summary.total_count}\n\n`
    csv += `${t('currency')},${t('total_amount')},${t('count')}\n`
    
    summary.totals.forEach(t => {
      csv += `${t.currency},${t.total_amount},${t.count}\n`
    })
    
    // Add UTF-8 BOM to properly display Amharic characters
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToXLSX = () => {
    if (!summary) return
    
    const monthName = filters.month ? months.find(m => m.value === parseInt(filters.month))?.label : t('all_months')
    const filename = `payment_summary_${filters.year}_${monthName.replace(/\s+/g, '_')}.xlsx`
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    
    // Prepare data for Excel
    const data = [
      [`${t('payment_summary')} - ${filters.year} ${monthName}`],
      [],
      [t('total_payments'), summary.total_count],
      [],
      [t('currency'), t('total_amount'), t('count')],
      ...summary.totals.map(t => [t.currency, t.total_amount, t.count])
    ]
    
    // Create worksheet from data
    const ws = XLSX.utils.aoa_to_sheet(data)
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 10 }
    ]
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, t('payment_summary'))
    
    // Write file
    XLSX.writeFile(wb, filename)
  }

  if (!isCeo && !isCeoSecretary && !isCxoFinance) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">You do not have permission to view payment reports.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold dark:text-white">{t('payment_reports')}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {t('monthly_summaries')}
            </div>
          </div>
        </div>
        {summary && (
          <div className="flex gap-2">
            <button
              onClick={exportToXLSX}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {t('export_excel')}
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('export_csv')}
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
        <div className="space-y-4">
          {/* Calendar Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('calendar')}:</span>
            <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setUseEthiopianCalendar(true)}
                className={`px-3 py-1.5 transition-colors ${
                  useEthiopianCalendar
                    ? 'bg-[#0B3C5D] dark:bg-[#F0B429] text-white dark:text-[#0B3C5D] font-medium'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
              >
                {isAmharic ? 'ኢትዮጵያዊ' : 'Ethiopian'}
              </button>
              <button
                type="button"
                onClick={() => setUseEthiopianCalendar(false)}
                className={`px-3 py-1.5 transition-colors ${
                  !useEthiopianCalendar
                    ? 'bg-[#0B3C5D] dark:bg-[#F0B429] text-white dark:text-[#0B3C5D] font-medium'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
              >
                {isAmharic ? 'ግሪጎሪያን' : 'Gregorian'}
              </button>
            </div>
          </div>

          {/* Date Selection */}
          {useEthiopianCalendar ? (
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">
                <Calendar className="w-4 h-4 inline mr-1" />
                {t('select_month_year')}
              </label>
              <EtLocalizationProvider localType={isAmharic ? 'AMH' : undefined}>
                <div className="eeu-et-date">
                  <EtDatePicker
                    value={selectedDate}
                    onChange={handleEthiopianDateChange}
                  />
                </div>
              </EtLocalizationProvider>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t('year')}
                </label>
                <select
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                  value={filters.year}
                  onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t('month')}
                </label>
                <select
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                  value={filters.month}
                  onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-slate-500 dark:text-slate-400">{t('loading')}...</div>
        </div>
      ) : summary ? (
        <div className="space-y-4">
          {/* Total Count Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('total_payments')}</div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{summary.total_count}</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-2xl">
                  💰
                </div>
              </div>
            </div>

            {/* Status Breakdown Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium uppercase tracking-wider text-[10px]">{t('by_status')}</div>
              <div className="space-y-2">
                {summary.by_status?.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{s.status_display || s.status}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Type Breakdown Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium uppercase tracking-wider text-[10px]">{t('by_type')}</div>
              <div className="space-y-2">
                {summary.by_type?.map((t, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{t.payment_type_display || t.payment_type}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Currency Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold dark:text-white">{t('breakdown_by_currency')}</h2>
            </div>
            <div className="p-4">
              {summary.totals.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  {t('no_payments')}
                </div>
              ) : (
                <div className="space-y-4">
                  {summary.totals.map((total, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {total.currency} ({total.count} payment{total.count !== 1 ? 's' : ''})
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                          {parseFloat(total.total_amount).toLocaleString('en-US', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })} {total.currency}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        total.currency === 'ETB' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        total.currency === 'USD' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                        'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                      }`}>
                        {total.currency}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-slate-500 dark:text-slate-400">{t('no_payments')}</div>
        </div>
      )}
    </div>
  )
}

export default PaymentReports
