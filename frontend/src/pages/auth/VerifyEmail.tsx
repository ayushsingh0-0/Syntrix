import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context';
import { getErrorMessage } from '../../utils/error';
import { Logo } from '../../components/common/Logo';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(!token ? 'error' : 'loading');
  const [errorMessage, setErrorMessage] = useState(!token ? 'No verification token provided in URL.' : '');
  const { refreshUser } = useAuth();

  useEffect(() => {
    let isMounted = true;
    if (!token) {
      return;
    }

    api
      .get(`/auth/verify-email?token=${token}`)
      .then(() => {
        if (isMounted) {
          setStatus('success');
          refreshUser();
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(getErrorMessage(err, 'Verification token is invalid or expired.'));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, refreshUser]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--background, #F5F3EB)',
        fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <Logo size="lg" to="/" />
      </div>

      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          background: 'var(--surface, #FFFDF8)',
          border: '1px solid var(--border, #DDD9CC)',
          borderRadius: '20px',
          boxShadow: '0 8px 30px rgba(35, 31, 20, 0.06)',
        }}
      >
        {status === 'loading' && (
          <div>
            <RefreshCw
              size={36}
              color="var(--primary, #F5AE4D)"
              style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 16px auto' }}
            />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 750, color: 'var(--foreground, #20201D)' }}>
              Verifying Email Address...
            </h3>
            <p style={{ color: 'var(--foreground-secondary, #77756D)', fontSize: '0.875rem', marginTop: '8px' }}>
              Please wait while we validate your token.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: '#E4EEE5',
                color: '#52755A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--foreground, #20201D)' }}>
              Email Verified!
            </h3>
            <p style={{ color: 'var(--foreground-secondary, #77756D)', fontSize: '0.875rem', margin: '10px 0 24px 0', lineHeight: 1.5 }}>
              Your email address has been successfully confirmed. Your account is now fully verified.
            </p>
            <Link
              to="/"
              className="btn btn-primary"
              style={{
                width: '100%',
                display: 'inline-flex',
                justifyContent: 'center',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 700,
                background: 'var(--primary, #F5AE4D)',
                color: '#20201D',
                textDecoration: 'none',
              }}
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: '#F5E1DB',
                color: '#9F5141',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertCircle size={32} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--foreground, #20201D)' }}>
              Verification Failed
            </h3>
            <p style={{ color: 'var(--foreground-secondary, #77756D)', fontSize: '0.875rem', margin: '10px 0 24px 0', lineHeight: 1.5 }}>
              {errorMessage}
            </p>
            <Link
              to="/"
              className="btn btn-secondary"
              style={{
                width: '100%',
                display: 'inline-flex',
                justifyContent: 'center',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 650,
                background: 'var(--surface, #FFFDF8)',
                border: '1px solid var(--border, #DDD9CC)',
                color: 'var(--foreground, #20201D)',
                textDecoration: 'none',
              }}
            >
              Return to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
