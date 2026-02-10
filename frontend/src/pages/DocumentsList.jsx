import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useTranslation } from 'react-i18next'
import MultiSelect from '../components/MultiSelect'
import departmentsEn from '../../Data/Department-en.json'
import departmentsAm from '../../Data/Department-am.json'
import { FileText, Search, FilePlus, Filter, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import EthDateDisplay from '../components/EthDateDisplay'
import EthiopianDateInput from '../components/EthiopianDateInput'

export default function DocumentsList() {
  const { t, i18n } = useTranslation()
  const { canCreateDocuments } = useAuth()
  const [items, setItems] = useState([])
  const [departments, setDepartments] = useState([])
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [coFilter, setCoFilter] = useState([])
  const [dirFilter, setDirFilter] = useState([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = async () => {
    try {
      const params = {}
      if (q) params.q = q
      if (typeFilter) params.doc_type = typeFilter
      if (statusFilter) params.status = statusFilter
      // Only add filters if they have valid values (not undefined/empty)
      const validCoFilter = coFilter.filter(v => v !== undefined && v !== null && v !== '')
      const validDirFilter = dirFilter.filter(v => v !== undefined && v !== null && v !== '')
      if (validCoFilter.length) params.co_office = validCoFilter.join(',')
      if (validDirFilter.length) params.directed_office = validDirFilter.join(',')
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      const res = await api.get('/api/documents/documents/', { params })
      setItems(res.data)
    } catch (err) {
      console.error('Failed to load documents:', err)
    }
  }

  useEffect(() => {
    // Fetch departments from backend
    api.get('/api/core/departments/').then(r => setDepartments(r.data))
  }, [])

  // Auto-reload when filters change
  useEffect(() => {
    load()
  }, [typeFilter, statusFilter, dateFrom, dateTo])

  // Use backend departments with i18n labels from JSON
  const deptData = i18n.language === 'am' ? departmentsAm : departmentsEn
  const labelMap = new Map(
    deptData.map(d => [d.short_name?.trim().toUpperCase(), d.dept_name])
  )
  const deptOptions = departments.map(d => {
    const localLabel = labelMap.get(d.code?.trim().toUpperCase()) || d.name
    return { value: String(d.id), label: `${d.code} - ${localLabel}` }
  })

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#0B3C5D] dark:bg-[#F0B429] flex items-center justify-center">
            <FileText className="w-5 h-5 text-white dark:text-[#0B3C5D]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold dark:text-white">{t('documents')}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400">{t('documents_subtitle')}</div>
          </div>
        </div>
        {canCreateDocuments && (
          <Link to="/documents/new" className="inline-flex items-center gap-2 rounded-lg bg-[#0B3C5D] dark:bg-[#F0B429] text-white dark:text-[#0B3C5D] px-4 py-2.5 font-medium shadow-sm hover:bg-[#09324F] dark:hover:bg-[#D9A020]">
            <FilePlus className="w-4 h-4" />
            {t('new_document')}
          </Link>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Filter className="w-4 h-4" />
          {t('filters')}
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                className="border border-slate-200 dark:border-slate-600 rounded-lg pl-9 pr-3 py-2 w-full bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 focus:border-[#0B3C5D]" 
                placeholder={t('search')} 
                value={q} 
                onChange={(e)=>setQ(e.target.value)} 
              />
            </div>
          </div>
          <select className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white text-sm" value={typeFilter} onChange={(e)=>{setTypeFilter(e.target.value)}}>
            <option value="">{t('all_types')}</option>
            <option value="INCOMING">{t('incoming')}</option>
            <option value="OUTGOING">{t('outgoing')}</option>
            <option value="MEMO">{t('memo')}</option>
          </select>
          <select className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white text-sm" value={statusFilter} onChange={(e)=>{setStatusFilter(e.target.value)}}>
            <option value="">{t('all_statuses')}</option>
            <option value="REGISTERED">{t('registered')}</option>
            <option value="DIRECTED">{t('directed')}</option>
            <option value="DISPATCHED">{t('dispatched')}</option>
            <option value="RECEIVED">{t('received')}</option>
            <option value="IN_PROGRESS">{t('in_progress')}</option>
            <option value="RESPONDED">{t('responded')}</option>
            <option value="CLOSED">{t('closed')}</option>
          </select>
          <button className="inline-flex items-center gap-2 bg-[#0B3C5D] dark:bg-[#F0B429] text-white dark:text-[#0B3C5D] rounded-lg px-4 py-2 font-medium hover:bg-[#09324F] dark:hover:bg-[#D9A020]" onClick={load}>
            <Search className="w-4 h-4" />
            {t('search')}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('co_office')}</div>
            <MultiSelect options={deptOptions} value={coFilter} onChange={setCoFilter} placeholder={t('co_office')} />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('directed_office')}</div>
            <MultiSelect options={deptOptions} value={dirFilter} onChange={setDirFilter} placeholder={t('directed_office')} />
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            {t('date_range_filter')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <EthiopianDateInput label={t('from')} value={dateFrom} onChange={setDateFrom} />
            <EthiopianDateInput label={t('to')} value={dateTo} onChange={setDateTo} />
          </div>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => { setDateFrom(''); setDateTo('') }}
              className="mt-2 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              {t('clear_date_filter')}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              <th className="py-3 px-4 dark:text-slate-300">{t('ref_no')}</th>
              <th className="px-4 dark:text-slate-300">{t('type')}</th>
              <th className="px-4 dark:text-slate-300">{t('source')}</th>
              <th className="px-4 dark:text-slate-300">{t('office')}</th>
              <th className="px-4 dark:text-slate-300">{t('subject')}</th>
              <th className="px-4 dark:text-slate-300">{t('status')}</th>
              <th className="px-4 dark:text-slate-300">{t('date')}</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map((d)=> {
              const statusColors = {
                REGISTERED: 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-200',
                DIRECTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                DISPATCHED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
                RECEIVED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                IN_PROGRESS: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
                RESPONDED: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
                CLOSED: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200',
              }
              const typeColors = {
                INCOMING: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                OUTGOING: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
                MEMO: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
              }
              return (
              <tr key={d.id} className="border-b dark:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-700/50">
                <td className="py-3 px-4">
                  <Link className="text-blue-700 dark:text-blue-400 hover:underline font-medium" to={`/documents/${d.id}`}>{d.ref_no}</Link>
                  {d.priority === 'URGENT' && <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">URGENT</span>}
                  {d.priority === 'HIGH' && <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">HIGH</span>}
                </td>
                <td className="px-4"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColors[d.doc_type] || ''}`}>{d.doc_type}</span></td>
                <td className="px-4 dark:text-slate-300 text-xs">{d.source === 'INTERNAL' ? t('internal') : t('external')}</td>
                <td className="px-4 dark:text-slate-300 text-xs">{d.department_name || 'CEO Office'}</td>
                <td className="px-4 dark:text-slate-300 max-w-xs truncate">{d.subject}</td>
                <td className="px-4"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[d.status] || ''}`}>{d.status}</span></td>
                <td className="px-4 dark:text-slate-300 text-xs"><EthDateDisplay date={d.registered_at} inline /></td>
              </tr>
              )
            }) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">{t('no_documents')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
