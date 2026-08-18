import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Users,
  ArrowUpRight,
  Plus,
  Activity,
  Flame,
  UserPlus,
  ChevronDown,
} from 'lucide-react';
import { useOrg } from '../../context';
import api from '../../services/api';
import type { OrgDashboardData, Project } from '../../types';
import {
  BarChart,
  Bar,
  BarXAxis,
  Grid,
  ChartTooltip,
  BarChartLoading,
  LineChart,
  Line,
  LineXAxis,
  LineChartTooltip,
} from '../../components/charts';

export const OrgOverview: React.FC = () => {
  const { currentOrg, myRole } = useOrg();
  const [dashboardData, setDashboardData] = useState<OrgDashboardData | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeSpan, setTimeSpan] = useState<number>(14);
  const [isVelocityLoading, setIsVelocityLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!currentOrg) return;

    Promise.all([
      api.get(`/organizations/${currentOrg.id}/dashboard?days=${timeSpan}`),
      api.get(`/organizations/${currentOrg.id}/projects?limit=6`),
    ])
      .then(([dashRes, projRes]) => {
        if (isMounted) {
          setDashboardData(dashRes.data.data);
          setRecentProjects(projRes.data.data || []);
          setIsLoading(false);
          setIsVelocityLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
        if (isMounted) {
          setIsLoading(false);
          setIsVelocityLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentOrg, timeSpan]);

  if (!currentOrg || isLoading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--foreground-secondary)' }}>
        <BarChartLoading aspectRatio="3 / 1" style={{ maxWidth: '900px', margin: '0 auto 24px' }} />
        <div style={{ fontSize: '1rem', fontWeight: '600' }}>Loading workspace intelligence...</div>
      </div>
    );
  }

  const summary = dashboardData?.summary;
  const velocity = dashboardData?.velocity || [];
  const workload = dashboardData?.workload || [];
  const activities = dashboardData?.recentActivities || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Hero Welcome Banner */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-primary">{myRole}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>Workspace Intelligence</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '4px', color: 'var(--foreground)' }}>
            {currentOrg.name}
          </h1>
          <p style={{ color: 'var(--foreground-secondary)', fontSize: '0.875rem' }}>
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

      {/* KPI Bento Grid */}
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
            <span style={{ fontSize: '0.8rem', fontWeight: '650', color: 'var(--foreground-secondary)' }}>Active Projects</span>
            <div style={{ color: 'var(--primary-hover)', padding: '6px', background: 'var(--primary-soft)', borderRadius: 'var(--radius-sm)' }}>
              <FolderKanban size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--foreground)' }}>
            {summary?.projects.active || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginTop: '4px' }}>
            {summary?.projects.total || 0} total ({summary?.projects.completed || 0} completed)
          </div>
        </div>

        {/* Task Completion Rate */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '650', color: 'var(--foreground-secondary)' }}>Completion Rate</span>
            <div style={{ color: '#52755A', padding: '6px', background: '#E4EEE5', borderRadius: 'var(--radius-sm)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--foreground)' }}>
            {summary?.tasks.completionRate || 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginTop: '4px' }}>
            {summary?.tasks.completed || 0} of {summary?.tasks.total || 0} tasks done
          </div>
        </div>

        {/* Active In Flight Tasks */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '650', color: 'var(--foreground-secondary)' }}>In Flight Tasks</span>
            <div style={{ color: '#D97706', padding: '6px', background: 'var(--primary-soft)', borderRadius: 'var(--radius-sm)' }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--foreground)' }}>
            {summary?.tasks.active || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginTop: '4px' }}>
            {summary?.tasks.byStatus.IN_PROGRESS || 0} in progress, {summary?.tasks.byStatus.REVIEW || 0} in review
          </div>
        </div>

        {/* Overdue Items Alert */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '650', color: 'var(--foreground-secondary)' }}>Overdue Tasks</span>
            <div style={{ color: summary?.tasks.overdue ? '#9F5141' : 'var(--foreground-muted)', padding: '6px', background: summary?.tasks.overdue ? '#F5E1DB' : 'var(--surface-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: '800',
              color: summary?.tasks.overdue ? '#9F5141' : 'var(--foreground)',
            }}
          >
            {summary?.tasks.overdue || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginTop: '4px' }}>
            {summary?.tasks.overdue ? 'Requires team attention' : 'All milestones on schedule'}
          </div>
        </div>

        {/* Workspace Team */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '650', color: 'var(--foreground-secondary)' }}>Team Capacity</span>
            <div style={{ color: '#52755A', padding: '6px', background: '#E4EEE5', borderRadius: 'var(--radius-sm)' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--foreground)' }}>
            {summary?.membersCount || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginTop: '4px' }}>
            Across {summary?.teamsCount || 0} functional teams
          </div>
        </div>
      </div>

      {/* Main Grid: Bklit UI Bar Chart & Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '20px' }}>
        {/* Delivery Velocity Bar Chart Card */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '750', color: 'var(--foreground)' }}>
                Delivery Velocity
              </h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--foreground-muted)', marginTop: '2px' }}>
                Daily tasks completed vs. tasks created
              </p>
            </div>

            {/* Time Span Dropdown & Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {/* Custom styled select dropdown */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <select
                  value={timeSpan}
                  onChange={(e) => setTimeSpan(Number(e.target.value))}
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm, 8px)',
                    padding: '5px 28px 5px 12px',
                    fontSize: '0.775rem',
                    fontWeight: '650',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={14}>Last 14 Days</option>
                  <option value={30}>Last 30 Days (1 Mo)</option>
                  <option value={90}>Last 90 Days (3 Mo)</option>
                </select>
                <ChevronDown
                  size={14}
                  color="var(--foreground-secondary)"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Chart Series Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '9px', height: '9px', borderRadius: '2.5px', background: '#F5AE4D' }} />
                  <span style={{ color: 'var(--foreground-secondary)', fontWeight: '600' }}>Completed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '9px', height: '9px', borderRadius: '2.5px', background: '#20201D' }} />
                  <span style={{ color: 'var(--foreground-secondary)', fontWeight: '600' }}>Created</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Visual Chart (BarChart for <= 14 days, LineChart for 30d/90d) */}
          <div style={{ flex: 1, minHeight: '220px', width: '100%', opacity: isVelocityLoading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
            {timeSpan <= 14 ? (
              <BarChart
                data={velocity}
                xDataKey="label"
                aspectRatio="2.3 / 1"
                margin={{ top: 16, right: 12, bottom: 28, left: 16 }}
              >
                <Grid horizontal stroke="var(--border)" />
                <Bar
                  dataKey="completed"
                  fill="#F5AE4D"
                  lineCap="round"
                  animationType="grow"
                />
                <Bar
                  dataKey="created"
                  fill="#20201D"
                  lineCap="round"
                  animationType="grow"
                />
                <BarXAxis step={timeSpan === 14 ? 2 : 1} fontSize={10} />
                <ChartTooltip
                  formatter={(val) => `${val} task${val === 1 ? '' : 's'}`}
                />
              </BarChart>
            ) : (
              <LineChart
                data={velocity}
                xDataKey="label"
                aspectRatio="2.3 / 1"
                margin={{ top: 16, right: 12, bottom: 28, left: 16 }}
              >
                <Grid horizontal stroke="var(--border)" />
                <Line
                  dataKey="completed"
                  stroke="#F5AE4D"
                  strokeWidth={2.5}
                  fill="rgba(245, 174, 77, 0.10)"
                  curve="monotone"
                />
                <Line
                  dataKey="created"
                  stroke="#20201D"
                  strokeWidth={2}
                  fill="rgba(32, 32, 29, 0.04)"
                  curve="monotone"
                />
                <LineXAxis step={timeSpan === 30 ? 4 : 10} fontSize={10} />
                <LineChartTooltip
                  formatter={(val) => `${val} task${val === 1 ? '' : 's'}`}
                />
              </LineChart>
            )}
          </div>
        </div>

        {/* Task Status & Priority Breakdown */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '750', color: 'var(--foreground)' }}>
              Status Breakdown
            </h3>
            <p style={{ fontSize: '0.775rem', color: 'var(--foreground-muted)', marginTop: '2px' }}>
              Current distribution of workspace tasks
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Done', count: summary?.tasks.byStatus.DONE || 0, color: '#719879' },
              { label: 'In Progress', count: summary?.tasks.byStatus.IN_PROGRESS || 0, color: '#F5AE4D' },
              { label: 'In Review', count: summary?.tasks.byStatus.REVIEW || 0, color: '#D9963D' },
              { label: 'To Do', count: summary?.tasks.byStatus.TODO || 0, color: '#9A978D' },
              { label: 'Cancelled', count: summary?.tasks.byStatus.CANCELLED || 0, color: '#C96D57' },
            ].map((st) => {
              const percent = summary?.tasks.total ? Math.round((st.count / summary.tasks.total) * 100) : 0;
              return (
                <div key={st.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--foreground)' }}>{st.label}</span>
                    <span style={{ color: 'var(--foreground-secondary)' }}>{st.count} ({percent}%)</span>
                  </div>
                  <div style={{ height: '6px', width: '100%', background: 'var(--surface-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: st.color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--foreground-secondary)' }}>Story Points Velocity</span>
              <span style={{ fontWeight: '750', color: 'var(--foreground)' }}>
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
              <h3 style={{ fontSize: '1.05rem', fontWeight: '750', color: 'var(--foreground)' }}>
                Team Workload Allocation
              </h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--foreground-muted)', marginTop: '2px' }}>
                Task assignments and in-flight capacity per member
              </p>
            </div>
            <Link to="/organization/members" style={{ fontSize: '0.8rem', color: 'var(--primary-hover)', fontWeight: '650', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Members <ArrowUpRight size={14} />
            </Link>
          </div>

          {workload.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--foreground-muted)', fontSize: '0.85rem' }}>
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
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
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
                          background: 'var(--primary-soft)',
                          color: '#20201D',
                          fontWeight: '750',
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
                      <div style={{ fontSize: '0.875rem', fontWeight: '650', color: 'var(--foreground)' }}>
                        {m.user.name}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--foreground-muted)' }}>
                        {m.role}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '750', color: 'var(--foreground)' }}>
                        {m.assignedTasks} tasks
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: '600' }}>
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
              <h3 style={{ fontSize: '1.05rem', fontWeight: '750', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} color="var(--primary-hover)" /> Activity Stream
              </h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--foreground-muted)', marginTop: '2px' }}>
                Real-time workspace updates
              </p>
            </div>
          </div>

          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--foreground-muted)', fontSize: '0.85rem' }}>
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
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      marginTop: '6px',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--foreground)', lineHeight: 1.4 }}>
                      <strong>{act.user.name}</strong> {act.action.toLowerCase().replace(/_/g, ' ')}{' '}
                      <span style={{ color: 'var(--foreground-secondary)' }}>
                        {act.project?.name || act.task?.title || ''}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)', marginTop: '2px' }}>
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects List */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '750', color: 'var(--foreground)' }}>
              Recent Projects
            </h3>
            <p style={{ fontSize: '0.775rem', color: 'var(--foreground-muted)', marginTop: '2px' }}>
              Latest initiatives in this organization
            </p>
          </div>
          <Link to="/projects" style={{ fontSize: '0.8rem', color: 'var(--primary-hover)', fontWeight: '650', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View all ({summary?.projects.total || 0}) <ArrowUpRight size={14} />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--foreground-muted)', fontSize: '0.85rem' }}>
            No projects created yet.{' '}
            <Link to="/projects" style={{ color: 'var(--primary-hover)', fontWeight: '650' }}>
              Create your first project
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '14px',
            }}
          >
            {recentProjects.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                style={{
                  display: 'block',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '750', fontSize: '0.9rem', color: 'var(--foreground)' }}>
                    {p.name}
                  </div>
                  <span className={`badge ${p.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                    {p.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--foreground-secondary)', lineClamp: 2, marginBottom: '10px' }}>
                  {p.description || 'No description provided'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--foreground-muted)' }}>
                  <span>Key: {p.key}</span>
                  <span>{p.status.toLowerCase()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgOverview;
