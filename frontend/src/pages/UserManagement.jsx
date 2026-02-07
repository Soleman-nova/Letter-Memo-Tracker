import React, { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import { Users, Plus, Edit2, Trash2, X, AlertCircle, KeyRound } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'CEO_SECRETARY', label: 'CEO Secretary' },
  { value: 'CXO_SECRETARY', label: 'CxO Secretary' },
  { value: 'CEO', label: 'CEO' },
  { value: 'CXO', label: 'CxO' },
]

export default function UserManagement() {
  const { canManageUsers } = useAuth()
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [resetPasswordUser, setResetPasswordUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const toast = useToast()
  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'CXO',
    department: '',
  })

  const fetchData = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.get('/api/core/users/'),
        api.get('/api/core/departments/')
      ])
      setUsers(usersRes.data)
      setDepartments(deptsRes.data)
    } catch (err) {
      console.error('Failed to fetch data:', err)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canManageUsers) {
      fetchData()
    }
  }, [canManageUsers])

  const resetForm = () => {
    setForm({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      role: 'CXO',
      department: '',
    })
    setEditingUser(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const data = { ...form }
      if (!data.department) delete data.department
      else data.department = parseInt(data.department)
      
      if (editingUser) {
        // Update existing user
        delete data.password // Don't update password on edit
        await api.patch(`/api/core/users/${editingUser.id}/`, data)
        toast.success('User updated successfully')
      } else {
        // Create new user
        await api.post('/api/core/users/', data)
        toast.success('User created successfully')
      }
      resetForm()
      fetchData()
    } catch (err) {
      console.error('Failed to save user:', err)
      toast.error(toast.parseApiError(err))
    }
  }

  const handleEdit = (user) => {
    setForm({
      username: user.username,
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      password: '',
      role: user.profile?.role || 'CXO',
      department: user.profile?.department || '',
    })
    setEditingUser(user)
    setShowForm(true)
  }

  const handleDelete = async (user) => {
    if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) return
    
    try {
      await api.delete(`/api/core/users/${user.id}/`)
      toast.success('User deleted successfully')
      fetchData()
    } catch (err) {
      console.error('Failed to delete user:', err)
      toast.error(toast.parseApiError(err))
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!resetPasswordUser || !newPassword) return
    
    try {
      await api.post(`/api/core/users/${resetPasswordUser.id}/reset_password/`, {
        new_password: newPassword
      })
      toast.success(`Password reset successfully for ${resetPasswordUser.username}`)
      setResetPasswordUser(null)
      setNewPassword('')
    } catch (err) {
      console.error('Failed to reset password:', err)
      toast.error(toast.parseApiError(err))
    }
  }

  if (!canManageUsers) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">You don't have permission to manage users.</p>
      </div>
    )
  }

  if (loading) return <div className="p-4 dark:text-white">Loading...</div>

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#0B3C5D] dark:bg-[#F0B429] flex items-center justify-center">
            <Users className="w-5 h-5 text-white dark:text-[#0B3C5D]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold dark:text-white">User Management</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400">Manage system users and roles</div>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0B3C5D] dark:bg-[#F0B429] text-white dark:text-[#0B3C5D] px-4 py-2.5 font-medium shadow-sm hover:bg-[#09324F] dark:hover:bg-[#D9A020]"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      
      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
              <h2 className="text-lg font-semibold dark:text-white">{editingUser ? 'Edit User' : 'Create New User'}</h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Username <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    disabled={!!editingUser}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Email</label>
                  <input
                    type="email"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">First Name</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Last Name</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
              </div>
              
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Password <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editingUser}
                    minLength={8}
                    placeholder="Minimum 8 characters"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Role <span className="text-red-500">*</span></label>
                  <select
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    required
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">
                    Department {['CXO', 'CXO_SECRETARY'].includes(form.role) && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    required={['CXO', 'CXO_SECRETARY'].includes(form.role)}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#0B3C5D] dark:bg-[#F0B429] text-white dark:text-[#0B3C5D] hover:bg-[#09324F] dark:hover:bg-[#D9A020]">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
              <h2 className="text-lg font-semibold dark:text-white">Reset Password</h2>
              <button onClick={() => { setResetPasswordUser(null); setNewPassword('') }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-4 space-y-4">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Reset password for user: <span className="font-medium dark:text-white">{resetPasswordUser.username}</span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">New Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <button type="button" onClick={() => { setResetPasswordUser(null); setNewPassword('') }} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700">
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">User</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Role</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Department</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Status</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800 dark:text-white">{user.first_name} {user.last_name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">@{user.username}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    user.profile?.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                    user.profile?.role === 'CEO_SECRETARY' ? 'bg-blue-100 text-blue-700' :
                    user.profile?.role === 'CEO' ? 'bg-amber-100 text-amber-700' :
                    user.profile?.role === 'CXO_SECRETARY' ? 'bg-teal-100 text-teal-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {user.profile?.role_display || user.profile?.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                  {user.profile?.department_code ? `${user.profile.department_code}` : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleEdit(user)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setResetPasswordUser(user); setNewPassword('') }}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-amber-600 ml-1"
                    title="Reset Password"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 ml-1"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">No users found</div>
        )}
      </div>
    </div>
  )
}
