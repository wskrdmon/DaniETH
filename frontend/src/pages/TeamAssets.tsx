// src/pages/TeamAssets.tsx
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { teamService } from '@/services/teamService';
import type { Team, TeamMember, TeamStats } from '@/types/team';

import StatCard        from '@/components/team/StatCard';
import MemberCard      from '@/components/team/MemberCard';
import AddMemberModal  from '@/components/team/AddMemberModal';

// ── Spinner centralizado ───────────────────────────────────────────────────────
function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

// ── Panel de error ─────────────────────────────────────────────────────────────
interface ErrorPanelProps {
  message: string;
  hint: string;
  retryLabel: string;
  onRetry: () => void;
}

function ErrorPanel({ message, hint, retryLabel, onRetry }: ErrorPanelProps) {
  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-severity-critical/10 border border-severity-critical/30 rounded-xl">
      <p className="text-severity-critical font-semibold text-sm">⚠ {message}</p>
      <p className="text-text-secondary text-xs mt-1">{hint}</p>
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-1.5 text-xs font-medium border border-border-secondary rounded-lg text-text-secondary hover:text-text-primary transition-colors"
      >
        {retryLabel}
      </button>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function TeamAssetsPage() {
  const { t } = useTranslation();

  const [stats,      setStats]      = useState<TeamStats | null>(null);
  const [teams,      setTeams]      = useState<Team[]>([]);
  const [members,    setMembers]    = useState<TeamMember[]>([]);
  const [activeTab,  setActiveTab]  = useState<string>('');
  const [loading,    setLoading]    = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error,      setError]      = useState('');
  const [showModal,  setShowModal]  = useState(false);

  // ── Carga inicial: stats + equipos ─────────────────────────────────────────
  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, teamsData] = await Promise.all([
        teamService.getStats(),
        teamService.listTeams(),
      ]);
      setStats(statsData);
      setTeams(teamsData);
      // Activa la primera pestaña solo si no hay ninguna seleccionada
      if (teamsData.length > 0) {
        setActiveTab(prev => prev || teamsData[0].id);
      }
    } catch {
      setError('load');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Carga miembros cuando cambia la pestaña ────────────────────────────────
  const fetchMembers = useCallback(async (teamId: string) => {
    if (!teamId) return;
    setLoadingMembers(true);
    try {
      const data = await teamService.listMembers(teamId);
      setMembers(data);
    } catch {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);
  useEffect(() => { fetchMembers(activeTab); }, [activeTab, fetchMembers]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDelete = async (memberId: string) => {
    if (!window.confirm(t('pages.teamPage.error.confirmDelete'))) return;
    try {
      await teamService.deleteMember(memberId);
      fetchMembers(activeTab);
      fetchInitial();
    } catch {
      alert(t('pages.teamPage.error.deleteFailed'));
    }
  };

  const handleMemberAdded = () => {
    fetchMembers(activeTab);
    fetchInitial();
  };

  const handleTabChange = (teamId: string) => {
    if (teamId !== activeTab) {
      setActiveTab(teamId);
    }
  };

  // ── Avg per member (para el subtexto de active tasks) ─────────────────────
  const avgPerMember = stats && stats.total_members > 0
    ? (stats.active_tasks / stats.total_members).toFixed(1)
    : '0';

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingSpinner message={t('pages.teamPage.loading')} />;
  }

  if (error) {
    return (
      <ErrorPanel
        message={t('pages.teamPage.error.loadFailed')}
        hint={t('pages.teamPage.error.loadHint')}
        retryLabel={t('pages.teamPage.error.retry')}
        onRetry={fetchInitial}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary flex items-center gap-2">
            <span>👥</span>
            <span>{t('pages.team.title')}</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {t('pages.teamPage.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              border border-border-secondary text-text-secondary
              hover:text-text-primary hover:border-border-primary
              transition-colors
            "
          >
            {t('pages.teamPage.btnAddMember')}
          </button>
          <button
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              border border-border-secondary text-text-secondary
              hover:text-text-primary hover:border-border-primary
              transition-colors
            "
          >
            {t('pages.teamPage.btnAnalytics')}
          </button>
          <button
            className="
              px-4 py-2 text-sm font-semibold rounded-lg text-white
              bg-gradient-to-r from-accent-cyan to-accent-blue
              hover:opacity-90 active:opacity-80
              transition-opacity shadow-md
            "
          >
            {t('pages.teamPage.btnSyncLdap')}
          </button>
        </div>
      </div>

      {/* ── Stats (5 tarjetas) ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            label={t('pages.teamPage.stats.totalMembers')}
            value={stats.total_members}
            sub={`${stats.total_teams} ${t('pages.teamPage.stats.teams')}`}
          />
          <StatCard
            label={t('pages.teamPage.stats.activeTasks')}
            value={stats.active_tasks}
            sub={t('pages.teamPage.stats.avgPerMember', { val: avgPerMember })}
            valueColor="text-accent-cyan"
          />
          <StatCard
            label={t('pages.teamPage.stats.overloaded')}
            value={stats.overloaded_count}
            sub={t('pages.teamPage.stats.moreThan5')}
            valueColor="text-severity-critical"
          />
          <StatCard
            label={t('pages.teamPage.stats.available')}
            value={stats.available_count}
            sub={t('pages.teamPage.stats.lessThan3')}
            valueColor="text-severity-low"
          />
          <StatCard
            label={t('pages.teamPage.stats.avgCompletion')}
            value={`${stats.avg_completion_days}d`}
            sub={t('pages.teamPage.stats.perTask')}
            valueColor="text-accent-cyan"
          />
        </div>
      )}

      {/* ── Cuerpo: Tabs + Miembros ── */}
      {teams.length === 0 ? (

        /* Sin equipos */
        <div className="text-center py-20 bg-bg-secondary border border-border-primary rounded-xl">
          <span className="text-5xl block mb-3">🏗</span>
          <p className="text-text-primary font-semibold">
            {t('pages.teamPage.empty.noTeams')}
          </p>
          <p className="text-text-muted text-sm mt-1">
            {t('pages.teamPage.empty.noTeamsHint')}
          </p>
        </div>

      ) : (
        <>
          {/* Tabs de equipos */}
          <div className="border-b border-border-primary overflow-x-auto">
            <div className="flex gap-0 min-w-max">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => handleTabChange(team.id)}
                  className={`
                    px-5 py-3 text-sm font-medium whitespace-nowrap
                    border-b-2 transition-colors
                    ${activeTab === team.id
                      ? 'text-accent-cyan border-accent-cyan'
                      : 'text-text-muted border-transparent hover:text-text-secondary'}
                  `}
                >
                  {team.icon && <span className="mr-1.5">{team.icon}</span>}
                  {team.name} ({team.member_count})
                </button>
              ))}
            </div>
          </div>

          {/* Lista de miembros */}
          <div className="min-h-[200px]">
            {loadingMembers ? (
              <LoadingSpinner message={t('common.loading')} />
            ) : members.length === 0 ? (
              /* Sin miembros en este equipo */
              <div className="text-center py-16 bg-bg-secondary border border-border-primary rounded-xl">
                <span className="text-4xl block mb-3">👤</span>
                <p className="text-text-muted text-sm">
                  {t('pages.teamPage.empty.noMembers')}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="
                    mt-4 px-5 py-2 text-sm font-semibold text-white rounded-lg
                    bg-gradient-to-r from-accent-cyan to-accent-blue
                    hover:opacity-90 transition-opacity
                  "
                >
                  {t('pages.teamPage.empty.btnFirstMember')}
                </button>
              </div>
            ) : (
              members.map(member => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onEdit={() => {/* TODO Sprint siguiente: modal edición */}}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* ── Modal de nuevo miembro ── */}
      {showModal && activeTab && (
        <AddMemberModal
          teamId={activeTab}
          onClose={() => setShowModal(false)}
          onSuccess={handleMemberAdded}
        />
      )}
    </div>
  );
}