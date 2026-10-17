import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, AlertCircle, Loader2, UserCheck } from 'lucide-react';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await signUp({
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setError(result.error || 'Registration failed');
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
                <UserCheck className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Registration Successful</h2>
              <p className="text-text-muted mb-4">
                Your account has been created. You can now sign in with your credentials.
              </p>
              <p className="text-sm text-text-muted">Redirecting to login...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl px-4 py-2 mb-6">
            <img src="/sttms-logo.svg" alt="STTMS" className="h-16 w-auto" />
          </div>
          <p className="text-white/60 mt-2">
            Smart Tender Transparency and Monitoring System
          </p>
          <p className="text-white/40 text-sm mt-1">Republic of South Africa</p>
        </div>

        <div className="card">
          <div className="card-body">
            <h2 className="text-xl font-semibold text-center mb-6">Create Account</h2>

            {error && (
              <div className="alert-danger mb-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Registration Failed</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="input pl-10"
                      placeholder="First name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="input pl-10"
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input pl-10"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input pl-10"
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input pl-10"
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </div>

              <p className="text-sm text-text-muted bg-surface rounded-lg p-3">
                Public accounts can view transparency information. Supplier, Procurement Officer, and Auditor accounts are created by authorised administrators.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-text-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-secondary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-white/40 text-sm mt-6">
          National Treasury - Republic of South Africa
        </p>
      </div>
    </div>
  );
}
