import React, { useEffect, useState, useCallback } from 'react';
import { UserPlus, Mail, RotateCw, Trash2, Copy, Check, Clock, Plus, X } from 'lucide-react';
import { useOrg, type OrganizationRole } from '../../context/OrgContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const OrgInvitations: React.FC = () => {
  const { currentOrg, hasPermission, myRole } = useOrg();
  const { showToast } = useToast();
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);



  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationRole>('MEMBER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const fetchInvites = useCallback(async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const { data } = await api.get(`/organizations/${currentOrg.id}/invitations`);
      setInvites(data.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    setIsSubmitting(true);
    try {
      const { data } = await api.post(`/organizations/${currentOrg.id}/invitations`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      showToast('success', `Invitation generated for ${inviteEmail}!`);
      setGeneratedLink(data.data.invitationLink || `${window.location.origin}/invite/${data.data.token}`);
      fetchInvites();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (invitationId: string, email: string) => {
    if (!currentOrg) return;
    try {
      const { data } = await api.post(`/organizations/${currentOrg.id}/invitations/${invitationId}/resend`);
      showToast('success', `Refreshed 7-day invitation link for ${email}!`);
      if (data.data?.invitationLink) {
        navigator.clipboard.writeText(data.data.invitationLink);
        showToast('info', 'New invitation link copied to clipboard!');
      }
      fetchInvites();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to resend invite');
    }
  };

  const handleRevoke = async (invitationId: string, email: string) => {
    if (!currentOrg) return;
    if (!confirm(`Revoke invitation for ${email}?`)) return;

    try {
      await api.delete(`/organizations/${currentOrg.id}/invitations/${invitationId}`);
      showToast('success', `Invitation for ${email} revoked.`);
      fetchInvites();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to revoke invite');
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setHasCopied(true);
    showToast('success', 'Invitation URL copied to clipboard!');
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>Workspace Invitations</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage pending team invites and send collaboration links
          </p>
        </div>

        {hasPermission('MEMBER_INVITE') && (
          <button className="btn btn-primary" onClick={() => { setIsInviteModalOpen(true); setGeneratedLink(null); }}>
            <Plus size={16} />
            <span>Invite Collaborator</span>
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)' }}>
              <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Invited Email</th>
              <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Role</th>
              <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expires</th>
              <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Loading invitations...
                </td>
              </tr>
            ) : invites.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No pending invitations found.
                </td>
              </tr>
            ) : (

              invites.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px 20px', fontWeight: '600', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={16} color="var(--primary)" />
                      <span>{inv.email}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className="badge badge-primary">{inv.role}</span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} />
                      <span>{new Date(inv.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleResend(inv.id, inv.email)}
                        title="Extend 7-day expiration & refresh link"
                      >
                        <RotateCw size={14} />
                        <span>Refresh Link</span>
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRevoke(inv.id, inv.email)}
                        style={{ color: 'var(--rose)' }}
                        title="Revoke invitation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsInviteModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>Invite Collaborator</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Send an invite link to join {currentOrg?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {generatedLink ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <Check size={36} color="var(--emerald)" style={{ margin: '0 auto 8px auto' }} />
                <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Invitation Ready!</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Share this private 7-day token link with <strong>{inviteEmail}</strong>:
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    marginBottom: '20px',
                  }}
                >
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                    }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => copyLink(generatedLink)}>
                    {hasCopied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{hasCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    setGeneratedLink(null);
                    setInviteEmail('');
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite}>
                <div className="input-group">
                  <label className="input-label">Recipient Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Workspace Role</label>
                  <select
                    className="input-field"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as OrganizationRole)}
                  >
                    {myRole === 'OWNER' && <option value="ADMIN">ADMIN (Workspace Admin)</option>}
                    {(myRole === 'OWNER' || myRole === 'ADMIN') && <option value="MANAGER">MANAGER (Project & Team Manager)</option>}
                    <option value="MEMBER">MEMBER (Contributor)</option>
                    <option value="GUEST">GUEST (Read-only)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsInviteModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting || !inviteEmail.trim()}>
                    {isSubmitting ? 'Generating...' : 'Generate Invite Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
