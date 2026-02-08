import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { useTranslation } from 'react-i18next'
import MultiSelect from '../components/MultiSelect'
import departmentsEn from '../../Data/Department-en.json'
import departmentsAm from '../../Data/Department-am.json'
import { FilePlus, Save, Paperclip, Edit } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'


export default function DocumentForm() {
  const { id } = useParams() // If id exists, we're in edit mode
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [existingDoc, setExistingDoc] = useState(null) // For edit mode
  const userRole = user?.profile?.role
  const userDeptId = user?.profile?.department?.id
  const isCxoSecretary = userRole === 'CXO_SECRETARY'
  const isCeoLevel = ['SUPER_ADMIN', 'CEO_SECRETARY'].includes(userRole)
  const [form, setForm] = useState({
    doc_type: 'INCOMING',
    source: 'EXTERNAL', // EXTERNAL or INTERNAL
    ref_no: '',
    subject: '',
    summary: '',
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
    priority: 'NORMAL',
    confidentiality: 'REGULAR',
  })
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const isEditMode = !!id

  useEffect(() => {
    // Fetch departments from backend to get correct IDs
    api.get('/api/core/departments/').then(r => {
      setDepartments(r.data)
      setLoading(false)
    }).catch(err => {
      console.error('Failed to load departments:', err)
      toast.error('Failed to load departments from server')
      setLoading(false)
    })
  }, [])

  // Load existing document if in edit mode
  useEffect(() => {
    if (id) {
      api.get(`/api/documents/documents/${id}/`).then(r => {
        const doc = r.data
        setExistingDoc(doc)
        setForm({
          doc_type: doc.doc_type || 'INCOMING',
          source: doc.source || 'EXTERNAL',
          ref_no: doc.ref_no || '',
          subject: doc.subject || '',
          summary: doc.summary || '',
          ec_year: doc.ec_year || '',
          company_office_name: doc.company_office_name || '',
          co_offices: doc.co_offices?.map(String) || [],
          directed_offices: doc.directed_offices?.map(String) || [],
          received_date: doc.received_date || '',
          written_date: doc.written_date || '',
          memo_date: doc.memo_date || '',
          ceo_directed_date: doc.ceo_directed_date || '',
          due_date: doc.due_date || '',
          ceo_note: doc.ceo_note || '',
          signature_name: doc.signature_name || '',
          priority: doc.priority || 'NORMAL',
          confidentiality: doc.confidentiality || 'REGULAR',
        })
      }).catch(err => {
        console.error('Failed to load document:', err)
        toast.error('Failed to load document')
      })
    }
  }, [id])

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
    try {
      if (isEditMode) {
        // Edit mode - update document and change status to DIRECTED
        const updateData = {
          ceo_directed_date: form.ceo_directed_date,
          ceo_note: form.ceo_note,
          directed_offices: form.directed_offices.map(Number),
          status: 'DIRECTED'
        }
        await api.patch(`/api/documents/documents/${id}/`, updateData)
        toast.success('Document updated successfully!')
        setTimeout(() => navigate(`/documents/${id}`), 1500)
      } else {
        // Create mode
        const fd = new FormData()
        Object.entries(form).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            v.forEach(val => { if (val !== '' && val !== undefined && val !== null) fd.append(k, val) })
          } else if (v !== '' && v !== undefined && v !== null) {
            fd.append(k, v)
          }
        })
        // Auto-set department for CxO Secretary (scenarios 7-13)
        if (isCxoSecretary && userDeptId) {
          fd.append('department', userDeptId)
        }
        for (const f of files) fd.append('attachments', f)
        const res = await api.post('/api/documents/documents/', fd)
        toast.success(`Document saved: ${res.data.ref_no}`)
        if (res.data.id) {
          setTimeout(() => navigate(`/documents/${res.data.id}`), 1000)
        } else {
          setTimeout(() => navigate('/documents'), 1000)
        }
      }
    } catch (e) {
      console.error('Form submission error:', e)
      toast.error(toast.parseApiError(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isEditMode ? 'bg-blue-600 dark:bg-blue-500' : 'bg-[#0B3C5D] dark:bg-[#F0B429]'}`}>
          {isEditMode ? <Edit className="w-5 h-5 text-white" /> : <FilePlus className="w-5 h-5 text-white dark:text-[#0B3C5D]" />}
        </div>
        <div>
          <h1 className="text-2xl font-semibold dark:text-white">{isEditMode ? 'Add CEO Direction' : t('new_document')}</h1>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {isEditMode 
              ? `Document: ${existingDoc?.ref_no || ''} - ${existingDoc?.subject || ''}` 
              : 'Create and route a new document'}
          </div>
        </div>
      </div>
            
      {/* EDIT MODE: Loading state */}
      {isEditMode && !existingDoc && (
        <div className="p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#0B3C5D] dark:border-slate-600 dark:border-t-[#F0B429]" />
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading document...</div>
        </div>
      )}
      {/* EDIT MODE: Show only CEO Direction fields */}
      {isEditMode && existingDoc && (
        <form onSubmit={submit} className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="font-semibold mb-3 text-blue-900 dark:text-blue-300">📋 Document Summary (Read Only)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500 dark:text-slate-400">Ref No:</span> <span className="font-medium dark:text-white">{existingDoc.ref_no}</span></div>
              <div><span className="text-slate-500 dark:text-slate-400">Received:</span> <span className="font-medium dark:text-white">{existingDoc.received_date}</span></div>
              <div className="md:col-span-2"><span className="text-slate-500 dark:text-slate-400">Subject:</span> <span className="font-medium dark:text-white">{existingDoc.subject}</span></div>
              <div><span className="text-slate-500 dark:text-slate-400">From:</span> <span className="font-medium dark:text-white">{existingDoc.company_office_name}</span></div>
              <div><span className="text-slate-500 dark:text-slate-400">Status:</span> <span className="font-medium dark:text-white">{existingDoc.status}</span></div>
            </div>
          </div>
          
          <div className="border border-green-200 dark:border-green-800 rounded-xl p-4 bg-green-50 dark:bg-green-900/20">
            <div className="font-semibold mb-3 text-green-900 dark:text-green-300">✍️ CEO Direction (Step 2)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">CEO Directed Date <span className="text-red-500">*</span></label>
                <input type="date" className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.ceo_directed_date} onChange={(e)=>update('ceo_directed_date', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Direct To (CxO Offices) <span className="text-red-500">*</span></label>
                <MultiSelect options={deptOptions} value={form.directed_offices} onChange={(vals)=>update('directed_offices', vals)} placeholder="Select offices to direct to" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 dark:text-white">CEO Note</label>
                <textarea className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" rows={3} value={form.ceo_note} onChange={(e)=>update('ceo_note', e.target.value)} placeholder="CEO's instructions or notes" />
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-green-600 text-white px-4 py-2.5 font-medium shadow-sm hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed" type="submit">
              <Save className="w-4 h-4" />
              Save & Mark as Directed
            </button>
            <button type="button" onClick={() => navigate(`/documents/${id}`)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* CREATE MODE: Show full form */}
      {!isEditMode && (
      <form onSubmit={submit} className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 space-y-6">
        {/* Primary Fields in Grid */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Document Information</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reference No. <span className="text-red-500">*</span></label>
              <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 focus:border-[#0B3C5D]" value={form.ref_no} onChange={(e)=>update('ref_no', e.target.value)} placeholder="e.g., CEO/001/18 EC" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('doc_type')}</label>
              <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 focus:border-[#0B3C5D]" value={form.doc_type} onChange={(e)=>update('doc_type', e.target.value)}>
                <option value="INCOMING">Incoming Letter</option>
                <option value="OUTGOING">Outgoing Letter</option>
                <option value="MEMO">Memo</option>
              </select>
            </div>
            {form.doc_type !== 'MEMO' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source</label>
                <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 focus:border-[#0B3C5D]" value={form.source} onChange={(e)=>update('source', e.target.value)}>
                  {isCeoLevel ? (
                    <>
                      <option value="EXTERNAL">External (Outside Company)</option>
                      <option value="INTERNAL">Internal (CxO Offices)</option>
                    </>
                  ) : (
                    <>
                      <option value="EXTERNAL">External (Outside Company)</option>
                      <option value="INTERNAL">Internal (Between Offices)</option>
                    </>
                  )}
                </select>
              </div>
            )}
            {form.doc_type === 'MEMO' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Direction</label>
                <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 focus:border-[#0B3C5D]" value={form.source} onChange={(e)=>update('source', e.target.value)}>
                  {isCeoLevel ? (
                    <>
                      <option value="INTERNAL">Incoming (From CxO to CEO)</option>
                      <option value="EXTERNAL">Outgoing (From CEO to CxO)</option>
                    </>
                  ) : (
                    <>
                      <option value="INTERNAL">To Other CxO Offices</option>
                      <option value="EXTERNAL">To CEO Office</option>
                    </>
                  )}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('ec_year')} <span className="text-red-500">*</span></label>
              <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 focus:border-[#0B3C5D]" value={form.ec_year} onChange={(e)=>update('ec_year', e.target.value)} placeholder="e.g., 18" required />
            </div>
          </div>
        </div>

        {/* ===== CEO SECRETARY SCENARIOS (1-6) ===== */}
        {isCeoLevel && (
          <>
        {/* Scenario 1: Incoming Letter from External (Outside Company) */}
        {form.doc_type === 'INCOMING' && form.source === 'EXTERNAL' && (
          <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20">
            <div className="font-semibold mb-3 text-blue-900 dark:text-blue-300">Scenario 1: External Incoming Letter (From Outside Company to CEO)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Received Date <span className="text-red-500">*</span></label>
                <input type="date" className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.received_date} onChange={(e)=>update('received_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Company/Agency Name <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.company_office_name} onChange={(e)=>update('company_office_name', e.target.value)} placeholder="e.g., Ministry of Water" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('subject')} <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">CEO Directed Date</label>
                <input type="date" className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.ceo_directed_date} onChange={(e)=>update('ceo_directed_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Direct To (CxO Offices)</label>
                <MultiSelect options={deptOptions} value={form.directed_offices} onChange={(vals)=>update('directed_offices', vals)} placeholder="Select offices to direct to" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">CC (CxO Offices - Optional)</label>
                <MultiSelect options={deptOptions} value={form.co_offices} onChange={(vals)=>update('co_offices', vals)} placeholder="Select offices to CC" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 dark:text-white">CEO Note</label>
                <textarea className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" rows={3} value={form.ceo_note} onChange={(e)=>update('ceo_note', e.target.value)} placeholder="CEO's instructions or notes" />
              </div>
            </div>
          </div>
        )}

        {/* Scenario 2: Incoming Letter from Internal (From CxO Offices to CEO) */}
        {form.doc_type === 'INCOMING' && form.source === 'INTERNAL' && (
          <div className="border border-green-200 dark:border-green-800 rounded-xl p-4 bg-green-50 dark:bg-green-900/20">
            <div className="font-semibold mb-3 text-green-900 dark:text-green-300">Scenario 2: Internal Incoming Letter (From CxO Office to CEO)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Received Date <span className="text-red-500">*</span></label>
                <input type="date" className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.received_date} onChange={(e)=>update('received_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">From Office (CxO) <span className="text-red-500">*</span></label>
                <MultiSelect options={deptOptions} value={form.co_offices} onChange={(vals)=>update('co_offices', vals)} placeholder="Select originating CxO office" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('subject')} <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Scenario 3: Outgoing Letter to External (From CEO to Companies/Agencies) */}
        {form.doc_type === 'OUTGOING' && form.source === 'EXTERNAL' && (
          <div className="border border-purple-200 dark:border-purple-800 rounded-xl p-4 bg-purple-50 dark:bg-purple-900/20">
            <div className="font-semibold mb-3 text-purple-900 dark:text-purple-300">Scenario 3: External Outgoing Letter (From CEO to Companies/Agencies)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Written Date <span className="text-red-500">*</span></label>
                <input type="date" className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.written_date} onChange={(e)=>update('written_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">To (Company/Agency Names) <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.company_office_name} onChange={(e)=>update('company_office_name', e.target.value)} placeholder="e.g., Ethiopian Airlines, Ministry of Finance" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('subject')} <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Signature Name</label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.signature_name} onChange={(e)=>update('signature_name', e.target.value)} placeholder="CEO name" />
              </div>
            </div>
          </div>
        )}

        {/* Scenario 4: Outgoing Letter to Internal (From CEO to CxO Offices) */}
        {form.doc_type === 'OUTGOING' && form.source === 'INTERNAL' && (
          <div className="border border-orange-200 dark:border-orange-800 rounded-xl p-4 bg-orange-50 dark:bg-orange-900/20">
            <div className="font-semibold mb-3 text-orange-900 dark:text-orange-300">Scenario 4: Internal Outgoing Letter (From CEO to CxO Offices)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Written Date <span className="text-red-500">*</span></label>
                <input type="date" className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.written_date} onChange={(e)=>update('written_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">To (CxO Offices) <span className="text-red-500">*</span></label>
                <MultiSelect options={deptOptions} value={form.directed_offices} onChange={(vals)=>update('directed_offices', vals)} placeholder="Select recipient CxO offices" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('subject')} <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Signature Name</label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.signature_name} onChange={(e)=>update('signature_name', e.target.value)} placeholder="CEO name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">CC (Other CxO Offices - Optional)</label>
                <MultiSelect options={deptOptions} value={form.co_offices} onChange={(vals)=>update('co_offices', vals)} placeholder="Select offices to CC" />
              </div>
            </div>
          </div>
        )}

        {/* Scenario 5: Incoming Memo (From CxO Offices to CEO) */}
        {form.doc_type === 'MEMO' && form.source === 'INTERNAL' && (
          <div className="border border-teal-200 dark:border-teal-800 rounded-xl p-4 bg-teal-50 dark:bg-teal-900/20">
            <div className="font-semibold mb-3 text-teal-900 dark:text-teal-300">Scenario 5: Incoming Memo (From CxO Office to CEO)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Memo Date <span className="text-red-500">*</span></label>
                <input type="date" className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.memo_date} onChange={(e)=>update('memo_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">From Office (CxO) <span className="text-red-500">*</span></label>
                <MultiSelect options={deptOptions} value={form.co_offices} onChange={(vals)=>update('co_offices', vals)} placeholder="Select originating CxO office" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('subject')} <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Scenario 6: Outgoing Memo (From CEO to CxO Offices) */}
        {form.doc_type === 'MEMO' && form.source === 'EXTERNAL' && (
          <div className="border border-amber-200 dark:border-amber-800 rounded-xl p-4 bg-amber-50 dark:bg-amber-900/20">
            <div className="font-semibold mb-3 text-amber-900 dark:text-amber-300">Scenario 6: Outgoing Memo (From CEO to CxO Offices)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Memo Date <span className="text-red-500">*</span></label>
                <input type="date" className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.memo_date} onChange={(e)=>update('memo_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">To (CxO Offices) <span className="text-red-500">*</span></label>
                <MultiSelect options={deptOptions} value={form.directed_offices} onChange={(vals)=>update('directed_offices', vals)} placeholder="Select recipient CxO offices" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('subject')} <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Signature Name</label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.signature_name} onChange={(e)=>update('signature_name', e.target.value)} placeholder="CEO name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">CC (Other CxO Offices - Optional)</label>
                <MultiSelect options={deptOptions} value={form.co_offices} onChange={(vals)=>update('co_offices', vals)} placeholder="Select offices to CC" />
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* ===== CxO SECRETARY SCENARIOS (7-13) ===== */}
        {isCxoSecretary && (
          <>
        {/* Scenario 7: Incoming from external to CxO office */}
        {form.doc_type === 'INCOMING' && form.source === 'EXTERNAL' && (
          <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20">
            <div className="font-semibold mb-3 text-blue-900 dark:text-blue-300">Scenario 7: External Incoming Letter (From Outside Company to Your CxO Office)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Received Date <span className="text-red-500">*</span></label>
                <input type="date" className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.received_date} onChange={(e)=>update('received_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Company/Agency Name <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.company_office_name} onChange={(e)=>update('company_office_name', e.target.value)} placeholder="e.g., Ministry of Water" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('subject')} <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Scenario 8: Incoming from another CxO office to this CxO office */}
        {form.doc_type === 'INCOMING' && form.source === 'INTERNAL' && (
          <div className="border border-green-200 dark:border-green-800 rounded-xl p-4 bg-green-50 dark:bg-green-900/20">
            <div className="font-semibold mb-3 text-green-900 dark:text-green-300">Scenario 8: Internal Incoming Letter (From Another CxO Office to Your Office)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Received Date <span className="text-red-500">*</span></label>
                <input type="date" className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.received_date} onChange={(e)=>update('received_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">From (Sending CxO Office)</label>
                <MultiSelect options={deptOptions} value={form.co_offices} onChange={(vals)=>update('co_offices', vals)} placeholder="Select sending CxO office" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('subject')} <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Forward To (Other CxO Offices - Optional)</label>
                <MultiSelect options={deptOptions} value={form.directed_offices} onChange={(vals)=>update('directed_offices', vals)} placeholder="Select offices to forward to" />
              </div>
            </div>
          </div>
        )}

        {/* Scenario 9: Outgoing to external from CxO office */}
        {form.doc_type === 'OUTGOING' && form.source === 'EXTERNAL' && (
          <div className="border border-purple-200 dark:border-purple-800 rounded-xl p-4 bg-purple-50 dark:bg-purple-900/20">
            <div className="font-semibold mb-3 text-purple-900 dark:text-purple-300">Scenario 9: External Outgoing Letter (From Your CxO Office to Companies/Agencies)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Written Date <span className="text-red-500">*</span></label>
                <input type="date" className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.written_date} onChange={(e)=>update('written_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">To (Company/Agency Names) <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.company_office_name} onChange={(e)=>update('company_office_name', e.target.value)} placeholder="e.g., Ethiopian Airlines" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('subject')} <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Signature Name</label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.signature_name} onChange={(e)=>update('signature_name', e.target.value)} placeholder="CxO name" />
              </div>
            </div>
          </div>
        )}

        {/* Scenario 10/11: Outgoing from CxO office */}
        {form.doc_type === 'OUTGOING' && form.source === 'INTERNAL' && (
          <div className="border border-orange-200 dark:border-orange-800 rounded-xl p-4 bg-orange-50 dark:bg-orange-900/20">
            <div className="font-semibold mb-3 text-orange-900 dark:text-orange-300">Internal Outgoing Letter (From Your CxO Office)</div>
            <div className="bg-orange-100 dark:bg-orange-900/40 rounded-lg p-3 mb-3 text-sm text-orange-800 dark:text-orange-300">
              <strong>Tip:</strong> Leave &quot;To (CxO Offices)&quot; empty to send to CEO Office (Scenario 10). Select CxO offices to send to other offices (Scenario 11).
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Written Date <span className="text-red-500">*</span></label>
                <input type="date" className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.written_date} onChange={(e)=>update('written_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">To (CxO Offices) <span className="text-xs text-slate-400">Empty = CEO Office</span></label>
                <MultiSelect options={deptOptions} value={form.directed_offices} onChange={(vals)=>update('directed_offices', vals)} placeholder="Leave empty for CEO, or select CxO offices" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('subject')} <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Signature Name</label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.signature_name} onChange={(e)=>update('signature_name', e.target.value)} placeholder="CxO name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">CC (CxO Offices - Optional)</label>
                <MultiSelect options={deptOptions} value={form.co_offices} onChange={(vals)=>update('co_offices', vals)} placeholder="Select offices to CC" />
              </div>
            </div>
          </div>
        )}

        {/* Scenario 12: Memo from CxO to other CxO offices */}
        {form.doc_type === 'MEMO' && form.source === 'INTERNAL' && (
          <div className="border border-teal-200 dark:border-teal-800 rounded-xl p-4 bg-teal-50 dark:bg-teal-900/20">
            <div className="font-semibold mb-3 text-teal-900 dark:text-teal-300">Scenario 12: Memo (From Your CxO Office to Other CxO Offices)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Memo Date <span className="text-red-500">*</span></label>
                <input type="date" className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.memo_date} onChange={(e)=>update('memo_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">To (Destination CxO Offices) <span className="text-red-500">*</span></label>
                <MultiSelect options={deptOptions} value={form.directed_offices} onChange={(vals)=>update('directed_offices', vals)} placeholder="Select destination CxO offices" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('subject')} <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">CC (CxO Offices - Optional)</label>
                <MultiSelect options={deptOptions} value={form.co_offices} onChange={(vals)=>update('co_offices', vals)} placeholder="Select offices to CC" />
              </div>
            </div>
          </div>
        )}

        {/* Scenario 13: Memo from CxO to CEO */}
        {form.doc_type === 'MEMO' && form.source === 'EXTERNAL' && (
          <div className="border border-amber-200 dark:border-amber-800 rounded-xl p-4 bg-amber-50 dark:bg-amber-900/20">
            <div className="font-semibold mb-3 text-amber-900 dark:text-amber-300">Scenario 13: Memo (From Your CxO Office to CEO Office)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Memo Date <span className="text-red-500">*</span></label>
                <input type="date" className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.memo_date} onChange={(e)=>update('memo_date', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('subject')} <span className="text-red-500">*</span></label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.subject} onChange={(e)=>update('subject', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Signature Name</label>
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full bg-white dark:bg-slate-700 dark:text-white" value={form.signature_name} onChange={(e)=>update('signature_name', e.target.value)} placeholder="CxO name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">CC (CxO Offices - Optional)</label>
                <MultiSelect options={deptOptions} value={form.co_offices} onChange={(vals)=>update('co_offices', vals)} placeholder="Select offices to CC" />
              </div>
            </div>
          </div>
        )}
          </>
        )}
        {/* ===== SHARED FIELDS (all scenarios) ===== */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Additional Details</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">Priority</label>
              <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white" value={form.priority} onChange={(e)=>update('priority', e.target.value)}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">Confidentiality</label>
              <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white" value={form.confidentiality} onChange={(e)=>update('confidentiality', e.target.value)}>
                <option value="REGULAR">Regular</option>
                <option value="CONFIDENTIAL">Confidential</option>
                <option value="SECRET">Secret</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">Due Date</label>
              <input type="date" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white" value={form.due_date} onChange={(e)=>update('due_date', e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1 dark:text-white">Summary / Description</label>
            <textarea className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white" rows={3} value={form.summary} onChange={(e)=>update('summary', e.target.value)} placeholder="Brief summary or additional notes about this document" />
          </div>
        </div>

        <div>
          <label className="text-sm mb-1 flex items-center gap-1 dark:text-white">
            <Paperclip className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            {t('attachments')}
          </label>
          <input type="file" multiple onChange={(e)=>setFiles(Array.from(e.target.files))} className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 dark:hover:file:bg-slate-600" />
          {files.length > 0 && (
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{files.length} file(s) selected</div>
          )}
        </div>
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#0B3C5D] dark:bg-[#F0B429] text-white dark:text-[#0B3C5D] px-4 py-2.5 font-medium shadow-sm hover:bg-[#09324F] dark:hover:bg-[#D9A020] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0B429] disabled:opacity-70 disabled:cursor-not-allowed" type="submit">
          <Save className="w-4 h-4" />
          {t('save')}
        </button>
      </form>
      )}
    </div>
  )
}
