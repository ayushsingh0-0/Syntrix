import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context';
import { getErrorMessage } from '../../utils/error';
import { Logo } from '../../components/common/Logo';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      showToast('error', 'Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      showToast('error', 'Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      showToast('success', 'Password reset successfully. Please sign in.');
      navigate('/login');
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to reset password. Link may be invalid or expired.'));
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
              Set New Password
            </h1>
            <p style={{ fontSize: '14px', color: '#77756D', lineHeight: 1.5 }}>
              Create a secure new password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px', width: '100%' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 650, marginBottom: '8px', color: '#20201D' }}>
                New Password
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '48px',
                    background: '#FFFDF8',
                    border: '1px solid #DDD9CC',
                    borderRadius: '12px',
                    padding: '0 48px 0 16px',
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#77756D',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '22px', width: '100%' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 650, marginBottom: '8px', color: '#20201D' }}>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
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
              {isSubmitting ? <span>Updating...</span> : <span>Update Password</span>}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </main>

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

export default ResetPassword;
