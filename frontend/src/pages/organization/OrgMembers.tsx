import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserMinus, UserPlus, Shield, Users } from 'lucide-react';
import { useOrg, useAuth, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import type { OrganizationMember, OrganizationRole } from '../../types';

export const OrgMembers: React.FC = () => {
  const { currentOrg, hasPermission, myRole } = useOrg();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = async () => {
    if (!currentOrg) return;
    try {
      const { data } = await api.get(`/organizations/${currentOrg.id}/members`);
      setMembers(data.data || []);
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

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!currentOrg) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from this organization?`)) return;

    try {
      await api.delete(`/organizations/${currentOrg.id}/members/${userId}`);
      showToast('success', `${memberName} removed from workspace.`);
      fetchMembers();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to remove member'));
    }
  };

  const canManageRole = hasPermission('MEMBER_ROLE_UPDATE');
  const canRemoveMember = hasPermission('MEMBER_REMOVE');
  const canInvite = hasPermission('MEMBER_INVITE');

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
            <Users size={20} color="var(--primary, #F5AE4D)" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)' }}>
              Workspace Members
            </h1>
          </div>
          <p style={{ color: 'var(--foreground-secondary)', fontSize: '0.875rem' }}>
            Manage team access levels, roles, and privileges for {currentOrg?.name}
          </p>
        </div>

        {canInvite && (
          <Link
            to="/organization/invitations"
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 700,
            }}
          >
            <UserPlus size={16} />
            <span>Invite New Member</span>
          </Link>
        )}
      </div>

      {/* Members Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Member
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Email
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Role
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
                  Loading workspace members...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--foreground-muted)', fontSize: '0.875rem' }}>
                  No members found.
                </td>
              </tr>
            ) : (
              members.map((m) => {
                const isSelf = m.userId === currentUser?.id;
                const isOwner = m.role === 'OWNER';

                return (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease',
                      height: '56px',
                    }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {m.user?.avatarUrl ? (
                          <img
                            src={m.user.avatarUrl}
                            alt={m.user.name}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'var(--primary-soft)',
                              color: '#20201D',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 750,
                              fontSize: '0.85rem',
                            }}
                          >
                            {m.user?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 650, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--foreground)' }}>
                            {m.user?.name}
                            {isSelf && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--primary-hover)', fontWeight: 600 }}>
                                (You)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                            {m.user?.bio || 'Workspace Member'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--foreground-secondary)' }}>
                      {m.user?.email}
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      {canManageRole && !isOwner && !isSelf ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.userId, e.target.value as OrganizationRole)}
                            style={{
                              padding: '5px 12px',
                              fontSize: '0.8rem',
                              fontWeight: 650,
                              borderRadius: '8px',
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              color: 'var(--foreground)',
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            {myRole === 'OWNER' && <option value="ADMIN">ADMIN</option>}
                            {(myRole === 'OWNER' || myRole === 'ADMIN') && <option value="MANAGER">MANAGER</option>}
                            <option value="MEMBER">MEMBER</option>
                            <option value="GUEST">GUEST</option>
                          </select>
                        </div>
                      ) : (
                        <span
                          className={`badge ${
                            isOwner
                              ? 'badge-primary'
                              : m.role === 'ADMIN'
                              ? 'badge-warning'
                              : 'badge-neutral'
                          }`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          {isOwner && <Shield size={12} />}
                          {m.role}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      {canRemoveMember && !isOwner && !isSelf && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleRemoveMember(m.userId, m.user.name)}
                          style={{
                            color: '#9F5141',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                          }}
                        >
                          <UserMinus size={14} />
                          <span>Remove</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrgMembers;
