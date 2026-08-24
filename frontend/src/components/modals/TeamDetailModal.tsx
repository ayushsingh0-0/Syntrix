import React, { useEffect, useState } from 'react';
import {
  Layers,
  UserPlus,
  Trash2,
  Crown,
  Search,
  Users,
} from 'lucide-react';
import { useOrg, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Team, TeamMember, TeamRole, OrganizationMember } from '../../types';

interface TeamDetailModalProps {
  teamId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

interface TeamDetailResponse {
  team: Team;
  members: TeamMember[];
}

export const TeamDetailModal: React.FC<TeamDetailModalProps> = ({ teamId, isOpen, onClose, onRefresh }) => {
  const { currentOrg, hasPermission } = useOrg();
  const { showToast } = useToast();
  const [details, setDetails] = useState<TeamDetailResponse | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<TeamRole>('MEMBER');
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && teamId && currentOrg) {
      Promise.all([
        api.get(`/organizations/${currentOrg.id}/teams/${teamId}`),
        api.get(`/organizations/${currentOrg.id}/members`),
      ])
        .then(([teamRes, orgMembersRes]) => {
          if (isMounted) {
            setDetails(teamRes.data.data);
            setOrgMembers(orgMembersRes.data.data || []);
          }
        })
        .catch((err: unknown) => {
          if (isMounted) {
            showToast('error', getErrorMessage(err, 'Failed to fetch team details'));
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, teamId, currentOrg, showToast]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !teamId || !selectedUserId) return;

    setIsAdding(true);
    try {
      await api.post(`/organizations/${currentOrg.id}/teams/${teamId}/members`, {
        userId: selectedUserId,
        role: selectedRole,
      });
      showToast('success', 'Member added to team roster!');
      setSelectedUserId('');
      const teamRes = await api.get(`/organizations/${currentOrg.id}/teams/${teamId}`);
      setDetails(teamRes.data.data);
      onRefresh();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to add member to team'));
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleRole = async (userId: string, newRole: TeamRole) => {
    if (!currentOrg || !teamId) return;

    try {
      await api.patch(`/organizations/${currentOrg.id}/teams/${teamId}/members/${userId}`, {
        role: newRole,
      });
      showToast('success', `Member role updated to ${newRole}`);
      const teamRes = await api.get(`/organizations/${currentOrg.id}/teams/${teamId}`);
      setDetails(teamRes.data.data);
      onRefresh();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to update role'));
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!currentOrg || !teamId) return;
    if (!confirm(`Remove ${memberName} from this team?`)) return;

    try {
      await api.delete(`/organizations/${currentOrg.id}/teams/${teamId}/members/${userId}`);
      showToast('success', `${memberName} removed from team.`);
      const teamRes = await api.get(`/organizations/${currentOrg.id}/teams/${teamId}`);
      setDetails(teamRes.data.data);
      onRefresh();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to remove member'));
    }
  };

  const handleDeleteTeam = async () => {
    if (!currentOrg || !teamId || !details) return;
    if (!confirm(`Are you sure you want to permanently delete "${details.team.name}"?`)) return;

    setIsDeletingTeam(true);
    try {
      await api.delete(`/organizations/${currentOrg.id}/teams/${teamId}`);
      showToast('success', 'Team deleted successfully');
      onRefresh();
      onClose();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to delete team'));
    } finally {
      setIsDeletingTeam(false);
    }
  };

  if (!isOpen || !details) return null;

  const existingMemberUserIds = details.members.map((m) => m.userId);
  const eligibleOrgMembers = orgMembers.filter((om) => !existingMemberUserIds.includes(om.userId));

  const filteredMembers = details.members.filter((m) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.user?.name?.toLowerCase().includes(query) ||
      m.user?.email?.toLowerCase().includes(query) ||
      m.user?.bio?.toLowerCase().includes(query)
    );
  });

  const canManageTeam = hasPermission('TEAM_MANAGE');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title=""
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          {canManageTeam ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleDeleteTeam}
              disabled={isDeletingTeam}
              style={{
                color: 'var(--error, #C96D57)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
              }}
            >
              <Trash2 size={14} />
              <span>Delete Team</span>
            </button>
          ) : <div />}

          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Team Banner Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-subtle, #EEEADF)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'var(--primary-soft, #FCE5C2)',
                color: '#20201D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(245, 174, 77, 0.2)',
              }}
            >
              <Layers size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--foreground, #20201D)', margin: 0 }}>
                  {details.team.name}
                </h2>
                <span
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: 750,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'var(--surface-secondary, #EEEADF)',
                    color: 'var(--foreground-secondary, #77756D)',
                    border: '1px solid var(--border, #DDD9CC)',
                  }}
                >
                  {details.members.length} Members
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--foreground-secondary, #77756D)', margin: '4px 0 0 0' }}>
                {details.team.description || 'Department and cross-functional team roster'}
              </p>
            </div>
          </div>
        </div>

        {/* Enrollment Card */}
        {canManageTeam && eligibleOrgMembers.length > 0 && (
          <form
            onSubmit={handleAddMember}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '16px',
              borderRadius: '14px',
              background: 'var(--surface-secondary, #EEEADF)',
              border: '1px solid var(--border, #DDD9CC)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 750, color: 'var(--foreground, #20201D)' }}>
              <UserPlus size={15} color="var(--primary-hover, #E99532)" />
              <span>Enrol Organization Member</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select
                className="input-field"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                style={{
                  flex: '1 1 240px',
                  background: 'var(--surface, #FFFDF8)',
                  borderColor: 'var(--border, #DDD9CC)',
                  height: '40px',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                }}
              >
                <option value="">-- Select organization member --</option>
                {eligibleOrgMembers.map((om) => (
                  <option key={om.userId} value={om.userId}>
                    {om.user?.name} ({om.user?.email})
                  </option>
                ))}
              </select>

              <select
                className="input-field"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as TeamRole)}
                style={{
                  width: '120px',
                  background: 'var(--surface, #FFFDF8)',
                  borderColor: 'var(--border, #DDD9CC)',
                  height: '40px',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                }}
              >
                <option value="MEMBER">MEMBER</option>
                <option value="LEAD">LEAD</option>
              </select>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isAdding}
                disabled={!selectedUserId}
                leftIcon={<UserPlus size={15} />}
                style={{ height: '40px' }}
              >
                Enrol Member
              </Button>
            </div>
          </form>
        )}

        {/* Roster Search & Filter Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--foreground, #20201D)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} color="var(--primary, #F5AE4D)" />
            <span>Active Team Roster</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground-muted, #77756D)' }}>
              ({filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'})
            </span>
          </div>

          <div
            style={{
              position: 'relative',
              width: '200px',
            }}
          >
            <Search
              size={14}
              color="var(--foreground-muted, #77756D)"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search roster..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                fontSize: '0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border, #DDD9CC)',
                background: 'var(--surface, #FFFDF8)',
                color: 'var(--foreground, #20201D)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Roster Table / List */}
        <div
          style={{
            background: 'var(--surface, #FFFDF8)',
            border: '1px solid var(--border, #DDD9CC)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          {filteredMembers.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--foreground-muted, #77756D)', fontSize: '0.875rem' }}>
              {searchQuery ? 'No team members matching your search.' : 'No members enrolled in this team yet.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface-secondary, #EEEADF)', borderBottom: '1px solid var(--border, #DDD9CC)' }}>
                  <th style={{ padding: '10px 16px', fontSize: '0.725rem', fontWeight: 750, color: 'var(--foreground-muted, #77756D)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Member
                  </th>
                  <th style={{ padding: '10px 16px', fontSize: '0.725rem', fontWeight: 750, color: 'var(--foreground-muted, #77756D)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Team Role
                  </th>
                  <th style={{ padding: '10px 16px', fontSize: '0.725rem', fontWeight: 750, color: 'var(--foreground-muted, #77756D)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => {
                  const isLead = m.role === 'LEAD';

                  return (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle, #EEEADF)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {m.user?.avatarUrl ? (
                            <img
                              src={m.user.avatarUrl}
                              alt={m.user.name}
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1.5px solid var(--border, #DDD9CC)',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: isLead ? 'var(--primary-soft, #FCE5C2)' : 'var(--surface-secondary, #EEEADF)',
                                color: '#20201D',
                                border: '1px solid var(--border, #DDD9CC)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 750,
                                fontSize: '0.85rem',
                              }}
                            >
                              {m.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--foreground, #20201D)' }}>
                              {m.user?.name}
                            </div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--foreground-muted, #77756D)' }}>
                              {m.user?.bio || m.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {canManageTeam ? (
                          <select
                            value={m.role}
                            onChange={(e) => handleToggleRole(m.userId, e.target.value as TeamRole)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              borderRadius: '8px',
                              border: isLead ? '1px solid var(--primary, #F5AE4D)' : '1px solid var(--border, #DDD9CC)',
                              background: isLead ? 'var(--primary-soft, #FCE5C2)' : 'var(--surface-secondary, #EEEADF)',
                              color: '#20201D',
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            <option value="MEMBER">MEMBER</option>
                            <option value="LEAD">👑 LEAD</option>
                          </select>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: isLead ? 'var(--primary-soft, #FCE5C2)' : 'var(--surface-secondary, #EEEADF)',
                              color: '#20201D',
                            }}
                          >
                            {isLead && <Crown size={12} color="#986A25" />}
                            <span>{m.role}</span>
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {canManageTeam && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.userId, m.user?.name || 'Member')}
                            title="Remove from team"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--foreground-muted, #77756D)',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.color = '#9F5141';
                              (e.currentTarget as HTMLElement).style.background = '#F5E1DB';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.color = 'var(--foreground-muted, #77756D)';
                              (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
};
