import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Settings,
  Save,
  Database,
  Bell,
  Shield,
  Globe,
  Mail,
  Clock,
  CheckCircle,
  Plus,
} from 'lucide-react';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type?: string;
  description?: string;
  is_public: boolean;
}

export function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSetting, setNewSetting] = useState({
    setting_key: '',
    setting_value: '',
    setting_type: 'text',
    description: '',
    is_public: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      for (const setting of settings) {
        await supabase
          .from('system_settings')
          .update({ setting_value: setting.setting_value })
          .eq('id', setting.id);
      }
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSetting(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('system_settings')
        .insert({
          setting_key: newSetting.setting_key,
          setting_value: newSetting.setting_value,
          setting_type: newSetting.setting_type,
          description: newSetting.description || null,
          is_public: newSetting.is_public,
        });

      if (error) throw error;

      setShowAddModal(false);
      setNewSetting({
        setting_key: '',
        setting_value: '',
        setting_type: 'text',
        description: '',
        is_public: false,
      });
      fetchSettings();
    } catch (error) {
      console.error('Error adding setting:', error);
      alert('Failed to add setting');
    }
  }

  const updateSetting = (id: string, value: string) => {
    setSettings(settings.map(s => s.id === id ? { ...s, setting_value: value } : s));
  };

  // Group settings by prefix
  const groupedSettings = settings.reduce((acc, setting) => {
    const prefix = setting.setting_key.split('_')[0];
    if (!acc[prefix]) acc[prefix] = [];
    acc[prefix].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  const categoryIcons: Record<string, any> = {
    site: Globe,
    default: Database,
    tender: Database,
    min: Database,
    alert: Bell,
    email: Mail,
    session: Shield,
    password: Shield,
    smtp: Mail,
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Configuration</h1>
          <p className="text-text-muted mt-1">Manage system-wide settings and preferences</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddModal(true)} className="btn btn-outline">
            <Plus className="w-4 h-4" />
            Add Setting
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {settings.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <Settings className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Settings Configured</h3>
            <p className="text-text-muted mb-6">
              Add your first system setting to configure the application.
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              Add First Setting
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedSettings).map(([prefix, prefixSettings]) => {
            const Icon = categoryIcons[prefix] || Settings;
            return (
              <div key={prefix} className="card">
                <div className="card-header flex items-center gap-3">
                  <Icon className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold capitalize">{prefix} Settings</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prefixSettings.map((setting) => (
                      <div key={setting.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <label className="font-medium text-sm">
                            {setting.setting_key.replace(/_/g, ' ')}
                          </label>
                          {setting.is_public && (
                            <span className="badge badge-secondary text-xs">Public</span>
                          )}
                        </div>
                        {setting.description && (
                          <p className="text-xs text-text-muted mb-2">{setting.description}</p>
                        )}
                        <input
                          type={setting.setting_type === 'number' ? 'number' : 'text'}
                          value={setting.setting_value}
                          onChange={(e) => updateSetting(setting.id, e.target.value)}
                          className="input"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card border-l-4 border-l-success">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-success" />
            <div>
              <p className="text-2xl font-bold">Active</p>
              <p className="text-sm text-text-muted">System Status</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">99.9%</p>
              <p className="text-sm text-text-muted">Uptime</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-secondary">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-secondary" />
            <div>
              <p className="text-2xl font-bold">{settings.length}</p>
              <p className="text-sm text-text-muted">Settings</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-warning" />
            <div>
              <p className="text-2xl font-bold">v1.0</p>
              <p className="text-sm text-text-muted">Version</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Setting Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold">Add System Setting</h3>
            </div>
            <form onSubmit={handleAddSetting}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label">Setting Key</label>
                  <input
                    type="text"
                    value={newSetting.setting_key}
                    onChange={(e) => setNewSetting({ ...newSetting, setting_key: e.target.value })}
                    className="input"
                    placeholder="e.g., site_name"
                    required
                  />
                </div>
                <div>
                  <label className="label">Setting Value</label>
                  <input
                    type="text"
                    value={newSetting.setting_value}
                    onChange={(e) => setNewSetting({ ...newSetting, setting_value: e.target.value })}
                    className="input"
                    placeholder="e.g., STTMS"
                    required
                  />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select
                    value={newSetting.setting_type}
                    onChange={(e) => setNewSetting({ ...newSetting, setting_type: e.target.value })}
                    className="select"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                  </select>
                </div>
                <div>
                  <label className="label">Description</label>
                  <input
                    type="text"
                    value={newSetting.description}
                    onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                    className="input"
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={newSetting.is_public}
                    onChange={(e) => setNewSetting({ ...newSetting, is_public: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_public" className="text-sm">Public setting (visible to all users)</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Setting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
