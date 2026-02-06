import React, { useEffect, useState } from 'react'
import api from '../api'
import { useTranslation } from 'react-i18next'
import MultiSelect from '../components/MultiSelect'
import departmentsEn from '../../Data/Department-en.json'
import departmentsAm from '../../Data/Department-am.json'
import { FilePlus, Save, Paperclip } from 'lucide-react'


export default function DocumentForm() {
  const { t, i18n } = useTranslation()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    doc_type: 'INCOMING',
    source: 'EXTERNAL', // EXTERNAL or INTERNAL
    subject: '',
    summary: '',
    department: '',
    ec_year: '',
    // Parties / offices
    company_office_name: '',
    co_offices: [],
    directed_offices: [],
    // Dates
    received_date: '',
    written_date: '',
    memo_date: '',
    ceo_directed_date: '',
    due_date: '',
    // Notes / signature
    ceo_note: '',
    signature_name: '',
  })
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    // Fetch departments from backend to get correct IDs
    api.get('/api/core/departments/').then(r => {
      setDepartments(r.data)
      setLoading(false)
    }).catch(err => {
      console.error('Failed to load departments:', err)
      setMsg('Failed to load departments from server')
      setLoading(false)
    })
  }, [])

  // Use backend departments for all selects to ensure IDs match DB
  // Map backend departments to local JSON for i18n labels
  const deptData = i18n.language === 'am' ? departmentsAm : departmentsEn
  
  // Create a case-insensitive, trimmed mapping
  const labelMap = new Map(
    deptData.map(d => [d.short_name?.trim().toUpperCase(), d.dept_name])
  )
  
  // Create options from backend departments with i18n labels
  const deptOptions = departments.map(d => {
    // Try to match by code (case-insensitive, trimmed)
    const localLabel = labelMap.get(d.code?.trim().toUpperCase()) || d.name
    return { value: String(d.id), label: `${d.code} - ${localLabel}` }
  })

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach(val => fd.append(k, val))
        } else {
          fd.append(k, v)
        }
      })
      for (const f of files) fd.append('attachments', f)
      const res = await api.post('/api/documents/documents/', fd)
      setMsg(`Saved: ${res.data.ref_no}`)
      setForm({
        doc_type: 'INCOMING', source: 'EXTERNAL', subject: '', summary: '', department: '', ec_year: '',
        company_office_name: '', co_offices: [], directed_offices: [],
        received_date: '', written_date: '', memo_date: '', ceo_directed_date: '', due_date: '',
        ceo_note: '', signature_name: '',
      })
      setFiles([])
    } catch (e) {
      const err = e.response?.data
      console.error('Form submission error:', err)
      setMsg(err ? (typeof err === 'string' ? err : JSON.stringify(err)) : 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-[#0B3C5D] flex items-center justify-center">
          <FilePlus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{t('new_document')}</h1>
          <div className="text-sm text-slate-500">Create and route a new document</div>
        </div>
      </div>
      {msg && <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 text-amber-800 p-2 text-sm">{msg}</div>}
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-6">
        {/* Primary Fields in Grid */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="text-sm font-medium text-slate-600 mb-3">Document Information</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('doc_type')}</label>
              <select className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 focus:border-[#0B3C5D]" value={form.doc_type} onChange={(e)=>update('doc_type', e.target.value)}>
                <option value="INCOMING">Incoming Letter</option>
                <option value="OUTGOING">Outgoing Letter</option>
                <option value="MEMO">Memo</option>
              </select>
            </div>
            {form.doc_type !== 'MEMO' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                <select className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 focus:border-[#0B3C5D]" value={form.source} onChange={(e)=>update('source', e.target.value)}>
                  <option value="EXTERNAL">External (Outside Company)</option>
                  <option value="INTERNAL">Internal (CxO Offices)</option>
                </select>
              </div>
            )}
            {form.doc_type === 'MEMO' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Direction</label>
                <select className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 focus:border-[#0B3C5D]" value={form.source} onChange={(e)=>update('source', e.target.value)}>
                  <option value="INTERNAL">Incoming (From CxO to CEO)</option>
                  <option value="EXTERNAL">Outgoing (From CEO to CxO)</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('department')}</label>
              <select className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 focus:border-[#0B3C5D]" value={form.department} onChange={(e)=>update('department', e.target.value)} disabled={loading}>
                <option value="">{loading ? 'Loading...' : '-- Select CEO Office --'}</option>
                {departments.map(d => {
                  const localLabel = labelMap.get(d.code?.trim().toUpperCase()) || d.name
                  return <option key={d.id} value={d.id}>{d.code} - {localLabel}</option>
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('ec_year')}</label>
              <input className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 focus:border-[#0B3C5D]" value={form.ec_year} onChange={(e)=>update('ec_year', e.target.value)} placeholder="e.g., 18" />
            </div>
          </div>
        </div>

        {/* Scenario 1: Incoming Letter from External (Outside Company) */}
        {form.doc_type === 'INCOMING' && form.source === 'EXTERNAL' && (
          <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
            <div className="font-semibold mb-3 text-blue-900">📥 Scenario 1: External Incoming Letter (From Outside Company to CEO)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Received Date</label>
                <input type="date" className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.received_date} onChange={(e)=>update('received_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company/Agency Name</label>
                <input className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.company_office_name} onChange={(e)=>update('company_office_name', e.target.value)} placeholder="e.g., Ministry of Water" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">{t('subject')}</label>
                <input className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CEO Directed Date</label>
                <input type="date" className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.ceo_directed_date} onChange={(e)=>update('ceo_directed_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Direct To (CxO Offices)</label>
                <MultiSelect options={deptOptions} value={form.directed_offices} onChange={(vals)=>update('directed_offices', vals)} placeholder="Select offices to direct to" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">CEO Note</label>
                <textarea className="border border-slate-300 rounded-lg p-2.5 w-full" rows={3} value={form.ceo_note} onChange={(e)=>update('ceo_note', e.target.value)} placeholder="CEO's instructions or notes" />
              </div>
            </div>
          </div>
        )}

        {/* Scenario 2: Incoming Letter from Internal (From CxO Offices to CEO) */}
        {form.doc_type === 'INCOMING' && form.source === 'INTERNAL' && (
          <div className="border border-green-200 rounded-xl p-4 bg-green-50">
            <div className="font-semibold mb-3 text-green-900">📨 Scenario 2: Internal Incoming Letter (From CxO Office to CEO)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Received Date</label>
                <input type="date" className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.received_date} onChange={(e)=>update('received_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">From Office (CxO)</label>
                <MultiSelect options={deptOptions} value={form.co_offices} onChange={(vals)=>update('co_offices', vals)} placeholder="Select originating CxO office" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">{t('subject')}</label>
                <input className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CEO Response Date</label>
                <input type="date" className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.ceo_directed_date} onChange={(e)=>update('ceo_directed_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Direct To (CxO Offices)</label>
                <MultiSelect options={deptOptions} value={form.directed_offices} onChange={(vals)=>update('directed_offices', vals)} placeholder="Select offices if redirecting" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">CEO Note</label>
                <textarea className="border border-slate-300 rounded-lg p-2.5 w-full" rows={3} value={form.ceo_note} onChange={(e)=>update('ceo_note', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Scenario 3: Outgoing Letter to External (From CEO to Companies/Agencies) */}
        {form.doc_type === 'OUTGOING' && form.source === 'EXTERNAL' && (
          <div className="border border-purple-200 rounded-xl p-4 bg-purple-50">
            <div className="font-semibold mb-3 text-purple-900">📤 Scenario 3: External Outgoing Letter (From CEO to Companies/Agencies)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Written Date</label>
                <input type="date" className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.written_date} onChange={(e)=>update('written_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To (Company/Agency Names)</label>
                <input className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.company_office_name} onChange={(e)=>update('company_office_name', e.target.value)} placeholder="e.g., Ethiopian Airlines, Ministry of Finance" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">{t('subject')}</label>
                <input className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Signature Name</label>
                <input className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.signature_name} onChange={(e)=>update('signature_name', e.target.value)} placeholder="CEO name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CC (CxO Offices - Optional)</label>
                <MultiSelect options={deptOptions} value={form.co_offices} onChange={(vals)=>update('co_offices', vals)} placeholder="Select offices to CC" />
              </div>
            </div>
          </div>
        )}

        {/* Scenario 4: Outgoing Letter to Internal (From CEO to CxO Offices) */}
        {form.doc_type === 'OUTGOING' && form.source === 'INTERNAL' && (
          <div className="border border-orange-200 rounded-xl p-4 bg-orange-50">
            <div className="font-semibold mb-3 text-orange-900">📮 Scenario 4: Internal Outgoing Letter (From CEO to CxO Offices)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Written Date</label>
                <input type="date" className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.written_date} onChange={(e)=>update('written_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To (CxO Offices)</label>
                <MultiSelect options={deptOptions} value={form.directed_offices} onChange={(vals)=>update('directed_offices', vals)} placeholder="Select recipient CxO offices" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">{t('subject')}</label>
                <input className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Signature Name</label>
                <input className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.signature_name} onChange={(e)=>update('signature_name', e.target.value)} placeholder="CEO name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CC (Other CxO Offices - Optional)</label>
                <MultiSelect options={deptOptions} value={form.co_offices} onChange={(vals)=>update('co_offices', vals)} placeholder="Select offices to CC" />
              </div>
            </div>
          </div>
        )}

        {/* Scenario 5: Incoming Memo (From CxO Offices to CEO) */}
        {form.doc_type === 'MEMO' && form.source === 'INTERNAL' && (
          <div className="border border-teal-200 rounded-xl p-4 bg-teal-50">
            <div className="font-semibold mb-3 text-teal-900">📝 Scenario 5: Incoming Memo (From CxO Office to CEO)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Memo Date</label>
                <input type="date" className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.memo_date} onChange={(e)=>update('memo_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">From Office (CxO)</label>
                <MultiSelect options={deptOptions} value={form.co_offices} onChange={(vals)=>update('co_offices', vals)} placeholder="Select originating CxO office" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">{t('subject')}</label>
                <input className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CEO Response Date</label>
                <input type="date" className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.ceo_directed_date} onChange={(e)=>update('ceo_directed_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Direct To (CxO Offices - Optional)</label>
                <MultiSelect options={deptOptions} value={form.directed_offices} onChange={(vals)=>update('directed_offices', vals)} placeholder="Select if redirecting" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">CEO Note</label>
                <textarea className="border border-slate-300 rounded-lg p-2.5 w-full" rows={3} value={form.ceo_note} onChange={(e)=>update('ceo_note', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Scenario 6: Outgoing Memo (From CEO to CxO Offices) */}
        {form.doc_type === 'MEMO' && form.source === 'EXTERNAL' && (
          <div className="border border-amber-200 rounded-xl p-4 bg-amber-50">
            <div className="font-semibold mb-3 text-amber-900">📋 Scenario 6: Outgoing Memo (From CEO to CxO Offices)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Memo Date</label>
                <input type="date" className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.memo_date} onChange={(e)=>update('memo_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To (CxO Offices)</label>
                <MultiSelect options={deptOptions} value={form.directed_offices} onChange={(vals)=>update('directed_offices', vals)} placeholder="Select recipient CxO offices" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">{t('subject')}</label>
                <input className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Signature Name</label>
                <input className="border border-slate-300 rounded-lg p-2.5 w-full" value={form.signature_name} onChange={(e)=>update('signature_name', e.target.value)} placeholder="CEO name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CC (Other CxO Offices - Optional)</label>
                <MultiSelect options={deptOptions} value={form.co_offices} onChange={(vals)=>update('co_offices', vals)} placeholder="Select offices to CC" />
              </div>
            </div>
          </div>
        )}
        <div>
          <label className="text-sm mb-1 flex items-center gap-1">
            <Paperclip className="w-4 h-4 text-slate-500" />
            {t('attachments')}
          </label>
          <input type="file" multiple onChange={(e)=>setFiles(Array.from(e.target.files))} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
          {files.length > 0 && (
            <div className="mt-2 text-xs text-slate-500">{files.length} file(s) selected</div>
          )}
        </div>
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#0B3C5D] text-white px-4 py-2.5 font-medium shadow-sm hover:bg-[#09324F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0B429] disabled:opacity-70 disabled:cursor-not-allowed" type="submit">
          <Save className="w-4 h-4" />
          {t('save')}
        </button>
      </form>
    </div>
  )
}
