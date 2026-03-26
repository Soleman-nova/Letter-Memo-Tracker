import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, FilePlus, FileText, Inbox, Send, FileStack, Clock, CheckCircle, AlertCircle, DollarSign, TrendingUp, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import EthDateDisplay from '../components/EthDateDisplay'

export default function Dashboard() {
  const { t } = useTranslation()
  const { canCreateDocuments, isCeoSecretary, isCeo } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, incoming: 0, outgoing: 0, memo: 0, pending: 0, received: 0 })
  const [paymentStats, setPaymentStats] = useState({ total: 0, pending: 0, urgent: 0, thisWeek: 0 })
  const [recent, setRecent] = useState([])

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
        
        // Add payment stats for CEO and CEO Secretary
        if (isCeo || isCeoSecretary) {
          promises.push(api.get('/api/payments/payments/'))
        }
        
        const results = await Promise.all(promises)
        const [allRes, inRes, outRes, memoRes, paymentsRes] = results
        
        const all = allRes.data || []
        setStats({
          total: all.length,
          incoming: (inRes.data || []).length,
          outgoing: (outRes.data || []).length,
          memo: (memoRes.data || []).length,
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
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
          
          setPaymentStats({
            total: payments.length,
            pending: payments.filter(p => p.status === 'ARRIVED' || p.status === 'REGISTERED').length,
            urgent: payments.filter(p => p.priority === 'URGENT').length,
            thisWeek: payments.filter(p => new Date(p.registration_date) >= oneWeekAgo).length,
          })
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isCeo, isCeoSecretary])

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
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('pending_payments')}</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{loading ? '…' : paymentStats.pending}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('urgent_payments')}</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                {loading ? '…' : paymentStats.urgent}
                {!loading && paymentStats.urgent > 0 && <Zap className="w-4 h-4" />}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('this_week')}</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{loading ? '…' : paymentStats.thisWeek}</div>
            </div>
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
