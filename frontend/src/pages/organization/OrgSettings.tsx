import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Trash2, ArrowRightLeft, ShieldAlert, Building2 } from 'lucide-react';
import { useOrg, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import { Button } from '../../components/common/Button';
import { FormField, Input, Select } from '../../components/common/FormComponents';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import type { OrganizationMember } from '../../types';

export const OrgSettings: React.FC = () => {
  const { currentOrg, myRole, hasPermission, refreshOrgs } = useOrg();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(currentOrg?.name || '');
  const [logoUrl, setLogoUrl] = useState(currentOrg?.logoUrl || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Transfer Ownership
  const [newOwnerUserId, setNewOwnerUserId] = useState('');
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  // Delete Workspace
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (currentOrg) {
      api
        .get(`/organizations/${currentOrg.id}/members`)
        .then((res) => {
          if (isMounted) {
            setMembers(res.data.data || []);
          }
        })
        .catch(() => {
          // silent
        });
    }
    return () => {
      isMounted = false;
    };
  }, [currentOrg]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    setIsUpdating(true);
    try {
      await api.put(`/organizations/${currentOrg.id}`, {
        name: name.trim(),
        logoUrl: logoUrl.trim() || null,
      });
      showToast('success', 'Workspace settings updated successfully!');
      await refreshOrgs();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to update workspace'));
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmTransferOwnership = async () => {
    if (!currentOrg || !newOwnerUserId) return;

    setIsTransferring(true);
    try {
      await api.post(`/organizations/${currentOrg.id}/transfer-ownership`, {
        newOwnerUserId,
      });
      showToast('success', 'Organization ownership transferred successfully!');
      setIsTransferDialogOpen(false);
      await refreshOrgs();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to transfer ownership'));
    } finally {
      setIsTransferring(false);
    }
  };

  const confirmDeleteOrg = async () => {
    if (!currentOrg) return;
    setIsDeleting(true);
    try {
      await api.delete(`/organizations/${currentOrg.id}`);
      showToast('success', 'Organization deleted.');
      setIsDeleteDialogOpen(false);
      await refreshOrgs();
      navigate('/');
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to delete organization'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentOrg) return null;

  const memberOptions = [
    { value: '', label: '-- Choose an active member --' },
    ...members
      .filter((m) => m.role !== 'OWNER')
      .map((m) => ({
        value: m.userId,
        label: `${m.user.name} (${m.user.email}) — ${m.role}`,
      })),
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Organization Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage workspace branding, identifiers, ownership, and destruction controls for{' '}
          <span className="text-slate-200 font-semibold">{currentOrg.name}</span>
        </p>
      </div>

      {/* General Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-400" />
          <span>Workspace Details</span>
        </h3>

        <form onSubmit={handleUpdate} className="space-y-4">
          <FormField label="Workspace Name" required>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={!hasPermission('ORG_UPDATE')}
            />
          </FormField>

          <FormField label="Workspace Slug (Unique URI Identifier)">
            <Input
              type="text"
              value={currentOrg.slug}
              disabled
              className="opacity-70 font-mono text-slate-400 cursor-not-allowed"
            />
          </FormField>

          <FormField label="Logo Image URL">
            <Input
              type="url"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              disabled={!hasPermission('ORG_UPDATE')}
            />
          </FormField>

          {hasPermission('ORG_UPDATE') && (
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isUpdating}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Settings
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Transfer Ownership (OWNER only) */}
      {myRole === 'OWNER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-violet-400" />
              <span>Transfer Ownership</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Transfer primary ownership of this organization to another active member. You will
              automatically retain ADMIN privileges.
            </p>
          </div>

          <FormField label="Select Successor Member" required>
            <Select
              options={memberOptions}
              value={newOwnerUserId}
              onChange={(e) => setNewOwnerUserId(e.target.value)}
            />
          </FormField>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={!newOwnerUserId}
              onClick={() => setIsTransferDialogOpen(true)}
              leftIcon={<ArrowRightLeft className="w-4 h-4" />}
            >
              Transfer Ownership
            </Button>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      {myRole === 'OWNER' && (
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2.5 text-rose-400 font-semibold">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-base">Danger Zone</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Permanently delete this organization, including all associated teams, projects, task
            boards, and member records. This action is irreversible.
          </p>

          <div className="flex justify-end pt-2">
            <Button
              variant="danger"
              size="md"
              onClick={() => setIsDeleteDialogOpen(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Organization
            </Button>
          </div>
        </div>
      )}

      {/* Transfer Ownership Dialog */}
      <ConfirmDialog
        isOpen={isTransferDialogOpen}
        onClose={() => setIsTransferDialogOpen(false)}
        onConfirm={confirmTransferOwnership}
        isLoading={isTransferring}
        title="Confirm Ownership Transfer"
        message="Are you absolutely sure you want to transfer ownership of this workspace? You will be downgraded to ADMIN."
        confirmText="Transfer Ownership"
        variant="warning"
      />

      {/* Delete Workspace Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteOrg}
        isLoading={isDeleting}
        title={`Delete ${currentOrg.name}`}
        message="Are you sure you want to permanently delete this organization and all its data? All projects, tasks, and audit logs will be permanently deleted."
        confirmText="Delete Workspace"
        variant="danger"
      />
    </div>
  );
};
