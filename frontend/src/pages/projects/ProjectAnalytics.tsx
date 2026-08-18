import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Users,
  Flame,
  ArrowLeft,
  Calendar,
  Layers,
  Kanban,
  ListTodo,
} from 'lucide-react';
import { useOrg } from '../../context';
import api from '../../services/api';
import type { ProjectAnalyticsData } from '../../types';

export const ProjectAnalytics: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentOrg } = useOrg();
  const [data, setData] = useState<ProjectAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!currentOrg || !projectId) return;

    api
      .get(`/organizations/${currentOrg.id}/projects/${projectId}/analytics`)
      .then((res) => {
        if (isMounted) {
          setData(res.data.data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentOrg, projectId]);

  if (isLoading || !data) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '1rem', fontWeight: '600' }}>Loading project analytics...</div>
      </div>
    );
  }

  const { project, metrics, sprints, overdueTasks, memberWorkload, velocity } = data;

  const maxVelocity = Math.max(
    ...velocity.map((v) => Math.max(v.created, v.completed)),
    5
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to={`/projects/${projectId}/board`}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.825rem' }}
          >
            <ArrowLeft size={14} /> Back to Board
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-subtle)',
                color: 'var(--primary)',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                fontSize: '0.85rem',
              }}
            >
              {project.key}
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              {project.name} Analytics
            </h1>
          </div>
        </div>

        {/* Quick Nav Links */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            to={`/projects/${projectId}/board`}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
          >
            <Kanban size={14} /> Board
          </Link>
          <Link
            to={`/projects/${projectId}/tasks`}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
          >
            <ListTodo size={14} /> Tasks
          </Link>
          <Link
            to={`/projects/${projectId}/sprints`}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
          >
            <Layers size={14} /> Sprints
          </Link>
        </div>
      </div>

      {/* Project Progress Hero Banner */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className={`badge badge-${project.priority === 'URGENT' ? 'rose' : project.priority === 'HIGH' ? 'amber' : 'emerald'}`}>
                {project.priority} Priority
              </span>
              <span className="badge badge-primary">{project.status}</span>
              {project.team && (
                <span className="badge badge-neutral">{project.team.name}</span>
              )}
            </div>
            {project.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                {project.description}
              </p>
            )}
          </div>

          {(project.startDate || project.targetDate) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Calendar size={15} color="var(--primary)" />
              <span>
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Start'} →{' '}
                {project.targetDate ? new Date(project.targetDate).toLocaleDateString() : 'Ongoing'}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              Overall Project Completion
            </span>
            <span style={{ fontWeight: '700', color: 'var(--primary)' }}>
              {metrics.progressPercentage}% ({metrics.completedTasks} / {metrics.totalTasks} tasks)
            </span>
          </div>
          <div style={{ height: '8px', width: '100%', background: 'var(--bg-card)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${metrics.progressPercentage}%`,
                background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
                borderRadius: '4px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Total Tasks</span>
            <div style={{ color: 'var(--primary)', padding: '5px', background: 'var(--primary-subtle)', borderRadius: '4px' }}>
              <FolderKanban size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {metrics.totalTasks}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {metrics.activeTasks} active tasks
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Story Points</span>
            <div style={{ color: '#10b981', padding: '5px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '4px' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {metrics.storyPoints.completed} / {metrics.storyPoints.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Points delivered
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Overdue Items</span>
            <div style={{ color: metrics.overdueCount ? '#f43f5e' : 'var(--text-muted)', padding: '5px', background: metrics.overdueCount ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)', borderRadius: '4px' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: metrics.overdueCount ? '#f43f5e' : 'var(--text-primary)' }}>
            {metrics.overdueCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {metrics.overdueCount > 0 ? 'Action needed' : 'All milestones on time'}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Assigned Team</span>
            <div style={{ color: '#06b6d4', padding: '5px', background: 'rgba(6, 182, 212, 0.12)', borderRadius: '4px' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {project.memberCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Project contributors
          </div>
        </div>
      </div>

      {/* Velocity & Status Distribution Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '20px' }}>
        {/* Project 14-Day Velocity */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Project Delivery Velocity
              </h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Daily task creation vs. completion
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
                      }}
                    />
                    <div
                      style={{
                        width: '40%',
                        maxWidth: '12px',
                        height: `${Math.max(completedHeight, 4)}px`,
                        background: '#10b981',
                        borderRadius: '3px 3px 0 0',
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

        {/* Status Distribution */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Status Breakdown
            </h3>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Tasks across columns
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Done', count: metrics.byStatus.DONE || 0, color: '#10b981' },
              { label: 'In Progress', count: metrics.byStatus.IN_PROGRESS || 0, color: '#3b82f6' },
              { label: 'In Review', count: metrics.byStatus.REVIEW || 0, color: '#8b5cf6' },
              { label: 'To Do', count: metrics.byStatus.TODO || 0, color: '#64748b' },
              { label: 'Cancelled', count: metrics.byStatus.CANCELLED || 0, color: '#f43f5e' },
            ].map((st) => {
              const percent = metrics.totalTasks ? Math.round((st.count / metrics.totalTasks) * 100) : 0;
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
        </div>
      </div>

      {/* Workload & Sprints / Overdue Tasks Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Project Contributor Workload */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Contributor Workload
          </h3>

          {memberWorkload.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No assigned contributors.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {memberWorkload.map((mw) => (
                <div
                  key={mw.user.id}
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
                    {mw.user.avatarUrl ? (
                      <img
                        src={mw.user.avatarUrl}
                        alt={mw.user.name}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'var(--primary-subtle)',
                          color: 'var(--primary)',
                          fontWeight: '700',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {mw.user.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {mw.user.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{mw.role}</div>
                    </div>
                  </div>

                  <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                    {mw.assignedTasks} tasks
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Tasks Attention List */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={16} color="#f43f5e" /> Overdue Items
          </h3>

          {overdueTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No overdue tasks in this project.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {overdueTasks.map((ot) => (
                <div
                  key={ot.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem', flexShrink: 0 }}>
                      {ot.key}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ot.title}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.7rem', color: '#f43f5e', fontWeight: '600', flexShrink: 0, marginLeft: '8px' }}>
                    Due {ot.dueDate ? new Date(ot.dueDate).toLocaleDateString() : 'Past'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sprints Overview */}
      {sprints.length > 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Sprints Performance
              </h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Iteration scopes and milestone progress
              </p>
            </div>
            <Link to={`/projects/${projectId}/sprints`} style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
              Manage Sprints →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {sprints.map((sp) => (
              <div
                key={sp.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {sp.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {sp.taskCount} tasks included
                  </div>
                </div>
                <span className={`badge badge-${sp.status === 'ACTIVE' ? 'primary' : sp.status === 'COMPLETED' ? 'emerald' : 'neutral'}`} style={{ fontSize: '0.7rem' }}>
                  {sp.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
