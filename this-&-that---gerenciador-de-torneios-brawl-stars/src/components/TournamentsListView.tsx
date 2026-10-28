import React, { useState } from 'react';
import { 
  Trophy, 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  ArrowRight, 
  Edit2, 
  Copy, 
  Trash2, 
  Archive,
  Layers,
  Sparkles
} from 'lucide-react';
import { Match, Tournament } from '../types/tournament';
import { formatFormatLabel, formatStatusLabel } from '../utils/brawlIcons';

interface TournamentsListViewProps {
  tournaments: Tournament[];
  matches: Match[];
  isAdmin: boolean;
  onSelectTournament: (id: string) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (t: Tournament) => void;
  onDuplicateTournament: (t: Tournament) => void;
  onDeleteTournament: (id: string) => void;
}

export const TournamentsListView: React.FC<TournamentsListViewProps> = ({
  tournaments,
  matches,
  isAdmin,
  onSelectTournament,
  onOpenCreateModal,
  onOpenEditModal,
  onDuplicateTournament,
  onDeleteTournament,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalityFilter, setModalityFilter] = useState('all');

  const filtered = tournaments.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (modalityFilter !== 'all' && t.modality !== modalityFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.organizer.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const modalities = Array.from(new Set(tournaments.map((t) => t.modality)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-display flex items-center gap-2">
            <Trophy className="w-6 h-6 text-orange-500" />
            Meus Campeonatos
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gerencie todos os torneios, cronogramas de chaves e fases competitivas.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Campeonato</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou organizador..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="in_progress">Em Andamento</option>
            <option value="registration">Inscrições Abertas</option>
            <option value="ready">Pronto para Iniciar</option>
            <option value="finished">Finalizados</option>
            <option value="draft">Rascunho</option>
          </select>

          {modalities.length > 1 && (
            <select
              value={modalityFilter}
              onChange={(e) => setModalityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">Todas as Modalidades</option>
              {modalities.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tournaments Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border-2 border-slate-800 border-dashed rounded-3xl flex flex-col items-center justify-center">
          <Trophy className="w-12 h-12 text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-slate-300 font-display">
            Nenhum campeonato encontrado
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            {tournaments.length === 0 ? 'Você ainda não possui nenhum torneio criado.' : 'Tente ajustar os filtros de busca.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t) => {
            const status = formatStatusLabel(t.status);
            const tMatches = matches.filter((m) => m.tournamentId === t.id);
            const completedCount = tMatches.filter((m) => m.status === 'completed').length;
            const progressPct = tMatches.length > 0 ? Math.round((completedCount / tMatches.length) * 100) : 0;

            return (
              <div
                key={t.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-orange-500/50 transition-all shadow-xl flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${status.bg} ${status.textCol}`}>
                      {status.text}
                    </span>
                    <span className="text-xs font-semibold text-cyan-400 font-mono">
                      {t.modality}
                    </span>
                  </div>

                  <h3
                    onClick={() => onSelectTournament(t.id)}
                    className="font-bold text-white font-display text-lg group-hover:text-orange-400 transition-colors cursor-pointer line-clamp-1"
                  >
                    {t.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {t.description || 'Sem descrição cadastrada.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Progresso: {completedCount}/{tMatches.length} jogos</span>
                      <span className="font-bold text-white">{progressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-cyan-400 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                    <span>{formatFormatLabel(t.format)}</span>
                    <span>{t.enrolledTeamIds.length} equipes</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  {isAdmin ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenEditModal(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicateTournament(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Duplicar"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTournament(t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : <div />}

                  <button
                    onClick={() => onSelectTournament(t.id)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-orange-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <span>Abrir</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
