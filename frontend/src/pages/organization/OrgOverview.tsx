import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Layers,
  Users,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { useOrg } from '../../context';
import api from '../../services/api';
import type { Project, Team } from '../../types';

export const OrgOverview: React.FC = () => {
  const { currentOrg, myRole } = useOrg();
  const [stats, setStats] = useState({
    projectsCount: 0,
    teamsCount: 0,
    membersCount: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!currentOrg) return;

    Promise.all([
      api.get(`/organizations/${currentOrg.id}/projects?limit=5`),
      api.get(`/organizations/${currentOrg.id}/teams`),
      api.get(`/organizations/${currentOrg.id}/members`),
    ]).then(([projRes, teamsRes, membersRes]) => {
      if (isMounted) {
        setStats({
          projectsCount: projRes.data.meta?.total || projRes.data.data?.length || 0,
          teamsCount: teamsRes.data.data?.length || 0,
          membersCount: membersRes.data.data?.length || 0,
        });
        setRecentProjects(projRes.data.data || []);
        setTeams(teamsRes.data.data || []);
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [currentOrg]);


  if (!currentOrg || isLoading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>Loading workspace overview...</div>;
  }

  return (
    <div>
      {/* Hero Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-primary">{myRole}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Workspace Portal</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{currentOrg.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Multi-tenant project control room & task intelligence
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/projects" className="btn btn-primary">
            <Plus size={16} />
            <span>New Project</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '2rem',
        }}
      >
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Projects</span>
            <div style={{ color: 'var(--primary)' }}><FolderKanban size={20} /></div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800' }}>{stats.projectsCount}</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Functional Teams</span>
            <div style={{ color: 'var(--accent)' }}><Layers size={20} /></div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800' }}>{stats.teamsCount}</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Members</span>
            <div style={{ color: 'var(--emerald)' }}><Users size={20} /></div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800' }}>{stats.membersCount}</div>
        </div>
      </div>

      {/* Projects and Teams Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Recent Projects */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Active Projects</h3>
            <Link to="/projects" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No active projects in this workspace yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentProjects.map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                      }}
                    >
                      {p.key}
                    </span>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{p.name}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`badge badge-${p.priority === 'URGENT' ? 'rose' : p.priority === 'HIGH' ? 'amber' : 'emerald'}`}>
                      {p.priority}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Workspace Teams */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Teams</h3>
            <Link to="/organization/teams" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          {teams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No teams created yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {teams.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t.memberCount || 0} members
                    </div>
                  </div>
                  {t.myRole && (
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                      {t.myRole}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
