import React, { useEffect, useState, useCallback } from 'react';
import { Layers, Plus, Users, Crown, ArrowRight } from 'lucide-react';
import { useOrg } from '../../context';
import { CreateTeamModal } from '../../components/modals/CreateTeamModal';
import { TeamDetailModal } from '../../components/modals/TeamDetailModal';
import api from '../../services/api';
import type { Team } from '../../types';

export const TeamList: React.FC = () => {
  const { currentOrg, hasPermission } = useOrg();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!currentOrg) return;
    try {
      const { data } = await api.get(`/organizations/${currentOrg.id}/teams`);
      setTeams(data.data || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    let isMounted = true;
    if (!currentOrg) return;

    api.get(`/organizations/${currentOrg.id}/teams`).then((res) => {
      if (isMounted) {
        setTeams(res.data.data || []);
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [currentOrg]);


  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>Teams Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Functional departments and cross-functional teams in {currentOrg?.name}
          </p>
        </div>

        {hasPermission('TEAM_MANAGE') && (
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} />
            <span>Create Team</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
          Loading teams...
        </div>
      ) : teams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Layers size={40} color="var(--accent)" style={{ margin: '0 auto 14px auto' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>No teams created yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
            Group workspace members into specialized teams for projects and permissions.
          </p>
          {hasPermission('TEAM_MANAGE') && (
            <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} />
              <span>Create First Team</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {teams.map((t) => (
            <div
              key={t.id}
              className="card card-hoverable"
              onClick={() => setSelectedTeamId(t.id)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(139, 92, 246, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent)',
                      }}
                    >
                      <Layers size={18} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem' }}>{t.name}</h3>
                  </div>

                  {t.myRole && (
                    <span className="badge badge-primary">
                      {t.myRole === 'LEAD' && <Crown size={12} />}
                      {t.myRole}
                    </span>
                  )}
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px', minHeight: '40px' }}>
                  {t.description || 'No description provided.'}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} />
                  <span>{t.memberCount || 0} Members</span>
                </div>
                <span style={{ color: 'var(--primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Manage Roster <ArrowRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchTeams}
      />

      <TeamDetailModal
        teamId={selectedTeamId}
        isOpen={!!selectedTeamId}
        onClose={() => setSelectedTeamId(null)}
        onRefresh={fetchTeams}
      />
    </div>
  );
};
