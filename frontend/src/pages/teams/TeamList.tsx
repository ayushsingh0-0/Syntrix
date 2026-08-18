import React, { useEffect, useState } from 'react';
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

  const fetchTeams = async () => {
    if (!currentOrg) return;
    try {
      const { data } = await api.get(`/organizations/${currentOrg.id}/teams`);
      setTeams(data.data || []);
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
      .get(`/organizations/${currentOrg.id}/teams`)
      .then((res) => {
        if (isMounted) {
          setTeams(res.data.data || []);
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
            <Layers size={20} color="var(--primary, #F5AE4D)" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)' }}>
              Teams Directory
            </h1>
          </div>
          <p style={{ color: 'var(--foreground-secondary)', fontSize: '0.875rem' }}>
            Functional departments and cross-functional teams in {currentOrg?.name}
          </p>
        </div>

        {hasPermission('TEAM_MANAGE') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
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
            <span>Create Team</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--foreground-muted)' }}>
          Loading teams...
        </div>
      ) : teams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--primary-soft)',
              color: '#20201D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Layers size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 750, color: 'var(--foreground)', marginBottom: '6px' }}>
            No teams created yet
          </h3>
          <p style={{ color: 'var(--foreground-secondary)', fontSize: '0.875rem', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px' }}>
            Group workspace members into specialized teams for projects and permissions.
          </p>
          {hasPermission('TEAM_MANAGE') && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
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
              className="card"
              onClick={() => setSelectedTeamId(t.id)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px',
                borderRadius: '18px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                transition: 'all 0.15s ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
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
                      <Layers size={18} />
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 750, color: 'var(--foreground)' }}>{t.name}</h3>
                  </div>

                  {t.myRole && (
                    <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {t.myRole === 'LEAD' && <Crown size={12} />}
                      {t.myRole}
                    </span>
                  )}
                </div>

                <p style={{ color: 'var(--foreground-secondary)', fontSize: '0.85rem', marginBottom: '16px', minHeight: '38px', lineHeight: 1.5 }}>
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
                  color: 'var(--foreground-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} />
                  <span>{t.memberCount || 0} Members</span>
                </div>
                <span style={{ color: 'var(--primary-hover)', fontWeight: '650', display: 'flex', alignItems: 'center', gap: '4px' }}>
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

export default TeamList;
