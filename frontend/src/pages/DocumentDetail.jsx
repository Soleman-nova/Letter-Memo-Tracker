import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { FileText, ArrowLeft, Paperclip, Inbox, Send, FileStack, Edit, CheckCircle, Truck, Eye, Clock, Users } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import EthDateDisplay, { formatEthiopianDate } from '../components/EthDateDisplay'

export default function DocumentDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)
  const [receiving, setReceiving] = useState(false)
  const toast = useToast()

  const fetchDoc = (showLoading = false) => {
    if (showLoading) setLoading(true)
    setError(null)
    api.get(`/api/documents/documents/${id}/`)
      .then(r => setDoc(r.data))
      .catch(e => {
        console.error('Failed to load document:', e)
        setError(e.response?.status === 404 ? 'Document not found' : 'Failed to load document')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDoc(true)
  }, [id])

  const updateStatus = async (newStatus) => {
    setUpdating(true)
    try {
      await api.post(`/api/documents/documents/${id}/update_status/`, { status: newStatus })
      toast.success(`Status updated to ${newStatus}`)
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
      toast.success('Document acknowledged')
      fetchDoc()
    } catch (e) {
      console.error('Failed to acknowledge:', e)
      toast.error(toast.parseApiError(e))
    } finally {
      setAcknowledging(false)
    }
  }

  const markAsReceived = async () => {
    setReceiving(true)
    try {
      await api.post(`/api/documents/documents/${id}/mark_received/`)
      toast.success('Document marked as received')
      fetchDoc()
    } catch (e) {
      console.error('Failed to mark as received:', e)
      toast.error(toast.parseApiError(e))
    } finally {
      setReceiving(false)
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

  if (loading) return (
    <div className="p-8 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#0B3C5D] dark:border-slate-600 dark:border-t-[#F0B429]" />
      <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('loading_document')}</div>
    </div>
  )
  if (error) return (
    <div className="p-8 text-center">
      <div className="text-red-500 dark:text-red-400 font-medium">{error}</div>
      <button onClick={() => navigate('/documents')} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">{t('documents')}</button>
    </div>
  )
  if (!doc) return null
  
  const TypeIcon = getTypeIcon(doc.doc_type)
  const scenario = doc.scenario || 0
  const role = user?.profile?.role
  const userDeptId = user?.profile?.department?.id
  // Can edit: CEO Secretary/Super Admin can edit all; CxO Secretary can edit their dept's docs
  const canEdit = role === 'SUPER_ADMIN' || role === 'CEO_SECRETARY' || 
    (role === 'CXO_SECRETARY' && userDeptId && (
      doc.department === userDeptId || 
      doc.co_offices?.includes(userDeptId) || 
      doc.directed_offices?.includes(userDeptId)
    ))

  // Scenario labels
  const scenarioLabels = {
    1: t('scenario_1'),
    2: t('scenario_2'),
    3: t('scenario_3'),
    4: t('scenario_4'),
    5: t('scenario_5'),
    6: t('scenario_6'),
    7: t('scenario_7'),
    8: t('scenario_8'),
    9: t('scenario_9'),
    10: t('scenario_10'),
    11: t('scenario_11'),
    12: t('scenario_12'),
    13: t('scenario_13'),
    14: t('scenario_14'),
  }

  // Scenarios that need dispatch by registering secretary
  const needsDispatch = [1, 2, 4, 6, 8, 11, 12, 14]
  // Scenarios that need CEO direction (S1, S2, S14)
  const needsCeoDirection = [1, 2, 14]
  // Scenarios with no direction needed - dispatch directly from REGISTERED
  const directDispatch = [4, 6, 8, 11, 12]
  // S5 can optionally dispatch if directed_offices are set
  const s5HasDirected = scenario === 5 && doc.directed_office_names?.length > 0
  // Scenarios with no receipt/dispatch needed
  const noReceipt = [3, 9]
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#0B3C5D] dark:bg-[#F0B429] flex items-center justify-center">
            <TypeIcon className="w-5 h-5 text-white dark:text-[#0B3C5D]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold dark:text-white">{doc.ref_no}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {doc.doc_type} · <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(doc.status)}`}>{doc.status}</span>
              {doc.department_code && <span className="ml-2 text-xs">({doc.department_code})</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* S1, S2: CEO Direction needed first */}
          {doc.status === 'REGISTERED' && needsCeoDirection.includes(scenario) && 
           (role === 'CEO_SECRETARY' || role === 'SUPER_ADMIN') && (
            <Link to={`/documents/${id}/edit`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-blue-700">
              <Edit className="w-4 h-4" />
              {t('add_ceo_direction')}
            </Link>
          )}
          {/* S1, S2: After direction, dispatch */}
          {doc.status === 'DIRECTED' && needsCeoDirection.includes(scenario) &&
           (role === 'CEO_SECRETARY' || role === 'SUPER_ADMIN') && (
            <button onClick={() => updateStatus('DISPATCHED')} disabled={updating} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-orange-700 disabled:opacity-50">
              <Truck className="w-4 h-4" />
              {updating ? t('dispatching') : t('dispatch_to_cxo')}
            </button>
          )}
          {/* Direct dispatch scenarios (no direction needed) - by the registering secretary */}
          {doc.status === 'REGISTERED' && directDispatch.includes(scenario) &&
            (([4, 6].includes(scenario) && (role === 'CEO_SECRETARY' || role === 'SUPER_ADMIN')) ||
             ([8, 11, 12].includes(scenario) && role === 'CXO_SECRETARY')) && (
            <button onClick={() => updateStatus('DISPATCHED')} disabled={updating} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-orange-700 disabled:opacity-50">
              <Truck className="w-4 h-4" />
              {updating ? t('dispatching') : t('dispatch')}
            </button>
          )}
          {/* S5: Dispatch forwarded memo to directed offices */}
          {doc.status === 'REGISTERED' && s5HasDirected &&
           (role === 'CEO_SECRETARY' || role === 'SUPER_ADMIN') && (
            <button onClick={() => updateStatus('DISPATCHED')} disabled={updating} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-orange-700 disabled:opacity-50">
              <Truck className="w-4 h-4" />
              {updating ? t('dispatching') : t('dispatch_memo')}
            </button>
          )}
          {/* Mark as Received - driven by backend user_can_receive */}
          {doc.user_can_receive && (
            <button onClick={markAsReceived} disabled={receiving} className="inline-flex items-center gap-2 rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-green-700 disabled:opacity-50">
              <CheckCircle className="w-4 h-4" />
              {receiving ? t('updating') : t('mark_received')}
            </button>
          )}
          {/* Mark as Seen (CC acknowledgment) - driven by backend user_can_acknowledge */}
          {doc.user_can_acknowledge && (
            <button onClick={acknowledgeDocument} disabled={acknowledging} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-emerald-700 disabled:opacity-50">
              <Eye className="w-4 h-4" />
              {acknowledging ? t('updating') : t('mark_seen')}
            </button>
          )}
          {/* Post-receive workflow: Mark In Progress */}
          {doc.status === 'RECEIVED' && canEdit && (
            <button onClick={() => updateStatus('IN_PROGRESS')} disabled={updating} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-purple-700 disabled:opacity-50">
              <Clock className="w-4 h-4" />
              {updating ? t('updating') : t('mark_in_progress')}
            </button>
          )}
          {/* Post-receive workflow: Mark Responded */}
          {doc.status === 'IN_PROGRESS' && canEdit && (
            <button onClick={() => updateStatus('RESPONDED')} disabled={updating} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-teal-700 disabled:opacity-50">
              <Send className="w-4 h-4" />
              {updating ? t('updating') : t('mark_responded')}
            </button>
          )}
          {/* Close document - available from RECEIVED, IN_PROGRESS, RESPONDED */}
          {['RECEIVED', 'IN_PROGRESS', 'RESPONDED'].includes(doc.status) && canEdit && (
            <button onClick={() => updateStatus('CLOSED')} disabled={updating} className="inline-flex items-center gap-2 rounded-lg bg-gray-600 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-700 disabled:opacity-50">
              <FileText className="w-4 h-4" />
              {updating ? t('updating') : t('close')}
            </button>
          )}
          {/* Close for register-only scenarios (S3, S9) */}
          {doc.status === 'REGISTERED' && noReceipt.includes(scenario) && canEdit && (
            <button onClick={() => updateStatus('CLOSED')} disabled={updating} className="inline-flex items-center gap-2 rounded-lg bg-gray-600 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-700 disabled:opacity-50">
              <FileText className="w-4 h-4" />
              {updating ? t('updating') : t('close')}
            </button>
          )}
          <Link to="/documents" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
            <ArrowLeft className="w-4 h-4" />
            {t('documents')}
          </Link>
        </div>
      </div>

      {/* Document Details Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
        <div className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
          <TypeIcon className="w-4 h-4 text-[#F0B429]" />
          {scenarioLabels[scenario] || `${doc.doc_type} - ${doc.source}`}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Date fields based on doc_type */}
          {doc.doc_type === 'INCOMING' && <Field label={t('received_date')} value={doc.received_date} isDate />}
          {doc.doc_type === 'OUTGOING' && <Field label={t('written_date')} value={doc.written_date} isDate />}
          {doc.doc_type === 'MEMO' && <Field label={t('memo_date')} value={doc.memo_date} isDate />}
          
          {/* Company name for external scenarios (S1, S3, S7, S9) */}
          {doc.company_office_name && (
            <Field label={[1, 7].includes(scenario) ? t('from') + ' (' + t('company_office_name') + ')' : t('to') + ' (' + t('company_office_name') + ')'} value={doc.company_office_name} />
          )}
          
          {/* Originating department for CxO scenarios (S7-S13) */}
          {doc.department_name && (
            <Field label={t('office')} value={`${doc.department_code} - ${doc.department_name}`} />
          )}
          
          {/* co_offices: meaning depends on scenario */}
          {doc.co_office_names?.length > 0 && (
            <Chips 
              label={
                [2, 5].includes(scenario) ? t('from_office_cxo') :
                [8].includes(scenario) ? t('from_sending_cxo') :
                t('cc_cxo_optional')
              } 
              values={doc.co_office_names} 
            />
          )}
          
          {/* Directed offices: meaning depends on scenario */}
          {doc.directed_office_names?.length > 0 && (
            <Chips 
              label={
                [1, 5].includes(scenario) ? t('direct_to_cxo') :
                [4, 6, 11, 12].includes(scenario) ? t('to_cxo_offices') :
                [8].includes(scenario) ? t('forward_to_cxo') :
                t('directed_office')
              } 
              values={doc.directed_office_names} 
            />
          )}

          {/* S10, S13: destination is CEO Office (no directed_offices) */}
          {[10, 13].includes(scenario) && !doc.directed_office_names?.length && (
            <Field label={t('to')} value="CEO Office" />
          )}
          
          {/* Subject */}
          <Field label={t('subject')} value={doc.subject} full />
          
          {/* Summary */}
          <Field label={t('summary')} value={doc.summary} full />
          
          {/* CEO direction fields (for S1 and S2) */}
          {needsCeoDirection.includes(scenario) && (
            <>
              <Field label={t('ceo_directed_date')} value={doc.ceo_directed_date} isDate />
              <Field label={t('ceo_note')} value={doc.ceo_note} full />
            </>
          )}
          
          {/* Priority & Confidentiality */}
          {doc.priority && doc.priority !== 'NORMAL' && (
            <Field label={t('priority')} value={<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              doc.priority === 'URGENT' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
              doc.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
              'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
            }`}>{doc.priority}</span>} />
          )}
          {doc.confidentiality && doc.confidentiality !== 'REGULAR' && (
            <Field label={t('confidentiality')} value={<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              doc.confidentiality === 'SECRET' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
              'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            }`}>{doc.confidentiality}</span>} />
          )}
          
          {/* CC External Names (S3, S9) */}
          {doc.cc_external_names && (
            <Field label={t('cc_external_names')} value={doc.cc_external_names} full />
          )}
          
          {/* Due date */}
          <Field label={t('due_date')} value={doc.due_date} isDate />
          
          {/* Signature */}
          <Field label={t('signature_name')} value={doc.signature_name} />
        </div>
      </div>

      {/* Receipt Status - for all scenarios that need receipt */}
      {!noReceipt.includes(scenario) && (doc.receipts?.length > 0 || doc.pending_receipts?.length > 0) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
            <Truck className="w-4 h-4 text-[#0B3C5D] dark:text-[#F0B429]" />
            {t('delivery_status')}
          </h2>
          <div className="space-y-3">
            {doc.receipts?.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  {t('received')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {doc.receipts.map(receipt => {
                    const ceoReceiveScenarios = [5, 10, 13]
                    const displayName = ceoReceiveScenarios.includes(scenario) ? t('ceo_office') : (receipt.department_code || receipt.department_name)
                    return (
                    <div key={receipt.id} className="inline-flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1.5">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <div>
                        <div className="text-sm font-medium text-green-800 dark:text-green-300">{displayName}</div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          by {receipt.received_by_name} · <EthDateDisplay date={receipt.received_at} inline className="inline" />
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </div>
            )}
            {doc.pending_receipts?.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  {t('pending_receipt')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {doc.pending_receipts.map(dept => (
                    <div key={dept.id} className="inline-flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-3 py-1.5">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">{dept.code || dept.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {doc.receipts?.length > 0 && doc.pending_receipts?.length === 0 && (
              <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {t('all_received')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Acknowledgment Status (Mark as Seen) - for scenarios with CC offices */}
      {doc.co_office_names?.length > 0 && (doc.acknowledgments?.length > 0 || doc.pending_acknowledgments?.length > 0) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
            <Users className="w-4 h-4 text-[#F0B429]" />
            {t('cc_acknowledgments')}
          </h2>
          <div className="space-y-3">
            {doc.acknowledgments?.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  {t('seen')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {doc.acknowledgments.map(ack => (
                    <div key={ack.id} className="inline-flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1.5">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <div>
                        <div className="text-sm font-medium text-green-800 dark:text-green-300">{ack.department_code || ack.department_name}</div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          by {ack.acknowledged_by_name} · <EthDateDisplay date={ack.acknowledged_at} inline className="inline" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {doc.pending_acknowledgments?.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  {t('pending_docs')}
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
            {doc.acknowledgments?.length > 0 && doc.pending_acknowledgments?.length === 0 && (
              <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {t('all_seen')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workflow Status Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
          <Clock className="w-4 h-4 text-[#0B3C5D] dark:text-[#F0B429]" />
          {t('workflow_progress')}
        </h2>
        {(() => {
          // Build expected steps per scenario
          const steps = {
            1: ['REGISTERED', 'DIRECTED', 'DISPATCHED', 'RECEIVED'],
            2: ['REGISTERED', 'DIRECTED', 'DISPATCHED', 'RECEIVED'],
            3: ['REGISTERED'],
            4: ['REGISTERED', 'DISPATCHED', 'RECEIVED'],
            5: s5HasDirected ? ['REGISTERED', 'DISPATCHED', 'RECEIVED'] : ['REGISTERED', 'RECEIVED'],
            6: ['REGISTERED', 'DISPATCHED', 'RECEIVED'],
            7: ['REGISTERED', 'RECEIVED'],
            8: ['REGISTERED', 'DISPATCHED', 'RECEIVED'],
            9: ['REGISTERED'],
            10: ['REGISTERED', 'RECEIVED'],
            11: ['REGISTERED', 'DISPATCHED', 'RECEIVED'],
            12: ['REGISTERED', 'DISPATCHED', 'RECEIVED'],
            13: ['REGISTERED', 'RECEIVED'],
            14: ['REGISTERED', 'DIRECTED', 'DISPATCHED', 'RECEIVED'],
          }
          const stepLabels = {
            REGISTERED: t('registered'),
            DIRECTED: t('directed'),
            DISPATCHED: t('dispatched'),
            RECEIVED: t('received'),
          }
          const flow = steps[scenario] || ['REGISTERED']
          const currentIdx = flow.indexOf(doc.status)
          return (
            <div className="flex items-center gap-1 flex-wrap">
              {flow.map((step, i) => {
                const done = i <= currentIdx && currentIdx >= 0
                const isCurrent = step === doc.status
                return (
                  <React.Fragment key={step}>
                    {i > 0 && <div className={`w-8 h-0.5 ${done ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-600'}`} />}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      done ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                      'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    } ${isCurrent ? 'ring-2 ring-green-400 dark:ring-green-500' : ''}`}>
                      {done ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {stepLabels[step] || step}
                    </div>
                  </React.Fragment>
                )
              })}
              {/* Show extra statuses beyond the standard flow */}
              {['IN_PROGRESS', 'RESPONDED', 'CLOSED'].includes(doc.status) && (
                <>
                  <div className="w-8 h-0.5 bg-green-400" />
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 ring-2 ring-green-400 dark:ring-green-500">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {doc.status === 'IN_PROGRESS' ? t('in_progress') : doc.status === 'RESPONDED' ? t('responded') : t('closed')}
                  </div>
                </>
              )}
            </div>
          )
        })()}
      </div>

      {/* Attachments */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
          <Paperclip className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          {t('attachments')}
        </h2>
        {doc.attachments?.length ? (
          <div className="space-y-2">
            {doc.attachments.map(a => (
              <a key={a.id} className="flex items-center gap-2 text-blue-700 dark:text-blue-400 hover:underline text-sm" href={a.file?.startsWith('http') ? a.file : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${a.file}`} target="_blank" rel="noreferrer">
                <Paperclip className="w-3.5 h-3.5" />
                {a.original_name}
              </a>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500 dark:text-slate-400">{t('no_attachments')}</div>
        )}
      </div>

      {/* Activity Log */}
      {doc.activities?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
            <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            {t('activity_log')}
          </h2>
          <div className="space-y-2">
            {doc.activities.map(act => (
              <div key={act.id} className="flex items-start gap-3 text-sm border-l-2 border-slate-200 dark:border-slate-600 pl-3 py-1">
                <div className="flex-1">
                  <span className="font-medium dark:text-white">{act.action}</span>
                  {act.notes && <span className="text-slate-500 dark:text-slate-400 ml-1">— {act.notes}</span>}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {act.actor_name && <span>{act.actor_name} · </span>}
                  <EthDateDisplay date={act.created_at} includeTime inline className="inline" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const DATE_FIELD_LABELS = ['Received Date', 'Written Date', 'Memo Date', 'CEO Directed Date', 'Due Date']

function Field({ label, value, full, isDate = false }) {
  if (!value) return null
  const isDateField = isDate || DATE_FIELD_LABELS.includes(label)
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      {isDateField ? (
        <div className="text-sm dark:text-white"><EthDateDisplay date={value} /></div>
      ) : (
        <div className="text-sm dark:text-white">{value}</div>
      )}
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
