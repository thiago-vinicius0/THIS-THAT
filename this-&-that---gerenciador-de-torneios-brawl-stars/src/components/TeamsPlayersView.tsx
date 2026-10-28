import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, Users, User, Shield, Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { Player, Team } from '../types/tournament';
import { renderTeamBadge, BADGE_ICONS } from '../utils/brawlIcons';

interface TeamsPlayersViewProps {
  teams: Team[];
  players: Player[];
  onSaveTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
  onSavePlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onImportTeamsBatch?: (teams: Team[], players: Player[]) => void;
}

const AVAILABLE_COLORS = [
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#A855F7', // Purple
  '#EAB308', // Gold
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#64748B', // Slate
];

const BRAWLERS_LIST = [
  'Shelly', 'Colt', 'Bull', 'Brock', 'El Primo', 'Barley', 'Poco', 'Rosa',
  'Jessie', 'Dynamike', 'Tick', '8-Bit', 'Rico', 'Darryl', 'Penny', 'Carl',
  'Jacky', 'Gus', 'Bo', 'Emz', 'Stu', 'Piper', 'Pam', 'Frank', 'Bibi', 'Bea',
  'Nani', 'Edgar', 'Griff', 'Grom', 'Bonnie', 'Mortis', 'Tara', 'Gene', 'Max',
  'Mr. P', 'Sprout', 'Byron', 'Squeak', 'Spike', 'Crow', 'Leon', 'Sandy', 'Amber',
  'Meg', 'Surge', 'Colette', 'Lou', 'Ruffs', 'Belle', 'Buzz', 'Ash', 'Lola', 'Fang'
];

export const TeamsPlayersView: React.FC<TeamsPlayersViewProps> = ({
  teams,
  players,
  onSaveTeam,
  onDeleteTeam,
  onSavePlayer,
  onDeletePlayer,
  onImportTeamsBatch,
}) => {
  const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
  const [search, setSearch] = useState('');
  
  // Team Modal state
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [teamColor, setTeamColor] = useState('#F97316');
  const [teamBadge, setTeamBadge] = useState('flame');
  const [teamCaptain, setTeamCaptain] = useState('');
  const [teamNotes, setTeamNotes] = useState('');
  const [teamError, setTeamError] = useState('');

  // Player Modal state
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerTag, setPlayerTag] = useState('');
  const [playerTeamId, setPlayerTeamId] = useState('');
  const [playerRole, setPlayerRole] = useState<'captain' | 'member' | 'substitute'>('member');
  const [playerBrawler, setPlayerBrawler] = useState('Colt');
  const [playerError, setPlayerError] = useState('');

  // Batch Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  // Open Add Team
  const handleOpenAddTeam = () => {
    setEditingTeam(null);
    setTeamName('');
    setTeamTag('');
    setTeamColor(AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)]);
    setTeamBadge('flame');
    setTeamCaptain('');
    setTeamNotes('');
    setTeamError('');
    setIsTeamModalOpen(true);
  };

  // Open Edit Team
  const handleOpenEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamTag(team.tag);
    setTeamColor(team.color);
    setTeamBadge(team.badgeIcon);
    setTeamCaptain(team.captain);
    setTeamNotes(team.notes || '');
    setTeamError('');
    setIsTeamModalOpen(true);
  };

  // Save Team
  const handleSaveTeam = () => {
    if (!teamName.trim()) {
      setTeamError('O nome da equipe é obrigatório.');
      return;
    }
    const cleanTag = teamTag.trim().startsWith('#') ? teamTag.trim().toUpperCase() : `#${teamTag.trim().toUpperCase()}`;

    const newTeam: Team = {
      id: editingTeam ? editingTeam.id : `team_${Date.now()}`,
      name: teamName.trim(),
      tag: cleanTag,
      color: teamColor,
      badgeIcon: teamBadge,
      captain: teamCaptain.trim() || 'Líder',
      notes: teamNotes.trim(),
      status: 'active',
      createdAt: editingTeam ? editingTeam.createdAt : new Date().toISOString(),
      isDemo: editingTeam?.isDemo,
    };

    onSaveTeam(newTeam);
    setIsTeamModalOpen(false);
  };

  // Open Add Player
  const handleOpenAddPlayer = (preselectedTeamId?: string) => {
    setEditingPlayer(null);
    setPlayerName('');
    setPlayerTag('');
    setPlayerTeamId(preselectedTeamId || teams[0]?.id || '');
    setPlayerRole('member');
    setPlayerBrawler('Colt');
    setPlayerError('');
    setIsPlayerModalOpen(true);
  };

  // Open Edit Player
  const handleOpenEditPlayer = (p: Player) => {
    setEditingPlayer(p);
    setPlayerName(p.name);
    setPlayerTag(p.tag);
    setPlayerTeamId(p.teamId);
    setPlayerRole(p.role);
    setPlayerBrawler(p.favoriteBrawler || 'Colt');
    setPlayerError('');
    setIsPlayerModalOpen(true);
  };

  // Save Player
  const handleSavePlayer = () => {
    if (!playerName.trim()) {
      setPlayerError('O nome do jogador é obrigatório.');
      return;
    }
    if (!playerTeamId) {
      setPlayerError('Selecione uma equipe.');
      return;
    }

    const cleanTag = playerTag.trim().startsWith('#') ? playerTag.trim().toUpperCase() : playerTag ? `#${playerTag.trim().toUpperCase()}` : '#BRAWLER';

    const newPlayer: Player = {
      id: editingPlayer ? editingPlayer.id : `player_${Date.now()}`,
      teamId: playerTeamId,
      name: playerName.trim(),
      tag: cleanTag,
      role: playerRole,
      favoriteBrawler: playerBrawler,
      stats: editingPlayer?.stats || { matches: 0, wins: 0, mvps: 0 },
      isDemo: editingPlayer?.isDemo,
    };

    onSavePlayer(newPlayer);
    setIsPlayerModalOpen(false);
  };

  // Batch import parser
  const handleProcessImport = () => {
    const lines = importText.split('\n').map((l) => l.trim()).filter(Boolean);
    const newTeams: Team[] = [];
    const newPlayers: Player[] = [];

    lines.forEach((line, idx) => {
      // Format: Team Name, Tag, Captain
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 1) {
        const tName = parts[0];
        const tTag = parts[1] || `#T${idx + 1}`;
        const tCap = parts[2] || 'Capitão';
        const teamId = `team_import_${Date.now()}_${idx}`;

        const team: Team = {
          id: teamId,
          name: tName,
          tag: tTag.startsWith('#') ? tTag : `#${tTag}`,
          color: AVAILABLE_COLORS[idx % AVAILABLE_COLORS.length],
          badgeIcon: ['flame', 'skull', 'star', 'sword', 'shield', 'zap', 'crown'][idx % 7],
          captain: tCap,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        newTeams.push(team);

        // Add captain as player
        newPlayers.push({
          id: `player_import_${Date.now()}_${idx}`,
          teamId,
          name: tCap,
          tag: `#CAP${idx + 1}`,
          role: 'captain',
          favoriteBrawler: 'Shelly',
          stats: { matches: 0, wins: 0, mvps: 0 },
        });
      }
    });

    if (newTeams.length > 0 && onImportTeamsBatch) {
      onImportTeamsBatch(newTeams, newPlayers);
      setIsImportModalOpen(false);
      setImportText('');
    }
  };

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.tag.toLowerCase().includes(search.toLowerCase()) ||
    t.captain.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.tag.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-display flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            Equipes e Jogadores
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre os participantes, gerencie escalações e personalize os brasões de batalha.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'teams' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Equipes ({teams.length})
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'players' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Jogadores ({players.length})
            </button>
          </div>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Importar lista de equipes em lote"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar</span>
          </button>

          {activeTab === 'teams' ? (
            <button
              onClick={handleOpenAddTeam}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Equipe</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenAddPlayer()}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Jogador</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={activeTab === 'teams' ? 'Buscar equipe por nome ou tag...' : 'Buscar jogador por nome ou tag...'}
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* TEAMS GRID */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => {
            const teamPlayers = players.filter((p) => p.teamId === team.id);
            return (
              <div
                key={team.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {renderTeamBadge(team.badgeIcon, team.color, 'w-10 h-10')}
                      <div>
                        <h4 className="font-bold text-white font-display text-base leading-tight">
                          {team.name}
                        </h4>
                        <span className="text-xs font-mono text-slate-400">
                          {team.tag}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditTeam(team)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Editar equipe"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTeam(team.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Excluir equipe"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {team.notes && (
                    <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                      {team.notes}
                    </p>
                  )}

                  {/* Players list preview */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-semibold">Escalação ({teamPlayers.length})</span>
                      <button
                        onClick={() => handleOpenAddPlayer(team.id)}
                        className="text-[11px] text-orange-400 hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Adicionar Jogador
                      </button>
                    </div>
                    {teamPlayers.length === 0 ? (
                      <p className="text-[11px] text-slate-600 italic">Nenhum jogador cadastrado ainda.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {teamPlayers.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 text-[11px] bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-slate-300 font-mono"
                          >
                            <span className="font-sans font-medium text-white">{p.name}</span>
                            {p.favoriteBrawler && (
                              <span className="text-slate-500 text-[10px]">({p.favoriteBrawler})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-2 text-[11px] text-slate-500 font-mono flex items-center justify-between">
                  <span>Capitão: {team.captain}</span>
                  {team.isDemo && (
                    <span className="text-orange-500 font-sans font-semibold">Demo</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PLAYERS TABLE */}
      {activeTab === 'players' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Jogador</th>
                <th className="py-3 px-4">Tag Brawl</th>
                <th className="py-3 px-4">Equipe</th>
                <th className="py-3 px-4">Função</th>
                <th className="py-3 px-4">Brawler Principal</th>
                <th className="py-3 px-4 text-center">Partidas / Vitórias</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredPlayers.map((player) => {
                const team = teams.find((t) => t.id === player.teamId);
                return (
                  <tr key={player.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white font-display">
                      {player.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {player.tag}
                    </td>
                    <td className="py-3 px-4">
                      {team ? (
                        <div className="flex items-center gap-1.5">
                          {renderTeamBadge(team.badgeIcon, team.color, 'w-5 h-5')}
                          <span className="font-semibold text-slate-200">{team.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Sem equipe</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        player.role === 'captain'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {player.role === 'captain' ? 'Capitão' : player.role === 'substitute' ? 'Reserva' : 'Titular'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {player.favoriteBrawler || '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums">
                      {player.stats?.matches || 0} J / {player.stats?.wins || 0} V
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditPlayer(player)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeletePlayer(player.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: ADD / EDIT TEAM */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsTeamModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white font-display mb-4">
              {editingTeam ? 'Editar Equipe' : 'Cadastrar Nova Equipe'}
            </h3>

            {teamError && (
              <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{teamError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Equipe *
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ex: Bull Rangers"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tag / Sigla
                  </label>
                  <input
                    type="text"
                    value={teamTag}
                    onChange={(e) => setTeamTag(e.target.value)}
                    placeholder="Ex: #BULL"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Capitão
                  </label>
                  <input
                    type="text"
                    value={teamCaptain}
                    onChange={(e) => setTeamCaptain(e.target.value)}
                    placeholder="Nick do líder"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Color & Emblem picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cor da Equipe
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTeamColor(c)}
                      className={`w-7 h-7 rounded-xl transition-transform ${
                        teamColor === c ? 'scale-110 ring-2 ring-white shadow-lg' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Cor ${c}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ícone do Brasão
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.keys(BADGE_ICONS).map((iconKey) => {
                    const IconComp = BADGE_ICONS[iconKey];
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setTeamBadge(iconKey)}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                          teamBadge === iconKey
                            ? 'bg-orange-600 border-orange-500 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <IconComp className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações / Estratégia
                </label>
                <textarea
                  rows={2}
                  value={teamNotes}
                  onChange={(e) => setTeamNotes(e.target.value)}
                  placeholder="Estilo de jogo, histórico competitivo..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveTeam}
                className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-lg shadow-orange-600/30"
              >
                Salvar Equipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PLAYER */}
      {isPlayerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsPlayerModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white font-display mb-4">
              {editingPlayer ? 'Editar Jogador' : 'Cadastrar Jogador'}
            </h3>

            {playerError && (
              <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{playerError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome / Nick do Jogador *
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Ex: Boomer_BR"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tag do Jogo (In-Game)
                  </label>
                  <input
                    type="text"
                    value={playerTag}
                    onChange={(e) => setPlayerTag(e.target.value)}
                    placeholder="Ex: #Y809LQP"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Função
                  </label>
                  <select
                    value={playerRole}
                    onChange={(e) => setPlayerRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="captain">Capitão</option>
                    <option value="member">Titular</option>
                    <option value="substitute">Reserva</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Equipe Vinculada *
                </label>
                <select
                  value={playerTeamId}
                  onChange={(e) => setPlayerTeamId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Selecione uma equipe</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.tag})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Brawler Principal (Preferido)
                </label>
                <select
                  value={playerBrawler}
                  onChange={(e) => setPlayerBrawler(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  {BRAWLERS_LIST.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPlayerModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePlayer}
                className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-lg shadow-orange-600/30"
              >
                Salvar Jogador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BATCH IMPORT */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white font-display mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-400" />
              Importar Equipes em Lote
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Insira uma equipe por linha no formato: <code className="bg-slate-950 px-1 py-0.5 rounded text-orange-300">Nome da Equipe, Tag, Capitão</code>
            </p>

            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Os Dinamites, #DYN, Boomer&#10;Bull Rangers, #BULL, Tanque&#10;Estrelas Roxas, #STR, CosmicTara"
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-orange-500"
            />

            <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProcessImport}
                className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-lg shadow-orange-600/30"
              >
                Importar Equipes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
