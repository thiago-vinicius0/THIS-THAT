/**
 * THIS & THAT - Brawl Stars Tournament Management Platform
 * Main Application Component
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TournamentsListView } from './components/TournamentsListView';
import { TournamentDetailView } from './components/TournamentDetailView';
import { TeamsPlayersView } from './components/TeamsPlayersView';
import { DrawsStudioView } from './components/DrawsStudioView';
import { StandingsCentralView } from './components/StandingsCentralView';
import { PublicView } from './components/PublicView';
import { TournamentFormModal } from './components/TournamentFormModal';
import { ScoreModal } from './components/ScoreModal';
import { ExportBackupModal } from './components/ExportBackupModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer, ToastMessage } from './components/Toast';

import { DrawLog, Match, Player, Team, Tournament } from './types/tournament';
import { StorageService } from './db/indexedDB';
import { DEMO_TOURNAMENT, DEMO_TEAMS, DEMO_PLAYERS, DEMO_MATCHES } from './db/demoData';
import { 
  generateSingleEliminationMatches, 
  generateGroupsAndPlayoffsMatches, 
  generateRoundRobinMatches, 
  updateMatchScoreAndAdvance 
} from './engine/rules';

export default function App() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<'dashboard' | 'tournaments' | 'tournament_detail' | 'teams' | 'draws' | 'standings' | 'public'>('dashboard');
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(true);

  // Core Data State
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [drawLogs, setDrawLogs] = useState<DrawLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals State
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [selectedMatchForScore, setSelectedMatchForScore] = useState<Match | null>(null);

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Confirmation Modal State
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load all initial data from IndexedDB
  const reloadData = async () => {
    try {
      const [tList, teamList, pList, mList, dList] = await Promise.all([
        StorageService.getAllTournaments(),
        StorageService.getAllTeams(),
        StorageService.getAllPlayers(),
        StorageService.getAllMatches(),
        StorageService.getAllDrawLogs(),
      ]);

      setTournaments(tList);
      setTeams(teamList);
      setPlayers(pList);
      setMatches(mList);
      setDrawLogs(dList);
    } catch (e) {
      console.error('Failed to load data from storage:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadData();

    // Check URL params for ?public=:id or ?view=:v
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const publicId = params.get('public');
      if (publicId) {
        setActiveTournamentId(publicId);
        setCurrentView('public');
        setIsAdmin(false);
      }
    }
  }, []);

  // Demo Data check
  const hasDemoData = tournaments.some((t) => t.isDemo) || teams.some((t) => t.isDemo);

  const handleLoadDemoData = async () => {
    try {
      await StorageService.saveTournament(DEMO_TOURNAMENT);
      await StorageService.saveTeamsBatch(DEMO_TEAMS);
      await StorageService.savePlayersBatch(DEMO_PLAYERS);
      await StorageService.saveMatchesBatch(DEMO_MATCHES);

      await reloadData();
      setActiveTournamentId(DEMO_TOURNAMENT.id);
      setCurrentView('tournament_detail');
      showToast('Torneio Demo Carregado!', 'A Copa THIS & THAT 2026 com 8 equipes e fase final foi inicializada.', 'success');
    } catch (e: any) {
      showToast('Erro ao carregar demo', e?.message, 'error');
    }
  };

  const handleClearDemoData = async () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Limpar Dados Demonstrativos',
      message: 'Isso removerá a Copa THIS & THAT 2026 e as equipes fictícias, preservando quaisquer torneios que você mesmo tenha criado. Deseja continuar?',
      confirmLabel: 'Limpar Demo',
      isDestructive: true,
      onConfirm: async () => {
        await StorageService.clearDemoData();
        await reloadData();
        if (activeTournamentId === DEMO_TOURNAMENT.id) {
          setActiveTournamentId(null);
          setCurrentView('dashboard');
        }
        setConfirmModalConfig((c) => ({ ...c, isOpen: false }));
        showToast('Dados Demo Removidos', 'O banco de dados agora contém apenas seus registros reais.', 'info');
      },
    });
  };

  // Tournament Actions
  const handleOpenCreateTournament = () => {
    setEditingTournament(null);
    setIsTournamentModalOpen(true);
  };

  const handleOpenEditTournament = (t: Tournament) => {
    setEditingTournament(t);
    setIsTournamentModalOpen(true);
  };

  const handleSaveTournament = async (data: Partial<Tournament>) => {
    let tournamentToSave: Tournament;

    if (editingTournament) {
      tournamentToSave = { ...editingTournament, ...data } as Tournament;
      await StorageService.saveTournament(tournamentToSave);
      showToast('Campeonato Atualizado!', `As alterações em "${tournamentToSave.name}" foram salvas.`, 'success');
    } else {
      const id = `tournament_${Date.now()}`;
      // Enroll available teams if any, or up to required count
      const eligibleTeams = teams.slice(0, data.teamsCount || 8).map((t) => t.id);

      tournamentToSave = {
        id,
        name: data.name || 'Novo Campeonato',
        description: data.description || '',
        organizer: data.organizer || 'Organizador',
        modality: data.modality || 'Fute-Brawl',
        format: data.format || 'groups_playoffs',
        teamType: data.teamType || '3v3',
        status: 'draft',
        isPublic: data.isPublic ?? true,
        createdAt: new Date().toISOString(),
        startDate: data.startDate || new Date().toISOString(),
        scoring: data.scoring || { win: 3, draw: 1, loss: 0, allowDraws: false },
        tiebreakerOrder: data.tiebreakerOrder || ['points', 'wins', 'diff', 'scored', 'head_to_head'],
        teamsCount: data.teamsCount || 8,
        playersPerTeam: data.playersPerTeam || 3,
        groupsCount: data.groupsCount || 2,
        qualifiersPerGroup: data.qualifiersPerGroup || 2,
        enrolledTeamIds: eligibleTeams,
      };

      // Generate initial matches according to format if teams are present
      let initialMatches: Match[] = [];
      if (eligibleTeams.length >= 2) {
        if (tournamentToSave.format === 'single_elimination') {
          initialMatches = generateSingleEliminationMatches(id, eligibleTeams, true);
        } else if (tournamentToSave.format === 'groups_playoffs') {
          const res = generateGroupsAndPlayoffsMatches(id, eligibleTeams, tournamentToSave.groupsCount || 2);
          initialMatches = res.matches;
        } else if (tournamentToSave.format === 'round_robin' || tournamentToSave.format === 'league') {
          initialMatches = generateRoundRobinMatches(id, eligibleTeams, 'round_robin');
        }
      }

      await StorageService.saveTournament(tournamentToSave);
      if (initialMatches.length > 0) {
        await StorageService.saveMatchesBatch(initialMatches);
      }

      showToast('Campeonato Criado!', `"${tournamentToSave.name}" foi criado com ${initialMatches.length} partidas geradas.`, 'success');
    }

    await reloadData();
    setActiveTournamentId(tournamentToSave.id);
    setCurrentView('tournament_detail');
  };

  const handleDeleteTournament = (id: string) => {
    const tourney = tournaments.find((t) => t.id === id);
    setConfirmModalConfig({
      isOpen: true,
      title: 'Excluir Campeonato',
      message: `Tem certeza que deseja excluir "${tourney?.name}"? Todas as partidas, sorteios e dados vinculados serão removidos permanentemente.`,
      confirmLabel: 'Excluir Definitivamente',
      isDestructive: true,
      onConfirm: async () => {
        await StorageService.deleteTournament(id);
        await reloadData();
        if (activeTournamentId === id) {
          setActiveTournamentId(null);
          setCurrentView('tournaments');
        }
        setConfirmModalConfig((c) => ({ ...c, isOpen: false }));
        showToast('Campeonato Excluído', 'O torneio e suas partidas foram removidos.', 'info');
      },
    });
  };

  const handleDuplicateTournament = async (t: Tournament) => {
    const copyId = `tournament_${Date.now()}`;
    const duplicate: Tournament = {
      ...t,
      id: copyId,
      name: `${t.name} (Cópia)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      isDemo: false,
    };

    await StorageService.saveTournament(duplicate);
    await reloadData();
    setActiveTournamentId(copyId);
    setCurrentView('tournament_detail');
    showToast('Campeonato Duplicado!', 'Uma cópia exata foi criada em modo Rascunho.', 'success');
  };

  // Match Scoring
  const handleOpenScoreModal = (match: Match) => {
    setSelectedMatchForScore(match);
    setIsScoreModalOpen(true);
  };

  const handleSaveScore = async (
    matchId: string,
    score1: number,
    score2: number,
    mapName?: string,
    notes?: string
  ) => {
    const activeTourney = tournaments.find((t) => t.id === selectedMatchForScore?.tournamentId);
    const allowDraws = activeTourney?.scoring?.allowDraws ?? false;

    // Run rules engine to advance winner & loser
    const { updatedMatches, error } = updateMatchScoreAndAdvance(
      matches,
      matchId,
      score1,
      score2,
      allowDraws
    );

    if (error) {
      showToast('Atenção', error, 'error');
      return;
    }

    // Attach map and notes
    const matchIndex = updatedMatches.findIndex((m) => m.id === matchId);
    if (matchIndex >= 0) {
      if (mapName) updatedMatches[matchIndex].mapName = mapName;
      if (notes) updatedMatches[matchIndex].notes = notes;
      await StorageService.saveMatch(updatedMatches[matchIndex]);

      // If next match was updated with advancing winner, persist it as well
      const nextMatchId = updatedMatches[matchIndex].nextMatchId;
      if (nextMatchId) {
        const nextMatch = updatedMatches.find((m) => m.id === nextMatchId);
        if (nextMatch) await StorageService.saveMatch(nextMatch);
      }
    }

    setMatches(updatedMatches);
    showToast('Placar Confirmado!', 'O resultado foi computado e as tabelas/chaves foram atualizadas.', 'success');
  };

  // Team & Player Actions
  const handleSaveTeam = async (team: Team) => {
    await StorageService.saveTeam(team);
    await reloadData();
    showToast('Equipe Salva!', `A equipe "${team.name}" está pronta para competir.`, 'success');
  };

  const handleDeleteTeam = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    const isEnrolled = tournaments.some((t) => t.enrolledTeamIds.includes(teamId));

    setConfirmModalConfig({
      isOpen: true,
      title: 'Excluir Equipe',
      message: isEnrolled
        ? `A equipe "${team?.name}" está inscrita em um ou mais campeonatos. Excluí-la pode afetar os confrontos existentes. Deseja realmente remover?`
        : `Deseja excluir a equipe "${team?.name}" e seus jogadores associados?`,
      confirmLabel: 'Excluir Equipe',
      isDestructive: true,
      onConfirm: async () => {
        await StorageService.deleteTeam(teamId);
        await reloadData();
        setConfirmModalConfig((c) => ({ ...c, isOpen: false }));
        showToast('Equipe Removida', 'A equipe foi excluída do sistema.', 'info');
      },
    });
  };

  const handleSavePlayer = async (player: Player) => {
    await StorageService.savePlayer(player);
    await reloadData();
    showToast('Jogador Salvo!', `Jogador "${player.name}" registrado com sucesso.`, 'success');
  };

  const handleDeletePlayer = async (playerId: string) => {
    await StorageService.deletePlayer(playerId);
    await reloadData();
    showToast('Jogador Removido', 'O jogador foi desvinculado.', 'info');
  };

  const handleImportTeamsBatch = async (newTeams: Team[], newPlayers: Player[]) => {
    await StorageService.saveTeamsBatch(newTeams);
    await StorageService.savePlayersBatch(newPlayers);
    await reloadData();
    showToast('Importação Concluída!', `${newTeams.length} equipes e ${newPlayers.length} jogadores foram importados.`, 'success');
  };

  // Draws Actions
  const handleSaveDrawLog = async (log: DrawLog) => {
    await StorageService.saveDrawLog(log);
    setDrawLogs((prev) => [log, ...prev]);
    showToast('Sorteio Registrado!', 'O resultado foi arquivado no histórico de auditoria.', 'success');
  };

  const handleApplyGroupDrawToTournament = async (tournamentId: string, groupAssignments: Record<string, string[]>) => {
    const tourney = tournaments.find((t) => t.id === tournamentId);
    if (!tourney) return;

    // Flatten all assigned teams
    const allAssigned = Object.values(groupAssignments).flat();
    const updatedTourney: Tournament = {
      ...tourney,
      enrolledTeamIds: allAssigned,
      status: 'ready',
    };

    // Generate new group round-robin matches
    const newMatches: Match[] = [];
    let matchCounter = 1;
    for (const [groupName, gTeamIds] of Object.entries(groupAssignments)) {
      const gMatches = generateRoundRobinMatches(tournamentId, gTeamIds, 'group', groupName, matchCounter);
      matchCounter += gMatches.length;
      newMatches.push(...gMatches);
    }

    await StorageService.saveTournament(updatedTourney);
    await StorageService.saveMatchesBatch(newMatches);
    await reloadData();

    setActiveTournamentId(tournamentId);
    setCurrentView('tournament_detail');
    showToast('Grupos Aplicados!', `Os grupos foram sorteados e ${newMatches.length} confrontos foram agendados.`, 'success');
  };

  const handleApplyBracketDrawToTournament = async (tournamentId: string, seededTeamIds: string[]) => {
    const tourney = tournaments.find((t) => t.id === tournamentId);
    if (!tourney) return;

    const newBracketMatches = generateSingleEliminationMatches(tournamentId, seededTeamIds, true);
    const updatedTourney: Tournament = {
      ...tourney,
      enrolledTeamIds: seededTeamIds,
      status: 'ready',
    };

    await StorageService.saveTournament(updatedTourney);
    await StorageService.saveMatchesBatch(newBracketMatches);
    await reloadData();

    setActiveTournamentId(tournamentId);
    setCurrentView('tournament_detail');
    showToast('Chaveamento Gerado!', 'Os seeds e confrontos da primeira fase foram gerados.', 'success');
  };

  // Clear all data
  const handleClearAllData = async () => {
    if (typeof window !== 'undefined') {
      window.indexedDB?.deleteDatabase('THIS_AND_THAT_BRAWL_DB');
      localStorage.clear();
      await reloadData();
      setActiveTournamentId(null);
      setCurrentView('dashboard');
      showToast('Banco Limpo', 'Todos os dados locais foram resetados com sucesso.', 'info');
    }
  };

  // Active Tournament object
  const activeTournament = tournaments.find((t) => t.id === activeTournamentId) || tournaments[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'tournaments' || view === 'teams' || view === 'draws' || view === 'standings' || view === 'dashboard') {
            setCurrentView(view as any);
          }
        }}
        isAdmin={isAdmin}
        onToggleAdmin={() => {
          setIsAdmin(!isAdmin);
          showToast(
            !isAdmin ? 'Modo Organizador Ativado' : 'Modo Espectador Ativado',
            !isAdmin ? 'Você agora pode lançar placares e editar regras.' : 'Visualização somente leitura para o público.',
            'info'
          );
        }}
        onOpenCreateTournament={handleOpenCreateTournament}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        hasDemoData={hasDemoData}
        onLoadDemoData={handleLoadDemoData}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Carregando dados de THIS & THAT...</p>
            </div>
          </div>
        ) : (
          <>
            {currentView === 'dashboard' && (
              <DashboardView
                tournaments={tournaments}
                teams={teams}
                players={players}
                matches={matches}
                onSelectTournament={(id) => {
                  setActiveTournamentId(id);
                  setCurrentView('tournament_detail');
                }}
                onOpenCreateTournament={handleOpenCreateTournament}
                onOpenAddTeam={() => setCurrentView('teams')}
                onNavigateToDraws={() => setCurrentView('draws')}
                onNavigateToStandings={() => setCurrentView('standings')}
                onLoadDemoData={handleLoadDemoData}
                onClearDemoData={handleClearDemoData}
                hasDemoData={hasDemoData}
              />
            )}

            {currentView === 'tournaments' && (
              <TournamentsListView
                tournaments={tournaments}
                matches={matches}
                isAdmin={isAdmin}
                onSelectTournament={(id) => {
                  setActiveTournamentId(id);
                  setCurrentView('tournament_detail');
                }}
                onOpenCreateModal={handleOpenCreateTournament}
                onOpenEditModal={handleOpenEditTournament}
                onDuplicateTournament={handleDuplicateTournament}
                onDeleteTournament={handleDeleteTournament}
              />
            )}

            {currentView === 'tournament_detail' && activeTournament && (
              <TournamentDetailView
                tournament={activeTournament}
                teams={teams}
                matches={matches}
                isAdmin={isAdmin}
                onUpdateTournament={async (t) => {
                  await StorageService.saveTournament(t);
                  await reloadData();
                }}
                onDeleteTournament={handleDeleteTournament}
                onDuplicateTournament={handleDuplicateTournament}
                onOpenScoreModal={handleOpenScoreModal}
                onNavigateToPublic={(id) => {
                  setActiveTournamentId(id);
                  setCurrentView('public');
                }}
                onOpenEditModal={handleOpenEditTournament}
                onOpenDrawModal={() => setCurrentView('draws')}
                onMatchesUpdated={async (newMatches) => {
                  await StorageService.saveMatchesBatch(newMatches);
                  setMatches(newMatches);
                }}
                onShowToast={showToast}
              />
            )}

            {currentView === 'teams' && (
              <TeamsPlayersView
                teams={teams}
                players={players}
                onSaveTeam={handleSaveTeam}
                onDeleteTeam={handleDeleteTeam}
                onSavePlayer={handleSavePlayer}
                onDeletePlayer={handleDeletePlayer}
                onImportTeamsBatch={handleImportTeamsBatch}
              />
            )}

            {currentView === 'draws' && (
              <DrawsStudioView
                tournaments={tournaments}
                teams={teams}
                drawLogs={drawLogs}
                onSaveDrawLog={handleSaveDrawLog}
                onApplyGroupDrawToTournament={handleApplyGroupDrawToTournament}
                onApplyBracketDrawToTournament={handleApplyBracketDrawToTournament}
              />
            )}

            {currentView === 'standings' && (
              <StandingsCentralView
                tournaments={tournaments}
                teams={teams}
                matches={matches}
              />
            )}

            {currentView === 'public' && activeTournament && (
              <PublicView
                tournament={activeTournament}
                teams={teams}
                matches={matches}
                onBackToAdmin={() => {
                  setIsAdmin(true);
                  setCurrentView('tournament_detail');
                }}
                onShowToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 font-display">THIS & THAT</span>
            <span>·</span>
            <span>Gerenciador de Torneios Brawl Stars</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Armazenamento 100% no navegador via IndexedDB · Feito para a comunidade competitiva
          </div>
        </div>
      </footer>

      {/* Modals Container */}
      <TournamentFormModal
        isOpen={isTournamentModalOpen}
        initialData={editingTournament}
        onSave={handleSaveTournament}
        onClose={() => setIsTournamentModalOpen(false)}
      />

      <ScoreModal
        isOpen={isScoreModalOpen}
        match={selectedMatchForScore}
        tournament={tournaments.find((t) => t.id === selectedMatchForScore?.tournamentId) || null}
        teamsMap={new Map<string, Team>(teams.map((t) => [t.id, t]))}
        onSave={handleSaveScore}
        onClose={() => {
          setIsScoreModalOpen(false);
          setSelectedMatchForScore(null);
        }}
      />

      <ExportBackupModal
        isOpen={isBackupModalOpen}
        tournaments={tournaments}
        teams={teams}
        matches={matches}
        onClose={() => setIsBackupModalOpen(false)}
        onDataRestored={reloadData}
        onClearAllData={handleClearAllData}
        onShowToast={showToast}
      />

      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmLabel={confirmModalConfig.confirmLabel}
        isDestructive={confirmModalConfig.isDestructive}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig((c) => ({ ...c, isOpen: false }))}
      />

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
