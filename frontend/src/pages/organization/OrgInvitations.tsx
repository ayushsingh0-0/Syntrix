import React, { useEffect, useState, useCallback } from 'react';
import { UserPlus, Mail, RotateCw, Trash2, Copy, Check, Clock, Plus } from 'lucide-react';
import { useOrg, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import { DataTable, type DataTableColumn } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/common/Button';
import { FormField, Input, Select } from '../../components/common/FormComponents';
import type { Invitation, OrganizationRole } from '../../types';

export const OrgInvitations: React.FC = () => {
  const { currentOrg, hasPermission, myRole } = useOrg();
  const { showToast } = useToast();
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationRole>('MEMBER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Revoke Confirmation State
  const [inviteToRevoke, setInviteToRevoke] = useState<{ id: string; email: string } | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchInvites = useCallback(async () => {
    if (!currentOrg) return;
    try {
      const { data } = await api.get(`/organizations/${currentOrg.id}/invitations`);
      setInvites(data.data || []);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg]);

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
    if (!currentOrg || !inviteEmail.trim()) return;

    setIsSubmitting(true);
    try {
      const { data } = await api.post(`/organizations/${currentOrg.id}/invitations`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      showToast('success', `Invitation generated for ${inviteEmail}!`);
      setGeneratedLink(
        data.data.invitationLink || `${window.location.origin}/invite/${data.data.token}`
      );
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
      const { data } = await api.post(
        `/organizations/${currentOrg.id}/invitations/${invitationId}/resend`
      );
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

  const confirmRevokeInvite = async () => {
    if (!currentOrg || !inviteToRevoke) return;
    setIsRevoking(true);
    try {
      await api.delete(`/organizations/${currentOrg.id}/invitations/${inviteToRevoke.id}`);
      showToast('success', `Invitation for ${inviteToRevoke.email} revoked.`);
      setInviteToRevoke(null);
      fetchInvites();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to revoke invite'));
    } finally {
      setIsRevoking(false);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setHasCopied(true);
    showToast('success', 'Invitation URL copied to clipboard!');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const columns: DataTableColumn<Invitation>[] = [
    {
      key: 'email',
      header: 'Invited Email',
      render: (inv) => (
        <div className="flex items-center gap-2.5 font-semibold text-sm text-slate-100">
          <Mail className="w-4 h-4 text-indigo-400" />
          <span>{inv.email}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (inv) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          {inv.role}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      header: 'Expiration',
      render: (inv) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{new Date(inv.expiresAt).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (inv) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleResend(inv.id, inv.email);
            }}
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setInviteToRevoke({ id: inv.id, email: inv.email });
            }}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const roleOptions = [
    ...(myRole === 'OWNER' ? [{ value: 'ADMIN', label: 'ADMIN (Workspace Admin)' }] : []),
    ...(myRole === 'OWNER' || myRole === 'ADMIN'
      ? [{ value: 'MANAGER', label: 'MANAGER (Project & Team Manager)' }]
      : []),
    { value: 'MEMBER', label: 'MEMBER (Contributor)' },
    { value: 'GUEST', label: 'GUEST (Read-only)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Workspace Invitations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage pending team invites and send collaboration tokens for{' '}
            <span className="text-slate-200 font-semibold">{currentOrg?.name}</span>
          </p>
        </div>

        {hasPermission('MEMBER_INVITE') && (
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setIsInviteModalOpen(true);
              setGeneratedLink(null);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Invite Collaborator
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={invites}
        isLoading={isLoading}
        emptyTitle="No pending invitations"
        emptyDescription="All team members have enrolled or no invitation links are active."
        emptyIcon={<Mail className="w-8 h-8" />}
      />

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Collaborator"
        subtitle={`Send a secure 7-day invite link to join ${currentOrg?.name}`}
      >
        {generatedLink ? (
          <div className="text-center py-2 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto ring-1 ring-emerald-500/20">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-100">Invitation Link Ready!</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Share this private token link with <strong className="text-slate-200">{inviteEmail}</strong>:
            </p>

            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 bg-transparent text-xs text-indigo-300 font-mono outline-none truncate"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => copyLink(generatedLink)}
                leftIcon={hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {hasCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => {
                setIsInviteModalOpen(false);
                setGeneratedLink(null);
                setInviteEmail('');
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSendInvite} className="space-y-4">
            <FormField label="Recipient Email" required>
              <Input
                type="email"
                placeholder="teammate@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
                autoFocus
              />
            </FormField>

            <FormField label="Workspace Role" required>
              <Select
                options={roleOptions}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrganizationRole)}
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" size="md" onClick={() => setIsInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={!inviteEmail.trim()}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Generate Invite Link
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Revoke Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(inviteToRevoke)}
        onClose={() => setInviteToRevoke(null)}
        onConfirm={confirmRevokeInvite}
        isLoading={isRevoking}
        title="Revoke Invitation"
        message={`Are you sure you want to cancel the pending invite for ${inviteToRevoke?.email}? This token will immediately expire.`}
        confirmText="Revoke Link"
        variant="danger"
      />
    </div>
  );
};
