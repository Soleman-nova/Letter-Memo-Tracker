import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import EthiopianDateInput from '../components/EthiopianDateInput'
import toast from 'react-hot-toast'

const PaymentRegistration = ({ onPaymentCreated }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    temp_ref_no: '',
    ref_no: '',
    tt_number: '',
    arrival_date: '',
    amount: '',
    currency: 'ETB',
    payment_type: 'INVOICE',
    vendor_name: '',
    invoice_number: '',
    description: '',
    payment_date: '',
    due_date: '',
    priority: 'NORMAL',
  })

  const currencies = [
    { value: 'ETB', label: 'Ethiopian Birr (ETB)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
  ]

  const paymentTypes = [
    { value: 'INVOICE', label: 'Invoice' },
    { value: 'EXPENSE', label: 'Expense' },
    { value: 'SALARY', label: 'Salary' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'OTHER', label: 'Other' },
  ]

  const priorities = [
    { value: 'LOW', label: 'Low' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ]

  const update = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        arrival_date: form.arrival_date || null,
        due_date: form.due_date || null,
        payment_date: form.payment_date || null,
      }
      
      const response = await api.post('/api/payments/payments/', payload)
      toast.success('Payment registered successfully!')
      
      // Reset form
      setForm({
        temp_ref_no: '',
        ref_no: '',
        tt_number: '',
        arrival_date: '',
        amount: '',
        currency: 'ETB',
        payment_type: 'INVOICE',
        vendor_name: '',
        invoice_number: '',
        description: '',
        payment_date: '',
        due_date: '',
        priority: 'NORMAL',
      })
      
      if (onPaymentCreated) {
        onPaymentCreated(response.data)
      }
      
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.detail || 'Failed to register payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
          <span className="text-blue-600 dark:text-blue-400">💰</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold dark:text-white">Register Payment</h1>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Register incoming payment letter from Finance
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Registration Details */}
        <div className="border border-slate-200 dark:border-slate-600 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/20">
          <div className="font-semibold mb-3 text-slate-900 dark:text-slate-300">📋 Registration Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">
                Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={form.ref_no}
                onChange={(e) => update('ref_no', e.target.value)}
                placeholder="Enter reference number"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">
                TT Number (Optional)
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={form.tt_number}
                onChange={(e) => update('tt_number', e.target.value)}
                placeholder="Enter TT tracking number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">
                Arrival Date <span className="text-red-500">*</span>
              </label>
              <EthiopianDateInput
                value={form.arrival_date}
                onChange={(v) => update('arrival_date', v)}
                placeholder="Date letter arrived at CEO office"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">
                Priority
              </label>
              <select
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={form.priority}
                onChange={(e) => update('priority', e.target.value)}
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="border border-green-200 dark:border-green-800 rounded-xl p-4 bg-green-50 dark:bg-green-900/20">
          <div className="font-semibold mb-3 text-green-900 dark:text-green-300">💳 Payment Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                value={form.amount}
                onChange={(e) => update('amount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">
                Currency
              </label>
              <select
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                value={form.currency}
                onChange={(e) => update('currency', e.target.value)}
              >
                {currencies.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">
                Payment Type
              </label>
              <select
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                value={form.payment_type}
                onChange={(e) => update('payment_type', e.target.value)}
              >
                {paymentTypes.map(pt => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                value={form.vendor_name}
                onChange={(e) => update('vendor_name', e.target.value)}
                placeholder="Enter vendor name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">
                Invoice Number
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                value={form.invoice_number}
                onChange={(e) => update('invoice_number', e.target.value)}
                placeholder="Enter invoice number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <EthiopianDateInput
                value={form.payment_date}
                onChange={(v) => update('payment_date', v)}
                placeholder="Date of payment transaction"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">
                Due Date
              </label>
              <EthiopianDateInput
                value={form.due_date}
                onChange={(v) => update('due_date', v)}
                placeholder="Payment due date (optional)"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1 dark:text-white">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Enter payment description"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setForm({
              ref_no: '',
              tt_number: '',
              arrival_date: '',
              amount: '',
              currency: 'ETB',
              payment_type: 'INVOICE',
              vendor_name: '',
              invoice_number: '',
              description: '',
              payment_date: '',
              due_date: '',
              priority: 'NORMAL',
            })}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Registering...
              </>
            ) : (
              <>
                <span>💰</span>
                Register Payment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PaymentRegistration
