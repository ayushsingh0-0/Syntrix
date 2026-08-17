import React, { useEffect, useState, useCallback } from 'react';
import { UserMinus, Users, ShieldCheck, Mail } from 'lucide-react';
import { useOrg, useAuth, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import { DataTable, type DataTableColumn } from '../../components/common/DataTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/common/Button';
import type { OrganizationMember, OrganizationRole } from '../../types';

export const OrgMembers: React.FC = () => {
  const { currentOrg, hasPermission, myRole } = useOrg();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Remove confirmation state
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!currentOrg) return;
    try {
      const { data } = await api.get(`/organizations/${currentOrg.id}/members`);
      setMembers(data.data || []);
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
      .get(`/organizations/${currentOrg.id}/members`)
      .then((res) => {
        if (isMounted) {
          setMembers(res.data.data || []);
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

  const handleRoleChange = async (userId: string, newRole: OrganizationRole) => {
    if (!currentOrg) return;
    try {
      await api.patch(`/organizations/${currentOrg.id}/members/${userId}`, { role: newRole });
      showToast('success', 'Member role updated successfully!');
      fetchMembers();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to update member role'));
    }
  };

  const confirmRemoveMember = async () => {
    if (!currentOrg || !memberToRemove) return;
    setIsRemoving(true);
    try {
      await api.delete(`/organizations/${currentOrg.id}/members/${memberToRemove.id}`);
      showToast('success', `${memberToRemove.name} removed from workspace.`);
      setMemberToRemove(null);
      fetchMembers();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to remove member'));
    } finally {
      setIsRemoving(false);
    }
  };

  const canManageRole = hasPermission('MEMBER_ROLE_UPDATE');
  const canRemoveMember = hasPermission('MEMBER_REMOVE');

  const columns: DataTableColumn<OrganizationMember>[] = [
    {
      key: 'user',
      header: 'Member',
      render: (m) => {
        const isSelf = m.userId === currentUser?.id;
        return (
          <div className="flex items-center gap-3">
            {m.user?.avatarUrl ? (
              <img
                src={m.user.avatarUrl}
                alt={m.user.name}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                {m.user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                <span>{m.user?.name}</span>
                {isSelf && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-medium">
                    You
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">{m.user?.bio || 'Workspace Member'}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'email',
      header: 'Email Address',
      render: (m) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
          <Mail className="w-3.5 h-3.5 text-slate-500" />
          <span>{m.user?.email}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Access Role',
      render: (m) => {
        const isSelf = m.userId === currentUser?.id;
        const isOwner = m.role === 'OWNER';

        if (canManageRole && !isOwner && !isSelf) {
          return (
            <select
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={m.role}
              onChange={(e) => handleRoleChange(m.userId, e.target.value as OrganizationRole)}
            >
              {myRole === 'OWNER' && <option value="ADMIN">ADMIN</option>}
              {(myRole === 'OWNER' || myRole === 'ADMIN') && (
                <option value="MANAGER">MANAGER</option>
              )}
              <option value="MEMBER">MEMBER</option>
              <option value="GUEST">GUEST</option>
            </select>
          );
        }

        const roleStyles = {
          OWNER: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
          ADMIN: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
          MANAGER: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          MEMBER: 'bg-slate-800 text-slate-300 border-slate-700',
          GUEST: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };

        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              roleStyles[m.role as OrganizationRole] || roleStyles.MEMBER
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            {m.role}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (m) => {
        const isSelf = m.userId === currentUser?.id;
        const isOwner = m.role === 'OWNER';

        if (!canRemoveMember || isOwner || isSelf) return null;

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMemberToRemove({ id: m.userId, name: m.user.name })}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
            leftIcon={<UserMinus className="w-3.5 h-3.5" />}
          >
            Remove
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Organization Members</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage team members and assigned access privileges for{' '}
            <span className="text-slate-200 font-semibold">{currentOrg?.name}</span>
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={members}
        isLoading={isLoading}
        emptyTitle="No members enrolled"
        emptyDescription="This workspace currently has no active members."
        emptyIcon={<Users className="w-8 h-8" />}
      />

      <ConfirmDialog
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={confirmRemoveMember}
        isLoading={isRemoving}
        title="Remove Team Member"
        message={`Are you sure you want to revoke ${memberToRemove?.name}'s access to ${currentOrg?.name}? They will no longer be able to view projects or tasks.`}
        confirmText="Remove Member"
        variant="danger"
      />
    </div>
  );
};
