import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const PaymentList = () => {
  const { t } = useTranslation()
  const { user, isCeoSecretary, isCeo } = useAuth()
  const toast = useToast()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRegistration, setShowRegistration] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    payment_type: '',
    priority: ''
  })
  const [registrationForm, setRegistrationForm] = useState({
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
    priority: 'NORMAL'
  })

  useEffect(() => {
    fetchPayments()
  }, [filters])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      
      const response = await api.get(`/api/payments/payments/?${params.toString()}`)
      setPayments(response.data.results || response.data)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const handleRegistration = async () => {
    try {
      const response = await api.post('/api/payments/payments/', registrationForm)
      toast.success('Payment registered successfully')
      setShowRegistration(false)
      setRegistrationForm({
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
        priority: 'NORMAL'
      })
      fetchPayments()
    } catch (error) {
      console.error('Error registering payment:', error)
      toast.error('Failed to register payment')
    }
  }

  const statusColors = {
    'ARRIVED': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'REGISTERED': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    'PENDING_CEO': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    'APPROVED': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    'REJECTED': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  }

  const priorityColors = {
    'LOW': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    'NORMAL': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'HIGH': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    'URGENT': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
            <span className="text-indigo-600 dark:text-indigo-400">💰</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold dark:text-white">Financial Payments</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Manage payment approvals and tracking
            </div>
          </div>
        </div>
        {isCeoSecretary && (
          <button 
            onClick={() => setShowRegistration(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2"
          >
            <span>➕</span>
            Register Payment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Status</label>
            <select
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              <option value="ARRIVED">Arrived</option>
              <option value="REGISTERED">Registered</option>
              <option value="PENDING_CEO">Pending CEO</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Payment Type</label>
            <select
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
              value={filters.payment_type}
              onChange={(e) => setFilters(prev => ({ ...prev, payment_type: e.target.value }))}
            >
              <option value="">All Types</option>
              <option value="INVOICE">Invoice</option>
              <option value="EXPENSE">Expense</option>
              <option value="SALARY">Salary</option>
              <option value="CONTRACT">Contract</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Priority</label>
            <select
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-slate-500 dark:text-slate-400">Loading payments...</div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-500 dark:text-slate-400">No payments found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Reference</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Vendor</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Amount</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Type</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Status</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Priority</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-4">
                      <div className="font-medium dark:text-white">{payment.ref_no || 'Unregistered'}</div>
                      {payment.tt_number && (
                        <div className="text-sm text-slate-500 dark:text-slate-400">TT: {payment.tt_number}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium dark:text-white">{payment.vendor_name}</div>
                      {payment.invoice_number && (
                        <div className="text-sm text-slate-500 dark:text-slate-400">Inv: {payment.invoice_number}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium dark:text-white">
                        {payment.amount} {payment.currency}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {payment.payment_type_display}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[payment.status]}`}>
                        {payment.status_display}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[payment.priority]}`}>
                        {payment.priority_display}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold dark:text-white">Register New Payment</h2>
                <button
                  onClick={() => setShowRegistration(false)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Reference Number</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.ref_no}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, ref_no: e.target.value }))}
                    placeholder="Enter reference number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">TT Number (Optional)</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.tt_number}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, tt_number: e.target.value }))}
                    placeholder="Enter TT number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Arrival Date</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.arrival_date}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, arrival_date: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Amount</label>
                  <input
                    type="number"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.amount}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Currency</label>
                  <select
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.currency}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, currency: e.target.value }))}
                  >
                    <option value="ETB">ETB</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Payment Type</label>
                  <select
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.payment_type}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, payment_type: e.target.value }))}
                  >
                    <option value="INVOICE">Invoice</option>
                    <option value="EXPENSE">Expense</option>
                    <option value="SALARY">Salary</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Vendor Name</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.vendor_name}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, vendor_name: e.target.value }))}
                    placeholder="Enter vendor name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Invoice Number</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.invoice_number}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                    placeholder="Enter invoice number"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 dark:text-white">Description</label>
                  <textarea
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.description}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Payment Date</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.payment_date}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, payment_date: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Due Date</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.due_date}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 dark:text-white">Priority</label>
                  <select
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.priority}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowRegistration(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegistration}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Register Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentList
