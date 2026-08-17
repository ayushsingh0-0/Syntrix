import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useAuth, useOrg, useToast } from '../../context';
import { getErrorMessage } from '../../utils/error';
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
    if (!token) {
      return;
    }

    api.get(`/invitations/${token}`).then((res) => {
      if (isMounted) {
        setPreview(res.data.data);
        setIsLoading(false);
      }
    }).catch((err: unknown) => {
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={32} color="var(--primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
      </div>
    );
  }

  if (!preview) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="card" style={{ maxWidth: '420px', textAlign: 'center' }}>
          <h3>Invitation Not Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '10px 0 20px 0' }}>
            This invitation link is invalid, already used, or expired.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go to Syntrix
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), transparent 70%), var(--bg-app)',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: '#fff',
            boxShadow: '0 0 24px var(--primary-glow)',
          }}
        >
          <Building2 size={28} />
        </div>

        <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>Workspace Invitation</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
          You have been invited to collaborate on Syntrix
        </p>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Organization</span>
            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {preview.organization?.name}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned Role</span>
            <span className="badge badge-primary">
              <ShieldCheck size={12} />
              {preview.role}
            </span>
          </div>
        </div>

        {isAccepted ? (
          <div>
            <CheckCircle2 size={40} color="var(--emerald)" style={{ margin: '0 auto 10px auto' }} />
            <h4 style={{ color: 'var(--emerald)' }}>Invitation Accepted!</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Redirecting to workspace...</p>
          </div>
        ) : (
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem' }}
            onClick={handleAccept}
            disabled={isAccepting}
          >
            <span>{isAccepting ? 'Enrolling...' : 'Accept Invitation & Join'}</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
