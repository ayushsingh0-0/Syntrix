import React, { useEffect, useState } from 'react';
import { UserPlus, Mail, RotateCw, Trash2, Copy, Check, Clock, Plus, X } from 'lucide-react';
import { useOrg, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import type { Invitation, OrganizationRole } from '../../types';

export const OrgInvitations: React.FC = () => {
  const { currentOrg, hasPermission, myRole } = useOrg();
  const { showToast } = useToast();
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationRole>('MEMBER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const fetchInvites = async () => {
    if (!currentOrg) return;
    try {
      const { data } = await api.get(`/organizations/${currentOrg.id}/invitations`);
      setInvites(data.data || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!currentOrg) return;

    api
      .get(`/organizations/${currentOrg.id}/invitations`)
      .then((res) => {
        if (isMounted) {
          setInvites(res.data.data || []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentOrg]);

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
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to send invitation'));
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
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to resend invite'));
    }
  };

  const handleRevoke = async (invitationId: string, email: string) => {
    if (!currentOrg) return;
    if (!confirm(`Revoke invitation for ${email}?`)) return;

    try {
      await api.delete(`/organizations/${currentOrg.id}/invitations/${invitationId}`);
      showToast('success', `Invitation for ${email} revoked.`);
      fetchInvites();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to revoke invite'));
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setHasCopied(true);
    showToast('success', 'Invitation URL copied to clipboard!');
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Mail size={20} color="var(--primary, #F5AE4D)" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)' }}>
              Workspace Invitations
            </h1>
          </div>
          <p style={{ color: 'var(--foreground-secondary)', fontSize: '0.875rem' }}>
            Manage pending collaborator invites and share join links for {currentOrg?.name}
          </p>
        </div>

        {hasPermission('MEMBER_INVITE') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setIsInviteModalOpen(true);
              setGeneratedLink(null);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 700,
            }}
          >
            <Plus size={16} />
            <span>Invite Collaborator</span>
          </button>
        )}
      </div>

      {/* Invitations Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Invited Email
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Assigned Role
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Expires
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--foreground-muted)', fontSize: '0.875rem' }}>
                  Loading invitations...
                </td>
              </tr>
            ) : invites.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--foreground-muted)', fontSize: '0.875rem' }}>
                  No pending invitations found. Send your first invite above.
                </td>
              </tr>
            ) : (
              invites.map((inv) => (
                <tr
                  key={inv.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 0.15s ease',
                    height: '56px',
                  }}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 650, fontSize: '0.9rem', color: 'var(--foreground)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={16} color="var(--primary-hover)" />
                      <span>{inv.email}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className="badge badge-primary">{inv.role}</span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '0.825rem', color: 'var(--foreground-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} />
                      <span>{new Date(inv.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleResend(inv.id, inv.email)}
                        title="Extend 7-day expiration & refresh link"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                        }}
                      >
                        <RotateCw size={13} />
                        <span>Refresh</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRevoke(inv.id, inv.email)}
                        style={{ color: '#9F5141', padding: '6px 10px', borderRadius: '8px' }}
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#20201D',
                  }}
                >
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 750, color: 'var(--foreground)' }}>Invite Collaborator</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
                    Send an invite link to join {currentOrg?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--foreground-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {generatedLink ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: '#E4EEE5',
                    color: '#52755A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <Check size={28} />
                </div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 750, marginBottom: '6px', color: 'var(--foreground)' }}>
                  Invitation Ready!
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--foreground-secondary)', marginBottom: '16px' }}>
                  Share this private 7-day token link with <strong>{inviteEmail}</strong>:
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
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
                      color: 'var(--foreground)',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => copyLink(generatedLink)}
                    style={{ padding: '6px 12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {hasCopied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{hasCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', fontWeight: 650 }}
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

                <div className="input-group" style={{ marginTop: '14px' }}>
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

export default OrgInvitations;
