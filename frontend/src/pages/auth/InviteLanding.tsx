import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Building2, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth, useOrg, useToast } from '../../context';
import { getErrorMessage } from '../../utils/error';
import { Button } from '../../components/common/Button';
import type { Invitation } from '../../types';

export const InviteLanding: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [preview, setPreview] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isAccepting, setIsAccepting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const { user } = useAuth();
  const { refreshOrgs, switchOrg } = useOrg();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    if (!token) return;

    api
      .get(`/invitations/${token}`)
      .then((res) => {
        if (isMounted) {
          setPreview(res.data.data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          showToast('error', getErrorMessage(err, 'Invalid or expired invitation link'));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, showToast]);

  const handleAccept = async () => {
    if (!user) {
      showToast('info', 'Please sign in or create an account to accept this invitation.');
      navigate(`/login?redirect=/invite/${token}`);
      return;
    }

    setIsAccepting(true);
    try {
      const { data } = await api.post('/invitations/accept', { token });
      showToast('success', `Joined ${data.data.organization.name}!`);
      setIsAccepted(true);
      await refreshOrgs();
      switchOrg(data.data.organization.id);
      setTimeout(() => navigate('/'), 1200);
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to accept invitation'));
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400 mt-3 font-medium uppercase tracking-wider">
          Loading invitation...
        </p>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-4 animate-scale-up">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto ring-1 ring-rose-500/20">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Invitation Not Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            This invitation link is invalid, already used, or has expired.
          </p>
          <div className="pt-2">
            <Link to="/">
              <Button variant="primary" size="md" fullWidth>
                Go to Syntrix
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

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-center z-10 animate-scale-up">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400/30">
          <Building2 className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Workspace Invitation</h1>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          You have been invited to collaborate on Syntrix
        </p>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-6 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Organization</span>
            <span className="text-sm font-bold text-slate-100">{preview.organization?.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Assigned Role</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              {preview.role}
            </span>
          </div>
        </div>

        {isAccepted ? (
          <div className="py-2 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-base font-semibold text-emerald-400">Invitation Accepted!</h4>
            <p className="text-xs text-slate-400">Redirecting to workspace...</p>
          </div>
        ) : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isAccepting}
            onClick={handleAccept}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isAccepting ? 'Enrolling...' : 'Accept Invitation & Join'}
          </Button>
        )}
      </div>
    </div>
  );
};
