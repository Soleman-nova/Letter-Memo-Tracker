import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Search, Save, Bookmark, X } from 'lucide-react'
import EthiopianDateInput from '../components/EthiopianDateInput'
import EthDateDisplay from '../components/EthDateDisplay'

const PaymentList = () => {
  const { t } = useTranslation()
  const { user, isCeoSecretary, isCeo, isCxoFinance } = useAuth()
  const toast = useToast()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, pageSize: 10 })
  const [editingPayment, setEditingPayment] = useState(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    payment_type: '',
    date_from: '',
    date_to: ''
  })
  const [savedFilters, setSavedFilters] = useState([])
  const [showSaveFilter, setShowSaveFilter] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [vendorNames, setVendorNames] = useState([])
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false)
  const [filteredVendors, setFilteredVendors] = useState([])
  const [registrationForm, setRegistrationForm] = useState({
    temp_ref_no: '',
    ref_no: '',
    registry_date: '',
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
  const [confirmDialog, setConfirmDialog] = useState({ show: false, type: null, payment: null })
  const [historyModal, setHistoryModal] = useState({ show: false, payment: null, history: [] })
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Load saved filters from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('payment_saved_filters')
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading saved filters:', e)
        localStorage.removeItem('payment_saved_filters')
        toast.error('Saved filters were corrupted and have been cleared')
      }
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [filters])

  // Real-time search effect with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPayments()
    }, 300) // 300ms debounce for smooth typing experience

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Check for duplicates when key fields change (with debouncing)
  useEffect(() => {
    if (showRegistration && isCeoSecretary && !editingPayment) {
      const timeoutId = setTimeout(() => {
        const duplicate = checkForDuplicates()
        setDuplicateWarning(duplicate)
      }, 500) // 500ms debounce delay
      
      return () => clearTimeout(timeoutId)
    }
  }, [registrationForm.invoice_number, registrationForm.tt_number, registrationForm.vendor_name, registrationForm.amount])

  // Extract unique vendor names from payments for autocomplete
  useEffect(() => {
    const uniqueVendors = [...new Set(
      payments
        .map(p => p.vendor_name)
        .filter(name => name && name.trim())
    )].sort()
    setVendorNames(uniqueVendors)
  }, [payments])

  const fetchPayments = async (page = pagination.currentPage, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      
      // Add search query to params
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      
      // Add pagination params
      params.append('page', page)
      params.append('page_size', pageSize)
      
      const response = await api.get(`/api/payments/payments/?${params.toString()}`)
      
      // Handle paginated response
      if (response.data.results) {
        setPayments(response.data.results)
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          pageSize: pageSize,
          totalPages: Math.ceil(response.data.count / pageSize),
          totalCount: response.data.count
        }))
      } else {
        // Fallback for non-paginated response
        const list = Array.isArray(response.data) ? response.data : []
        setPayments(list)
        setPagination(prev => ({
          ...prev,
          currentPage: 1,
          totalPages: list.length > 0 ? 1 : 0,
          totalCount: list.length,
        }))
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const resetRegistrationForm = () => {
    setRegistrationForm({
      temp_ref_no: '',
      ref_no: '',
      registry_date: '',
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
    setEditingPayment(null)
    setDuplicateWarning(null)
  }

  const handleRegistration = async () => {
    try {
      // Validate vendor_name is required for new payments
      if (!editingPayment && (!registrationForm.vendor_name || !registrationForm.vendor_name.trim())) {
        toast.error('Vendor Name is required')
        return
      }
      
      // Validate Registry Date is required when editing ARRIVED payment
      if (editingPayment && editingPayment.status === 'ARRIVED') {
        if (!registrationForm.registry_date) {
          toast.error('Registry Date is required to update payment details')
          return
        }
      }
      
      const payload = { ...registrationForm };
      
      // Convert empty strings to null for optional fields
      ['amount', 'arrival_date', 'payment_date', 'due_date', 'registry_date', 'ref_no', 'temp_ref_no', 'tt_number', 'invoice_number', 'vendor_name', 'description'].forEach(field => {
        if (payload[field] === '') {
          payload[field] = null;
        }
      });

      if (editingPayment) {
        await api.patch(`/api/payments/payments/${editingPayment.id}/`, payload)
        toast.success(t('payment_updated'))
      } else {
        await api.post('/api/payments/payments/', payload)
        toast.success(t('payment_registered'))
      }
      
      setShowRegistration(false)
      resetRegistrationForm()
      fetchPayments()
    } catch (error) {
      console.error('Error registering payment:', error)
      const errorData = error.response?.data
      let errorMessage = 'Failed to register payment'
      
      if (errorData && typeof errorData === 'object') {
        const firstError = Object.entries(errorData)[0]
        if (firstError) {
          errorMessage = `${firstError[0]}: ${firstError[1]}`
        }
      }
      
      toast.error(errorMessage)
    }
  }

  const saveCurrentFilter = () => {
    if (!filterName.trim()) {
      toast.error('Please enter a filter name')
      return
    }
    
    const newFilter = {
      id: Date.now(),
      name: filterName,
      filters: { ...filters },
      searchQuery: searchQuery
    }
    
    const updated = [...savedFilters, newFilter]
    setSavedFilters(updated)
    localStorage.setItem('payment_saved_filters', JSON.stringify(updated))
    setFilterName('')
    setShowSaveFilter(false)
    toast.success('Filter saved successfully')
  }

  const loadFilter = (savedFilter) => {
    setFilters(savedFilter.filters)
    setSearchQuery(savedFilter.searchQuery || '')
    toast.success(`Loaded filter: ${savedFilter.name}`)
  }

  const deleteFilter = (filterId) => {
    const updated = savedFilters.filter(f => f.id !== filterId)
    setSavedFilters(updated)
    localStorage.setItem('payment_saved_filters', JSON.stringify(updated))
    toast.success('Filter deleted')
  }

  const clearAllFilters = () => {
    setFilters({ status: '', payment_type: '', date_from: '', date_to: '' })
    setSearchQuery('')
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchPayments(newPage)
    }
  }

  const handleNextPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      fetchPayments(pagination.currentPage + 1)
    }
  }

  const handlePreviousPage = () => {
    if (pagination.currentPage > 1) {
      fetchPayments(pagination.currentPage - 1)
    }
  }

  const handlePageSizeChange = (newPageSize) => {
    fetchPayments(1, newPageSize)
  }

  const handleVendorNameChange = (value) => {
    setRegistrationForm(prev => ({ ...prev, vendor_name: value }))
    
    if (value.trim().length > 0) {
      const filtered = vendorNames.filter(name => 
        name.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredVendors(filtered)
      setShowVendorSuggestions(filtered.length > 0)
    } else {
      setShowVendorSuggestions(false)
      setFilteredVendors([])
    }
  }

  const selectVendor = (vendorName) => {
    setRegistrationForm(prev => ({ ...prev, vendor_name: vendorName }))
    setShowVendorSuggestions(false)
    setFilteredVendors([])
  }

  const checkForDuplicates = () => {
    if (!isCeoSecretary) return null

    const { invoice_number, tt_number, vendor_name, amount } = registrationForm
    
    // Check for exact matches on invoice or TT number
    const exactMatch = payments.find(p => 
      (invoice_number && p.invoice_number === invoice_number) ||
      (tt_number && p.tt_number === tt_number)
    )
    
    if (exactMatch) {
      return {
        type: 'exact',
        payment: exactMatch,
        message: `${t('possible_duplicate')}: ${exactMatch.ref_no || exactMatch.temp_ref_no}`
      }
    }

    // Check for similar vendor and amount
    if (vendor_name && amount) {
      const similarMatch = payments.find(p => 
        p.vendor_name?.toLowerCase() === vendor_name.toLowerCase() &&
        Math.abs(parseFloat(p.amount) - parseFloat(amount)) < 0.01
      )
      
      if (similarMatch) {
        return {
          type: 'similar',
          payment: similarMatch,
          message: `${t('duplicate_warning')}: ${similarMatch.vendor_name} - ${similarMatch.amount} ${similarMatch.currency}`
        }
      }
    }

    return null
  }

  const handleEdit = (payment) => {
    setEditingPayment(payment)
    setRegistrationForm({
      temp_ref_no: payment.temp_ref_no || '',
      ref_no: payment.ref_no || '',
      registry_date: payment.registry_date || '',
      tt_number: payment.tt_number || '',
      arrival_date: payment.arrival_date || '',
      amount: payment.amount || '',
      currency: payment.currency || 'ETB',
      payment_type: payment.payment_type || 'INVOICE',
      vendor_name: payment.vendor_name || '',
      invoice_number: payment.invoice_number || '',
      description: payment.description || '',
      payment_date: payment.payment_date || '',
      due_date: payment.due_date || '',
      priority: payment.priority || 'NORMAL'
    })
    setShowRegistration(true)
  }

  const statusColors = {
    'ARRIVED': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'PENDING_PAYMENT': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    'TRANSFERRED_TO_BANK': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    'PAYMENT_COMPLETE': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  }

  const priorityColors = {
    'LOW': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    'NORMAL': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'HIGH': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    'URGENT': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  }

  const getStatusDate = (payment) => {
    if (!payment) return null
    if (payment.status === 'ARRIVED') {
      return payment.arrival_date || payment.registration_date
    }
    if (payment.status === 'PENDING_PAYMENT') {
      return payment.registry_date || payment.pending_payment_date || payment.registration_date
    }
    if (payment.status === 'TRANSFERRED_TO_BANK') {
      return payment.transferred_date
    }
    if (payment.status === 'PAYMENT_COMPLETE') {
      return payment.completed_date
    }
    return payment.status_changed_date || payment.registration_date
  }

  const handleStatusChange = async (paymentId, action, payment = null) => {
    // Validate registry number and date before marking as pending payment
    if (action === 'mark_pending_payment' && payment) {
      if (!payment.ref_no || !payment.ref_no.trim()) {
        toast.error('Registry Number is required before marking as pending payment')
        return
      }
      if (!payment.registry_date) {
        toast.error('Registry Date is required before marking as pending payment')
        return
      }
    }
    
    try {
      await api.post(`/api/payments/payments/${paymentId}/${action}/`)
      toast.success(t('payment_updated'))
      fetchPayments()
      setConfirmDialog({ show: false, type: null, payment: null })
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast.error(error.response?.data?.error || 'Failed to update payment status')
    }
  }

  const openConfirmDialog = (type, payment) => {
    setConfirmDialog({ show: true, type, payment })
  }

  const handleConfirm = () => {
    if (confirmDialog.payment && confirmDialog.type) {
      handleStatusChange(confirmDialog.payment.id, confirmDialog.type)
    }
  }

  const fetchPaymentHistory = async (paymentId) => {
    setLoadingHistory(true)
    try {
      const response = await api.get(`/api/payments/payments/${paymentId}/history/`)
      return response.data
    } catch (error) {
      console.error('Error fetching payment history:', error)
      toast.error('Failed to load payment history')
      return []
    } finally {
      setLoadingHistory(false)
    }
  }

  const openHistoryModal = async (payment) => {
    const history = await fetchPaymentHistory(payment.id)
    setHistoryModal({ show: true, payment, history })
  }

  const startItem = pagination.totalCount === 0
    ? 0
    : ((pagination.currentPage - 1) * pagination.pageSize) + 1

  const endItem = pagination.totalCount === 0
    ? 0
    : Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
            <span className="text-indigo-600 dark:text-indigo-400">💰</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold dark:text-white">{t('financial_payments')}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {t('manage_payment_approvals')}
            </div>
          </div>
        </div>
        {isCeoSecretary && (
          <button 
            onClick={() => setShowRegistration(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2"
          >
            <span>➕</span>
            {t('register_payment')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">{t('status')}</label>
            <select
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">{t('all_statuses')}</option>
              <option value="ARRIVED">{t('arrived')}</option>
              <option value="PENDING_PAYMENT">{t('pending_payment')}</option>
              <option value="TRANSFERRED_TO_BANK">{t('transferred_to_bank')}</option>
              <option value="PAYMENT_COMPLETE">{t('payment_complete')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">{t('payment_type')}</label>
            <select
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
              value={filters.payment_type}
              onChange={(e) => setFilters(prev => ({ ...prev, payment_type: e.target.value }))}
            >
              <option value="">{t('all_types')}</option>
              <option value="INVOICE">{t('invoice')}</option>
              <option value="EXPENSE">{t('expense')}</option>
              <option value="SALARY">{t('salary')}</option>
              <option value="CONTRACT">{t('contract')}</option>
              <option value="OTHER">{t('other')}</option>
            </select>
          </div>
          <div>
            <EthiopianDateInput
              label={t('date_from')}
              value={filters.date_from}
              onChange={(value) => setFilters(prev => ({ ...prev, date_from: value }))}
            />
          </div>
          <div>
            <EthiopianDateInput
              label={t('date_to')}
              value={filters.date_to}
              onChange={(value) => setFilters(prev => ({ ...prev, date_to: value }))}
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setShowSaveFilter(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-1"
          >
            <Save className="w-4 h-4" />
            {t('save_filter')}
          </button>
          <button
            onClick={clearAllFilters}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-lg"
          >
            {t('clear_filters')}
          </button>
        </div>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Bookmark className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('saved_filters')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map(savedFilter => (
                <div
                  key={savedFilter.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                >
                  <button
                    onClick={() => loadFilter(savedFilter)}
                    className="hover:underline"
                  >
                    {savedFilter.name}
                  </button>
                  <button
                    onClick={() => deleteFilter(savedFilter.id)}
                    className="hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Filter Modal */}
      {showSaveFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">{t('save_filter')}</h3>
            <input
              type="text"
              placeholder={t('filter_name')}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 mb-4 bg-white dark:bg-slate-700 dark:text-white"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && saveCurrentFilter()}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSaveFilter(false)
                  setFilterName('')
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                {t('cancel')}
              </button>
              <button
                onClick={saveCurrentFilter}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payments List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow">
        {/* Search Bar - Top Right */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('payments_table')}</h3>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('search_payments')}
              className="w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="text-slate-500 dark:text-slate-400">{t('loading')}...</div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-500 dark:text-slate-400">{t('no_payments')}</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">{t('reference')}</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">{t('vendor')}</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">{t('amount')}</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">{t('type')}</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">{t('status')}</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">{t('registry_date')}</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">{t('changed_by')}</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">{t('change_date')}</th>
                  <th className="text-center p-4 font-medium text-slate-900 dark:text-slate-100">{t('history')}</th>
                  {(isCeoSecretary || isCxoFinance) && <th className="text-right p-4 font-medium text-slate-900 dark:text-slate-100">{t('actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-4">
                      <div className="font-medium dark:text-white">{payment.ref_no || payment.temp_ref_no || 'Unregistered'}</div>
                      {payment.temp_ref_no && !payment.ref_no && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">Temp ref</div>
                      )}
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
                      {payment.registry_date ? (
                        <EthDateDisplay
                          date={payment.registry_date}
                          className="text-sm text-slate-700 dark:text-slate-100"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {payment.status_changed_by_name || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      {payment.status_changed_date ? (
                        <EthDateDisplay
                          date={payment.status_changed_date}
                          className="text-sm text-slate-700 dark:text-slate-100"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => openHistoryModal(payment)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                      >
                        {t('view_history')}
                      </button>
                    </td>
                    {(isCeoSecretary || isCxoFinance) && (
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          {isCeoSecretary && payment.status === 'ARRIVED' && (
                            <button
                              onClick={() => handleStatusChange(payment.id, 'mark_pending_payment', payment)}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium"
                            >
                              {t('mark_pending_payment')}
                            </button>
                          )}
                          {isCeoSecretary && payment.status !== 'PAYMENT_COMPLETE' && (
                            <button
                              onClick={() => handleEdit(payment)}
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm"
                            >
                              {t('edit')}
                            </button>
                          )}
                          {isCxoFinance && payment.status === 'PENDING_PAYMENT' && (
                            <button
                              onClick={() => openConfirmDialog('mark_transferred', payment)}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium"
                            >
                              {t('transfer_to_bank')}
                            </button>
                          )}
                          {isCxoFinance && payment.status === 'TRANSFERRED_TO_BANK' && (
                            <button
                              onClick={() => openConfirmDialog('mark_completed', payment)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                            >
                              {t('mark_complete')}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && payments.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {t('showing')} {startItem} - {endItem} {t('of')} {pagination.totalCount} {t('payments')}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600 dark:text-slate-400">{t('items_per_page')}:</label>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-slate-700 dark:text-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('previous')}
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const pageNum = index + 1
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          pageNum === pagination.currentPage
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  } else if (
                    pageNum === pagination.currentPage - 2 ||
                    pageNum === pagination.currentPage + 2
                  ) {
                    return <span key={pageNum} className="text-slate-400">...</span>
                  }
                  return null
                })}
              </div>

              <button
                onClick={handleNextPage}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold dark:text-white">
                  {editingPayment ? t('edit_payment') : t('register_new_payment')}
                </h2>
                <button
                  onClick={() => {
                    setShowRegistration(false)
                    resetRegistrationForm()
                  }}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              {/* Duplicate Warning */}
              {duplicateWarning && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 text-lg">⚠️</span>
                    <div>
                      <div className="font-semibold text-amber-800 dark:text-amber-300">{duplicateWarning.message}</div>
                      <div className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                        Please verify this is not a duplicate payment before proceeding.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('temp_ref_optional')}</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.temp_ref_no}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, temp_ref_no: e.target.value }))}
                    placeholder={t('ph_temp_ref')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('official_ref_optional')}</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.ref_no}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, ref_no: e.target.value }))}
                    placeholder={t('ph_official_ref')}
                  />
                </div>
                
                <div>
                  <EthiopianDateInput
                    label={t('registry_date')}
                    value={registrationForm.registry_date}
                    onChange={(value) => setRegistrationForm(prev => ({ ...prev, registry_date: value }))}
                    placeholder={t('ph_registry_date')}
                    disabled={editingPayment?.registry_date ? true : false}
                    required={editingPayment && editingPayment.status === 'ARRIVED' ? true : false}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('tt_number_optional')}</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.tt_number}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, tt_number: e.target.value }))}
                    placeholder={t('ph_tt_number')}
                  />
                </div>
                
                <div>
                  <EthiopianDateInput
                    label={t('arrival_date')}
                    value={registrationForm.arrival_date}
                    onChange={(value) => setRegistrationForm(prev => ({ ...prev, arrival_date: value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('amount')}</label>
                  <input
                    type="number"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.amount}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder={t('ph_amount')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('currency')}</label>
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
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('payment_type')}</label>
                  <select
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.payment_type}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, payment_type: e.target.value }))}
                  >
                    <option value="INVOICE">{t('invoice')}</option>
                    <option value="EXPENSE">{t('expense')}</option>
                    <option value="SALARY">{t('salary')}</option>
                    <option value="CONTRACT">{t('contract')}</option>
                    <option value="OTHER">{t('other')}</option>
                  </select>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium mb-1 dark:text-white">
                    {t('vendor_name')}
                    {!editingPayment && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.vendor_name}
                    onChange={(e) => handleVendorNameChange(e.target.value)}
                    onFocus={() => {
                      if (registrationForm.vendor_name.trim().length > 0 && filteredVendors.length > 0) {
                        setShowVendorSuggestions(true)
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow click on suggestion
                      setTimeout(() => setShowVendorSuggestions(false), 200)
                    }}
                    placeholder={t('ph_vendor_name')}
                    autoComplete="off"
                  />
                  {showVendorSuggestions && filteredVendors.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredVendors.map((vendor, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectVendor(vendor)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm"
                        >
                          {vendor}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('invoice_number')}</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.invoice_number}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                    placeholder={t('ph_invoice_number')}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('description')}</label>
                  <textarea
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.description}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('ph_description')}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('payment_date')}</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.payment_date}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, payment_date: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('due_date')}</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.due_date}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('priority')}</label>
                  <select
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white"
                    value={registrationForm.priority}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="LOW">{t('low')}</option>
                    <option value="NORMAL">{t('normal')}</option>
                    <option value="HIGH">{t('high')}</option>
                    <option value="URGENT">{t('urgent')}</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRegistration(false)
                    resetRegistrationForm()
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleRegistration}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  {editingPayment ? t('update_payment') : t('register_payment')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              {confirmDialog.type === 'mark_transferred' ? t('transfer_to_bank') : t('mark_complete')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {confirmDialog.type === 'mark_transferred' ? t('confirm_transfer') : t('confirm_complete')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog({ show: false, type: null, payment: null })}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg text-white ${
                  confirmDialog.type === 'mark_transferred' 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {historyModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-white">
                {t('payment_history')} - {historyModal.payment?.ref_no || historyModal.payment?.temp_ref_no}
              </h3>
              <button
                onClick={() => setHistoryModal({ show: false, payment: null, history: [] })}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {loadingHistory ? (
              <div className="text-center py-8">
                <div className="text-slate-500 dark:text-slate-400">{t('loading')}...</div>
              </div>
            ) : historyModal.history.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-slate-500 dark:text-slate-400">{t('no_history')}</div>
              </div>
            ) : (
              <div className="space-y-4">
                {historyModal.history.map((entry, index) => (
                  <div key={entry.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-r">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">{entry.action}</span>
                        {entry.old_status && entry.new_status && (
                          <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                            ({entry.old_status} → {entry.new_status})
                          </span>
                        )}
                      </div>
                      <EthDateDisplay
                        date={entry.timestamp}
                        includeTime={true}
                        className="text-sm text-slate-600 dark:text-slate-400"
                      />
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                      {t('performed_by')}: {entry.performed_by_name || 'System'}
                    </div>
                    {entry.notes && (
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {entry.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setHistoryModal({ show: false, payment: null, history: [] })}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentList
