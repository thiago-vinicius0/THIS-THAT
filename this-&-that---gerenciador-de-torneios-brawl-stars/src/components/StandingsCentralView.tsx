import React, { useState } from 'react';
import { Layers, Trophy, Download, Search } from 'lucide-react';
import { Match, Team, Tournament } from '../types/tournament';
import { StandingsTable } from './StandingsTable';
import { calculateStandings } from '../engine/rules';

interface StandingsCentralViewProps {
  tournaments: Tournament[];
  teams: Team[];
  matches: Match[];
}

export const StandingsCentralView: React.FC<StandingsCentralViewProps> = ({
  tournaments,
  teams,
  matches,
}) => {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournaments[0]?.id || '');

  const selectedTournament = tournaments.find((t) => t.id === selectedTournamentId);
  const teamsMap = new Map<string, Team>(teams.map((t) => [t.id, t]));

  if (!selectedTournament) {
    return (
      <div className="p-12 text-center bg-slate-900/40 border-2 border-slate-800 border-dashed rounded-3xl">
        <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-300 font-display">
          Nenhum campeonato disponível para classificação
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Crie um campeonato ou carregue o torneio de demonstração para visualizar as tabelas.
        </p>
      </div>
    );
  }

  const tournamentMatches = matches.filter((m) => m.tournamentId === selectedTournament.id);
  const isGroupPlayoffs = selectedTournament.format === 'groups_playoffs';
  const groupNames = isGroupPlayoffs ? ['A', 'B', 'C', 'D'].slice(0, selectedTournament.groupsCount || 2) : [];

  // Group standings
  const groupStandingsMap = new Map<string, any[]>();
  if (isGroupPlayoffs) {
    for (const g of groupNames) {
      const gMatches = tournamentMatches.filter((m) => m.groupId === g && m.stage === 'group');
      const gTeamIds = new Set<string>();
      gMatches.forEach((m) => {
        if (m.team1Id) gTeamIds.add(m.team1Id);
        if (m.team2Id) gTeamIds.add(m.team2Id);
      });
      const gTeams = Array.from(gTeamIds).map((id) => teamsMap.get(id)).filter(Boolean) as Team[];
      const gStandings = calculateStandings(gTeams, gMatches, selectedTournament.scoring, selectedTournament.tiebreakerOrder);
      groupStandingsMap.set(g, gStandings);
    }
  }

  const enrolledTeams = selectedTournament.enrolledTeamIds
    .map((id) => teamsMap.get(id))
    .filter(Boolean) as Team[];

  const overallStandings = calculateStandings(
    enrolledTeams,
    tournamentMatches,
    selectedTournament.scoring,
    selectedTournament.tiebreakerOrder
  );

  return (
    <div className="space-y-6">
      {/* Header & Tournament Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-display flex items-center gap-2">
            <Layers className="w-6 h-6 text-orange-500" />
            Classificações & Tabelas
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Acompanhe o desempenho de cada equipe com cálculo automático de vitórias, saldo e critérios de desempate.
          </p>
        </div>

        {tournaments.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Torneio:</span>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tables Area */}
      {isGroupPlayoffs ? (
        <div className="space-y-6">
          {groupNames.map((g) => (
            <StandingsTable
              key={g}
              title={`Classificação Oficial - Grupo ${g}`}
              standings={groupStandingsMap.get(g) || []}
              qualifiersCount={selectedTournament.qualifiersPerGroup || 2}
            />
          ))}
        </div>
      ) : (
        <StandingsTable
          title={`Tabela Geral - ${selectedTournament.name}`}
          standings={overallStandings}
          qualifiersCount={selectedTournament.qualifiersPerGroup || 2}
        />
      )}
    </div>
  );
};
