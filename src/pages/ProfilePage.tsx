import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Shield,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
} from 'lucide-react';

export function ProfilePage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    employee_id: user?.employee_id || '',
  });

  if (!user) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Please log in to view your profile.</div>;
  }

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          employee_id: formData.employee_id,
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setEditing(false);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = (name?: string) => {
    const map: Record<string, string> = {
      admin: 'Administrator',
      procurement_officer: 'Procurement Officer',
      supplier: 'Supplier',
      auditor: 'Auditor',
    };
    return name ? map[name] || name : '-';
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">My Profile</h1>
          <p className="text-sm text-text-muted mt-1">View and manage your account information</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn btn-primary">
            <Save className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Profile header card */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-text">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-sm text-text-muted">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="badge badge-primary">{roleLabel(user.role?.name)}</span>
                <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className={`badge ${user.email_verified ? 'badge-success' : 'badge-warning'}`}>
                  {user.email_verified ? 'Email Verified' : 'Email Not Verified'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-text">Personal Information</h3>
        </div>
        <div className="card-body">
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="input"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="input"
                  placeholder="Last name"
                />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="label">Employee ID</label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="input"
                  placeholder="Employee ID"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <UserIcon className="w-5 h-5 text-text-muted mt-0.5" />
                <div>
                  <p className="text-sm text-text-muted">First Name</p>
                  <p className="font-medium text-text">{user.first_name || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserIcon className="w-5 h-5 text-text-muted mt-0.5" />
                <div>
                  <p className="text-sm text-text-muted">Last Name</p>
                  <p className="font-medium text-text">{user.last_name || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-text-muted mt-0.5" />
                <div>
                  <p className="text-sm text-text-muted">Email Address</p>
                  <p className="font-medium text-text">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-text-muted mt-0.5" />
                <div>
                  <p className="text-sm text-text-muted">Phone Number</p>
                  <p className="font-medium text-text">{user.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-text-muted mt-0.5" />
                <div>
                  <p className="text-sm text-text-muted">Role</p>
                  <p className="font-medium text-text">{roleLabel(user.role?.name)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-text-muted mt-0.5" />
                <div>
                  <p className="text-sm text-text-muted">Department</p>
                  <p className="font-medium text-text">{user.department?.name || 'Not assigned'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserIcon className="w-5 h-5 text-text-muted mt-0.5" />
                <div>
                  <p className="text-sm text-text-muted">Employee ID</p>
                  <p className="font-medium text-text">{user.employee_id || 'Not assigned'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-text-muted mt-0.5" />
                <div>
                  <p className="text-sm text-text-muted">Member Since</p>
                  <p className="font-medium text-text">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-ZA', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    }) : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account status */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-text">Account Status</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-surface">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className={`w-5 h-5 ${user.is_active ? 'text-success' : 'text-danger'}`} />
                <p className="text-sm text-text-muted">Account Status</p>
              </div>
              <p className="font-medium text-text">{user.is_active ? 'Active' : 'Inactive'}</p>
            </div>
            <div className="p-4 rounded-lg bg-surface">
              <div className="flex items-center gap-2 mb-1">
                <Mail className={`w-5 h-5 ${user.email_verified ? 'text-success' : 'text-warning'}`} />
                <p className="text-sm text-text-muted">Email Verification</p>
              </div>
              <p className="font-medium text-text">{user.email_verified ? 'Verified' : 'Pending'}</p>
            </div>
            <div className="p-4 rounded-lg bg-surface">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-text-muted" />
                <p className="text-sm text-text-muted">Last Login</p>
              </div>
              <p className="font-medium text-text">
                {user.last_login
                  ? new Date(user.last_login).toLocaleDateString('en-ZA', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })
                  : 'First login'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
