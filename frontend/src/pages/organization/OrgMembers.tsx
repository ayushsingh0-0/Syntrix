import React, { useEffect, useState, useCallback } from 'react';
import { UserMinus } from 'lucide-react';
import { useOrg, type OrganizationRole } from '../../context/OrgContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const OrgMembers: React.FC = () => {
  const { currentOrg, hasPermission, myRole } = useOrg();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const { data } = await api.get(`/organizations/${currentOrg.id}/members`);
      setMembers(data.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleRoleChange = async (userId: string, newRole: OrganizationRole) => {
    if (!currentOrg) return;
    try {
      await api.patch(`/organizations/${currentOrg.id}/members/${userId}`, { role: newRole });
      showToast('success', 'Member role updated successfully!');
      fetchMembers();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!currentOrg) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from this organization?`)) return;

    try {
      await api.delete(`/organizations/${currentOrg.id}/members/${userId}`);
      showToast('success', `${memberName} removed from workspace.`);
      fetchMembers();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to remove member');
    }
  };

  const canManageRole = hasPermission('MEMBER_ROLE_UPDATE');
  const canRemoveMember = hasPermission('MEMBER_REMOVE');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>Organization Members</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage team members and assigned access privileges for {currentOrg?.name}
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)' }}>
              <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Member</th>
              <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</th>
              <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Loading members...
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
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {m.user?.avatarUrl ? (
                          <img
                            src={m.user.avatarUrl}
                            alt={m.user.name}
                            style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--bg-card-hover)',
                              border: '1px solid var(--border-default)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '0.85rem',
                            }}
                          >
                            {m.user?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {m.user?.name}
                            {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>(You)</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {m.user?.bio || 'Member'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {m.user?.email}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      {canManageRole && !isOwner && !isSelf ? (
                        <select
                          className="input-field"
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.userId, e.target.value as OrganizationRole)}
                          style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                        >
                          {myRole === 'OWNER' && <option value="ADMIN">ADMIN</option>}
                          {(myRole === 'OWNER' || myRole === 'ADMIN') && <option value="MANAGER">MANAGER</option>}
                          <option value="MEMBER">MEMBER</option>
                          <option value="GUEST">GUEST</option>
                        </select>
                      ) : (
                        <span className={`badge badge-${isOwner ? 'primary' : m.role === 'ADMIN' ? 'accent' : 'neutral'}`}>
                          {m.role}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      {canRemoveMember && !isOwner && !isSelf && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleRemoveMember(m.userId, m.user.name)}
                          style={{ color: 'var(--rose)' }}
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
