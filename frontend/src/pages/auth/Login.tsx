import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth, useToast } from '../../context';
import { getErrorMessage } from '../../utils/error';
import { Button } from '../../components/common/Button';
import { FormField, Input } from '../../components/common/FormComponents';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      showToast('success', 'Welcome back to Syntrix!');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Login failed. Check your credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const autofillDemo = () => {
    setEmail('demo@syntrix.io');
    setPassword('DemoPass123!');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 z-10 animate-scale-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Sign in to Syntrix</h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Production-grade multi-tenant project intelligence
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Email Address" required>
            <Input
              type="email"
              placeholder="alex@syntrix.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
          </FormField>

          <FormField
            label="Password"
            required
            helperText={
              <div className="flex justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            }
          >
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="mt-2"
          >
            Sign In
          </Button>

          {/* Quick Demo Autofill */}
          <button
            type="button"
            onClick={autofillDemo}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-indigo-400/90 hover:text-indigo-300 py-2 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg bg-indigo-950/20 hover:bg-indigo-950/40 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fill Demo Credentials (demo@syntrix.io)</span>
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};
