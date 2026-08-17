import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, ShieldAlert, KeyRound } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context';
import { getErrorMessage } from '../../utils/error';
import { Button } from '../../components/common/Button';
import { FormField, Input } from '../../components/common/FormComponents';

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-4 animate-scale-up">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto ring-1 ring-rose-500/20">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Invalid Reset Link</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            No security reset token was found in the URL. Please request a new password reset link.
          </p>
          <div className="pt-2">
            <Link to="/forgot-password">
              <Button variant="primary" size="md" fullWidth>
                Request New Link
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 z-10 animate-scale-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3.5 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/10">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Set new password</h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Must be at least 8 characters long
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center py-2 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto ring-1 ring-emerald-500/20">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">Password Updated!</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Your account password has been changed. You can now log in with your new credentials.
            </p>
            <div className="pt-2">
              <Button variant="primary" size="md" fullWidth onClick={() => navigate('/login')}>
                Go to Sign In
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="New Password" required>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
                minLength={8}
              />
            </FormField>

            <FormField label="Confirm New Password" required>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
                minLength={8}
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              isLoading={isSubmitting}
              className="mt-2"
            >
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
