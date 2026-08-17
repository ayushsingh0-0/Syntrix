import React, { useEffect, useState, useCallback } from 'react';
import { Layers, Plus, Users, Crown, ArrowRight } from 'lucide-react';
import { useOrg } from '../../context';
import { CreateTeamModal } from '../../components/modals/CreateTeamModal';
import { TeamDetailModal } from '../../components/modals/TeamDetailModal';
import api from '../../services/api';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/Skeleton';
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
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg]);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Teams Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Functional departments and cross-functional teams in{' '}
            <span className="text-slate-200 font-semibold">{currentOrg?.name}</span>
          </p>
        </div>

        {hasPermission('TEAM_MANAGE') && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Team
          </Button>
        )}
      </div>

      {isLoading ? (
        <CardSkeleton count={3} />
      ) : teams.length === 0 ? (
        <EmptyState
          title="No teams created yet"
          description="Group workspace members into specialized teams to streamline project ownership and permissions."
          icon={<Layers className="w-8 h-8 text-violet-400" />}
          actionLabel={hasPermission('TEAM_MANAGE') ? 'Create First Team' : undefined}
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTeamId(t.id)}
              className="group bg-slate-900 border border-slate-800 hover:border-violet-500/40 rounded-xl p-5 shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-violet-500/5 hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-100 group-hover:text-violet-300 transition-colors">
                      {t.name}
                    </h3>
                  </div>

                  {t.myRole && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                      {t.myRole === 'LEAD' && <Crown className="w-3 h-3 text-amber-400" />}
                      {t.myRole}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {t.description || 'No specific team description specified.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.memberCount || 0} Members</span>
                </div>
                <span className="text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Manage Roster <ArrowRight className="w-3.5 h-3.5" />
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
