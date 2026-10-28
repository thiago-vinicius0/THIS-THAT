import React, { useState, useEffect } from 'react';
import { X, Trophy, Minus, Plus, AlertCircle, Save } from 'lucide-react';
import { Match, Team, Tournament } from '../types/tournament';
import { renderTeamBadge, BRAWL_MAPS_BY_MODALITY } from '../utils/brawlIcons';

interface ScoreModalProps {
  isOpen: boolean;
  match: Match | null;
  tournament: Tournament | null;
  teamsMap: Map<string, Team>;
  onSave: (matchId: string, score1: number, score2: number, mapName?: string, notes?: string) => void;
  onClose: () => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  isOpen,
  match,
  tournament,
  teamsMap,
  onSave,
  onClose,
}) => {
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [mapName, setMapName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      setScore1(match.score1 || 0);
      setScore2(match.score2 || 0);
      setMapName(match.mapName || '');
      setNotes(match.notes || '');
      setError(null);
    }
  }, [match]);

  if (!isOpen || !match) return null;

  const team1 = match.team1Id ? teamsMap.get(match.team1Id) : null;
  const team2 = match.team2Id ? teamsMap.get(match.team2Id) : null;

  const availableMaps = tournament?.modality ? BRAWL_MAPS_BY_MODALITY[tournament.modality] || [] : [];

  const isElimination = match.stage !== 'group' && match.stage !== 'round_robin';
  const allowDraws = tournament?.scoring?.allowDraws && !isElimination;

  const handleSave = () => {
    if (score1 < 0 || score2 < 0) {
      setError('Os placares não podem ser negativos.');
      return;
    }

    if (score1 === score2 && !allowDraws) {
      setError('Partidas eliminatórias ou com regras sem empate exigem um vencedor.');
      return;
    }

    onSave(match.id, score1, score2, mapName, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="score-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-md">
                {match.roundName}
              </span>
              {match.groupId && (
                <span className="text-xs font-semibold text-orange-400 bg-orange-950/60 border border-orange-800/60 px-2 py-0.5 rounded-md">
                  Grupo {match.groupId}
                </span>
              )}
            </div>
            <h3 id="score-modal-title" className="text-xl font-bold text-white font-display mt-1">
              Lançar Placar da Partida
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Teams & Score Steppers */}
        <div className="grid grid-cols-2 gap-4 my-6">
          {/* Team 1 */}
          <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
            score1 > score2 ? 'bg-orange-950/20 border-orange-500/60' : 'bg-slate-950/50 border-slate-800'
          }`}>
            <div className="mb-2">
              {team1 ? renderTeamBadge(team1.badgeIcon, team1.color, 'w-12 h-12') : (
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 text-xs">
                  ?
                </div>
              )}
            </div>
            <h4 className="font-bold text-white font-display text-base truncate max-w-full">
              {team1?.name || 'A definir'}
            </h4>
            <span className="text-xs text-slate-400 font-mono">{team1?.tag || '#---'}</span>

            {/* Stepper */}
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => setScore1(Math.max(0, score1 - 1))}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-lg font-bold border border-slate-700 active:scale-95 transition-transform"
                aria-label={`Diminuir placar de ${team1?.name || 'Equipe 1'}`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="0"
                value={score1}
                onChange={(e) => setScore1(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 h-12 bg-slate-900 border-2 border-slate-700 rounded-xl text-center text-2xl font-black font-display text-white focus:border-orange-500 focus:outline-none"
                aria-label={`Placar de ${team1?.name || 'Equipe 1'}`}
              />
              <button
                type="button"
                onClick={() => setScore1(score1 + 1)}
                className="w-10 h-10 rounded-xl bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-orange-600/30 active:scale-95 transition-transform"
                aria-label={`Aumentar placar de ${team1?.name || 'Equipe 1'}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {score1 > score2 && (
              <span className="mt-3 flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                <Trophy className="w-3 h-3" /> Vencedor
              </span>
            )}
          </div>

          {/* Team 2 */}
          <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
            score2 > score1 ? 'bg-cyan-950/20 border-cyan-500/60' : 'bg-slate-950/50 border-slate-800'
          }`}>
            <div className="mb-2">
              {team2 ? renderTeamBadge(team2.badgeIcon, team2.color, 'w-12 h-12') : (
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 text-xs">
                  ?
                </div>
              )}
            </div>
            <h4 className="font-bold text-white font-display text-base truncate max-w-full">
              {team2?.name || 'A definir'}
            </h4>
            <span className="text-xs text-slate-400 font-mono">{team2?.tag || '#---'}</span>

            {/* Stepper */}
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => setScore2(Math.max(0, score2 - 1))}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-lg font-bold border border-slate-700 active:scale-95 transition-transform"
                aria-label={`Diminuir placar de ${team2?.name || 'Equipe 2'}`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="0"
                value={score2}
                onChange={(e) => setScore2(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 h-12 bg-slate-900 border-2 border-slate-700 rounded-xl text-center text-2xl font-black font-display text-white focus:border-cyan-500 focus:outline-none"
                aria-label={`Placar de ${team2?.name || 'Equipe 2'}`}
              />
              <button
                type="button"
                onClick={() => setScore2(score2 + 1)}
                className="w-10 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-cyan-600/30 active:scale-95 transition-transform"
                aria-label={`Aumentar placar de ${team2?.name || 'Equipe 2'}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {score2 > score1 && (
              <span className="mt-3 flex items-center gap-1 text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                <Trophy className="w-3 h-3" /> Vencedor
              </span>
            )}
          </div>
        </div>

        {/* Map selection & Notes */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mapa Disputado
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                placeholder="Ex: Super Estádio, Mina Rochosa..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-orange-500 focus:outline-none"
              />
              {availableMaps.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) setMapName(e.target.value);
                  }}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none"
                  aria-label="Sugestões de mapas"
                >
                  <option value="">Mapas Típicos</option>
                  {availableMaps.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Observações / Destaque / MVP
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Partida decidida na prorrogação, MVP Boomer_BR..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {isElimination ? 'Mata-Mata: O vencedor avançará automaticamente na chave.' : 'Fase de grupos: Atualizará a tabela de pontos.'}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              Confirmar Placar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
