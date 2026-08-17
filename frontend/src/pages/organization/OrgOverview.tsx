import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Users,
  Layers,
  ArrowUpRight,
  Plus,
  Activity,
  Flame,
  UserPlus,
} from 'lucide-react';
import { useOrg } from '../../context';
import api from '../../services/api';
import type { OrgDashboardData, Project } from '../../types';

export const OrgOverview: React.FC = () => {
  const { currentOrg, myRole } = useOrg();
  const [dashboardData, setDashboardData] = useState<OrgDashboardData | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!currentOrg) return;

    Promise.all([
      api.get(`/organizations/${currentOrg.id}/dashboard`),
      api.get(`/organizations/${currentOrg.id}/projects?limit=5`),
    ])
      .then(([dashRes, projRes]) => {
        if (isMounted) {
          setDashboardData(dashRes.data.data);
          setRecentProjects(projRes.data.data || []);
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

  if (!currentOrg || isLoading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '1rem', fontWeight: '600' }}>Loading workspace analytics...</div>
      </div>
    );
  }

  const summary = dashboardData?.summary;
  const velocity = dashboardData?.velocity || [];
  const workload = dashboardData?.workload || [];
  const activities = dashboardData?.recentActivities || [];

  // Calculate max velocity for SVG chart scaling
  const maxVelocity = Math.max(
    ...velocity.map((v) => Math.max(v.created, v.completed)),
    5
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Hero Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-primary">{myRole}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Workspace Intelligence</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '4px', color: 'var(--text-primary)' }}>
            {currentOrg.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Real-time delivery KPIs, workload allocation, and execution velocity
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/projects" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} />
            <span>New Project</span>
          </Link>
          {(myRole === 'OWNER' || myRole === 'ADMIN') && (
            <Link
              to="/organization/invitations"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <UserPlus size={16} />
              <span>Invite Team</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Projects KPI */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Active Projects</span>
            <div style={{ color: 'var(--primary)', padding: '6px', background: 'var(--primary-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <FolderKanban size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {summary?.projects.active || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {summary?.projects.total || 0} total ({summary?.projects.completed || 0} completed)
          </div>
        </div>

        {/* Task Completion Rate */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Completion Rate</span>
            <div style={{ color: '#10b981', padding: '6px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: 'var(--radius-sm)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {summary?.tasks.completionRate || 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {summary?.tasks.completed || 0} of {summary?.tasks.total || 0} tasks done
          </div>
        </div>

        {/* Active Work In Progress */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>In Flight Tasks</span>
            <div style={{ color: '#6366f1', padding: '6px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: 'var(--radius-sm)' }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {summary?.tasks.active || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {summary?.tasks.byStatus.IN_PROGRESS || 0} in progress, {summary?.tasks.byStatus.REVIEW || 0} in review
          </div>
        </div>

        {/* Overdue Items Alert */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Overdue Tasks</span>
            <div style={{ color: summary?.tasks.overdue ? '#f43f5e' : 'var(--text-muted)', padding: '6px', background: summary?.tasks.overdue ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: '800',
              color: summary?.tasks.overdue ? '#f43f5e' : 'var(--text-primary)',
            }}
          >
            {summary?.tasks.overdue || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {summary?.tasks.overdue ? 'Requires team attention' : 'All milestones on schedule'}
          </div>
        </div>

        {/* Workspace Team */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Team Capacity</span>
            <div style={{ color: '#06b6d4', padding: '6px', background: 'rgba(6, 182, 212, 0.12)', borderRadius: 'var(--radius-sm)' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {summary?.membersCount || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across {summary?.teamsCount || 0} functional teams
          </div>
        </div>
      </div>

      {/* Main Grid: Velocity Trend & Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '20px' }}>
        {/* 14-Day Delivery Velocity Chart */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                14-Day Delivery Velocity
              </h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Tasks created vs. tasks completed per day
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#6366f1' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Created</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Completed</span>
              </div>
            </div>
          </div>

          {/* SVG Visual Chart */}
          <div style={{ flex: 1, minHeight: '180px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '8px' }}>
            {velocity.map((v) => {
              const createdHeight = Math.round((v.created / maxVelocity) * 130);
              const completedHeight = Math.round((v.completed / maxVelocity) * 130);

              return (
                <div
                  key={v.date}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                  title={`${v.label}: ${v.created} created, ${v.completed} completed`}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', width: '100%', justifyContent: 'center' }}>
                    <div
                      style={{
                        width: '40%',
                        maxWidth: '12px',
                        height: `${Math.max(createdHeight, 4)}px`,
                        background: '#6366f1',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <div
                      style={{
                        width: '40%',
                        maxWidth: '12px',
                        height: `${Math.max(completedHeight, 4)}px`,
                        background: '#10b981',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', transform: 'rotate(-30deg)', transformOrigin: 'top left', whiteSpace: 'nowrap', marginTop: '6px' }}>
                    {v.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Status & Priority Breakdown */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Status Breakdown
            </h3>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Current distribution of workspace tasks
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Done', count: summary?.tasks.byStatus.DONE || 0, color: '#10b981' },
              { label: 'In Progress', count: summary?.tasks.byStatus.IN_PROGRESS || 0, color: '#3b82f6' },
              { label: 'In Review', count: summary?.tasks.byStatus.REVIEW || 0, color: '#8b5cf6' },
              { label: 'To Do', count: summary?.tasks.byStatus.TODO || 0, color: '#64748b' },
              { label: 'Cancelled', count: summary?.tasks.byStatus.CANCELLED || 0, color: '#f43f5e' },
            ].map((st) => {
              const percent = summary?.tasks.total ? Math.round((st.count / summary.tasks.total) * 100) : 0;
              return (
                <div key={st.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{st.label}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{st.count} ({percent}%)</span>
                  </div>
                  <div style={{ height: '6px', width: '100%', background: 'var(--bg-card)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: st.color, borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Story Points Velocity</span>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                {summary?.tasks.storyPoints.completed || 0} / {summary?.tasks.storyPoints.total || 0} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Grid: Team Workload & Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px' }}>
        {/* Team Workload & Allocation */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Team Workload Allocation
              </h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Task assignments and in-flight capacity per member
              </p>
            </div>
            <Link to="/organization/members" style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Members <ArrowUpRight size={14} />
            </Link>
          </div>

          {workload.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No members found in workspace.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {workload.map((m) => (
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
                    {m.user.avatarUrl ? (
                      <img
                        src={m.user.avatarUrl}
                        alt={m.user.name}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--primary-subtle)',
                          color: 'var(--primary)',
                          fontWeight: '700',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {m.user.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {m.user.name}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {m.role}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {m.assignedTasks} tasks
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#3b82f6' }}>
                        {m.inProgressTasks} active / {m.completedTasks} done
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Workspace Activity Feed */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} color="var(--primary)" /> Activity Stream
              </h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Real-time workspace updates
              </p>
            </div>
          </div>

          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No recent activity recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activities.slice(0, 7).map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {act.user?.name?.charAt(0) || 'U'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.3' }}>
                      <span style={{ fontWeight: '600' }}>{act.user?.name}</span>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {act.action.toLowerCase().replace(/_/g, ' ')}
                      </span>{' '}
                      {act.task && (
                        <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                          {act.task.key}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(act.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects Row */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>Active Projects</h3>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Quick access to project sprint boards and backlogs
            </p>
          </div>
          <Link to="/projects" style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            All Projects <ArrowUpRight size={14} />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No projects in this workspace yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {recentProjects.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}/board`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '3px 7px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--primary-subtle)',
                        color: 'var(--primary)',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                      }}
                    >
                      {p.key}
                    </span>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{p.name}</span>
                  </div>
                  <span className={`badge badge-${p.priority === 'URGENT' ? 'rose' : p.priority === 'HIGH' ? 'amber' : 'emerald'}`} style={{ fontSize: '0.65rem' }}>
                    {p.priority}
                  </span>
                </div>

                {p.description && (
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.description}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Layers size={13} /> {p.status}
                  </span>
                  <span>View Board →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
