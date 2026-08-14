import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context';
import { getErrorMessage } from '../../utils/error';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      showToast('error', 'Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setIsSuccess(true);
      showToast('success', 'Password reset successfully! Please sign in.');
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Password reset link is invalid or expired.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="card" style={{ maxWidth: '420px', textAlign: 'center' }}>
          <ShieldAlert size={48} color="var(--rose)" style={{ margin: '0 auto 12px auto' }} />
          <h3>Invalid Reset Link</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '10px 0 20px 0' }}>
            No security reset token was provided in the URL.
          </p>
          <Link to="/forgot-password" className="btn btn-primary">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>Set new password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Must be at least 8 characters long
          </p>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <CheckCircle2 size={48} color="var(--emerald)" style={{ margin: '0 auto 12px auto' }} />
            <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Password Updated!</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Your account password has been changed. You can now log in with your new credentials.
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/login')}>
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{ paddingLeft: '38px' }}
                />
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{ paddingLeft: '38px' }}
                />
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%', padding: '0.75rem', marginTop: '1rem' }}
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
