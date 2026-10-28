import React, { useState } from 'react';
import { TeamStanding } from '../types/tournament';
import { renderTeamBadge } from '../utils/brawlIcons';
import { Download, Search, Trophy, ArrowUpDown } from 'lucide-react';
import { StorageService } from '../db/indexedDB';

interface StandingsTableProps {
  standings: TeamStanding[];
  qualifiersCount?: number;
  title?: string;
  allowExport?: boolean;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  qualifiersCount = 2,
  title,
  allowExport = true,
}) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof TeamStanding>('points');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = standings.filter((s) => 
    s.teamName.toLowerCase().includes(search.toLowerCase()) ||
    s.teamTag.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc 
      ? String(valA).localeCompare(String(valB)) 
      : String(valB).localeCompare(String(valA));
  });

  const handleSort = (field: keyof TeamStanding) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleDownloadCSV = () => {
    const csvContent = StorageService.generateStandingsCSV(standings);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `classificacao_${title || 'torneio'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60">
        <div className="flex items-center gap-2">
          {title && <h3 className="font-bold text-white font-display text-base">{title}</h3>}
          <span className="text-xs text-slate-400">
            ({standings.length} {standings.length === 1 ? 'equipe' : 'equipes'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar equipe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {allowExport && (
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
              title="Exportar Classificação para CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800 select-none">
            <tr>
              <th className="py-3 px-3 w-12 text-center">#</th>
              <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('teamName')}>
                <div className="flex items-center gap-1">
                  <span>Equipe</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort('matchesPlayed')} title="Jogos">
                J
              </th>
              <th className="py-3 px-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort('wins')} title="Vitórias">
                V
              </th>
              <th className="py-3 px-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort('draws')} title="Empates">
                E
              </th>
              <th className="py-3 px-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort('losses')} title="Derrotas">
                D
              </th>
              <th className="py-3 px-2 text-center cursor-pointer hover:text-white font-bold text-orange-400" onClick={() => handleSort('points')} title="Pontos">
                PTS
              </th>
              <th className="py-3 px-2 text-center cursor-pointer hover:text-white hidden md:table-cell" onClick={() => handleSort('scoreFor')} title="Pontos / Gols Pró">
                GP
              </th>
              <th className="py-3 px-2 text-center cursor-pointer hover:text-white hidden md:table-cell" onClick={() => handleSort('scoreAgainst')} title="Pontos / Gols Contra">
                GC
              </th>
              <th className="py-3 px-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort('scoreDiff')} title="Saldo">
                SG
              </th>
              <th className="py-3 px-2 text-center cursor-pointer hover:text-white font-mono" onClick={() => handleSort('winRate')} title="Aproveitamento">
                %
              </th>
              <th className="py-3 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {sorted.map((item, index) => {
              const originalIndex = standings.findIndex((s) => s.teamId === item.teamId);
              const isQualified = originalIndex < qualifiersCount;
              const isFirst = originalIndex === 0;

              return (
                <tr
                  key={item.teamId}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isQualified ? 'bg-orange-950/10' : ''
                  }`}
                >
                  {/* Position */}
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold font-mono ${
                      isFirst 
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                        : isQualified 
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                        : 'text-slate-500'
                    }`}>
                      {index + 1}
                    </span>
                  </td>

                  {/* Team */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {renderTeamBadge(item.teamBadgeIcon, item.teamColor, 'w-6 h-6')}
                      <div className="truncate max-w-[140px] sm:max-w-[200px]">
                        <span className="font-bold text-white font-display block truncate">
                          {item.teamName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.teamTag}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Stats */}
                  <td className="py-3 px-2 text-center font-mono tabular-nums text-slate-300">
                    {item.matchesPlayed}
                  </td>
                  <td className="py-3 px-2 text-center font-mono tabular-nums text-emerald-400 font-bold">
                    {item.wins}
                  </td>
                  <td className="py-3 px-2 text-center font-mono tabular-nums text-slate-400">
                    {item.draws}
                  </td>
                  <td className="py-3 px-2 text-center font-mono tabular-nums text-red-400">
                    {item.losses}
                  </td>
                  <td className="py-3 px-2 text-center font-mono tabular-nums font-black text-orange-400 text-sm">
                    {item.points}
                  </td>
                  <td className="py-3 px-2 text-center font-mono tabular-nums text-slate-400 hidden md:table-cell">
                    {item.scoreFor}
                  </td>
                  <td className="py-3 px-2 text-center font-mono tabular-nums text-slate-400 hidden md:table-cell">
                    {item.scoreAgainst}
                  </td>
                  <td className={`py-3 px-2 text-center font-mono tabular-nums font-semibold ${
                    item.scoreDiff > 0 ? 'text-emerald-400' : item.scoreDiff < 0 ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {item.scoreDiff > 0 ? `+${item.scoreDiff}` : item.scoreDiff}
                  </td>
                  <td className="py-3 px-2 text-center font-mono tabular-nums text-slate-300">
                    {item.winRate}%
                  </td>

                  {/* Classification Status */}
                  <td className="py-3 px-3 text-right">
                    {isFirst ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        <Trophy className="w-3 h-3" /> Líder
                      </span>
                    ) : isQualified ? (
                      <span className="inline-block text-[11px] font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md">
                        Classificado
                      </span>
                    ) : (
                      <span className="inline-block text-[11px] text-slate-500">
                        Eliminado
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
