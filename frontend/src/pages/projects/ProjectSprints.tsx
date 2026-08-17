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
  Trash2,
  TrendingDown,
  Kanban,
  ListFilter,
  Activity,
} from 'lucide-react';
import { useOrg, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import { TaskDetailDrawer } from '../../components/tasks/TaskDetailDrawer';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { FormField, Input, Textarea, Select } from '../../components/common/FormComponents';
import type { Project, Sprint, Task, BurndownData, TaskPriority } from '../../types';

export const ProjectSprints: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentOrg, hasPermission } = useOrg();
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        await api
          .post(
            `/organizations/${currentOrg.id}/projects/${projectId}/sprints/unassigned/tasks`,
            { taskIds: [taskId] }
          )
          .catch(async () => {
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
      await api.delete(
        `/organizations/${currentOrg.id}/projects/${projectId}/sprints/${sprintId}`
      );
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

  const priorityStyles: Record<TaskPriority, string> = {
    URGENT: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    HIGH: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    MEDIUM: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    LOW: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  if (isLoading || !project) {
    return (
      <div className="text-slate-400 py-12 text-center text-xs">Loading Agile sprints...</div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link
              to={`/projects/${project.id}`}
              className="hover:text-slate-200 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{project.name}</span>
            </Link>
            <span>/</span>
            <span className="text-slate-200 font-medium">Sprints & Backlog</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              Agile Sprints ({sprints.length})
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/projects/${project.id}/board`}>
            <Button variant="secondary" size="sm" leftIcon={<Kanban className="w-3.5 h-3.5" />}>
              Board
            </Button>
          </Link>
          <Link to={`/projects/${project.id}/tasks`}>
            <Button variant="secondary" size="sm" leftIcon={<ListFilter className="w-3.5 h-3.5" />}>
              Tasks
            </Button>
          </Link>

          {hasPermission('PROJECT_UPDATE') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateSprintOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Sprint
            </Button>
          )}
        </div>
      </div>

      {/* Active Sprint Section (Hero Card) */}
      {activeSprint ? (
        <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Active Sprint
                </span>
                <h2 className="text-xl font-bold text-slate-100">{activeSprint.name}</h2>
              </div>
              {activeSprint.goal && (
                <p className="text-xs text-slate-300">
                  🎯 <span className="font-semibold text-slate-200">Goal:</span> {activeSprint.goal}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenBurndown(activeSprint.id)}
                leftIcon={<TrendingDown className="w-3.5 h-3.5 text-indigo-400" />}
              >
                Burndown Chart
              </Button>

              {hasPermission('PROJECT_UPDATE') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setCompletingSprint(activeSprint);
                    if (plannedSprints.length > 0) setRolloverTargetId(plannedSprints[0].id);
                  }}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Complete Sprint
                </Button>
              )}
            </div>
          </div>

          {/* Sprint Progress Summary */}
          {(() => {
            const totalTasks = activeSprint.tasks.length;
            const completedTasks = activeSprint.tasks.filter((t) => t.status === 'DONE').length;
            const totalPoints = activeSprint.tasks.reduce(
              (sum, t) => sum + (t.storyPoints || 1),
              0
            );
            const completedPoints = activeSprint.tasks
              .filter((t) => t.status === 'DONE')
              .reduce((sum, t) => sum + (t.storyPoints || 1), 0);
            const percent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

            return (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    Progress:{' '}
                    <strong className="text-slate-100 font-semibold">
                      {completedTasks}/{totalTasks} tasks
                    </strong>{' '}
                    ({completedPoints}/{totalPoints} pts)
                  </span>
                  <span className="font-bold text-indigo-400">{percent}% Completed</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Active Sprint Tasks List */}
          <div className="space-y-2">
            {activeSprint.tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="group flex items-center justify-between p-3 rounded-lg bg-slate-950/50 hover:bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 text-xs transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-indigo-400">{task.key}</span>
                  <span className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {task.title}
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                      priorityStyles[task.priority] || priorityStyles.MEDIUM
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      task.status === 'DONE'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {task.status}
                  </span>
                  <span className="font-mono text-slate-400">
                    {task.storyPoints ? `${task.storyPoints} pts` : '1 pt'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-2 shadow-lg">
          <Activity className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">No Active Sprint</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Start a planned sprint below to begin tracking daily velocity and burndown progress.
          </p>
        </div>
      )}

      {/* Planned Sprints List */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Planned Sprints ({plannedSprints.length})</span>
        </h2>

        {plannedSprints.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500 shadow-lg">
            No planned sprints. Click &quot;Create Sprint&quot; to plan your next milestone.
          </div>
        ) : (
          <div className="space-y-4">
            {plannedSprints.map((sprint) => {
              const sprintPoints = sprint.tasks.reduce(
                (sum, t) => sum + (t.storyPoints || 1),
                0
              );

              return (
                <div
                  key={sprint.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-100">{sprint.name}</h3>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          {sprint.tasks.length} tasks • {sprintPoints} pts
                        </span>
                      </div>
                      {sprint.goal && (
                        <p className="text-xs text-slate-400 mt-0.5">🎯 {sprint.goal}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {hasPermission('PROJECT_UPDATE') && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
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
                            leftIcon={<Play className="w-3.5 h-3.5" />}
                          >
                            Start Sprint
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSprint(sprint.id, sprint.name)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tasks inside Planned Sprint */}
                  <div className="space-y-1.5">
                    {sprint.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="group flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-xs transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-indigo-400">{task.key}</span>
                          <span className="text-slate-200 group-hover:text-indigo-300 transition-colors">
                            {task.title}
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                              priorityStyles[task.priority] || priorityStyles.MEDIUM
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <select
                          value={task.sprintId || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleAssignTaskToSprint(task.id, e.target.value || null);
                          }}
                          className="bg-slate-900 border border-slate-700 text-[10px] text-slate-300 rounded px-2 py-0.5"
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
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Backlog Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Product Backlog ({backlogTasks.length})</span>
          </h2>
        </div>

        {/* Quick Add Backlog Task */}
        <form onSubmit={handleQuickCreateBacklogTask} className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="+ Add item directly to product backlog..."
              value={newBacklogTitle}
              onChange={(e) => setNewBacklogTitle(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" size="md" disabled={!newBacklogTitle.trim()}>
            Add
          </Button>
        </form>

        {/* Backlog Tasks List */}
        {backlogTasks.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            Backlog is clear. All tasks have been allocated to sprints!
          </div>
        ) : (
          <div className="space-y-1.5">
            {backlogTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="group flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-xs transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-indigo-400">{task.key}</span>
                  <span className="text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {task.title}
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                      priorityStyles[task.priority] || priorityStyles.MEDIUM
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>

                <select
                  value=""
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (e.target.value) handleAssignTaskToSprint(task.id, e.target.value);
                  }}
                  className="bg-slate-900 border border-indigo-500/40 text-[10px] text-indigo-300 font-medium rounded px-2 py-0.5"
                >
                  <option value="">+ Assign to Sprint...</option>
                  {activeSprint && (
                    <option value={activeSprint.id}>⚡ {activeSprint.name} (Active)</option>
                  )}
                  {plannedSprints.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      📋 {ps.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SVG Burndown Chart Modal */}
      <Modal
        isOpen={Boolean(burndownSprintId)}
        onClose={() => setBurndownSprintId(null)}
        title="Sprint Burndown Chart"
        subtitle="Daily ideal trajectory vs. actual remaining story points"
      >
        {isLoadingBurndown || !burndownData ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Calculating velocity trajectory...
          </div>
        ) : (
          <div className="space-y-4">
            {/* KPI Row */}
            <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <div>
                <div className="text-[10px] text-slate-400">Total Points</div>
                <div className="text-base font-bold text-slate-100">
                  {burndownData.sprint.totalStoryPoints}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Done Points</div>
                <div className="text-base font-bold text-emerald-400">
                  {burndownData.sprint.completedStoryPoints}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Total Tasks</div>
                <div className="text-base font-bold text-slate-100">
                  {burndownData.sprint.totalTasks}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Done Tasks</div>
                <div className="text-base font-bold text-indigo-400">
                  {burndownData.sprint.completedTasks}
                </div>
              </div>
            </div>

            {/* SVG Visual */}
            {(() => {
              const width = 540;
              const height = 200;
              const padding = 30;
              const points = burndownData.timeline;
              const maxVal = Math.max(1, burndownData.sprint.totalStoryPoints);

              if (points.length < 2) {
                return (
                  <div className="text-center py-6 text-xs text-slate-500">
                    Not enough timeline data points to render curve.
                  </div>
                );
              }

              const getX = (index: number) =>
                padding + (index / (points.length - 1)) * (width - 2 * padding);
              const getY = (val: number) =>
                height - padding - (val / maxVal) * (height - 2 * padding);

              const idealPath = points
                .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.idealRemainingPoints)}`)
                .join(' ');
              const actualPath = points
                .map(
                  (p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.actualRemainingPoints)}`
                )
                .join(' ');

              return (
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                    <line
                      x1={padding}
                      y1={padding}
                      x2={padding}
                      y2={height - padding}
                      stroke="#334155"
                    />
                    <line
                      x1={padding}
                      y1={height - padding}
                      x2={width - padding}
                      y2={height - padding}
                      stroke="#334155"
                    />
                    <path
                      d={idealPath}
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    <path d={actualPath} fill="none" stroke="#6366f1" strokeWidth="3" />
                    {points.map((p, i) => (
                      <circle
                        key={i}
                        cx={getX(i)}
                        cy={getY(p.actualRemainingPoints)}
                        r="3.5"
                        fill="#6366f1"
                      />
                    ))}
                  </svg>
                  <div className="flex items-center justify-center gap-6 mt-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-0.5 bg-slate-500 border-dashed" />
                      <span className="text-slate-400">Ideal Guideline</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-1 bg-indigo-500 rounded" />
                      <span className="font-semibold text-slate-200">Actual Work Remaining</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* Create Sprint Modal */}
      <Modal
        isOpen={isCreateSprintOpen}
        onClose={() => setIsCreateSprintOpen(false)}
        title="Create Sprint"
        subtitle={`Plan a new sprint for ${project.name}`}
      >
        <form onSubmit={handleCreateSprint} className="space-y-4">
          <FormField label="Sprint Name" required>
            <Input
              placeholder="e.g. Sprint 4 — Performance Optimization"
              value={newSprintName}
              onChange={(e) => setNewSprintName(e.target.value)}
              required
              autoFocus
            />
          </FormField>

          <FormField label="Sprint Goal (Optional)">
            <Textarea
              placeholder="Primary milestone target..."
              value={newSprintGoal}
              onChange={(e) => setNewSprintGoal(e.target.value)}
              rows={2}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date">
              <Input
                type="date"
                value={newSprintStartDate}
                onChange={(e) => setNewSprintStartDate(e.target.value)}
              />
            </FormField>

            <FormField label="End Date">
              <Input
                type="date"
                value={newSprintEndDate}
                onChange={(e) => setNewSprintEndDate(e.target.value)}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" size="md" onClick={() => setIsCreateSprintOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmittingSprint}
              disabled={!newSprintName.trim()}
            >
              Create Sprint
            </Button>
          </div>
        </form>
      </Modal>

      {/* Start Sprint Modal */}
      {startingSprint && (
        <Modal
          isOpen={Boolean(startingSprint)}
          onClose={() => setStartingSprint(null)}
          title={`Start Sprint: ${startingSprint.name}`}
          subtitle="Activate iteration to start tracking burndown velocity"
        >
          <form onSubmit={handleStartSprint} className="space-y-4">
            <FormField label="Sprint Goal">
              <Textarea
                value={startGoal}
                onChange={(e) => setStartGoal(e.target.value)}
                placeholder="What will this sprint accomplish?"
                rows={2}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Start Date" required>
                <Input
                  type="date"
                  value={startStartDate}
                  onChange={(e) => setStartStartDate(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="End Date" required>
                <Input
                  type="date"
                  value={startEndDate}
                  onChange={(e) => setStartEndDate(e.target.value)}
                  required
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="secondary" size="md" onClick={() => setStartingSprint(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md">
                Start Sprint
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complete Sprint Modal */}
      {completingSprint && (
        <Modal
          isOpen={Boolean(completingSprint)}
          onClose={() => setCompletingSprint(null)}
          title={`Complete Sprint: ${completingSprint.name}`}
          subtitle="Archive completed tasks and reassign pending work"
        >
          <form onSubmit={handleCompleteSprint} className="space-y-4">
            <p className="text-xs text-slate-300">
              Completed tasks will be finalized under this sprint. Where should incomplete tasks be
              moved?
            </p>

            <FormField label="Rollover Incomplete Tasks To">
              <Select
                value={rolloverTargetId}
                onChange={(e) => setRolloverTargetId(e.target.value)}
                options={[
                  { value: '', label: 'Product Backlog (Unassigned)' },
                  ...plannedSprints.map((ps) => ({
                    value: ps.id,
                    label: `Next Planned: ${ps.name}`,
                  })),
                ]}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="secondary" size="md" onClick={() => setCompletingSprint(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md">
                Complete Sprint
              </Button>
            </div>
          </form>
        </Modal>
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
