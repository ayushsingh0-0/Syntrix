import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context';
import { getErrorMessage } from '../../utils/error';

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

    api.get(`/auth/verify-email?token=${token}`).then(() => {
      if (isMounted) {
        setStatus('success');
        refreshUser();
      }
    }).catch((err: unknown) => {
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem 2rem', textAlign: 'center' }}>
        {status === 'loading' && (
          <div>
            <RefreshCw size={36} color="var(--primary)" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 16px auto' }} />
            <h3>Verifying Email Address...</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '8px' }}>
              Please wait while we validate your token.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <CheckCircle2 size={48} color="var(--emerald)" style={{ margin: '0 auto 14px auto' }} />
            <h3 style={{ fontSize: '1.4rem' }}>Email Verified!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '10px 0 24px 0' }}>
              Your email address has been successfully confirmed. Your account is now fully verified.
            </p>
            <Link to="/" className="btn btn-primary" style={{ width: '100%' }}>
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <AlertCircle size={48} color="var(--rose)" style={{ margin: '0 auto 14px auto' }} />
            <h3 style={{ fontSize: '1.4rem' }}>Verification Failed</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '10px 0 24px 0' }}>
              {errorMessage}
            </p>
            <Link to="/" className="btn btn-secondary" style={{ width: '100%' }}>
              Return to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
