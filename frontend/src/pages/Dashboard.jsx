import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, FilePlus, FileText, Inbox, Send, FileStack, Clock } from 'lucide-react'

export default function Dashboard() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, incoming: 0, outgoing: 0, memo: 0 })
  const [recent, setRecent] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [allRes, inRes, outRes, memoRes] = await Promise.all([
          api.get('/api/documents/documents/'),
          api.get('/api/documents/documents/', { params: { doc_type: 'INCOMING' } }),
          api.get('/api/documents/documents/', { params: { doc_type: 'OUTGOING' } }),
          api.get('/api/documents/documents/', { params: { doc_type: 'MEMO' } }),
        ])
        const all = allRes.data || []
        setStats({
          total: all.length,
          incoming: (inRes.data || []).length,
          outgoing: (outRes.data || []).length,
          memo: (memoRes.data || []).length,
        })
        const rec = [...all]
          .sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at))
          .slice(0, 6)
        setRecent(rec)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#0B3C5D] dark:bg-[#F0B429] flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white dark:text-[#0B3C5D]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold dark:text-white">{t('dashboard')}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400">Overview of your documents</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/documents/new" className="inline-flex items-center gap-2 rounded-lg bg-[#0B3C5D] dark:bg-[#F0B429] text-white dark:text-[#0B3C5D] px-4 py-2.5 font-medium shadow-sm hover:bg-[#09324F] dark:hover:bg-[#D9A020] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0B429]">
            <FilePlus className="w-4 h-4" />
            {t('new_document')}
          </Link>
          <Link to="/documents" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
            <FileText className="w-4 h-4" />
            {t('documents')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total" value={stats.total} loading={loading} accent="#0B3C5D" icon={FileStack} />
        <StatCard title="Incoming" value={stats.incoming} loading={loading} accent="#F0B429" icon={Inbox} />
        <StatCard title="Outgoing" value={stats.outgoing} loading={loading} accent="#0A4C86" icon={Send} />
        <StatCard title="Memos" value={stats.memo} loading={loading} accent="#F0B429" icon={FileText} />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700">
        <div className="px-4 py-3 border-b dark:border-slate-700 font-semibold flex items-center gap-2 dark:text-white">
          <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          Recent documents
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <th className="py-2 px-4 dark:text-slate-300">Ref</th>
                <th className="px-4 dark:text-slate-300">Type</th>
                <th className="px-4 dark:text-slate-300">{t('subject')}</th>
                <th className="px-4 dark:text-slate-300">Status</th>
                <th className="px-4 dark:text-slate-300">Registered</th>
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
                    <td className="px-4 dark:text-slate-300">{d.doc_type}</td>
                    <td className="px-4 truncate max-w-[28rem] dark:text-slate-300">{d.subject}</td>
                    <td className="px-4 dark:text-slate-300">{d.status}</td>
                    <td className="px-4 dark:text-slate-300">{new Date(d.registered_at).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-6 text-center text-slate-500 dark:text-slate-400" colSpan={5}>No documents yet</td>
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
