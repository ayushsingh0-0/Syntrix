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
  TrendingUp,
} from 'lucide-react';
import { useOrg } from '../../context';
import api from '../../services/api';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
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
      api.get(`/organizations/${currentOrg.id}/projects?limit=6`),
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
      <div className="space-y-6 animate-pulse">
        <Skeleton height="140px" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height="110px" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton height="320px" />
          </div>
          <div>
            <Skeleton height="320px" />
          </div>
        </div>
      </div>
    );
  }

  const summary = dashboardData?.summary;
  const velocity = dashboardData?.velocity || [];
  const workload = dashboardData?.workload || [];
  const activities = dashboardData?.recentActivities || [];

  const maxVelocity = Math.max(
    ...velocity.map((v) => Math.max(v.created, v.completed)),
    5
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Welcome Banner with Kokonut-inspired gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900/40 via-violet-900/20 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {myRole}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Workspace Intelligence Engine
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              {currentOrg.name}
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Real-time delivery KPIs, workload allocation matrices, and sprint execution velocity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/projects">
              <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                New Project
              </Button>
            </Link>
            {(myRole === 'OWNER' || myRole === 'ADMIN') && (
              <Link to="/organization/invitations">
                <Button variant="secondary" size="md" leftIcon={<UserPlus className="w-4 h-4" />}>
                  Invite Team
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Bento Grid KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Projects KPI */}
        <div className="group bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-4.5 shadow-lg transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Projects</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{summary?.projects.active || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary?.projects.total || 0} total • {summary?.projects.completed || 0} finished
          </div>
        </div>

        {/* Completion Rate */}
        <div className="group bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4.5 shadow-lg transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Completion Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {summary?.tasks.completionRate || 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary?.tasks.completed || 0} of {summary?.tasks.total || 0} tasks done
          </div>
        </div>

        {/* Active Work In Progress */}
        <div className="group bg-slate-900/90 border border-slate-800 hover:border-violet-500/40 rounded-xl p-4.5 shadow-lg transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">In Flight Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-violet-400">{summary?.tasks.active || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary?.tasks.byStatus.IN_PROGRESS || 0} in progress •{' '}
            {summary?.tasks.byStatus.REVIEW || 0} in review
          </div>
        </div>

        {/* Overdue Items */}
        <div className="group bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 rounded-xl p-4.5 shadow-lg transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Overdue Tasks</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
                summary?.tasks.overdue
                  ? 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold ${
              summary?.tasks.overdue ? 'text-rose-400' : 'text-slate-100'
            }`}
          >
            {summary?.tasks.overdue || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary?.tasks.overdue ? 'Requires sprint attention' : 'All milestones on track'}
          </div>
        </div>

        {/* Team Capacity */}
        <div className="group bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4.5 shadow-lg transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Team Members</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-400">{summary?.membersCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {summary?.teamsCount || 0} functional teams
          </div>
        </div>
      </div>

      {/* Main Grid: Bklit-Inspired Velocity Chart & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 14-Day Delivery Velocity Chart (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>14-Day Delivery Velocity</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daily comparison of tasks created vs. tasks closed
                </p>
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

            {/* Bklit-styled SVG Bars */}
            <div className="h-48 flex items-end gap-2 sm:gap-3 pt-4 border-b border-slate-800 pb-2">
              {velocity.map((v) => {
                const createdHeight = Math.round((v.created / maxVelocity) * 140);
                const completedHeight = Math.round((v.completed / maxVelocity) * 140);

                return (
                  <div
                    key={v.date}
                    className="flex-1 flex flex-col items-center justify-end h-full gap-1 group relative cursor-pointer"
                  >
                    {/* Tooltip on hover */}
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
            <span>14-Day Trajectory Window</span>
            <span>{velocity[velocity.length - 1]?.label || 'Today'}</span>
          </div>
        </div>

        {/* Task Status & Priority Breakdown (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-5">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Status Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Workspace-wide task states</p>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Done', count: summary?.tasks.byStatus.DONE || 0, color: 'bg-emerald-500' },
              {
                label: 'In Progress',
                count: summary?.tasks.byStatus.IN_PROGRESS || 0,
                color: 'bg-indigo-500',
              },
              {
                label: 'In Review',
                count: summary?.tasks.byStatus.REVIEW || 0,
                color: 'bg-violet-500',
              },
              { label: 'To Do', count: summary?.tasks.byStatus.TODO || 0, color: 'bg-slate-600' },
              {
                label: 'Cancelled',
                count: summary?.tasks.byStatus.CANCELLED || 0,
                color: 'bg-rose-500',
              },
            ].map((st) => {
              const percent = summary?.tasks.total
                ? Math.round((st.count / summary.tasks.total) * 100)
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

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Story Points Velocity</span>
            <span className="font-bold text-slate-200">
              {summary?.tasks.storyPoints.completed || 0} /{' '}
              {summary?.tasks.storyPoints.total || 0} pts
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Grid: Team Workload & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Workload Allocation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Team Workload</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Active task allocation per collaborator
              </p>
            </div>
            <Link
              to="/organization/members"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Members</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {workload.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No active workload records found.
            </div>
          ) : (
            <div className="space-y-2.5">
              {workload.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    {m.user.avatarUrl ? (
                      <img
                        src={m.user.avatarUrl}
                        alt={m.user.name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                        {m.user.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{m.user.name}</div>
                      <div className="text-[10px] text-slate-400">{m.role}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-200">
                      {m.assignedTasks} assigned
                    </div>
                    <div className="text-[10px] text-indigo-400">
                      {m.inProgressTasks} in progress • {m.completedTasks} done
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Workspace Activity Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Live Activity Stream</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time workspace event updates</p>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No recent activity recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 6).map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 pb-2.5 border-b border-slate-800/80 last:border-none last:pb-0"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-300 shrink-0 mt-0.5">
                    {act.user?.name?.charAt(0) || 'U'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-300 leading-tight">
                      <span className="font-semibold text-slate-100">{act.user?.name}</span>{' '}
                      <span className="text-slate-400">
                        {act.action.toLowerCase().replace(/_/g, ' ')}
                      </span>{' '}
                      {act.task && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                          {act.task.key}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      •{' '}
                      {new Date(act.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Projects Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Active Workspace Projects</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct access to sprint boards, task backlogs, and metrics
            </p>
          </div>
          <Link
            to="/projects"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <span>All Projects</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No projects found in this workspace.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}/board`}
                className="group bg-slate-950/60 hover:bg-slate-800/50 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                      {p.key}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        p.priority === 'URGENT'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                          : p.priority === 'HIGH'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      {p.priority}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {p.name}
                  </h4>
                  {p.description && (
                    <p className="text-xs text-slate-400 line-clamp-1 mt-1">{p.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>{p.status}</span>
                  </div>
                  <span className="text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
                    Board →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
