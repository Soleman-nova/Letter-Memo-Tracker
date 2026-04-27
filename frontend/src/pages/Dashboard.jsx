import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, FilePlus, FileText, Inbox, Send, FileStack, Clock, CheckCircle, AlertCircle, DollarSign, TrendingUp, Zap, Download, ChevronUp, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import EthDateDisplay from '../components/EthDateDisplay'
import * as XLSX from 'xlsx'

export default function Dashboard() {
  const { t } = useTranslation()
  const { canCreateDocuments, isCeoSecretary, isCeo } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, incoming: 0, outgoing: 0, memo: 0, pending: 0, received: 0 })
  const [paymentStats, setPaymentStats] = useState({ total: 0, totalAmountMonth: { ETB: 0, USD: 0, EUR: 0 }, thisMonth: 0, thisWeek: 0 })
  const [recent, setRecent] = useState([])
  const [performanceData, setPerformanceData] = useState({ receipt_performance: [], cc_performance: [] })
  const [selectedMonth, setSelectedMonth] = useState('current')
  const [historicalData, setHistoricalData] = useState(null)
  const [availableMonths, setAvailableMonths] = useState([])
  const [previousMonthData, setPreviousMonthData] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const promises = [
          api.get('/api/documents/documents/'),
          api.get('/api/documents/documents/', { params: { doc_type: 'INCOMING' } }),
          api.get('/api/documents/documents/', { params: { doc_type: 'OUTGOING' } }),
          api.get('/api/documents/documents/', { params: { doc_type: 'MEMO' } }),
        ]
        
        // Add payment stats and performance data for CEO and CEO Secretary
        if (isCeo || isCeoSecretary) {
          promises.push(api.get('/api/payments/payments/'))
          promises.push(api.get('/api/documents/documents/performance/'))
        }
        
        const results = await Promise.all(promises)
        const [allRes, inRes, outRes, memoRes, paymentsRes, performanceRes] = results
        
        // Handle paginated responses - extract results array
        const all = allRes.data.results || allRes.data || []
        const incoming = inRes.data.results || inRes.data || []
        const outgoing = outRes.data.results || outRes.data || []
        const memo = memoRes.data.results || memoRes.data || []

        // Use paginator counts when available so totals reflect all records, not just first page
        const totalAll = Array.isArray(allRes.data.results) && typeof allRes.data.count === 'number'
          ? allRes.data.count
          : all.length
        const totalIncoming = Array.isArray(inRes.data.results) && typeof inRes.data.count === 'number'
          ? inRes.data.count
          : incoming.length
        const totalOutgoing = Array.isArray(outRes.data.results) && typeof outRes.data.count === 'number'
          ? outRes.data.count
          : outgoing.length
        const totalMemo = Array.isArray(memoRes.data.results) && typeof memoRes.data.count === 'number'
          ? memoRes.data.count
          : memo.length
        
        setStats({
          total: totalAll,
          incoming: totalIncoming,
          outgoing: totalOutgoing,
          memo: totalMemo,
          // pending/received are still computed from the first page sample
          pending: all.filter(d => ['REGISTERED','DIRECTED','DISPATCHED'].includes(d.status)).length,
          received: all.filter(d => d.status === 'RECEIVED').length,
        })
        const rec = [...all]
          .sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at))
          .slice(0, 6)
        setRecent(rec)
        
        // Calculate payment stats
        if (paymentsRes) {
          const payments = paymentsRes.data.results || paymentsRes.data || []
          const registeredPayments = payments.filter(p => p.status === 'PENDING_PAYMENT' || p.status === 'TRANSFERRED_TO_BANK' || p.status === 'PAYMENT_COMPLETE')
          const totalPayments = Array.isArray(paymentsRes.data.results) && typeof paymentsRes.data.count === 'number'
            ? paymentsRes.data.count
            : registeredPayments.length
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
          const oneMonthAgo = new Date()
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
          
          if (isCeo) {
            // CEO sees: Total, Total Amount (Month), This Month count, This Week
            const thisMonthPayments = registeredPayments.filter(p => new Date(p.registration_date) >= oneMonthAgo)
            const amountsByCurrency = thisMonthPayments.reduce((acc, payment) => {
              const currency = payment.currency || 'ETB'
              const amount = parseFloat(payment.amount) || 0
              acc[currency] = (acc[currency] || 0) + amount
              return acc
            }, { ETB: 0, USD: 0, EUR: 0 })
            
            setPaymentStats({
              total: totalPayments,
              totalAmountMonth: amountsByCurrency,
              thisMonth: thisMonthPayments.length,
              thisWeek: registeredPayments.filter(p => new Date(p.registration_date) >= oneWeekAgo).length,
            })
          } else if (isCeoSecretary) {
            // CEO Secretary sees: Total, Arrived, Pending Payment, This Week
            setPaymentStats({
              total: totalPayments,
              arrived: payments.filter(p => p.status === 'ARRIVED').length,
              registered: payments.filter(p => p.status === 'PENDING_PAYMENT').length,
              thisWeek: registeredPayments.filter(p => new Date(p.registration_date) >= oneWeekAgo).length,
            })
          }
        }
        
        // Set performance data
        if (performanceRes) {
          setPerformanceData({
            receipt_performance: performanceRes.data.receipt_performance || [],
            cc_performance: performanceRes.data.cc_performance || []
          })
          
          // Generate available months (current + last 12 months)
          const months = []
          const now = new Date()
          for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
            months.push({
              value: i === 0 ? 'current' : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
              label: i === 0 ? 'Current Month' : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            })
          }
          setAvailableMonths(months)
          
          // Load previous month data for comparison
          const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`
          try {
            const prevRes = await api.get(`/api/documents/documents/performance/history/?month=${prevMonthStr}`)
            setPreviousMonthData({
              receipt_performance: prevRes.data.receipt_performance || [],
              cc_performance: prevRes.data.cc_performance || []
            })
          } catch (err) {
            console.log('No previous month data available')
          }
        }
      } catch (error) {
        console.error('Dashboard load error:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isCeo, isCeoSecretary])

  // Handle month selection
  const handleMonthChange = async (monthValue) => {
    setSelectedMonth(monthValue)
    
    if (monthValue === 'current') {
      setHistoricalData(null)
    } else {
      try {
        const res = await api.get(`/api/documents/documents/performance/history/?month=${monthValue}`)
        setHistoricalData({
          receipt_performance: res.data.receipt_performance || [],
          cc_performance: res.data.cc_performance || []
        })
      } catch (err) {
        console.error('Error loading historical data:', err)
        setHistoricalData({ receipt_performance: [], cc_performance: [] })
      }
    }
  }

  // Calculate trend compared to previous month
  const getTrend = (currentData, metricType) => {
    if (!previousMonthData || !currentData.has_data) return null
    
    const prevDept = previousMonthData[metricType === 'receipt' ? 'receipt_performance' : 'cc_performance']
      .find(d => d.department_id === currentData.department_id)
    
    if (!prevDept || !prevDept.has_data) return null
    
    const change = ((currentData.average_hours - prevDept.average_hours) / prevDept.average_hours) * 100
    return {
      direction: change < -5 ? 'up' : change > 5 ? 'down' : 'stable',
      percentage: Math.abs(change).toFixed(1)
    }
  }

  // Get ranking badge
  const getRankBadge = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `#${index + 1}`
  }

  // Export to Excel
  const exportToExcel = () => {
    const currentData = selectedMonth === 'current' ? performanceData : historicalData
    if (!currentData) return

    const receiptData = currentData.receipt_performance.filter(d => d.has_data).map((dept, idx) => ({
      'Rank': idx + 1,
      'Department Code': dept.department_code,
      'Department Name': dept.department_name,
      'Average Hours': dept.average_hours,
      'Document Count': dept.document_count,
      'Metric Type': 'Receipt Performance'
    }))

    const ccData = currentData.cc_performance.filter(d => d.has_data).map((dept, idx) => ({
      'Rank': idx + 1,
      'Department Code': dept.department_code,
      'Department Name': dept.department_name,
      'Average Hours': dept.average_hours,
      'Document Count': dept.document_count,
      'Metric Type': 'CC Acknowledgment Performance'
    }))

    const wb = XLSX.utils.book_new()
    const wsReceipt = XLSX.utils.json_to_sheet(receiptData)
    const wsCC = XLSX.utils.json_to_sheet(ccData)
    
    XLSX.utils.book_append_sheet(wb, wsReceipt, 'Receipt Performance')
    XLSX.utils.book_append_sheet(wb, wsCC, 'CC Performance')
    
    const monthLabel = selectedMonth === 'current' ? 'Current' : selectedMonth
    XLSX.writeFile(wb, `Performance_Report_${monthLabel}.xlsx`)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#0B3C5D] dark:bg-[#F0B429] flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white dark:text-[#0B3C5D]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold dark:text-white">{t('dashboard')}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard_subtitle')}</div>
          </div>
        </div>
        <div className="flex gap-2">
          {canCreateDocuments && (
            <Link to="/documents/new" className="inline-flex items-center gap-2 rounded-lg bg-[#0B3C5D] dark:bg-[#F0B429] text-white dark:text-[#0B3C5D] px-4 py-2.5 font-medium shadow-sm hover:bg-[#09324F] dark:hover:bg-[#D9A020] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0B429]">
              <FilePlus className="w-4 h-4" />
              {t('new_document')}
            </Link>
          )}
          {isCeoSecretary && (
            <Link to="/payments" className="inline-flex items-center gap-2 rounded-lg bg-green-600 dark:bg-green-700 text-white px-4 py-2.5 font-medium shadow-sm hover:bg-green-700 dark:hover:bg-green-800">
              <DollarSign className="w-4 h-4" />
              {t('register_payment')}
            </Link>
          )}
          {(isCeo || isCeoSecretary) && (
            <Link to="/payments/reports" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
              <TrendingUp className="w-4 h-4" />
              {t('payment_reports')}
            </Link>
          )}
          <Link to="/documents" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
            <FileText className="w-4 h-4" />
            {t('documents')}
          </Link>
        </div>
      </div>

      {/* Document Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title={t('total')} value={stats.total} loading={loading} accent="#0B3C5D" icon={FileStack} />
        <StatCard title={t('incoming_docs')} value={stats.incoming} loading={loading} accent="#2563EB" icon={Inbox} />
        <StatCard title={t('outgoing_docs')} value={stats.outgoing} loading={loading} accent="#EA580C" icon={Send} />
        <StatCard title={t('memos')} value={stats.memo} loading={loading} accent="#0D9488" icon={FileText} />
        <StatCard title={t('pending_docs')} value={stats.pending} loading={loading} accent="#F0B429" icon={AlertCircle} />
        <StatCard title={t('received_docs')} value={stats.received} loading={loading} accent="#16A34A" icon={CheckCircle} />
      </div>

      {/* Payment Statistics - Only for CEO and CEO Secretary */}
      {(isCeo || isCeoSecretary) && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 dark:bg-green-700 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('payments')}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t('payment_overview')}</p>
              </div>
            </div>
            <Link to="/payments" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium text-sm flex items-center gap-1">
              {t('view_all')} →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('total_payments')}</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? '…' : paymentStats.total}</div>
            </div>
            
            {isCeo ? (
              <>
                {/* CEO sees: Total Amount (Month) and This Month count */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('total_amount_month')}</div>
                  {loading ? (
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">…</div>
                  ) : (
                    <div className="space-y-1">
                      {Object.entries(paymentStats.totalAmountMonth || {}).map(([currency, amount]) => (
                        amount > 0 && (
                          <div key={currency} className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                              {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{currency}</span>
                          </div>
                        )
                      ))}
                      {Object.values(paymentStats.totalAmountMonth || {}).every(v => v === 0) && (
                        <div className="text-lg font-bold text-slate-400 dark:text-slate-500">0.00 ETB</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('this_month')}</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{loading ? '…' : paymentStats.thisMonth}</div>
                </div>
              </>
            ) : (
              <>
                {/* CEO Secretary sees: Arrived and Registered */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('arrived_payments')}</div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{loading ? '…' : paymentStats.arrived}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('registered_payments')}</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{loading ? '…' : paymentStats.registered}</div>
                </div>
              </>
            )}
            
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('this_week')}</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{loading ? '…' : paymentStats.thisWeek}</div>
            </div>
          </div>
        </div>
      )}

      {/* Best Performers Section - Only for CEO and CEO Secretary */}
      {(isCeo || isCeoSecretary) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700">
          <div className="px-4 py-3 border-b dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
              <span className="font-semibold dark:text-white">{t('best_performers')}</span>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
              >
                {availableMonths.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            </div>
          </div>
          <div className="p-4">
            {(() => {
              const currentData = selectedMonth === 'current' ? performanceData : historicalData
              if (!currentData) {
                return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Loading...</div>
              }
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fastest Receipt Performance */}
                  <div>
                    <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3">{t('fastest_receipt')}</h4>
                    {currentData.receipt_performance.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {currentData.receipt_performance.map((dept, index) => {
                          const trend = selectedMonth === 'current' ? getTrend(dept, 'receipt') : null
                          return (
                            <div 
                              key={dept.department_id} 
                              className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                                dept.has_data 
                                  ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' 
                                  : 'bg-slate-50 dark:bg-slate-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`text-sm font-bold ${
                                  index < 3 ? 'text-lg' : 'text-xs'
                                } ${dept.has_data ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                                  {dept.has_data ? getRankBadge(index) : '—'}
                                </span>
                                <div>
                                  <div className={`text-sm font-medium ${dept.has_data ? 'dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {dept.department_name}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">{dept.department_code}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                {dept.has_data ? (
                                  <>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm font-bold text-green-600 dark:text-green-400">{dept.average_hours}h</span>
                                      {trend && (
                                        <span className={`text-xs flex items-center ${
                                          trend.direction === 'up' ? 'text-green-600' : 
                                          trend.direction === 'down' ? 'text-red-600' : 
                                          'text-slate-500'
                                        }`}>
                                          {trend.direction === 'up' && <ChevronUp className="w-3 h-3" />}
                                          {trend.direction === 'down' && <ChevronDown className="w-3 h-3" />}
                                          {trend.direction !== 'stable' && `${trend.percentage}%`}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{dept.document_count} docs</div>
                                  </>
                                ) : (
                                  <div className="text-xs text-slate-400 dark:text-slate-500">No data</div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                        {t('no_performance_data')}
                      </div>
                    )}
                  </div>
                  
                  {/* Fastest CC Acknowledgment Performance */}
                  <div>
                    <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3">{t('fastest_cc_acknowledgment')}</h4>
                    {currentData.cc_performance.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {currentData.cc_performance.map((dept, index) => {
                          const trend = selectedMonth === 'current' ? getTrend(dept, 'cc_acknowledgment') : null
                          return (
                            <div 
                              key={dept.department_id} 
                              className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                                dept.has_data 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                                  : 'bg-slate-50 dark:bg-slate-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`text-sm font-bold ${
                                  index < 3 ? 'text-lg' : 'text-xs'
                                } ${dept.has_data ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                                  {dept.has_data ? getRankBadge(index) : '—'}
                                </span>
                                <div>
                                  <div className={`text-sm font-medium ${dept.has_data ? 'dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {dept.department_name}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">{dept.department_code}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                {dept.has_data ? (
                                  <>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{dept.average_hours}h</span>
                                      {trend && (
                                        <span className={`text-xs flex items-center ${
                                          trend.direction === 'up' ? 'text-green-600' : 
                                          trend.direction === 'down' ? 'text-red-600' : 
                                          'text-slate-500'
                                        }`}>
                                          {trend.direction === 'up' && <ChevronUp className="w-3 h-3" />}
                                          {trend.direction === 'down' && <ChevronDown className="w-3 h-3" />}
                                          {trend.direction !== 'stable' && `${trend.percentage}%`}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{dept.document_count} docs</div>
                                  </>
                                ) : (
                                  <div className="text-xs text-slate-400 dark:text-slate-500">No data</div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                        {t('no_performance_data')}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700">
        <div className="px-4 py-3 border-b dark:border-slate-700 font-semibold flex items-center gap-2 dark:text-white">
          <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          {t('recent_documents')}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <th className="py-2 px-4 dark:text-slate-300">{t('ref_no')}</th>
                <th className="px-4 dark:text-slate-300">{t('type')}</th>
                <th className="px-4 dark:text-slate-300">{t('subject')}</th>
                <th className="px-4 dark:text-slate-300">{t('status')}</th>
                <th className="px-4 dark:text-slate-300">{t('registered')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b dark:border-slate-700">
                    <td className="py-2 px-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" /></td>
                    <td className="px-4"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" /></td>
                    <td className="px-4"><div className="h-4 w-64 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" /></td>
                    <td className="px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" /></td>
                    <td className="px-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : recent.length ? (
                recent.map((d) => (
                  <tr key={d.id} className="border-b dark:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-700/50">
                    <td className="py-2 px-4"><Link className="text-blue-700 dark:text-blue-400" to={`/documents/${d.id}`}>{d.ref_no}</Link></td>
                    <td className="px-4"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      d.doc_type === 'INCOMING' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      d.doc_type === 'OUTGOING' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                      'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                    }`}>{d.doc_type}</span></td>
                    <td className="px-4 truncate max-w-[28rem] dark:text-slate-300">{d.subject}</td>
                    <td className="px-4"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      d.status === 'REGISTERED' ? 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-200' :
                      d.status === 'DIRECTED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                      d.status === 'DISPATCHED' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                      d.status === 'RECEIVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                      d.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                      d.status === 'RESPONDED' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                    }`}>{d.status}</span></td>
                    <td className="px-4 dark:text-slate-300"><EthDateDisplay date={d.registered_at} includeTime inline /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-6 text-center text-slate-500 dark:text-slate-400" colSpan={5}>{t('no_documents_yet')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, loading, accent, icon: Icon }) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 shadow p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-400">{title}</div>
        {Icon && <Icon className="w-5 h-5" style={{ color: accent }} />}
      </div>
      <div className="mt-1 text-2xl font-semibold dark:text-white">{loading ? '…' : value}</div>
      <div className="mt-3 h-1.5 rounded-full" style={{ background: accent }} />
    </div>
  )
}
