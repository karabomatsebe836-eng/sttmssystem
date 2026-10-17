import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User, Role, Department } from '../types';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  User as UserIcon,
  Mail,
  Shield,
} from 'lucide-react';

export function UserManagementPage() {
  const [users, setUsers] = useState<(User & { role: Role; department?: Department })[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role_id: '',
    department_id: '',
    employee_id: '',
    phone: '',
    company_name: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchDepartments();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles (*),
          department:departments (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRoles() {
    const { data } = await supabase.from('roles').select('*');
    setRoles(data || []);
  }

  async function fetchDepartments() {
    const { data } = await supabase.from('departments').select('*').eq('is_active', true);
    setDepartments(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData: any = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role_id: formData.role_id,
          department_id: formData.department_id || null,
          employee_id: formData.employee_id || null,
          phone: formData.phone || null,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingUser.id);

        if (error) throw error;
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error('Your session has expired. Please sign in again.');

        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            first_name: formData.first_name,
            last_name: formData.last_name,
            role_id: formData.role_id,
            department_id: formData.department_id || null,
            employee_id: formData.employee_id || null,
            phone: formData.phone || null,
            company_name: formData.company_name || null,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || 'Unable to create account');
        }
      }

      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
    }
  }

  function resetForm() {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role_id: '',
      department_id: '',
      employee_id: '',
      phone: '',
      company_name: '',
    });
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      role_id: user.role_id,
      department_id: user.department_id || '',
      employee_id: user.employee_id || '',
      phone: user.phone || '',
      company_name: '',
    });
    setShowModal(true);
  }

  async function toggleUserStatus(user: User) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.first_name.toLowerCase().includes(search.toLowerCase()) ||
      user.last_name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || user.role_id === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-text-muted mt-1">Manage system users and their roles</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingUser(null);
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="select w-full sm:w-48"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {user.first_name[0]}{user.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-text-muted">{user.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${
                        user.role.name === 'admin' ? 'badge-danger' :
                        user.role.name === 'procurement_officer' ? 'badge-primary' :
                        user.role.name === 'auditor' ? 'badge-warning' :
                        'badge-secondary'
                      }`}>
                        {user.role.name}
                      </span>
                    </td>
                    <td>{user.department?.name || '-'}</td>
                    <td>
                      <button
                        onClick={() => toggleUserStatus(user)}
                        className={`badge cursor-pointer ${
                          user.is_active ? 'badge-success' : 'badge-danger'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString('en-ZA')}</td>
                    <td>
                      <button
                        onClick={() => openEditModal(user)}
                        className="btn btn-ghost btn-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    required
                    disabled={!!editingUser}
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="label">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input"
                      required={!editingUser}
                    />
                  </div>
                )}
                <div>
                  <label className="label">Company Name</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="input"
                    placeholder="Required for supplier accounts"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Role</label>
                    <select
                      value={formData.role_id}
                      onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                      className="select"
                      required
                    >
                      <option value="">Select role</option>
                      {roles.filter((role) => ['supplier', 'procurement_officer', 'auditor'].includes(role.name)).map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Department</label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="select"
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Employee ID</label>
                    <input
                      type="text"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function DepartmentManagementPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    budget_allocation: '',
    head_of_department: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    province: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const deptData = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        budget_allocation: parseFloat(formData.budget_allocation) || 0,
        head_of_department: formData.head_of_department || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        address: formData.address || null,
        province: formData.province || null,
      };

      if (editingDept) {
        const { error } = await supabase
          .from('departments')
          .update(deptData)
          .eq('id', editingDept.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('departments').insert(deptData);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingDept(null);
      resetForm();
      fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Failed to save department');
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      code: '',
      description: '',
      budget_allocation: '',
      head_of_department: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      province: '',
    });
  }

  function openEditModal(dept: Department) {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      budget_allocation: dept.budget_allocation.toString(),
      head_of_department: dept.head_of_department || '',
      contact_email: dept.contact_email || '',
      contact_phone: dept.contact_phone || '',
      address: dept.address || '',
      province: dept.province || '',
    });
    setShowModal(true);
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Department Management</h1>
          <p className="text-text-muted mt-1">Manage government departments and entities</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingDept(null);
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div key={dept.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div>
                  <span className="badge badge-secondary">{dept.code}</span>
                  <h3 className="text-lg font-semibold mt-2">{dept.name}</h3>
                </div>
                <button
                  onClick={() => openEditModal(dept)}
                  className="btn btn-ghost btn-sm"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-text-muted">{dept.description}</p>
                <div className="flex items-center gap-2 text-text-secondary">
                  <span className="font-medium">Budget:</span>
                  <span>{formatCurrency(dept.budget_allocation)}</span>
                </div>
                {dept.head_of_department && (
                  <p className="text-text-secondary">
                    <span className="font-medium">Head:</span> {dept.head_of_department}
                  </p>
                )}
                {dept.province && (
                  <p className="text-text-muted">
                    <span className="font-medium">Province:</span> {dept.province}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold">
                {editingDept ? 'Edit Department' : 'Add New Department'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Department Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="input"
                      required
                      maxLength={10}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Budget Allocation (ZAR)</label>
                    <input
                      type="number"
                      value={formData.budget_allocation}
                      onChange={(e) => setFormData({ ...formData, budget_allocation: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Province</label>
                    <select
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="select"
                    >
                      <option value="">Select province</option>
                      <option value="Eastern Cape">Eastern Cape</option>
                      <option value="Free State">Free State</option>
                      <option value="Gauteng">Gauteng</option>
                      <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                      <option value="Limpopo">Limpopo</option>
                      <option value="Mpumalanga">Mpumalanga</option>
                      <option value="Northern Cape">Northern Cape</option>
                      <option value="North West">North West</option>
                      <option value="Western Cape">Western Cape</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Head of Department</label>
                  <input
                    type="text"
                    value={formData.head_of_department}
                    onChange={(e) => setFormData({ ...formData, head_of_department: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Contact Email</label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
