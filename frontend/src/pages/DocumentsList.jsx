import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useTranslation } from 'react-i18next'
import MultiSelect from '../components/MultiSelect'
import departmentsEn from '../../Data/Department-en.json'
import departmentsAm from '../../Data/Department-am.json'
import { FileText, Search, FilePlus, Filter } from 'lucide-react'

export default function DocumentsList() {
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState([])
  const [departments, setDepartments] = useState([])
  const [q, setQ] = useState('')
  const [coFilter, setCoFilter] = useState([])
  const [dirFilter, setDirFilter] = useState([])

  const load = async () => {
    try {
      const params = {}
      if (q) params.q = q
      // Only add filters if they have valid values (not undefined/empty)
      const validCoFilter = coFilter.filter(v => v !== undefined && v !== null && v !== '')
      const validDirFilter = dirFilter.filter(v => v !== undefined && v !== null && v !== '')
      if (validCoFilter.length) params.co_office = validCoFilter.join(',')
      if (validDirFilter.length) params.directed_office = validDirFilter.join(',')
      const res = await api.get('/api/documents/documents/', { params })
      setItems(res.data)
    } catch (err) {
      console.error('Failed to load documents:', err)
    }
  }

  useEffect(() => {
    // Fetch departments from backend
    api.get('/api/core/departments/').then(r => setDepartments(r.data))
    load()
  }, [])

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
          <div className="h-10 w-10 rounded-lg bg-[#0B3C5D] flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{t('documents')}</h1>
            <div className="text-sm text-slate-500">Manage all your documents</div>
          </div>
        </div>
        <Link to="/documents/new" className="inline-flex items-center gap-2 rounded-lg bg-[#0B3C5D] text-white px-4 py-2.5 font-medium shadow-sm hover:bg-[#09324F]">
          <FilePlus className="w-4 h-4" />
          {t('new_document')}
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Filter className="w-4 h-4" />
          Filters
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                className="border border-slate-200 rounded-lg pl-9 pr-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 focus:border-[#0B3C5D]" 
                placeholder={t('search')} 
                value={q} 
                onChange={(e)=>setQ(e.target.value)} 
              />
            </div>
          </div>
          <button className="inline-flex items-center gap-2 bg-[#0B3C5D] text-white rounded-lg px-4 py-2 font-medium hover:bg-[#09324F]" onClick={load}>
            <Search className="w-4 h-4" />
            {t('search')}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-500 mb-1">{t('co_office')}</div>
            <MultiSelect options={deptOptions} value={coFilter} onChange={setCoFilter} placeholder={t('co_office')} />
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">{t('directed_office')}</div>
            <MultiSelect options={deptOptions} value={dirFilter} onChange={setDirFilter} placeholder={t('directed_office')} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-slate-50">
              <th className="py-3 px-4">Ref</th>
              <th className="px-4">Type</th>
              <th className="px-4">{t('subject')}</th>
              <th className="px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map((d)=> (
              <tr key={d.id} className="border-b hover:bg-slate-50/60">
                <td className="py-3 px-4"><Link className="text-blue-700 hover:underline" to={`/documents/${d.id}`}>{d.ref_no}</Link></td>
                <td className="px-4">{d.doc_type}</td>
                <td className="px-4">{d.subject}</td>
                <td className="px-4">{d.status}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">No documents found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
