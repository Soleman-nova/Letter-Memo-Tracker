import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import EthiopianDateInput from '../components/EthiopianDateInput'
import toast from 'react-hot-toast'

const PaymentApproval = ({ paymentId, onApprovalComplete }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [payment, setPayment] = useState(null)
  const [form, setForm] = useState({
    status: 'APPROVED',
    ceo_notes: '',
  })

  useEffect(() => {
    if (paymentId) {
      fetchPayment()
    }
  }, [paymentId])

  const fetchPayment = async () => {
    try {
      const response = await api.get(`/api/payments/payments/${paymentId}/`)
      setPayment(response.data)
    } catch (error) {
      console.error('Error fetching payment:', error)
      toast.error('Failed to load payment details')
    }
  }

  const update = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await api.post(`/api/payments/payments/${paymentId}/approve/`, form)
      toast.success(`Payment ${form.status.toLowerCase()} successfully!`)
      
      if (onApprovalComplete) {
        onApprovalComplete(response.data)
      }
      
    } catch (error) {
      console.error('Approval error:', error)
      toast.error(error.response?.data?.detail || 'Failed to process approval')
    } finally {
      setLoading(false)
    }
  }

  if (!payment) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
        <div className="text-center py-8">
          <div className="text-slate-500 dark:text-slate-400">Loading payment details...</div>
        </div>
      </div>
    )
  }

  const statusColors = {
    'ARRIVED': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'REGISTERED': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    'PENDING_CEO': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    'APPROVED': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    'REJECTED': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
          <span className="text-purple-600 dark:text-purple-400">👑</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold dark:text-white">CEO Approval</h1>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Review and approve payment request
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="border border-slate-200 dark:border-slate-600 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/20 mb-6">
        <div className="font-semibold mb-3 text-slate-900 dark:text-slate-300">📄 Payment Details</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Reference:</span>
            <div className="font-medium dark:text-white">{payment.ref_no || 'Not registered'}</div>
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400">TT Number:</span>
            <div className="font-medium dark:text-white">{payment.tt_number || 'N/A'}</div>
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Vendor:</span>
            <div className="font-medium dark:text-white">{payment.vendor_name}</div>
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Amount:</span>
            <div className="font-medium dark:text-white">
              {payment.amount} {payment.currency}
            </div>
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Payment Type:</span>
            <div className="font-medium dark:text-white">{payment.payment_type_display}</div>
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Current Status:</span>
            <div className="font-medium">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[payment.status]}`}>
                {payment.status_display}
              </span>
            </div>
          </div>
          <div className="md:col-span-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Description:</span>
            <div className="font-medium dark:text-white mt-1">{payment.description}</div>
          </div>
        </div>
      </div>

      {/* Approval Form */}
      <form onSubmit={submit} className="space-y-6">
        <div className="border border-purple-200 dark:border-purple-800 rounded-xl p-4 bg-purple-50 dark:bg-purple-900/20">
          <div className="font-semibold mb-3 text-purple-900 dark:text-purple-300">✍️ CEO Decision</div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 dark:text-white">
              Approval Decision <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="APPROVED"
                  checked={form.status === 'APPROVED'}
                  onChange={(e) => update('status', e.target.value)}
                  className="mr-2"
                />
                <span className="text-green-700 dark:text-green-400 font-medium">✅ Approve</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="REJECTED"
                  checked={form.status === 'REJECTED'}
                  onChange={(e) => update('status', e.target.value)}
                  className="mr-2"
                />
                <span className="text-red-700 dark:text-red-400 font-medium">❌ Reject</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">
              CEO Notes {form.status === 'REJECTED' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              rows={4}
              value={form.ceo_notes}
              onChange={(e) => update('ceo_notes', e.target.value)}
              placeholder={
                form.status === 'APPROVED' 
                  ? "Add approval notes (optional)..."
                  : "Please provide reason for rejection..."
              }
              required={form.status === 'REJECTED'}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setForm({ status: 'APPROVED', ceo_notes: '' })
            }}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2.5 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
              form.status === 'APPROVED' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                {form.status === 'APPROVED' ? (
                  <>
                    <span>✅</span>
                    Approve Payment
                  </>
                ) : (
                  <>
                    <span>❌</span>
                    Reject Payment
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PaymentApproval
