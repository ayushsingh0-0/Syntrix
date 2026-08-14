import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setIsSuccess(true);
      showToast('success', 'Reset instructions sent to your email.');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--bg-app)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem 2rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              color: 'var(--primary)',
            }}
          >
            <KeyRound size={22} />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>Reset password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Enter your email to receive password reset instructions
          </p>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <CheckCircle2 size={48} color="var(--emerald)" style={{ margin: '0 auto 12px auto' }} />
            <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Check your inbox</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              If an account exists for <strong>{email}</strong>, we've sent instructions to reset your password.
            </p>
            <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }}>
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="input-field"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '38px' }}
                />
                <Mail
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%', padding: '0.75rem', marginTop: '1rem' }}
            >
              {isSubmitting ? 'Sending link...' : 'Send Reset Link'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
