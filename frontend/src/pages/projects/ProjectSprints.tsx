import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Flame,
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowLeft,
  X,
  Trash2,
  TrendingDown,
  Kanban,
  ListFilter,
  Activity,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useOrg, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import { TaskDetailDrawer } from '../../components/tasks/TaskDetailDrawer';
import type {
  Project,
  Sprint,
  Task,
  BurndownData,
  TaskPriority,
} from '../../types';

export const ProjectSprints: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentOrg, hasPermission } = useOrg();
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Collapsible Sprints state (sprintId -> boolean, true = collapsed)
  const [collapsedSprints, setCollapsedSprints] = useState<Record<string, boolean>>({});

  const toggleSprintCollapse = (sprintId: string) => {
    setCollapsedSprints((prev) => ({
      ...prev,
      [sprintId]: !prev[sprintId],
    }));
  };

  // Burndown State
  const [burndownSprintId, setBurndownSprintId] = useState<string | null>(null);
  const [burndownData, setBurndownData] = useState<BurndownData | null>(null);
  const [isLoadingBurndown, setIsLoadingBurndown] = useState(false);

  // Selected Task for Drawer
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Create Sprint Modal
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [newSprintStartDate, setNewSprintStartDate] = useState('');
  const [newSprintEndDate, setNewSprintEndDate] = useState('');
  const [isSubmittingSprint, setIsSubmittingSprint] = useState(false);

  // Start Sprint Modal
  const [startingSprint, setStartingSprint] = useState<Sprint | null>(null);
  const [startStartDate, setStartStartDate] = useState('');
  const [startEndDate, setStartEndDate] = useState('');
  const [startGoal, setStartGoal] = useState('');

  // Complete Sprint Modal
  const [completingSprint, setCompletingSprint] = useState<Sprint | null>(null);
  const [rolloverTargetId, setRolloverTargetId] = useState<string>('');

  // Inline Quick Backlog Task
  const [newBacklogTitle, setNewBacklogTitle] = useState('');

  const fetchSprintData = useCallback(async () => {
    if (!currentOrg || !projectId) return;
    try {
      const [projRes, sprintsRes, backlogRes] = await Promise.all([
        api.get(`/organizations/${currentOrg.id}/projects/${projectId}`),
        api.get(`/organizations/${currentOrg.id}/projects/${projectId}/sprints`),
        api.get(`/organizations/${currentOrg.id}/projects/${projectId}/sprints/backlog`),
      ]);

      setProject(projRes.data.data);
      setSprints(sprintsRes.data.data || []);
      setBacklogTasks(backlogRes.data.data || []);
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to load sprint planning'));
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, projectId, showToast]);

  useEffect(() => {
    fetchSprintData();
  }, [fetchSprintData]);

  const activeSprint = sprints.find((s) => s.status === 'ACTIVE');
  const plannedSprints = sprints.filter((s) => s.status === 'PLANNED');

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !projectId || !newSprintName.trim()) return;

    setIsSubmittingSprint(true);
    try {
      await api.post(`/organizations/${currentOrg.id}/projects/${projectId}/sprints`, {
        name: newSprintName.trim(),
        goal: newSprintGoal.trim() || null,
        startDate: newSprintStartDate ? new Date(newSprintStartDate).toISOString() : null,
        endDate: newSprintEndDate ? new Date(newSprintEndDate).toISOString() : null,
      });

      showToast('success', 'Sprint created successfully!');
      setIsCreateSprintOpen(false);
      setNewSprintName('');
      setNewSprintGoal('');
      setNewSprintStartDate('');
      setNewSprintEndDate('');
      fetchSprintData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to create sprint'));
    } finally {
      setIsSubmittingSprint(false);
    }
  };

  const handleStartSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !projectId || !startingSprint) return;

    try {
      await api.post(
        `/organizations/${currentOrg.id}/projects/${projectId}/sprints/${startingSprint.id}/start`,
        {
          startDate: new Date(startStartDate).toISOString(),
          endDate: new Date(startEndDate).toISOString(),
          goal: startGoal.trim() || null,
        }
      );

      showToast('success', `Sprint "${startingSprint.name}" is now active!`);
      setStartingSprint(null);
      fetchSprintData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to start sprint'));
    }
  };

  const handleCompleteSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !projectId || !completingSprint) return;

    try {
      await api.post(
        `/organizations/${currentOrg.id}/projects/${projectId}/sprints/${completingSprint.id}/complete`,
        {
          rolloverToSprintId: rolloverTargetId || null,
        }
      );

      showToast('success', `Sprint "${completingSprint.name}" marked as completed.`);
      setCompletingSprint(null);
      fetchSprintData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to complete sprint'));
    }
  };

  const handleAssignTaskToSprint = async (taskId: string, targetSprintId: string | null) => {
    if (!currentOrg || !projectId) return;

    try {
      if (targetSprintId) {
        await api.post(
          `/organizations/${currentOrg.id}/projects/${projectId}/sprints/${targetSprintId}/tasks`,
          { taskIds: [taskId] }
        );
      } else {
        // Move back to backlog
        await api.put(`/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}`, {
          columnId: null,
        });
        // We call task update or sprint unassign
        await api.post(
          `/organizations/${currentOrg.id}/projects/${projectId}/sprints/unassigned/tasks`,
          { taskIds: [taskId] }
        ).catch(async () => {
          // If unassigned endpoint doesn't exist, we can use sprint task assign with null
          fetchSprintData();
        });
      }
      fetchSprintData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to update task sprint'));
    }
  };

  const handleQuickCreateBacklogTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !projectId || !newBacklogTitle.trim()) return;

    try {
      await api.post(`/organizations/${currentOrg.id}/projects/${projectId}/tasks`, {
        title: newBacklogTitle.trim(),
        priority: 'MEDIUM',
      });
      setNewBacklogTitle('');
      fetchSprintData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to create task'));
    }
  };

  const handleDeleteSprint = async (sprintId: string, sprintName: string) => {
    if (!currentOrg || !projectId) return;
    if (!confirm(`Delete sprint "${sprintName}"? Tasks will return to the backlog.`)) return;

    try {
      await api.delete(`/organizations/${currentOrg.id}/projects/${projectId}/sprints/${sprintId}`);
      showToast('success', `Sprint "${sprintName}" deleted.`);
      fetchSprintData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to delete sprint'));
    }
  };

  const handleOpenBurndown = async (sprintId: string) => {
    if (!currentOrg || !projectId) return;
    setBurndownSprintId(sprintId);
    setIsLoadingBurndown(true);

    try {
      const res = await api.get(
        `/organizations/${currentOrg.id}/projects/${projectId}/sprints/${sprintId}/burndown`
      );
      setBurndownData(res.data.data);
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to load burndown chart'));
    } finally {
      setIsLoadingBurndown(false);
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>URGENT</span>;
      case 'HIGH':
        return <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>HIGH</span>;
      case 'MEDIUM':
        return <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>MED</span>;
      case 'LOW':
        return <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>LOW</span>;
    }
  };

  if (isLoading || !project) {
    return <div style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>Loading Agile sprints...</div>;
  }

  return (
    <div>
      {/* Top Header & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Link
              to={`/projects/${project.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--text-muted)',
                fontSize: '0.825rem',
              }}
            >
              <ArrowLeft size={14} />
              <span>{project.name}</span>
            </Link>
            <span style={{ color: 'var(--border-subtle)' }}>/</span>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Sprints & Backlog</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(234, 88, 12, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--amber)',
              }}
            >
              <Flame size={18} />
            </div>
            <h1 style={{ fontSize: '1.6rem' }}>Agile Sprints ({sprints.length})</h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to={`/projects/${project.id}/board`} className="btn btn-secondary btn-sm">
            <Kanban size={14} />
            <span>Kanban Board</span>
          </Link>
          <Link to={`/projects/${project.id}/tasks`} className="btn btn-secondary btn-sm">
            <ListFilter size={14} />
            <span>Tasks</span>
          </Link>

          {hasPermission('PROJECT_UPDATE') && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsCreateSprintOpen(true)}>
              <Plus size={14} />
              <span>Create Sprint</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Sprint Section (Hero Card) */}
      {activeSprint ? (
        <div
          className="card"
          style={{
            marginBottom: '28px',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.06) 0%, var(--bg-card) 100%)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span className="badge badge-emerald" style={{ fontSize: '0.75rem', fontWeight: '800' }}>
                  ACTIVE SPRINT
                </span>
                <h2 style={{ fontSize: '1.3rem' }}>{activeSprint.name}</h2>
              </div>
              {activeSprint.goal && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  🎯 <strong>Goal:</strong> {activeSprint.goal}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleOpenBurndown(activeSprint.id)}
              >
                <TrendingDown size={14} color="var(--primary)" />
                <span>Burndown Chart</span>
              </button>

              {hasPermission('PROJECT_UPDATE') && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setCompletingSprint(activeSprint);
                    if (plannedSprints.length > 0) setRolloverTargetId(plannedSprints[0].id);
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Complete Sprint</span>
                </button>
              )}
            </div>
          </div>

          {/* Sprint Progress Summary */}
          {(() => {
            const totalTasks = activeSprint.tasks.length;
            const completedTasks = activeSprint.tasks.filter((t) => t.status === 'DONE').length;
            const totalPoints = activeSprint.tasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
            const completedPoints = activeSprint.tasks
              .filter((t) => t.status === 'DONE')
              .reduce((sum, t) => sum + (t.storyPoints || 1), 0);
            const percent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

            return (
              <div style={{ background: 'var(--bg-surface)', padding: '14px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Progress: <strong>{completedTasks}/{totalTasks} tasks</strong> ({completedPoints}/{totalPoints} pts)
                  </span>
                  <span style={{ fontWeight: '800', color: 'var(--primary)' }}>{percent}% Completed</span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${percent}%`,
                      background: 'var(--primary)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Active Sprint Tasks List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeSprint.tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.8rem', color: 'var(--primary)' }}>
                    {task.key}
                  </span>
                  <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{task.title}</span>
                  {getPriorityBadge(task.priority)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    className={`badge ${task.status === 'DONE' ? 'badge-emerald' : 'badge-neutral'}`}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {task.status}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                    {task.storyPoints ? `${task.storyPoints} pts` : '1 pt'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="card"
          style={{
            marginBottom: '28px',
            textAlign: 'center',
            padding: '28px',
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-subtle)',
          }}
        >
          <Activity size={28} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>No Active Sprint</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Start a planned sprint below to begin tracking daily velocity and burndown progress.
          </p>
        </div>
      )}

      {/* Planned Sprints List */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--primary)" />
          <span>Planned Sprints ({plannedSprints.length})</span>
        </h2>

        {plannedSprints.length === 0 ? (
          <div className="card" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No planned sprints. Click "Create Sprint" above to plan your next milestone.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {plannedSprints.map((sprint) => {
              const isCollapsed = !!collapsedSprints[sprint.id];
              const sprintPoints = sprint.tasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);

              return (
                <div key={sprint.id} className="card" style={{ padding: '16px', transition: 'all 0.2s ease' }}>
                  <div
                    onClick={() => toggleSprintCollapse(sprint.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h3 style={{ fontSize: '1.1rem' }}>{sprint.name}</h3>
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                            {sprint.tasks.length} tasks • {sprintPoints} pts
                          </span>
                        </div>
                        {sprint.goal && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>🎯 {sprint.goal}</p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      {hasPermission('PROJECT_UPDATE') && (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setStartingSprint(sprint);
                              const nowIso = new Date().toISOString().substring(0, 10);
                              const endIso = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                                .toISOString()
                                .substring(0, 10);
                              setStartStartDate(nowIso);
                              setStartEndDate(endIso);
                              setStartGoal(sprint.goal || '');
                            }}
                          >
                            <Play size={13} />
                            <span>Start Sprint</span>
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDeleteSprint(sprint.id, sprint.name)}
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Tasks inside Planned Sprint */}
                  {!isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                      {sprint.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-surface)',
                            fontSize: '0.825rem',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary)' }}>
                              {task.key}
                            </span>
                            <span>{task.title}</span>
                            {getPriorityBadge(task.priority)}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <select
                              className="input-field"
                              value={task.sprintId || ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleAssignTaskToSprint(task.id, e.target.value || null);
                              }}
                              style={{ width: 'auto', padding: '2px 6px', fontSize: '0.75rem' }}
                            >
                              <option value={sprint.id}>In: {sprint.name}</option>
                              <option value="">Move to Backlog</option>
                              {plannedSprints
                                .filter((ps) => ps.id !== sprint.id)
                                .map((ps) => (
                                  <option key={ps.id} value={ps.id}>
                                    Move to: {ps.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Sprints History Section */}
      {(() => {
        const completedSprints = sprints.filter((s) => s.status === 'COMPLETED');
        if (completedSprints.length === 0) return null;

        return (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--emerald)" />
              <span>Sprint History ({completedSprints.length} Completed)</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {completedSprints.map((sprint) => {
                const isCollapsed = collapsedSprints[sprint.id] !== false; // Default completed sprints to collapsed
                const totalPoints = sprint.tasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
                const completedTasks = sprint.tasks.filter((t) => t.status === 'DONE').length;

                return (
                  <div
                    key={sprint.id}
                    className="card"
                    style={{
                      padding: '16px',
                      borderLeft: '4px solid var(--emerald)',
                      background: 'var(--bg-card)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      onClick={() => toggleSprintCollapse(sprint.id)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                          {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                              COMPLETED
                            </span>
                            <h3 style={{ fontSize: '1.1rem' }}>{sprint.name}</h3>
                            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                              {completedTasks}/{sprint.tasks.length} tasks • {totalPoints} pts
                            </span>
                          </div>
                          {sprint.goal && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: '4px' }}>
                              🎯 <strong>Goal:</strong> {sprint.goal}
                            </p>
                          )}
                          {sprint.completedAt && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                              🏁 Completed on {new Date(sprint.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBurndown(sprint.id);
                        }}
                      >
                        <TrendingDown size={14} color="var(--primary)" />
                        <span>Burndown Report</span>
                      </button>
                    </div>

                    {/* Collapsible Task Roster inside Completed Sprint */}
                    {!isCollapsed && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                        {sprint.tasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-md)',
                              background: 'var(--bg-surface)',
                              fontSize: '0.825rem',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary)' }}>
                                {task.key}
                              </span>
                              <span style={{ color: task.status === 'DONE' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                {task.title}
                              </span>
                              {getPriorityBadge(task.priority)}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                                DONE
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                                {task.storyPoints ? `${task.storyPoints} pts` : '1 pt'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Product Backlog Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--primary)" />
            <span>Product Backlog ({backlogTasks.length})</span>
          </h2>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          {/* Quick Add Backlog Task */}
          <form onSubmit={handleQuickCreateBacklogTask} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="+ Add task directly to backlog..."
              value={newBacklogTitle}
              onChange={(e) => setNewBacklogTitle(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!newBacklogTitle.trim()}>
              Add
            </button>
          </form>

          {/* Backlog Tasks List */}
          {backlogTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Backlog is empty. All tasks are assigned to sprints!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {backlogTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.8rem', color: 'var(--primary)' }}>
                      {task.key}
                    </span>
                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{task.title}</span>
                    {getPriorityBadge(task.priority)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <select
                      className="input-field"
                      value=""
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.value) handleAssignTaskToSprint(task.id, e.target.value);
                      }}
                      style={{ width: 'auto', padding: '3px 8px', fontSize: '0.75rem', borderColor: 'var(--primary)' }}
                    >
                      <option value="">+ Assign to Sprint...</option>
                      {activeSprint && <option value={activeSprint.id}>⚡ {activeSprint.name} (Active)</option>}
                      {plannedSprints.map((ps) => (
                        <option key={ps.id} value={ps.id}>
                          📋 {ps.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SVG Burndown Chart Modal */}
      {burndownSprintId && (
        <div className="modal-overlay" onClick={() => setBurndownSprintId(null)}>
          <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingDown size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.2rem' }}>Burndown Velocity Chart</h3>
              </div>
              <button onClick={() => setBurndownSprintId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {isLoadingBurndown || !burndownData ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Calculating velocity trajectory...
              </div>
            ) : (
              <div>
                {/* Metrics Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '10px',
                    marginBottom: '20px',
                    background: 'var(--bg-surface)',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Story Pts</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{burndownData.sprint.totalStoryPoints}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Completed Pts</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--emerald)' }}>
                      {burndownData.sprint.completedStoryPoints}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Tasks</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{burndownData.sprint.totalTasks}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Done Tasks</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>
                      {burndownData.sprint.completedTasks}
                    </div>
                  </div>
                </div>

                {/* SVG Line Graph */}
                {(() => {
                  const width = 580;
                  const height = 220;
                  const padding = 35;
                  const points = burndownData.timeline;
                  const maxVal = Math.max(1, burndownData.sprint.totalStoryPoints);

                  if (points.length < 2) {
                    return <div style={{ textAlign: 'center', padding: '20px' }}>Not enough timeline points.</div>;
                  }

                  const getX = (index: number) => padding + (index / (points.length - 1)) * (width - 2 * padding);
                  const getY = (val: number) => height - padding - (val / maxVal) * (height - 2 * padding);

                  const idealPath = points
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.idealRemainingPoints)}`)
                    .join(' ');
                  const actualPath = points
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.actualRemainingPoints)}`)
                    .join(' ');

                  return (
                    <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                        {/* Grid lines */}
                        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="var(--border-subtle)" />
                        <line
                          x1={padding}
                          y1={height - padding}
                          x2={width - padding}
                          y2={height - padding}
                          stroke="var(--border-subtle)"
                        />

                        {/* Ideal Line (Dashed) */}
                        <path d={idealPath} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />

                        {/* Actual Line (Solid Blue) */}
                        <path d={actualPath} fill="none" stroke="var(--primary)" strokeWidth="3" />

                        {/* Data dots */}
                        {points.map((p, i) => (
                          <circle
                            key={i}
                            cx={getX(i)}
                            cy={getY(p.actualRemainingPoints)}
                            r="4"
                            fill="var(--primary)"
                          />
                        ))}
                      </svg>

                      {/* Legend */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '16px', height: '2px', background: '#94a3b8', borderStyle: 'dashed' }} />
                          <span style={{ color: 'var(--text-muted)' }}>Ideal Guideline</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '16px', height: '3px', background: 'var(--primary)' }} />
                          <span style={{ fontWeight: '700' }}>Actual Remaining Work</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Sprint Modal */}
      {isCreateSprintOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateSprintOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Create Sprint</h3>
              <button onClick={() => setIsCreateSprintOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSprint}>
              <div className="input-group">
                <label className="input-label">Sprint Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Sprint 3 - Performance"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label className="input-label">Sprint Goal (Optional)</label>
                <textarea
                  className="input-field"
                  placeholder="What is the primary deliverable for this sprint?"
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  rows={2}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Start Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newSprintStartDate}
                    onChange={(e) => setNewSprintStartDate(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">End Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newSprintEndDate}
                    onChange={(e) => setNewSprintEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateSprintOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingSprint || !newSprintName.trim()}>
                  {isSubmittingSprint ? 'Creating...' : 'Create Sprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Sprint Modal */}
      {startingSprint && (
        <div className="modal-overlay" onClick={() => setStartingSprint(null)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Start Sprint: {startingSprint.name}</h3>
              <button onClick={() => setStartingSprint(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStartSprint}>
              <div className="input-group">
                <label className="input-label">Sprint Goal</label>
                <textarea
                  className="input-field"
                  value={startGoal}
                  onChange={(e) => setStartGoal(e.target.value)}
                  placeholder="Sprint objective..."
                  rows={2}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Start Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={startStartDate}
                    onChange={(e) => setStartStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">End Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={startEndDate}
                    onChange={(e) => setStartEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStartingSprint(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Start Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Sprint Modal */}
      {completingSprint && (
        <div className="modal-overlay" onClick={() => setCompletingSprint(null)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Complete Sprint: {completingSprint.name}</h3>
              <button onClick={() => setCompletingSprint(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCompleteSprint}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Completed tasks will be permanently archived under this sprint. Where would you like to move incomplete tasks?
              </p>

              <div className="input-group">
                <label className="input-label">Move Incomplete Tasks To</label>
                <select
                  className="input-field"
                  value={rolloverTargetId}
                  onChange={(e) => setRolloverTargetId(e.target.value)}
                >
                  <option value="">Product Backlog (Unassigned)</option>
                  {plannedSprints.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      Next Planned: {ps.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCompletingSprint(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Complete Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Drawer */}
      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          projectId={project.id}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={fetchSprintData}
          onTaskDeleted={fetchSprintData}
        />
      )}
    </div>
  );
};
