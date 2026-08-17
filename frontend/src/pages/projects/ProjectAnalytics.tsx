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
  TrendingUp,
} from 'lucide-react';
import { useOrg } from '../../context';
import api from '../../services/api';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
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
      <div className="space-y-6 animate-pulse">
        <Skeleton height="60px" />
        <Skeleton height="120px" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height="100px" />
          ))}
        </div>
      </div>
    );
  }

  const { project, metrics, sprints, overdueTasks, memberWorkload, velocity } = data;

  const maxVelocity = Math.max(
    ...velocity.map((v) => Math.max(v.created, v.completed)),
    5
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}/board`}>
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Board
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
              {project.key}
            </span>
            <h1 className="text-xl font-bold text-slate-100">{project.name} Analytics</h1>
          </div>
        </div>

        {/* Quick Nav Links */}
        <div className="flex items-center gap-2">
          <Link to={`/projects/${projectId}/board`}>
            <Button variant="secondary" size="sm" leftIcon={<Kanban className="w-3.5 h-3.5" />}>
              Board
            </Button>
          </Link>
          <Link to={`/projects/${projectId}/tasks`}>
            <Button variant="secondary" size="sm" leftIcon={<ListTodo className="w-3.5 h-3.5" />}>
              Tasks
            </Button>
          </Link>
          <Link to={`/projects/${projectId}/sprints`}>
            <Button variant="secondary" size="sm" leftIcon={<Layers className="w-3.5 h-3.5" />}>
              Sprints
            </Button>
          </Link>
        </div>
      </div>

      {/* Project Progress Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  project.priority === 'URGENT'
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                    : project.priority === 'HIGH'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                }`}
              >
                {project.priority} Priority
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {project.status}
              </span>
              {project.team && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {project.team.name}
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-xs text-slate-400 mt-1">{project.description}</p>
            )}
          </div>

          {(project.startDate || project.targetDate) && (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Start'} →{' '}
                {project.targetDate ? new Date(project.targetDate).toLocaleDateString() : 'Ongoing'}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">Overall Milestone Progress</span>
            <span className="font-bold text-indigo-400">
              {metrics.progressPercentage}% ({metrics.completedTasks} / {metrics.totalTasks} tasks)
            </span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${metrics.progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Scope</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{metrics.totalTasks}</div>
          <div className="text-[11px] text-slate-400 mt-1">{metrics.activeTasks} in-flight tasks</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Story Points</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {metrics.storyPoints.completed} / {metrics.storyPoints.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Delivered velocity points</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Overdue Tasks</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                metrics.overdueCount > 0
                  ? 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold ${
              metrics.overdueCount > 0 ? 'text-rose-400' : 'text-slate-100'
            }`}
          >
            {metrics.overdueCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.overdueCount > 0 ? 'Urgent action required' : 'All milestones on schedule'}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Project Roster</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-400">{project.memberCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Assigned collaborators</div>
        </div>
      </div>

      {/* Velocity & Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Velocity Chart (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>Project Delivery Velocity</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Daily task throughput breakdown</p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-indigo-500" />
                  <span className="text-slate-300">Created</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-slate-300">Completed</span>
                </div>
              </div>
            </div>

            <div className="h-44 flex items-end gap-2 pt-4 border-b border-slate-800 pb-2">
              {velocity.map((v) => {
                const createdHeight = Math.round((v.created / maxVelocity) * 130);
                const completedHeight = Math.round((v.completed / maxVelocity) * 130);

                return (
                  <div
                    key={v.date}
                    className="flex-1 flex flex-col items-center justify-end h-full gap-1 group relative cursor-pointer"
                  >
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-slate-800 text-[10px] text-slate-100 px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 border border-slate-700">
                      {v.label}: {v.created} in, {v.completed} out
                    </div>

                    <div className="flex items-end gap-1 w-full justify-center">
                      <div
                        style={{ height: `${Math.max(createdHeight, 4)}px` }}
                        className="w-1/2 max-w-[10px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all duration-300 group-hover:brightness-125"
                      />
                      <div
                        style={{ height: `${Math.max(completedHeight, 4)}px` }}
                        className="w-1/2 max-w-[10px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all duration-300 group-hover:brightness-125"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 text-[10px] text-slate-500 font-mono">
            <span>{velocity[0]?.label || 'Start'}</span>
            <span>14-Day Delivery Burn</span>
            <span>{velocity[velocity.length - 1]?.label || 'Today'}</span>
          </div>
        </div>

        {/* Status Distribution (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Status Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tasks across workflow columns</p>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Done', count: metrics.byStatus.DONE || 0, color: 'bg-emerald-500' },
              {
                label: 'In Progress',
                count: metrics.byStatus.IN_PROGRESS || 0,
                color: 'bg-indigo-500',
              },
              { label: 'In Review', count: metrics.byStatus.REVIEW || 0, color: 'bg-violet-500' },
              { label: 'To Do', count: metrics.byStatus.TODO || 0, color: 'bg-slate-600' },
              {
                label: 'Cancelled',
                count: metrics.byStatus.CANCELLED || 0,
                color: 'bg-rose-500',
              },
            ].map((st) => {
              const percent = metrics.totalTasks
                ? Math.round((st.count / metrics.totalTasks) * 100)
                : 0;
              return (
                <div key={st.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{st.label}</span>
                    <span className="text-slate-400">
                      {st.count} ({percent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${st.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contributor Workload & Overdue Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contributor Workload */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <h3 className="text-base font-semibold text-slate-100">Contributor Allocation</h3>

          {memberWorkload.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              No assigned contributors.
            </div>
          ) : (
            <div className="space-y-2.5">
              {memberWorkload.map((mw) => (
                <div
                  key={mw.user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    {mw.user.avatarUrl ? (
                      <img
                        src={mw.user.avatarUrl}
                        alt={mw.user.name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                        {mw.user.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{mw.user.name}</div>
                      <div className="text-[10px] text-slate-400">{mw.role}</div>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {mw.assignedTasks} tasks
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Items Attention */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Overdue Tasks Attention</span>
          </h3>

          {overdueTasks.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              All tasks are delivered on or before due date!
            </div>
          ) : (
            <div className="space-y-2.5">
              {overdueTasks.map((ot) => (
                <div
                  key={ot.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-rose-500/20"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 shrink-0">
                      {ot.key}
                    </span>
                    <span className="text-xs font-medium text-slate-200 truncate">{ot.title}</span>
                  </div>

                  <span className="text-[10px] text-rose-400 font-mono font-semibold shrink-0 ml-2">
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Sprint Iteration History</h3>
              <p className="text-xs text-slate-400 mt-0.5">Scoping and iteration status</p>
            </div>
            <Link
              to={`/projects/${projectId}/sprints`}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Manage Sprints →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sprints.map((sp) => (
              <div
                key={sp.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-200">{sp.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{sp.taskCount} tasks included</div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    sp.status === 'ACTIVE'
                      ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      : sp.status === 'COMPLETED'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
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
