import React, { useState } from 'react';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Share2, 
  CheckCircle2, 
  Layers, 
  Swords, 
  Printer, 
  Copy, 
  AlertCircle,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { Match, Team, Tournament } from '../types/tournament';
import { VisualBracket } from './VisualBracket';
import { StandingsTable } from './StandingsTable';
import { formatFormatLabel, formatStatusLabel, renderTeamBadge } from '../utils/brawlIcons';
import { calculateStandings } from '../engine/rules';
import { ASSETS } from '../assets/assets';

interface PublicViewProps {
  tournament: Tournament;
  teams: Team[];
  matches: Match[];
  onBackToAdmin?: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PublicView: React.FC<PublicViewProps> = ({
  tournament,
  teams,
  matches,
  onBackToAdmin,
  onShowToast,
}) => {
  const [subTab, setSubTab] = useState<'bracket' | 'standings' | 'matches' | 'teams'>('bracket');

  const teamsMap = new Map<string, Team>(teams.map((t) => [t.id, t]));
  const enrolledTeams = tournament.enrolledTeamIds
    .map((id) => teamsMap.get(id))
    .filter(Boolean) as Team[];

  const tournamentMatches = matches.filter((m) => m.tournamentId === tournament.id);
  const groupMatches = tournamentMatches.filter((m) => m.stage === 'group');

  const isGroupPlayoffs = tournament.format === 'groups_playoffs';
  const groupNames = isGroupPlayoffs ? ['A', 'B', 'C', 'D'].slice(0, tournament.groupsCount || 2) : [];

  const groupStandingsMap = new Map<string, any[]>();
  if (isGroupPlayoffs) {
    for (const g of groupNames) {
      const gMatches = groupMatches.filter((m) => m.groupId === g);
      const gTeamIds = new Set<string>();
      gMatches.forEach((m) => {
        if (m.team1Id) gTeamIds.add(m.team1Id);
        if (m.team2Id) gTeamIds.add(m.team2Id);
      });
      const gTeams = Array.from(gTeamIds).map((id) => teamsMap.get(id)).filter(Boolean) as Team[];
      const gStandings = calculateStandings(gTeams, gMatches, tournament.scoring, tournament.tiebreakerOrder);
      groupStandingsMap.set(g, gStandings);
    }
  }

  const overallStandings = calculateStandings(
    enrolledTeams,
    tournamentMatches,
    tournament.scoring,
    tournament.tiebreakerOrder
  );

  const statusInfo = formatStatusLabel(tournament.status);

  // Copy shareable URL
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}?public=${tournament.id}`;
      navigator.clipboard?.writeText(url);
      onShowToast('Link Copiado!', 'O link público do torneio foi copiado para sua área de transferência.', 'success');
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Notice about Local Persistence & Boundaries */}
      <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-400 no-print">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Visão Pública do Espectador:</strong> Os dados deste campeonato são atualizados em tempo real pelo navegador do organizador.
          </span>
        </div>
        {onBackToAdmin && (
          <button
            onClick={onBackToAdmin}
            className="flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 ml-4 shrink-0 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Painel Admin</span>
          </button>
        )}
      </div>

      {/* Public Header Hero */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusInfo.bg} ${statusInfo.textCol}`}>
                {statusInfo.text}
              </span>
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-full">
                {tournament.modality}
              </span>
              <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-full">
                {formatFormatLabel(tournament.format)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white font-display">
              {tournament.name}
            </h1>

            {tournament.description && (
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                {tournament.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span>Organização: <strong className="text-white">{tournament.organizer}</strong></span>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(tournament.startDate).toLocaleDateString()}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                {enrolledTeams.length} Equipes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print shrink-0">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all active:scale-95"
            >
              <Copy className="w-4 h-4" />
              <span>Copiar Link</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs transition-colors"
              title="Imprimir chave e tabela"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto no-print">
        <button
          onClick={() => setSubTab('bracket')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            subTab === 'bracket' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Chaveamento</span>
        </button>

        <button
          onClick={() => setSubTab('standings')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            subTab === 'standings' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Classificação</span>
        </button>

        <button
          onClick={() => setSubTab('matches')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            subTab === 'matches' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Resultados ({tournamentMatches.length})</span>
        </button>

        <button
          onClick={() => setSubTab('teams')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            subTab === 'teams' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Equipes ({enrolledTeams.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {subTab === 'bracket' && (
        <VisualBracket
          matches={tournamentMatches}
          teamsMap={teamsMap}
          isAdmin={false}
        />
      )}

      {subTab === 'standings' && (
        <div className="space-y-6">
          {isGroupPlayoffs ? (
            <div className="space-y-6">
              {groupNames.map((gName) => {
                const gStandings = groupStandingsMap.get(gName) || [];
                return (
                  <StandingsTable
                    key={gName}
                    title={`Grupo ${gName}`}
                    standings={gStandings}
                    qualifiersCount={tournament.qualifiersPerGroup || 2}
                  />
                );
              })}
            </div>
          ) : (
            <StandingsTable
              title="Classificação Geral"
              standings={overallStandings}
              qualifiersCount={tournament.qualifiersPerGroup || 2}
            />
          )}
        </div>
      )}

      {subTab === 'matches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tournamentMatches.map((match) => {
            const team1 = match.team1Id ? teamsMap.get(match.team1Id) : null;
            const team2 = match.team2Id ? teamsMap.get(match.team2Id) : null;
            const isCompleted = match.status === 'completed';

            return (
              <div
                key={match.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs pb-2 mb-2 border-b border-slate-800 font-mono">
                    <span className="text-cyan-400 font-sans font-bold">{match.roundName}</span>
                    <span className="text-slate-400">{match.mapName || `#${match.matchNumber}`}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className={`flex items-center justify-between p-2 rounded-xl ${
                      match.winnerId === match.team1Id ? 'bg-orange-500/15 border border-orange-500/30 font-bold' : 'bg-slate-950/60'
                    }`}>
                      <div className="flex items-center gap-2">
                        {team1 ? renderTeamBadge(team1.badgeIcon, team1.color, 'w-6 h-6') : <span className="text-xs text-slate-500">?</span>}
                        <span className="text-xs font-display text-white">{team1?.name || (match.isBye ? 'Folga' : 'A definir')}</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-white px-2">
                        {isCompleted ? match.score1 : '-'}
                      </span>
                    </div>

                    <div className={`flex items-center justify-between p-2 rounded-xl ${
                      match.winnerId === match.team2Id ? 'bg-orange-500/15 border border-orange-500/30 font-bold' : 'bg-slate-950/60'
                    }`}>
                      <div className="flex items-center gap-2">
                        {team2 ? renderTeamBadge(team2.badgeIcon, team2.color, 'w-6 h-6') : <span className="text-xs text-slate-500">?</span>}
                        <span className="text-xs font-display text-white">{team2?.name || (match.isBye ? 'Folga' : 'A definir')}</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-white px-2">
                        {isCompleted ? match.score2 : '-'}
                      </span>
                    </div>
                  </div>

                  {match.notes && (
                    <p className="text-[11px] text-slate-400 mt-2 italic">
                      "{match.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 text-[11px] text-slate-500 font-mono">
                  Status: {isCompleted ? 'Finalizada' : 'Aguardando partida'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'teams' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {enrolledTeams.map((team) => (
            <div
              key={team.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3 shadow-md"
            >
              {renderTeamBadge(team.badgeIcon, team.color, 'w-10 h-10')}
              <div>
                <h4 className="font-bold text-white font-display text-sm">{team.name}</h4>
                <span className="text-xs text-slate-400 font-mono">{team.tag} · Cap: {team.captain}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
