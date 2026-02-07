import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { FileText, ArrowLeft, Paperclip, Inbox, Send, FileStack, Edit, CheckCircle, Truck, Eye, Clock, Users } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

export default function DocumentDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)
  const toast = useToast()

  const fetchDoc = () => {
    api.get(`/api/documents/documents/${id}/`).then(r => setDoc(r.data))
  }

  useEffect(() => {
    fetchDoc()
  }, [id])

  const updateStatus = async (newStatus) => {
    setUpdating(true)
    try {
      await api.post(`/api/documents/documents/${id}/update_status/`, { status: newStatus })
      fetchDoc()
    } catch (e) {
      console.error('Failed to update status:', e)
      toast.error(toast.parseApiError(e))
    } finally {
      setUpdating(false)
    }
  }

  const acknowledgeDocument = async () => {
    setAcknowledging(true)
    try {
      await api.post(`/api/documents/documents/${id}/acknowledge/`)
      fetchDoc()
    } catch (e) {
      console.error('Failed to acknowledge:', e)
      toast.error(toast.parseApiError(e))
    } finally {
      setAcknowledging(false)
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'INCOMING': return Inbox
      case 'OUTGOING': return Send
      case 'MEMO': return FileStack
      default: return FileText
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'REGISTERED': return 'bg-slate-100 text-slate-700'
      case 'DIRECTED': return 'bg-blue-100 text-blue-700'
      case 'DISPATCHED': return 'bg-orange-100 text-orange-700'
      case 'RECEIVED': return 'bg-green-100 text-green-700'
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-700'
      case 'RESPONDED': return 'bg-teal-100 text-teal-700'
      case 'CLOSED': return 'bg-gray-100 text-gray-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  if (!doc) return <div className="p-4 dark:text-white">Loading...</div>
  
  const TypeIcon = getTypeIcon(doc.doc_type)
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#0B3C5D] dark:bg-[#F0B429] flex items-center justify-center">
            <TypeIcon className="w-5 h-5 text-white dark:text-[#0B3C5D]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold dark:text-white">{doc.ref_no}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400">{doc.doc_type} · <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(doc.status)}`}>{doc.status}</span></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Workflow action buttons based on status */}
          {doc.status === 'REGISTERED' && (
            <Link to={`/documents/${id}/edit`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-blue-700">
              <Edit className="w-4 h-4" />
              Add CEO Direction
            </Link>
          )}
          {doc.status === 'DIRECTED' && (
            <button onClick={() => updateStatus('DISPATCHED')} disabled={updating} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-orange-700 disabled:opacity-50">
              <Truck className="w-4 h-4" />
              Mark as Dispatched
            </button>
          )}
          {doc.status === 'DISPATCHED' && (
            <button onClick={() => updateStatus('RECEIVED')} disabled={updating} className="inline-flex items-center gap-2 rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-green-700 disabled:opacity-50">
              <CheckCircle className="w-4 h-4" />
              Confirm Receipt
            </button>
          )}
          {doc.user_can_acknowledge && (
            <button onClick={acknowledgeDocument} disabled={acknowledging} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-emerald-700 disabled:opacity-50">
              <Eye className="w-4 h-4" />
              {acknowledging ? 'Acknowledging...' : 'Mark as Seen'}
            </button>
          )}
          <Link to="/documents" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
            <ArrowLeft className="w-4 h-4" />
            Back to list
          </Link>
        </div>
      </div>

      {/* Details by type */}
      {doc.doc_type === 'INCOMING' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
          <div className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
            <Inbox className="w-4 h-4 text-[#F0B429]" />
            {t('outside_incoming')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={t('received_letter_date')} value={doc.received_date} />
            {doc.company_office_name && (
              <Field label={t('company_office_name')} value={doc.company_office_name} />
            )}
            <Chips label={t('co_office')} values={doc.co_office_names} />
            <Field label={t('subject')} value={doc.subject} full />
            <Field label={t('ceo_directed_date')} value={doc.ceo_directed_date} />
            <Chips label={t('directed_office')} values={doc.directed_office_names} />
            <Field label={t('ceo_note')} value={doc.ceo_note} full />
            <Field label={t('signature')} value={doc.signature_name} />
          </div>
        </div>
      )}

      {doc.doc_type === 'MEMO' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
          <div className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
            <FileStack className="w-4 h-4 text-[#F0B429]" />
            {t('internal_incoming')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={t('memo_date')} value={doc.memo_date} />
            <Chips label={t('co_office')} values={doc.co_office_names} />
            <Field label={t('subject')} value={doc.subject} full />
            <Field label={t('ceo_directed_date')} value={doc.ceo_directed_date} />
            <Chips label={t('directed_office')} values={doc.directed_office_names} />
            <Field label={t('ceo_note')} value={doc.ceo_note} full />
            <Field label={t('signature')} value={doc.signature_name} />
          </div>
        </div>
      )}

      {doc.doc_type === 'OUTGOING' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
          <div className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
            <Send className="w-4 h-4 text-[#0A4C86]" />
            {t('outside_outgoing')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={t('written_date')} value={doc.written_date} />
            {doc.company_office_name && (
              <Field label={t('company_office_name')} value={doc.company_office_name} />
            )}
            <Chips label={t('co_office')} values={doc.co_office_names} />
            <Field label={t('subject')} value={doc.subject} full />
            <Field label={t('signature')} value={doc.signature_name} />
          </div>
        </div>
      )}

      {/* Acknowledgment Status for Outgoing Letters */}
      {doc.doc_type === 'OUTGOING' && doc.co_office_names?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
            <Users className="w-4 h-4 text-[#F0B429]" />
            CC Office Acknowledgments
          </h2>
          <div className="space-y-3">
            {/* Acknowledged */}
            {doc.acknowledgments?.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Acknowledged
                </div>
                <div className="flex flex-wrap gap-2">
                  {doc.acknowledgments.map(ack => (
                    <div key={ack.id} className="inline-flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1.5">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <div>
                        <div className="text-sm font-medium text-green-800 dark:text-green-300">{ack.department_code || ack.department_name}</div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          by {ack.acknowledged_by_name} · {new Date(ack.acknowledged_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Pending */}
            {doc.pending_acknowledgments?.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  Pending
                </div>
                <div className="flex flex-wrap gap-2">
                  {doc.pending_acknowledgments.map(dept => (
                    <div key={dept.id} className="inline-flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-3 py-1.5">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">{dept.code || dept.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* All acknowledged */}
            {doc.acknowledgments?.length > 0 && doc.pending_acknowledgments?.length === 0 && (
              <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                All CC offices have acknowledged this document
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attachments */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
          <Paperclip className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          {t('attachments')}
        </h2>
        {doc.attachments?.length ? (
          <div className="space-y-2">
            {doc.attachments.map(a => (
              <a key={a.id} className="flex items-center gap-2 text-blue-700 dark:text-blue-400 hover:underline text-sm" href={a.file} target="_blank" rel="noreferrer">
                <Paperclip className="w-3.5 h-3.5" />
                {a.original_name}
              </a>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500 dark:text-slate-400">No attachments</div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, full }) {
  if (!value) return null
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-sm dark:text-white">{value}</div>
    </div>
  )
}

function Chips({ label, values, full }) {
  if (!values || !values.length) return null
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="flex flex-wrap gap-1">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center rounded bg-slate-200 dark:bg-slate-600 px-2 py-0.5 text-xs dark:text-white">{v}</span>
        ))}
      </div>
    </div>
  )
}
