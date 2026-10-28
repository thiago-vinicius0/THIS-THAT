import React, { useState } from 'react';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Settings, 
  Play, 
  Share2, 
  Download, 
  Edit, 
  Copy, 
  Archive, 
  Trash2, 
  CheckCircle2, 
  Swords, 
  Layers, 
  Shuffle, 
  BarChart3,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Match, Team, TeamStanding, Tournament, TournamentStatus } from '../types/tournament';
import { VisualBracket } from './VisualBracket';
import { StandingsTable } from './StandingsTable';
import { formatFormatLabel, formatStatusLabel, renderTeamBadge } from '../utils/brawlIcons';
import { calculateStandings, updateMatchScoreAndAdvance, generatePlayoffBracketFromGroups } from '../engine/rules';
import { StorageService } from '../db/indexedDB';

interface TournamentDetailViewProps {
  tournament: Tournament;
  teams: Team[];
  matches: Match[];
  isAdmin: boolean;
  onUpdateTournament: (updated: Tournament) => void;
  onDeleteTournament: (id: string) => void;
  onDuplicateTournament: (t: Tournament) => void;
  onOpenScoreModal: (match: Match) => void;
  onNavigateToPublic: (tournamentId: string) => void;
  onOpenEditModal: (t: Tournament) => void;
  onOpenDrawModal?: () => void;
  onMatchesUpdated: (newMatches: Match[]) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const TournamentDetailView: React.FC<TournamentDetailViewProps> = ({
  tournament,
  teams,
  matches,
  isAdmin,
  onUpdateTournament,
  onDeleteTournament,
  onDuplicateTournament,
  onOpenScoreModal,
  onNavigateToPublic,
  onOpenEditModal,
  onOpenDrawModal,
  onMatchesUpdated,
  onShowToast,
}) => {
  const [subTab, setSubTab] = useState<'bracket' | 'standings' | 'matches' | 'teams' | 'stats'>('bracket');
  const [matchFilterStatus, setMatchFilterStatus] = useState<string>('all');
  const [matchFilterRound, setMatchFilterRound] = useState<string>('all');

  const teamsMap = new Map<string, Team>(teams.map((t) => [t.id, t]));
  const enrolledTeams = tournament.enrolledTeamIds
    .map((id) => teamsMap.get(id))
    .filter(Boolean) as Team[];

  const tournamentMatches = matches.filter((m) => m.tournamentId === tournament.id);

  // Group Matches vs Bracket Matches
  const groupMatches = tournamentMatches.filter((m) => m.stage === 'group');
  const bracketMatches = tournamentMatches.filter(
    (m) => m.stage === 'bracket_winners' || m.stage === 'grand_final' || m.stage === 'third_place'
  );
  const roundRobinMatches = tournamentMatches.filter((m) => m.stage === 'round_robin');

  // Compute standings
  const isGroupPlayoffs = tournament.format === 'groups_playoffs';
  const groupNames = isGroupPlayoffs ? ['A', 'B', 'C', 'D'].slice(0, tournament.groupsCount || 2) : [];

  // Standings per group
  const groupStandingsMap = new Map<string, TeamStanding[]>();
  if (isGroupPlayoffs) {
    for (const g of groupNames) {
      const gMatches = groupMatches.filter((m) => m.groupId === g);
      // Participating teams in this group
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

  // Overall Standings (for round-robin or general league)
  const overallStandings = calculateStandings(
    enrolledTeams,
    tournamentMatches,
    tournament.scoring,
    tournament.tiebreakerOrder
  );

  // Status badge
  const statusInfo = formatStatusLabel(tournament.status);

  // Handle status update
  const handleStatusChange = (newStatus: TournamentStatus) => {
    const updated = { ...tournament, status: newStatus };
    onUpdateTournament(updated);
    onShowToast('Status Atualizado', `Campeonato agora está: ${formatStatusLabel(newStatus).text}`, 'info');
  };

  // Generate Playoffs from Group stage qualifiers
  const handleGeneratePlayoffs = () => {
    if (!isGroupPlayoffs) return;

    // Collect qualifiers from each group
    const qualifiers: string[] = [];
    const groupA = groupStandingsMap.get('A') || [];
    const groupB = groupStandingsMap.get('B') || [];

    const numQualifiers = tournament.qualifiersPerGroup || 2;
    const topA = groupA.slice(0, numQualifiers).map((s) => s.teamId);
    const topB = groupB.slice(0, numQualifiers).map((s) => s.teamId);

    if (topA.length < numQualifiers || topB.length < numQualifiers) {
      onShowToast('Grupos Incompletos', 'Finalize as partidas dos grupos antes de gerar os playoffs.', 'error');
      return;
    }

    // Standard cross-group seeding:
    // Semi 1: 1st Group A vs 2nd Group B
    // Semi 2: 1st Group B vs 2nd Group A
    const seededPlayoffs = [topA[0], topB[1], topB[0], topA[1]];

    const newPlayoffMatches = generatePlayoffBracketFromGroups(tournament.id, seededPlayoffs, true);

    // Keep existing group matches and append new playoff matches
    const updatedMatches = [...groupMatches, ...newPlayoffMatches];
    onMatchesUpdated(updatedMatches);
    onShowToast('Playoffs Gerados!', 'A chave de mata-mata foi montada com os classificados dos grupos.', 'success');
    setSubTab('bracket');
  };

  // Filtered Matches
  const filteredMatches = tournamentMatches.filter((m) => {
    if (matchFilterStatus !== 'all' && m.status !== matchFilterStatus) return false;
    if (matchFilterRound !== 'all' && String(m.round) !== matchFilterRound) return false;
    return true;
  });

  const uniqueRounds = Array.from(new Set(tournamentMatches.map((m) => m.round))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Tournament Top Banner & Actions */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusInfo.bg} ${statusInfo.textCol}`}>
                {statusInfo.text}
              </span>
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-full">
                {tournament.modality}
              </span>
              <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full font-mono">
                {formatFormatLabel(tournament.format)}
              </span>
              {tournament.isPublic && (
                <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                  Público
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
              {tournament.name}
            </h1>

            {tournament.description && (
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                {tournament.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 font-medium">
              <span>Organizado por: <strong className="text-white">{tournament.organizer}</strong></span>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(tournament.startDate).toLocaleDateString()}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                {enrolledTeams.length} / {tournament.teamsCount} Equipes
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isAdmin && (
              <>
                {/* Status Switcher Dropdown */}
                <select
                  value={tournament.status}
                  onChange={(e) => handleStatusChange(e.target.value as TournamentStatus)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                  aria-label="Alterar status do campeonato"
                >
                  <option value="draft">Rascunho</option>
                  <option value="registration">Inscrições Abertas</option>
                  <option value="ready">Pronto para Iniciar</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="paused">Pausado</option>
                  <option value="finished">Finalizado</option>
                  <option value="archived">Arquivado</option>
                </select>

                <button
                  onClick={() => onOpenEditModal(tournament)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Editar configurações"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDuplicateTournament(tournament)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Duplicar campeonato"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteTournament(tournament.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
                  title="Excluir campeonato"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={() => onNavigateToPublic(tournament.id)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Visão Pública</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        {(tournament.format === 'single_elimination' || tournament.format === 'double_elimination' || tournament.format === 'groups_playoffs') && (
          <button
            onClick={() => setSubTab('bracket')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              subTab === 'bracket' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Chaveamento Visual</span>
          </button>
        )}

        <button
          onClick={() => setSubTab('standings')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            subTab === 'standings' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isGroupPlayoffs ? 'Grupos & Classificação' : 'Classificação Geral'}</span>
        </button>

        <button
          onClick={() => setSubTab('matches')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            subTab === 'matches' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Partidas & Placares ({tournamentMatches.length})</span>
        </button>

        <button
          onClick={() => setSubTab('teams')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            subTab === 'teams' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Equipes Inscritas ({enrolledTeams.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: BRACKET */}
      {subTab === 'bracket' && (
        <div className="space-y-4">
          {isGroupPlayoffs && bracketMatches.length === 0 && (
            <div className="p-6 bg-slate-900 border-2 border-slate-800 rounded-3xl text-center space-y-3">
              <Swords className="w-10 h-10 text-orange-500 mx-auto" />
              <h3 className="text-lg font-bold text-white font-display">
                Mata-Mata Pronto para ser Gerado
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Quando a fase de grupos estiver concluída, clique no botão abaixo para puxar os 2 melhores de cada grupo e montar as semifinais automaticamente.
              </p>
              {isAdmin && (
                <button
                  onClick={handleGeneratePlayoffs}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/30 transition-all inline-flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Gerar Chave dos Playoffs
                </button>
              )}
            </div>
          )}

          <VisualBracket
            matches={tournamentMatches}
            teamsMap={teamsMap}
            isAdmin={isAdmin}
            onMatchClick={isAdmin ? onOpenScoreModal : undefined}
          />
        </div>
      )}

      {/* SUBTAB 2: STANDINGS */}
      {subTab === 'standings' && (
        <div className="space-y-6">
          {isGroupPlayoffs ? (
            <div className="space-y-6">
              {groupNames.map((gName) => {
                const gStandings = groupStandingsMap.get(gName) || [];
                return (
                  <StandingsTable
                    key={gName}
                    title={`Classificação - Grupo ${gName}`}
                    standings={gStandings}
                    qualifiersCount={tournament.qualifiersPerGroup || 2}
                  />
                );
              })}
            </div>
          ) : (
            <StandingsTable
              title="Classificação Geral do Torneio"
              standings={overallStandings}
              qualifiersCount={tournament.qualifiersPerGroup || 2}
            />
          )}
        </div>
      )}

      {/* SUBTAB 3: MATCHES & SCORES */}
      {subTab === 'matches' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Filtros:</span>
              <select
                value={matchFilterStatus}
                onChange={(e) => setMatchFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="scheduled">Agendadas</option>
                <option value="completed">Concluídas</option>
              </select>

              {uniqueRounds.length > 1 && (
                <select
                  value={matchFilterRound}
                  onChange={(e) => setMatchFilterRound(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="all">Todas as Rodadas</option>
                  {uniqueRounds.map((r) => (
                    <option key={r} value={String(r)}>Rodada {r}</option>
                  ))}
                </select>
              )}
            </div>

            <span className="text-xs font-mono text-slate-400">
              {filteredMatches.length} de {tournamentMatches.length} partidas
            </span>
          </div>

          {/* Matches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredMatches.map((match) => {
              const team1 = match.team1Id ? teamsMap.get(match.team1Id) : null;
              const team2 = match.team2Id ? teamsMap.get(match.team2Id) : null;
              const isCompleted = match.status === 'completed';

              return (
                <div
                  key={match.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs pb-2 mb-3 border-b border-slate-800 font-mono">
                      <span className="text-cyan-400 font-sans font-bold">
                        {match.roundName}
                      </span>
                      <span className="text-slate-400">
                        {match.mapName ? match.mapName : `#${match.matchNumber}`}
                      </span>
                    </div>

                    {/* Team 1 vs Team 2 Row */}
                    <div className="space-y-2">
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
                      <p className="text-[11px] text-slate-400 mt-2 italic line-clamp-1">
                        "{match.notes}"
                      </p>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {isCompleted ? 'Resultado registrado' : 'Aguardando disputa'}
                      </span>
                      <button
                        onClick={() => onOpenScoreModal(match)}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition-all active:scale-95"
                      >
                        {isCompleted ? 'Editar Placar' : 'Lançar Placar'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 4: ENROLLED TEAMS */}
      {subTab === 'teams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white font-display text-base">
              Equipes Participantes ({enrolledTeams.length})
            </h3>
            {isAdmin && onOpenDrawModal && (
              <button
                onClick={onOpenDrawModal}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 flex items-center gap-1.5"
              >
                <Shuffle className="w-4 h-4" />
                <span>Sortear no Estúdio</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {enrolledTeams.map((team) => (
              <div
                key={team.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3 shadow-md"
              >
                {renderTeamBadge(team.badgeIcon, team.color, 'w-10 h-10')}
                <div className="min-w-0">
                  <h4 className="font-bold text-white font-display text-sm truncate">{team.name}</h4>
                  <span className="text-xs text-slate-400 font-mono">{team.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
