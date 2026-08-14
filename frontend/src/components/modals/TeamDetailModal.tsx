import React, { useEffect, useState, useCallback } from 'react';
import { X, Layers, UserPlus, Trash2, Crown } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface TeamDetailModalProps {
  teamId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const TeamDetailModal: React.FC<TeamDetailModalProps> = ({ teamId, isOpen, onClose, onRefresh }) => {
  const { currentOrg } = useOrg();

  const { showToast } = useToast();
  const [details, setDetails] = useState<any>(null);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'LEAD' | 'MEMBER'>('MEMBER');
  const [isAdding, setIsAdding] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!currentOrg || !teamId) return;
    try {
      const [teamRes, orgMembersRes] = await Promise.all([
        api.get(`/organizations/${currentOrg.id}/teams/${teamId}`),
        api.get(`/organizations/${currentOrg.id}/members`),
      ]);
      setDetails(teamRes.data.data);
      setOrgMembers(orgMembersRes.data.data);
    } catch {
      // ignore
    }
  }, [currentOrg, teamId]);

  useEffect(() => {
    if (isOpen && teamId) {
      fetchDetails();
    }
  }, [isOpen, teamId, fetchDetails]);

  if (!isOpen || !details) return null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !teamId || !selectedUserId) return;

    setIsAdding(true);
    try {
      await api.post(`/organizations/${currentOrg.id}/teams/${teamId}/members`, {
        userId: selectedUserId,
        role: selectedRole,
      });
      showToast('success', 'Member added to team!');
      setSelectedUserId('');
      fetchDetails();
      onRefresh();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to add member to team');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: 'LEAD' | 'MEMBER') => {
    if (!currentOrg || !teamId) return;
    const newRole = currentRole === 'LEAD' ? 'MEMBER' : 'LEAD';

    try {
      await api.patch(`/organizations/${currentOrg.id}/teams/${teamId}/members/${userId}`, {
        role: newRole,
      });
      showToast('success', `Member role updated to ${newRole}`);
      fetchDetails();
      onRefresh();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!currentOrg || !teamId) return;
    if (!confirm(`Remove ${memberName} from this team?`)) return;

    try {
      await api.delete(`/organizations/${currentOrg.id}/teams/${teamId}/members/${userId}`);
      showToast('success', `${memberName} removed from team.`);
      fetchDetails();
      onRefresh();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteTeam = async () => {
    if (!currentOrg || !teamId) return;
    if (!confirm(`Are you sure you want to delete the "${details.team.name}" team?`)) return;

    try {
      await api.delete(`/organizations/${currentOrg.id}/teams/${teamId}`);
      showToast('success', 'Team deleted successfully');
      onRefresh();
      onClose();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to delete team');
    }
  };

  const existingMemberUserIds = details.members.map((m: any) => m.userId);
  const eligibleOrgMembers = orgMembers.filter((om) => !existingMemberUserIds.includes(om.userId));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(139, 92, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>{details.team.name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {details.team.description || 'No description provided'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Add Member Form */}
        <form onSubmit={handleAddMember} style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Enrol Organization Member
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              className="input-field"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              style={{ flex: 1 }}
            >
              <option value="">-- Choose member --</option>
              {eligibleOrgMembers.map((om) => (
                <option key={om.userId} value={om.userId}>
                  {om.user.name} ({om.user.email})
                </option>
              ))}
            </select>

            <select
              className="input-field"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'LEAD' | 'MEMBER')}
              style={{ width: '110px' }}
            >
              <option value="MEMBER">MEMBER</option>
              <option value="LEAD">LEAD</option>
            </select>

            <button type="submit" className="btn btn-primary btn-sm" disabled={isAdding || !selectedUserId}>
              <UserPlus size={14} />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Members List */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '10px' }}>
            Team Roster ({details.members.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {details.members.map((m: any) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                    }}
                  >
                    {m.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{m.user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.user?.bio || 'Member'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className={`badge ${m.role === 'LEAD' ? 'badge-primary' : 'badge-neutral'}`}
                    onClick={() => handleToggleRole(m.userId, m.role)}
                    title="Click to toggle LEAD / MEMBER"
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {m.role === 'LEAD' && <Crown size={12} />}
                    {m.role}
                  </button>

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleRemoveMember(m.userId, m.user.name)}
                    style={{ color: 'var(--rose)', padding: '4px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <button className="btn btn-danger btn-sm" onClick={handleDeleteTeam}>
            <Trash2 size={14} />
            <span>Delete Team</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
