import React, { useState } from 'react';
import { Shuffle, Dices, Trophy, Check, RotateCcw, Sparkles, Clock, History, AlertCircle } from 'lucide-react';
import { DrawLog, Team, Tournament } from '../types/tournament';
import { renderTeamBadge } from '../utils/brawlIcons';

interface DrawsStudioViewProps {
  tournaments: Tournament[];
  teams: Team[];
  drawLogs: DrawLog[];
  onSaveDrawLog: (log: DrawLog) => void;
  onApplyGroupDrawToTournament?: (tournamentId: string, groupAssignments: Record<string, string[]>) => void;
  onApplyBracketDrawToTournament?: (tournamentId: string, seededTeamIds: string[]) => void;
}

export const DrawsStudioView: React.FC<DrawsStudioViewProps> = ({
  tournaments,
  teams,
  drawLogs,
  onSaveDrawLog,
  onApplyGroupDrawToTournament,
  onApplyBracketDrawToTournament,
}) => {
  const [activeTab, setActiveTab] = useState<'groups' | 'bracket' | 'custom' | 'history'>('groups');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournaments[0]?.id || '');
  
  // Animation state
  const [isDrawing, setIsDrawing] = useState(false);
  const [animatingName, setAnimatingName] = useState('');

  // Groups Draw State
  const [numGroups, setNumGroups] = useState<number>(2);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [drawnGroups, setDrawnGroups] = useState<Record<string, string[]> | null>(null);

  // Custom Draw State
  const [customItemsText, setCustomItemsText] = useState('Equipe Alpha\nEquipe Bravo\nEquipe Charlie\nEquipe Delta\nEquipe Echo\nEquipe Foxtrot');
  const [customQuantity, setCustomQuantity] = useState(1);
  const [customWithoutReplacement, setCustomWithoutReplacement] = useState(true);
  const [customResults, setCustomResults] = useState<string[]>([]);

  // Bracket Seed Draw State
  const [bracketTeamIds, setBracketTeamIds] = useState<string[]>([]);
  const [drawnSeeds, setDrawnSeeds] = useState<string[] | null>(null);

  const selectedTournament = tournaments.find((t) => t.id === selectedTournamentId);

  // Sync teams when tournament changes
  React.useEffect(() => {
    if (selectedTournament) {
      const eligible = selectedTournament.enrolledTeamIds.length > 0 
        ? selectedTournament.enrolledTeamIds 
        : teams.slice(0, selectedTournament.teamsCount).map((t) => t.id);
      setSelectedTeamIds(eligible);
      setBracketTeamIds(eligible);
      setNumGroups(selectedTournament.groupsCount || 2);
    } else {
      setSelectedTeamIds(teams.map((t) => t.id));
      setBracketTeamIds(teams.map((t) => t.id));
    }
  }, [selectedTournamentId, selectedTournament, teams]);

  // Animated Shuffle helper
  const runShuffleAnimation = (items: string[], onFinish: () => void) => {
    setIsDrawing(true);
    let count = 0;
    const interval = setInterval(() => {
      const randomItem = items[Math.floor(Math.random() * items.length)];
      setAnimatingName(randomItem);
      count++;
      if (count > 20) {
        clearInterval(interval);
        setIsDrawing(false);
        setAnimatingName('');
        onFinish();
      }
    }, 80);
  };

  // Perform Group Draw
  const handleExecuteGroupDraw = () => {
    if (selectedTeamIds.length === 0) return;

    const teamNames = selectedTeamIds.map((id) => teams.find((t) => t.id === id)?.name || id);

    runShuffleAnimation(teamNames, () => {
      const shuffled = [...selectedTeamIds].sort(() => Math.random() - 0.5);
      const groupNames = ['A', 'B', 'C', 'D'].slice(0, numGroups);
      const groups: Record<string, string[]> = {};
      for (const g of groupNames) groups[g] = [];

      shuffled.forEach((teamId, index) => {
        const group = groupNames[index % numGroups];
        groups[group].push(teamId);
      });

      setDrawnGroups(groups);

      // Log
      const log: DrawLog = {
        id: `draw_${Date.now()}`,
        tournamentId: selectedTournamentId || undefined,
        type: 'groups',
        timestamp: new Date().toISOString(),
        title: `Sorteio de Grupos (${numGroups} Grupos)`,
        eligibleParticipants: selectedTeamIds,
        results: groups,
      };
      onSaveDrawLog(log);
    });
  };

  // Perform Bracket Draw
  const handleExecuteBracketDraw = () => {
    if (bracketTeamIds.length === 0) return;

    const teamNames = bracketTeamIds.map((id) => teams.find((t) => t.id === id)?.name || id);

    runShuffleAnimation(teamNames, () => {
      const shuffled = [...bracketTeamIds].sort(() => Math.random() - 0.5);
      setDrawnSeeds(shuffled);

      const log: DrawLog = {
        id: `draw_${Date.now()}`,
        tournamentId: selectedTournamentId || undefined,
        type: 'bracket',
        timestamp: new Date().toISOString(),
        title: `Sorteio de Chaveamento (${shuffled.length} Equipes)`,
        eligibleParticipants: bracketTeamIds,
        results: shuffled,
      };
      onSaveDrawLog(log);
    });
  };

  // Perform Custom Draw
  const handleExecuteCustomDraw = () => {
    const rawList = customItemsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawList.length === 0) return;

    runShuffleAnimation(rawList, () => {
      const pool = [...rawList];
      const results: string[] = [];

      for (let i = 0; i < Math.min(customQuantity, pool.length); i++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        results.push(pool[randomIndex]);
        if (customWithoutReplacement) {
          pool.splice(randomIndex, 1);
        }
      }

      setCustomResults(results);

      const log: DrawLog = {
        id: `draw_${Date.now()}`,
        type: 'custom',
        timestamp: new Date().toISOString(),
        title: `Sorteio Personalizado (${results.length} Vencedores)`,
        eligibleParticipants: rawList,
        results: results,
      };
      onSaveDrawLog(log);
    });
  };

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-display flex items-center gap-2">
            <Shuffle className="w-6 h-6 text-orange-500" />
            Estúdio de Sorteios Arcade
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Distribuição balanceada de grupos, confrontos de chaveamento e sorteios transparentes em tempo real.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'groups' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sorteio de Grupos
          </button>
          <button
            onClick={() => setActiveTab('bracket')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'bracket' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Chaveamento
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'custom' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Roleta / Itens
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'history' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Histórico ({drawLogs.length})
          </button>
        </div>
      </div>

      {/* Animation Overlay banner when rolling */}
      {isDrawing && (
        <div className="p-8 bg-gradient-to-r from-orange-600/30 via-cyan-600/30 to-purple-600/30 border-2 border-orange-500 rounded-3xl text-center shadow-2xl animate-pulse">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-spin" />
            <h3 className="text-3xl font-black font-display text-white tracking-wide">
              {animatingName || 'Sorteando...'}
            </h3>
            <Sparkles className="w-8 h-8 text-yellow-400 animate-spin" />
          </div>
          <p className="text-xs text-slate-300 mt-2 font-mono">
            Gerador pseudoaleatório criptograficamente balanceado em execução...
          </p>
        </div>
      )}

      {/* TAB 1: GROUP DRAW */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Dices className="w-5 h-5 text-orange-400" />
              Configurar Sorteio
            </h3>

            {tournaments.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vincular ao Campeonato
                </label>
                <select
                  value={selectedTournamentId}
                  onChange={(e) => setSelectedTournamentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.modality})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quantidade de Grupos
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNumGroups(n)}
                    className={`py-2 text-xs font-bold rounded-xl border-2 transition-all ${
                      numGroups === n
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {n} Grupos
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  Participantes Elegíveis ({selectedTeamIds.length})
                </label>
                <button
                  type="button"
                  onClick={() => setSelectedTeamIds(teams.map((t) => t.id))}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Selecionar Todos
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
                {teams.map((t) => {
                  const isChecked = selectedTeamIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer text-xs select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTeamIds([...selectedTeamIds, t.id]);
                          else setSelectedTeamIds(selectedTeamIds.filter((id) => id !== t.id));
                        }}
                        className="rounded text-orange-600 bg-slate-900 border-slate-700"
                      />
                      {renderTeamBadge(t.badgeIcon, t.color, 'w-5 h-5')}
                      <span className="font-semibold text-slate-200 truncate">{t.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={isDrawing || selectedTeamIds.length === 0}
              onClick={handleExecuteGroupDraw}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
            >
              <Shuffle className="w-4 h-4" />
              {isDrawing ? 'Sorteando...' : 'Sortear Grupos Agora'}
            </button>
          </div>

          {/* Results Cards */}
          <div className="lg:col-span-2 space-y-4">
            {drawnGroups ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white font-display">
                    Resultado Oficial do Sorteio
                  </h3>
                  {selectedTournamentId && onApplyGroupDrawToTournament && (
                    <button
                      onClick={() => onApplyGroupDrawToTournament(selectedTournamentId, drawnGroups)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      Aplicar Grupos ao Torneio
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(drawnGroups).map(([groupName, teamIds]) => (
                    <div
                      key={groupName}
                      className="p-5 bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-xl"
                    >
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                        <h4 className="font-bold text-white font-display text-lg flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center text-sm font-black">
                            {groupName}
                          </span>
                          <span>Grupo {groupName}</span>
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          {teamIds.length} equipes
                        </span>
                      </div>

                      <div className="space-y-2">
                        {teamIds.map((teamId, index) => {
                          const team = teams.find((t) => t.id === teamId);
                          return (
                            <div
                              key={teamId}
                              className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
                            >
                              <span className="font-mono text-slate-500 text-[11px] w-4 text-center">
                                {index + 1}
                              </span>
                              {team ? renderTeamBadge(team.badgeIcon, team.color, 'w-6 h-6') : null}
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-slate-100 block truncate font-display">
                                  {team ? team.name : teamId}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {team?.tag}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-900/40 border-2 border-slate-800 border-dashed rounded-3xl flex flex-col items-center justify-center">
                <Dices className="w-12 h-12 text-slate-600 mb-3" />
                <h4 className="text-base font-bold text-slate-300 font-display">
                  Nenhum sorteio de grupos realizado nesta sessão
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Selecione os participantes elegíveis ao lado e clique no botão para gerar os potes e grupos automaticamente.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BRACKET DRAW */}
      {activeTab === 'bracket' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Trophy className="w-5 h-5 text-cyan-400" />
              Sorteio de Chaves & Seeds
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Participantes Elegíveis ({bracketTeamIds.length})
              </label>
              <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
                {teams.map((t) => {
                  const isChecked = bracketTeamIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer text-xs select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setBracketTeamIds([...bracketTeamIds, t.id]);
                          else setBracketTeamIds(bracketTeamIds.filter((id) => id !== t.id));
                        }}
                        className="rounded text-cyan-600 bg-slate-900 border-slate-700"
                      />
                      {renderTeamBadge(t.badgeIcon, t.color, 'w-5 h-5')}
                      <span className="font-semibold text-slate-200 truncate">{t.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={isDrawing || bracketTeamIds.length < 2}
              onClick={handleExecuteBracketDraw}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
            >
              <Shuffle className="w-4 h-4" />
              {isDrawing ? 'Sorteando...' : 'Sortear Posições na Chave'}
            </button>
          </div>

          <div className="lg:col-span-2">
            {drawnSeeds ? (
              <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="font-bold text-white font-display text-base">
                    Ordem de Cabeças de Chave (Seeds)
                  </h4>
                  {selectedTournamentId && onApplyBracketDrawToTournament && (
                    <button
                      onClick={() => onApplyBracketDrawToTournament(selectedTournamentId, drawnSeeds)}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 flex items-center gap-1.5 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      Aplicar Chaveamento ao Torneio
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {drawnSeeds.map((teamId, index) => {
                    const team = teams.find((t) => t.id === teamId);
                    return (
                      <div
                        key={teamId}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs"
                      >
                        <span className="w-7 h-7 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono font-bold flex items-center justify-center text-xs">
                          #{index + 1}
                        </span>
                        {team ? renderTeamBadge(team.badgeIcon, team.color, 'w-6 h-6') : null}
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-white block truncate font-display">
                            {team ? team.name : teamId}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{team?.tag}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-900/40 border-2 border-slate-800 border-dashed rounded-3xl flex flex-col items-center justify-center">
                <Trophy className="w-12 h-12 text-slate-600 mb-3" />
                <h4 className="text-base font-bold text-slate-300 font-display">
                  Nenhum chaveamento sorteado
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Selecione as equipes e clique para sortear as posições e os confrontos da primeira fase.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM RAFFLE */}
      {activeTab === 'custom' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Sorteio Personalizado & Prêmios
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Itens a Sortear (1 por linha)
              </label>
              <textarea
                rows={6}
                value={customItemsText}
                onChange={(e) => setCustomItemsText(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Qtd. Vencedores</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={customQuantity}
                  onChange={(e) => setCustomQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Repetição</label>
                <button
                  type="button"
                  onClick={() => setCustomWithoutReplacement(!customWithoutReplacement)}
                  className={`w-full py-2 px-2 text-xs font-bold rounded-xl border transition-colors ${
                    customWithoutReplacement ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {customWithoutReplacement ? 'Sem Reposição' : 'Com Reposição'}
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={isDrawing}
              onClick={handleExecuteCustomDraw}
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-black rounded-2xl shadow-lg shadow-yellow-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
            >
              <Dices className="w-4 h-4" />
              {isDrawing ? 'Girando...' : 'Girar Roleta do Sorteio'}
            </button>
          </div>

          <div className="lg:col-span-2">
            {customResults.length > 0 ? (
              <div className="bg-slate-900 border-2 border-yellow-500/40 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="font-bold text-white font-display text-base flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Vencedores Sorteados
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-950 border border-yellow-500/30 flex items-center gap-3 shadow-md"
                    >
                      <span className="w-8 h-8 rounded-xl bg-yellow-500 text-slate-950 font-black flex items-center justify-center font-display text-sm">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-white font-display text-sm truncate">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-900/40 border-2 border-slate-800 border-dashed rounded-3xl flex flex-col items-center justify-center">
                <Sparkles className="w-12 h-12 text-slate-600 mb-3" />
                <h4 className="text-base font-bold text-slate-300 font-display">
                  Roleta Pronta para o Sorteio
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Insira os participantes ou prêmios na caixa de texto e clique no botão para sortear.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <History className="w-5 h-5 text-orange-400" />
              Auditoria & Histórico de Sorteios
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {drawLogs.length} registros persistidos
            </span>
          </div>

          {drawLogs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              Nenhum sorteio registrado até o momento.
            </p>
          ) : (
            <div className="space-y-3">
              {drawLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h4 className="font-bold text-white font-display text-sm">{log.title}</h4>
                    <div className="flex items-center gap-3 text-slate-400 mt-1">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span>·</span>
                      <span>{log.eligibleParticipants.length} participantes</span>
                    </div>
                  </div>

                  <div className="text-slate-300 font-mono text-xs bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    {Array.isArray(log.results) ? `${log.results.length} sorteados` : `${Object.keys(log.results).length} grupos`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
