import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context';
import { getErrorMessage } from '../../utils/error';
import { Button } from '../../components/common/Button';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    !token ? 'error' : 'loading'
  );
  const [errorMessage, setErrorMessage] = useState(
    !token ? 'No verification token provided in URL.' : ''
  );
  const { refreshUser } = useAuth();

  useEffect(() => {
    let isMounted = true;
    if (!token) return;

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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-center z-10 animate-scale-up">
        {status === 'loading' && (
          <div className="py-6 space-y-4">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-slate-100">Verifying Email Address...</h3>
            <p className="text-xs text-slate-400">Please wait while we validate your security token.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto ring-1 ring-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Email Verified!</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Your email address has been successfully confirmed. Your account is now fully verified.
            </p>
            <div className="pt-2">
              <Link to="/">
                <Button variant="primary" size="md" fullWidth>
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto ring-1 ring-rose-500/20">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Verification Failed</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              {errorMessage}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link to="/" className="flex-1">
                <Button variant="secondary" size="md" fullWidth>
                  Return Home
                </Button>
              </Link>
              <Link to="/login" className="flex-1">
                <Button variant="primary" size="md" fullWidth>
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
