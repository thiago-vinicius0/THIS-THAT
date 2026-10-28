import React, { useRef } from 'react';
import { Match, Team } from '../types/tournament';
import { renderTeamBadge } from '../utils/brawlIcons';
import { Trophy, CheckCircle2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface VisualBracketProps {
  matches: Match[];
  teamsMap: Map<string, Team>;
  onMatchClick?: (match: Match) => void;
  isAdmin?: boolean;
}

export const VisualBracket: React.FC<VisualBracketProps> = ({
  matches,
  teamsMap,
  onMatchClick,
  isAdmin = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = React.useState(1);

  // Filter knockout matches
  const bracketMatches = matches.filter(
    (m) => m.stage === 'bracket_winners' || m.stage === 'grand_final' || m.stage === 'third_place'
  );

  if (bracketMatches.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
        <p className="text-slate-400 text-sm">
          A chave eliminatória ainda não foi gerada para este torneio.
        </p>
      </div>
    );
  }

  // Group matches by round
  const roundsMap = new Map<number, Match[]>();
  bracketMatches
    .filter((m) => m.stage !== 'third_place')
    .forEach((m) => {
      const list = roundsMap.get(m.round) || [];
      list.push(m);
      roundsMap.set(m.round, list);
    });

  const sortedRounds = Array.from(roundsMap.keys()).sort((a, b) => a - b);
  const thirdPlaceMatch = bracketMatches.find((m) => m.stage === 'third_place');

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Zoom / Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
          <span>Chave Eliminatória Oficial</span>
          <span className="text-slate-600">·</span>
          <span>{isAdmin ? 'Clique em qualquer partida para lançar o placar' : 'Visualização em tempo real'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Reduzir zoom"
            aria-label="Reduzir zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 px-2">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Aumentar zoom"
            aria-label="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors ml-1"
            title="Redefinir zoom"
            aria-label="Redefinir zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bracket Canvas Area */}
      <div 
        ref={containerRef}
        className="overflow-x-auto overflow-y-auto p-8 min-h-[460px] scroll-smooth"
      >
        <div 
          className="flex items-stretch gap-12 min-w-max transition-transform origin-top-left"
          style={{ transform: `scale(${zoom})` }}
        >
          {sortedRounds.map((roundNumber, rIdx) => {
            const matchesInThisRound = roundsMap.get(roundNumber) || [];
            const roundTitle = matchesInThisRound[0]?.roundName || `Rodada ${roundNumber}`;

            return (
              <div key={roundNumber} className="flex flex-col w-72 shrink-0">
                {/* Round Header */}
                <div className="mb-6 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-full">
                    {roundTitle}
                  </span>
                </div>

                {/* Match Cards Container with auto alignment */}
                <div className="flex flex-col justify-around flex-1 gap-6">
                  {matchesInThisRound.map((match) => {
                    const team1 = match.team1Id ? teamsMap.get(match.team1Id) : null;
                    const team2 = match.team2Id ? teamsMap.get(match.team2Id) : null;
                    const isCompleted = match.status === 'completed';
                    const isFinal = match.stage === 'grand_final';

                    return (
                      <div
                        key={match.id}
                        onClick={() => onMatchClick?.(match)}
                        role={isAdmin ? 'button' : 'article'}
                        tabIndex={isAdmin ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (isAdmin && (e.key === 'Enter' || e.key === ' ')) {
                            onMatchClick?.(match);
                          }
                        }}
                        className={`group relative rounded-2xl border-2 transition-all p-3.5 text-left shadow-lg ${
                          isAdmin ? 'cursor-pointer hover:border-orange-500 hover:shadow-orange-500/10' : ''
                        } ${
                          isFinal 
                            ? 'bg-gradient-to-b from-slate-900 to-amber-950/20 border-amber-500/60 shadow-amber-500/10'
                            : isCompleted 
                            ? 'bg-slate-900/90 border-slate-700/80' 
                            : 'bg-slate-900/60 border-slate-800 border-dashed'
                        }`}
                      >
                        {/* Match Title & Map */}
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-2 mb-2 border-b border-slate-800/80">
                          <span className="truncate">Partida #{match.matchNumber}</span>
                          {match.mapName ? (
                            <span className="text-slate-400 truncate max-w-[120px]">{match.mapName}</span>
                          ) : isCompleted ? (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" /> Fim
                            </span>
                          ) : (
                            <span className="text-orange-400 font-sans font-semibold">Agendada</span>
                          )}
                        </div>

                        {/* Team 1 */}
                        <div className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                          match.winnerId && match.winnerId === match.team1Id 
                            ? 'bg-orange-500/15 text-orange-200 font-bold border border-orange-500/30' 
                            : 'text-slate-200'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            {team1 ? renderTeamBadge(team1.badgeIcon, team1.color, 'w-6 h-6') : (
                              <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-500">
                                ?
                              </div>
                            )}
                            <span className="text-xs truncate font-display font-semibold">
                              {team1 ? team1.name : (match.isBye ? 'Folga' : 'A definir')}
                            </span>
                          </div>
                          <span className={`text-sm font-mono tabular-nums px-2 py-0.5 rounded-lg ${
                            isCompleted ? 'bg-slate-800 font-bold text-white' : 'text-slate-600'
                          }`}>
                            {isCompleted ? match.score1 : '-'}
                          </span>
                        </div>

                        {/* Team 2 */}
                        <div className={`flex items-center justify-between p-2 mt-1 rounded-xl transition-colors ${
                          match.winnerId && match.winnerId === match.team2Id 
                            ? 'bg-orange-500/15 text-orange-200 font-bold border border-orange-500/30' 
                            : 'text-slate-200'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            {team2 ? renderTeamBadge(team2.badgeIcon, team2.color, 'w-6 h-6') : (
                              <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-500">
                                ?
                              </div>
                            )}
                            <span className="text-xs truncate font-display font-semibold">
                              {team2 ? team2.name : (match.isBye ? 'Folga' : 'A definir')}
                            </span>
                          </div>
                          <span className={`text-sm font-mono tabular-nums px-2 py-0.5 rounded-lg ${
                            isCompleted ? 'bg-slate-800 font-bold text-white' : 'text-slate-600'
                          }`}>
                            {isCompleted ? match.score2 : '-'}
                          </span>
                        </div>

                        {/* Winner Trophy banner for Final */}
                        {isFinal && isCompleted && match.winnerId && (
                          <div className="mt-3 pt-2 border-t border-amber-500/30 flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400">
                            <Trophy className="w-4 h-4 text-amber-400" />
                            <span>Campeão: {teamsMap.get(match.winnerId)?.name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 3rd Place Match Card (if exists) */}
          {thirdPlaceMatch && (
            <div className="flex flex-col w-72 shrink-0 border-l border-slate-800/80 pl-8">
              <div className="mb-6 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3 py-1 rounded-full">
                  Disputa do 3º Lugar
                </span>
              </div>
              <div className="flex flex-col justify-center flex-1">
                <div
                  onClick={() => onMatchClick?.(thirdPlaceMatch)}
                  role={isAdmin ? 'button' : 'article'}
                  tabIndex={isAdmin ? 0 : undefined}
                  className={`p-3.5 rounded-2xl border-2 bg-slate-900 border-slate-700 shadow-lg ${
                    isAdmin ? 'cursor-pointer hover:border-amber-500 transition-colors' : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-2 mb-2 border-b border-slate-800">
                    <span>Medalha de Bronze</span>
                    <span>{thirdPlaceMatch.status === 'completed' ? 'Concluída' : 'Agendada'}</span>
                  </div>

                  {/* Team 1 */}
                  <div className={`flex items-center justify-between p-2 rounded-xl ${
                    thirdPlaceMatch.winnerId === thirdPlaceMatch.team1Id 
                      ? 'bg-amber-500/15 text-amber-200 font-bold border border-amber-500/30' 
                      : 'text-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {thirdPlaceMatch.team1Id && teamsMap.get(thirdPlaceMatch.team1Id) ? (
                        renderTeamBadge(teamsMap.get(thirdPlaceMatch.team1Id)!.badgeIcon, teamsMap.get(thirdPlaceMatch.team1Id)!.color, 'w-6 h-6')
                      ) : (
                        <div className="w-6 h-6 rounded-lg bg-slate-800 text-[10px] text-slate-500 flex items-center justify-center">?</div>
                      )}
                      <span className="text-xs truncate font-display font-semibold">
                        {thirdPlaceMatch.team1Id ? teamsMap.get(thirdPlaceMatch.team1Id)?.name : 'Perdedor Semi 1'}
                      </span>
                    </div>
                    <span className="text-sm font-mono tabular-nums px-2 py-0.5 rounded-lg bg-slate-800 font-bold text-white">
                      {thirdPlaceMatch.status === 'completed' ? thirdPlaceMatch.score1 : '-'}
                    </span>
                  </div>

                  {/* Team 2 */}
                  <div className={`flex items-center justify-between p-2 mt-1 rounded-xl ${
                    thirdPlaceMatch.winnerId === thirdPlaceMatch.team2Id 
                      ? 'bg-amber-500/15 text-amber-200 font-bold border border-amber-500/30' 
                      : 'text-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {thirdPlaceMatch.team2Id && teamsMap.get(thirdPlaceMatch.team2Id) ? (
                        renderTeamBadge(teamsMap.get(thirdPlaceMatch.team2Id)!.badgeIcon, teamsMap.get(thirdPlaceMatch.team2Id)!.color, 'w-6 h-6')
                      ) : (
                        <div className="w-6 h-6 rounded-lg bg-slate-800 text-[10px] text-slate-500 flex items-center justify-center">?</div>
                      )}
                      <span className="text-xs truncate font-display font-semibold">
                        {thirdPlaceMatch.team2Id ? teamsMap.get(thirdPlaceMatch.team2Id)?.name : 'Perdedor Semi 2'}
                      </span>
                    </div>
                    <span className="text-sm font-mono tabular-nums px-2 py-0.5 rounded-lg bg-slate-800 font-bold text-white">
                      {thirdPlaceMatch.status === 'completed' ? thirdPlaceMatch.score2 : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
