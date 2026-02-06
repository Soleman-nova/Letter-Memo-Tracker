import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { FileText, ArrowLeft, Paperclip, Inbox, Send, FileStack } from 'lucide-react'

export default function DocumentDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const [doc, setDoc] = useState(null)

  useEffect(() => {
    api.get(`/api/documents/documents/${id}/`).then(r => setDoc(r.data))
  }, [id])

  const getTypeIcon = (type) => {
    switch (type) {
      case 'INCOMING': return Inbox
      case 'OUTGOING': return Send
      case 'MEMO': return FileStack
      default: return FileText
    }
  }

  if (!doc) return <div className="p-4">Loading...</div>
  
  const TypeIcon = getTypeIcon(doc.doc_type)
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#0B3C5D] flex items-center justify-center">
            <TypeIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{doc.ref_no}</h1>
            <div className="text-sm text-slate-500">{doc.doc_type} · {doc.status}</div>
          </div>
        </div>
        <Link to="/documents" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" />
          Back to list
        </Link>
      </div>

      {/* Details by type */}
      {doc.doc_type === 'INCOMING' && (
        <div className="bg-white rounded-xl shadow border border-slate-200 p-4">
          <div className="font-semibold mb-3 flex items-center gap-2">
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
        <div className="bg-white rounded-xl shadow border border-slate-200 p-4">
          <div className="font-semibold mb-3 flex items-center gap-2">
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
        <div className="bg-white rounded-xl shadow border border-slate-200 p-4">
          <div className="font-semibold mb-3 flex items-center gap-2">
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

      {/* Attachments */}
      <div className="bg-white rounded-xl shadow border border-slate-200 p-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-slate-500" />
          {t('attachments')}
        </h2>
        {doc.attachments?.length ? (
          <div className="space-y-2">
            {doc.attachments.map(a => (
              <a key={a.id} className="flex items-center gap-2 text-blue-700 hover:underline text-sm" href={a.file} target="_blank" rel="noreferrer">
                <Paperclip className="w-3.5 h-3.5" />
                {a.original_name}
              </a>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">No attachments</div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, full }) {
  if (!value) return null
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  )
}

function Chips({ label, values, full }) {
  if (!values || !values.length) return null
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="flex flex-wrap gap-1">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center rounded bg-slate-200 px-2 py-0.5 text-xs">{v}</span>
        ))}
      </div>
    </div>
  )
}
