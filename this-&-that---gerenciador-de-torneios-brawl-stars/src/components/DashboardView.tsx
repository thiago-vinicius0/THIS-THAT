import React from 'react';
import { 
  Trophy, 
  Play, 
  Users, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Shuffle, 
  Layers, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Shield,
  RotateCcw
} from 'lucide-react';
import { Match, Player, Team, Tournament } from '../types/tournament';
import { formatFormatLabel, formatStatusLabel, renderTeamBadge } from '../utils/brawlIcons';
import { ASSETS } from '../assets/assets';

interface DashboardViewProps {
  tournaments: Tournament[];
  teams: Team[];
  players: Player[];
  matches: Match[];
  onSelectTournament: (id: string) => void;
  onOpenCreateTournament: () => void;
  onOpenAddTeam: () => void;
  onNavigateToDraws: () => void;
  onNavigateToStandings: () => void;
  onLoadDemoData: () => void;
  onClearDemoData: () => void;
  hasDemoData: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tournaments,
  teams,
  players,
  matches,
  onSelectTournament,
  onOpenCreateTournament,
  onOpenAddTeam,
  onNavigateToDraws,
  onNavigateToStandings,
  onLoadDemoData,
  onClearDemoData,
  hasDemoData,
}) => {
  // Real KPIs calculated from stored data
  const totalTournaments = tournaments.length;
  const inPrepTournaments = tournaments.filter((t) => t.status === 'draft' || t.status === 'registration' || t.status === 'ready').length;
  const inProgressTournaments = tournaments.filter((t) => t.status === 'in_progress').length;
  const finishedTournaments = tournaments.filter((t) => t.status === 'finished').length;
  
  const totalTeams = teams.length;
  const totalPlayers = players.length;

  const pendingMatches = matches.filter((m) => m.status === 'scheduled' || m.status === 'in_progress').length;
  const completedMatches = matches.filter((m) => m.status === 'completed').length;

  return (
    <div className="space-y-8">
      {/* Hero Arcade Banner */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-slate-800 bg-slate-900 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent z-10" />
        <img
          src={ASSETS.heroBanner}
          alt="THIS & THAT Brawl Arena"
          className="absolute right-0 top-0 w-full h-full object-cover object-center opacity-30 select-none pointer-events-none"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        <div className="relative z-20 p-6 sm:p-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 px-3 py-1 rounded-full text-xs font-bold text-orange-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Painel Oficial do Organizador</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight leading-tight">
            THIS & THAT
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Plataforma arcade para criação, sorteio e gestão profissional de campeonatos de Brawl Stars.
            Gere chaves eliminatórias, tabelas inteligentes e compartilhe os resultados em tempo real.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={onOpenCreateTournament}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Campeonato</span>
            </button>
            <button
              onClick={onNavigateToDraws}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all active:scale-95"
            >
              <Shuffle className="w-4 h-4" />
              <span>Estúdio de Sorteios</span>
            </button>
            {!hasDemoData ? (
              <button
                onClick={onLoadDemoData}
                className="px-4 py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition-all"
                title="Carrega 1 torneio completo com 8 equipes, grupos e playoffs para testar"
              >
                Carregar Torneio Demo
              </button>
            ) : (
              <button
                onClick={onClearDemoData}
                className="px-4 py-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-slate-700 rounded-xl text-xs font-medium transition-all"
                title="Remove apenas os dados demonstrativos sem apagar torneios criados por você"
              >
                Limpar Torneio Demo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Tournaments */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Campeonatos</span>
            <Trophy className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black font-display text-white tabular-nums">
            {totalTournaments}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {inProgressTournaments} em andamento · {finishedTournaments} finalizados
          </div>
        </div>

        {/* Teams & Players */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Equipes & Brawlers</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-display text-white tabular-nums">
            {totalTeams}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalPlayers} jogadores cadastrados
          </div>
        </div>

        {/* Pending Matches */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Partidas Pendentes</span>
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-black font-display text-yellow-400 tabular-nums">
            {pendingMatches}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Aguardando disputa ou placar
          </div>
        </div>

        {/* Completed Matches */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Partidas Concluídas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-display text-emerald-400 tabular-nums">
            {completedMatches}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Com placares validados
          </div>
        </div>
      </div>

      {/* Recent Tournaments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500" />
            Campeonatos Recentes
          </h2>
          {tournaments.length > 0 && (
            <span className="text-xs font-mono text-slate-400">
              {tournaments.length} cadastrados
            </span>
          )}
        </div>

        {tournaments.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 border-2 border-slate-800 border-dashed rounded-3xl flex flex-col items-center justify-center">
            <Trophy className="w-16 h-16 text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-white font-display">
              Nenhum campeonato criado ainda
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
              Comece agora organizando seu primeiro torneio de Brawl Stars ou carregue o torneio de demonstração para explorar o sistema.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenCreateTournament}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30"
              >
                Criar Primeiro Torneio
              </button>
              <button
                onClick={onLoadDemoData}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700"
              >
                Carregar Torneio Demo
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((t) => {
              const status = formatStatusLabel(t.status);
              const tMatches = matches.filter((m) => m.tournamentId === t.id);
              const completedCount = tMatches.filter((m) => m.status === 'completed').length;
              const progressPct = tMatches.length > 0 ? Math.round((completedCount / tMatches.length) * 100) : 0;

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTournament(t.id)}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-orange-500/60 transition-all cursor-pointer shadow-lg hover:shadow-orange-500/10 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${status.bg} ${status.textCol}`}>
                        {status.text}
                      </span>
                      <span className="text-[11px] font-semibold text-cyan-400 font-mono">
                        {t.modality}
                      </span>
                    </div>

                    <h3 className="font-bold text-white font-display text-base group-hover:text-orange-400 transition-colors line-clamp-1">
                      {t.name}
                    </h3>

                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {t.description || 'Sem descrição cadastrada.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Progresso das Partidas</span>
                        <span className="font-mono text-white font-bold">{completedCount}/{tMatches.length} ({progressPct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-cyan-400 rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">
                      {t.enrolledTeamIds.length} equipes
                    </span>
                    <span className="text-orange-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Abrir <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions Panel */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white font-display">
          Ações Rápidas de Gerenciamento
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={onOpenCreateTournament}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-orange-500/60 text-left transition-all group"
          >
            <Plus className="w-5 h-5 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-white text-xs font-display">Novo Torneio</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Criar campeonato do zero</p>
          </button>

          <button
            onClick={onOpenAddTeam}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 text-left transition-all group"
          >
            <Users className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-white text-xs font-display">Cadastrar Equipe</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Adicionar time e jogadores</p>
          </button>

          <button
            onClick={onNavigateToDraws}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-yellow-500/60 text-left transition-all group"
          >
            <Shuffle className="w-5 h-5 text-yellow-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-white text-xs font-display">Sorteio Arcade</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Sortear grupos e chaves</p>
          </button>

          <button
            onClick={onNavigateToStandings}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/60 text-left transition-all group"
          >
            <Layers className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-white text-xs font-display">Classificações</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Consultar tabelas gerais</p>
          </button>
        </div>
      </div>
    </div>
  );
};
