import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserMinus,
  UserPlus,
  Shield,
  Users,
  Search,
  Crown,
  Copy,
  Check,
} from 'lucide-react';
import { useOrg, useAuth, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import { Button } from '../../components/common/Button';
import type { OrganizationMember, OrganizationRole } from '../../types';

export const OrgMembers: React.FC = () => {
  const { currentOrg, hasPermission, myRole } = useOrg();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

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

  const copyToClipboard = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    showToast('success', `Copied ${email} to clipboard!`);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const canManageRole = hasPermission('MEMBER_ROLE_UPDATE');
  const canRemoveMember = hasPermission('MEMBER_REMOVE');
  const canInvite = hasPermission('MEMBER_INVITE');

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      !searchQuery.trim() ||
      m.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user?.bio?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalMembers = members.length;
  const adminCount = members.filter((m) => m.role === 'OWNER' || m.role === 'ADMIN').length;
  const standardMembers = members.filter((m) => m.role === 'MEMBER' || m.role === 'MANAGER').length;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--primary-soft, #FCE5C2)',
                color: '#20201D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={20} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground, #20201D)', margin: 0 }}>
              Workspace Members
            </h1>
          </div>
          <p style={{ color: 'var(--foreground-secondary, #77756D)', fontSize: '0.875rem', margin: 0 }}>
            Manage team access levels, privileges, and roster roles for {currentOrg?.name}
          </p>
        </div>

        {canInvite && (
          <Link
            to="/organization/invitations"
            style={{ textDecoration: 'none' }}
          >
            <Button
              variant="primary"
              size="md"
              leftIcon={<UserPlus size={16} />}
            >
              Invite New Member
            </Button>
          </Link>
        )}
      </div>

      {/* KPI Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          className="card"
          style={{
            padding: '18px 20px',
            background: 'var(--surface, #FFFDF8)',
            border: '1px solid var(--border, #DDD9CC)',
            borderRadius: '16px',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground-muted, #77756D)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Roster
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--foreground, #20201D)', marginTop: '4px' }}>
            {totalMembers}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--foreground-secondary, #77756D)', marginTop: '2px' }}>
            Active seats enrolled
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '18px 20px',
            background: 'var(--surface, #FFFDF8)',
            border: '1px solid var(--border, #DDD9CC)',
            borderRadius: '16px',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground-muted, #77756D)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Admins & Owners
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#986A25', marginTop: '4px' }}>
            {adminCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--foreground-secondary, #77756D)', marginTop: '2px' }}>
            Full workspace governance
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '18px 20px',
            background: 'var(--surface, #FFFDF8)',
            border: '1px solid var(--border, #DDD9CC)',
            borderRadius: '16px',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground-muted, #77756D)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Standard Members
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#52755A', marginTop: '4px' }}>
            {standardMembers}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--foreground-secondary, #77756D)', marginTop: '2px' }}>
            Collaborating across projects
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          background: 'var(--surface, #FFFDF8)',
          border: '1px solid var(--border, #DDD9CC)',
          borderRadius: '14px',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
          <Search
            size={16}
            color="var(--foreground-muted, #77756D)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search by name, email or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              fontSize: '0.85rem',
              borderRadius: '10px',
              border: '1px solid var(--border, #DDD9CC)',
              background: 'var(--background, #F5F3EB)',
              color: 'var(--foreground, #20201D)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'OWNER', 'ADMIN', 'MANAGER', 'MEMBER'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '8px',
                border: roleFilter === r ? '1px solid var(--primary, #F5AE4D)' : '1px solid var(--border, #DDD9CC)',
                background: roleFilter === r ? 'var(--primary-soft, #FCE5C2)' : 'transparent',
                color: 'var(--foreground, #20201D)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {r === 'ALL' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table Card */}
      <div
        className="card"
        style={{
          padding: 0,
          overflow: 'hidden',
          background: 'var(--surface, #FFFDF8)',
          border: '1px solid var(--border, #DDD9CC)',
          borderRadius: '18px',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-secondary, #EEEADF)', borderBottom: '1px solid var(--border, #DDD9CC)' }}>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 750, color: 'var(--foreground-muted, #77756D)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Member Details
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 750, color: 'var(--foreground-muted, #77756D)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Email Address
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 750, color: 'var(--foreground-muted, #77756D)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Workspace Role
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 750, color: 'var(--foreground-muted, #77756D)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--foreground-muted, #77756D)', fontSize: '0.875rem' }}>
                  Loading workspace members...
                </td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--foreground-muted, #77756D)', fontSize: '0.875rem' }}>
                  {searchQuery || roleFilter !== 'ALL' ? 'No members match the selected filter criteria.' : 'No members found in this workspace.'}
                </td>
              </tr>
            ) : (
              filteredMembers.map((m) => {
                const isSelf = m.userId === currentUser?.id;
                const isOwner = m.role === 'OWNER';
                const isAdmin = m.role === 'ADMIN';

                return (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle, #EEEADF)',
                      transition: 'background 0.15s ease',
                      height: '60px',
                    }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {m.user?.avatarUrl ? (
                          <img
                            src={m.user.avatarUrl}
                            alt={m.user.name}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1.5px solid var(--border, #DDD9CC)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: isOwner ? 'var(--primary-soft, #FCE5C2)' : 'var(--surface-secondary, #EEEADF)',
                              color: '#20201D',
                              border: '1px solid var(--border, #DDD9CC)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 750,
                              fontSize: '0.9rem',
                            }}
                          >
                            {m.user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.925rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--foreground, #20201D)' }}>
                            {m.user?.name}
                            {isSelf && (
                              <span
                                style={{
                                  fontSize: '0.675rem',
                                  fontWeight: 750,
                                  color: '#20201D',
                                  background: 'var(--primary-soft, #FCE5C2)',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(245, 174, 77, 0.4)',
                                }}
                              >
                                YOU
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted, #77756D)' }}>
                            {m.user?.bio || 'Workspace Team Member'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--foreground-secondary, #77756D)' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span>{m.user?.email}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(m.user?.email || '')}
                          title="Copy email"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--foreground-muted, #77756D)',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {copiedEmail === m.user?.email ? <Check size={13} color="#52755A" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      {canManageRole && !isOwner && !isSelf ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.userId, e.target.value as OrganizationRole)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            borderRadius: '8px',
                            background: 'var(--surface, #FFFDF8)',
                            border: '1px solid var(--border, #DDD9CC)',
                            color: 'var(--foreground, #20201D)',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          {myRole === 'OWNER' && <option value="ADMIN">ADMIN</option>}
                          {(myRole === 'OWNER' || myRole === 'ADMIN') && <option value="MANAGER">MANAGER</option>}
                          <option value="MEMBER">MEMBER</option>
                          <option value="GUEST">GUEST</option>
                        </select>
                      ) : (
                        <span
                          className={`badge ${
                            isOwner
                              ? 'badge-primary'
                              : isAdmin
                              ? 'badge-warning'
                              : 'badge-neutral'
                          }`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.725rem',
                            fontWeight: 750,
                            padding: '4px 10px',
                          }}
                        >
                          {isOwner && <Crown size={12} color="#986A25" />}
                          {isAdmin && <Shield size={12} />}
                          <span>{m.role}</span>
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      {canRemoveMember && !isOwner && !isSelf && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleRemoveMember(m.userId, m.user?.name || 'Member')}
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
