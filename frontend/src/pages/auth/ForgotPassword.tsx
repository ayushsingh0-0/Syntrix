import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context';
import { getErrorMessage } from '../../utils/error';
import { Logo } from '../../components/common/Logo';

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
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to send reset link.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: "'Plus Jakarta Sans', Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        color: '#20201D',
        background:
          'radial-gradient(circle at 12% 18%, rgba(245, 174, 77, 0.13), transparent 24%), radial-gradient(circle at 88% 82%, rgba(245, 174, 77, 0.10), transparent 22%), #F5F3EB',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 48px',
          zIndex: 10,
        }}
      >
        <Logo size="md" to="/" />
        <Link
          to="/login"
          style={{
            fontSize: '13px',
            fontWeight: 650,
            color: '#20201D',
            textDecoration: 'none',
          }}
        >
          Sign in
        </Link>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 24px',
          zIndex: 10,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            background: '#FFFDF8',
            borderRadius: '24px',
            padding: '40px 36px',
            border: '1px solid #DDD9CC',
            boxShadow: '0 20px 60px rgba(35, 31, 20, 0.08)',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 750,
                letterSpacing: '-0.04em',
                color: '#20201D',
                marginBottom: '8px',
              }}
            >
              Reset Password
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: '#77756D',
                lineHeight: 1.5,
                maxWidth: '300px',
                margin: '0 auto',
              }}
            >
              Enter your registered email to receive recovery instructions
            </p>
          </div>

          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#E4EEE5',
                  color: '#52755A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 750, color: '#20201D', marginBottom: '8px' }}>
                Check your inbox
              </h4>
              <p style={{ fontSize: '14px', color: '#77756D', marginBottom: '24px', lineHeight: 1.5 }}>
                If an account exists for <strong>{email}</strong>, we've dispatched password reset instructions.
              </p>
              <Link
                to="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#F5AE4D',
                  color: '#20201D',
                  borderRadius: '12px',
                  fontWeight: 750,
                  fontSize: '14px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(245, 174, 77, 0.3)',
                }}
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px', width: '100%' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 650, marginBottom: '8px', color: '#20201D' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '48px',
                    background: '#FFFDF8',
                    border: '1px solid #DDD9CC',
                    borderRadius: '12px',
                    padding: '0 16px',
                    fontSize: '14px',
                    color: '#20201D',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#F5AE4D';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 174, 77, 0.18)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#DDD9CC';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#F5AE4D',
                  color: '#20201D',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 750,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(245, 174, 77, 0.3)',
                  transition: 'all 0.2s',
                }}
              >
                {isSubmitting ? <span>Sending...</span> : <span>Send Reset Link</span>}
                <ArrowRight size={16} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '22px' }}>
                <Link
                  to="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    color: '#77756D',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#20201D')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#77756D')}
                >
                  <ArrowLeft size={14} />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '24px 20px',
          fontSize: '12px',
          color: '#9A978D',
          zIndex: 10,
        }}
      >
        <span>Copyright @Syntrix 2026</span>
        <span style={{ margin: '0 8px' }}>|</span>
        <a href="#privacy" style={{ color: '#77756D' }}>
          Privacy Policy
        </a>
      </footer>
    </div>
  );
};

export default ForgotPassword;
