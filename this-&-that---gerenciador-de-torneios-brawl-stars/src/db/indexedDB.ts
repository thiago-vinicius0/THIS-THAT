/**
 * THIS & THAT - Persistent Storage Engine
 * Primary: IndexedDB for structured, high-capacity client storage
 * Fallback: LocalStorage wrapper with identical async API for resilience
 */

import { AppBackup, DrawLog, Match, Player, Team, Tournament } from '../types/tournament';

const DB_NAME = 'THIS_AND_THAT_BRAWL_DB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste ambiente.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('tournaments')) {
        db.createObjectStore('tournaments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('teams')) {
        db.createObjectStore('teams', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('players')) {
        const playerStore = db.createObjectStore('players', { keyPath: 'id' });
        playerStore.createIndex('teamId', 'teamId', { unique: false });
      }
      if (!db.objectStoreNames.contains('matches')) {
        const matchStore = db.createObjectStore('matches', { keyPath: 'id' });
        matchStore.createIndex('tournamentId', 'tournamentId', { unique: false });
        matchStore.createIndex('stage', 'stage', { unique: false });
      }
      if (!db.objectStoreNames.contains('drawLogs')) {
        const drawStore = db.createObjectStore('drawLogs', { keyPath: 'id' });
        drawStore.createIndex('tournamentId', 'tournamentId', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// Fallback LocalStorage keys
const LS_PREFIX = 'tt_brawl_';

function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage error:', e);
  }
}

export const StorageService = {
  // Tournaments
  async getAllTournaments(): Promise<Tournament[]> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('tournaments', 'readonly');
        const store = tx.objectStore('tournaments');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return getLocalStorage<Tournament[]>('tournaments', []);
    }
  },

  async saveTournament(tournament: Tournament): Promise<void> {
    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('tournaments', 'readwrite');
        const store = tx.objectStore('tournaments');
        const req = store.put(tournament);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = getLocalStorage<Tournament[]>('tournaments', []);
      const idx = list.findIndex((t) => t.id === tournament.id);
      if (idx >= 0) list[idx] = tournament;
      else list.push(tournament);
      setLocalStorage('tournaments', list);
    }
  },

  async deleteTournament(id: string): Promise<void> {
    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['tournaments', 'matches', 'drawLogs'], 'readwrite');
        tx.objectStore('tournaments').delete(id);
        
        // Also delete matches of this tournament
        const matchStore = tx.objectStore('matches');
        const matchIndex = matchStore.index('tournamentId');
        const matchReq = matchIndex.getAllKeys(id);
        matchReq.onsuccess = () => {
          for (const key of matchReq.result) {
            matchStore.delete(key);
          }
        };

        // Delete draw logs
        const drawStore = tx.objectStore('drawLogs');
        const drawIndex = drawStore.index('tournamentId');
        const drawReq = drawIndex.getAllKeys(id);
        drawReq.onsuccess = () => {
          for (const key of drawReq.result) {
            drawStore.delete(key);
          }
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      const list = getLocalStorage<Tournament[]>('tournaments', []).filter((t) => t.id !== id);
      setLocalStorage('tournaments', list);
      const matches = getLocalStorage<Match[]>('matches', []).filter((m) => m.tournamentId !== id);
      setLocalStorage('matches', matches);
      const draws = getLocalStorage<DrawLog[]>('drawLogs', []).filter((d) => d.tournamentId !== id);
      setLocalStorage('drawLogs', draws);
    }
  },

  // Teams
  async getAllTeams(): Promise<Team[]> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('teams', 'readonly');
        const store = tx.objectStore('teams');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return getLocalStorage<Team[]>('teams', []);
    }
  },

  async saveTeam(team: Team): Promise<void> {
    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('teams', 'readwrite');
        const store = tx.objectStore('teams');
        const req = store.put(team);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = getLocalStorage<Team[]>('teams', []);
      const idx = list.findIndex((t) => t.id === team.id);
      if (idx >= 0) list[idx] = team;
      else list.push(team);
      setLocalStorage('teams', list);
    }
  },

  async saveTeamsBatch(teams: Team[]): Promise<void> {
    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('teams', 'readwrite');
        const store = tx.objectStore('teams');
        for (const t of teams) {
          store.put(t);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      const existing = getLocalStorage<Team[]>('teams', []);
      const map = new Map<string, Team>(existing.map((t) => [t.id, t]));
      for (const t of teams) {
        map.set(t.id, t);
      }
      setLocalStorage('teams', Array.from(map.values()));
    }
  },

  async deleteTeam(id: string): Promise<void> {
    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['teams', 'players'], 'readwrite');
        tx.objectStore('teams').delete(id);
        
        // Also delete players of this team
        const playerStore = tx.objectStore('players');
        const playerIndex = playerStore.index('teamId');
        const playerReq = playerIndex.getAllKeys(id);
        playerReq.onsuccess = () => {
          for (const key of playerReq.result) {
            playerStore.delete(key);
          }
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      const list = getLocalStorage<Team[]>('teams', []).filter((t) => t.id !== id);
      setLocalStorage('teams', list);
      const players = getLocalStorage<Player[]>('players', []).filter((p) => p.teamId !== id);
      setLocalStorage('players', players);
    }
  },

  // Players
  async getAllPlayers(): Promise<Player[]> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('players', 'readonly');
        const store = tx.objectStore('players');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return getLocalStorage<Player[]>('players', []);
    }
  },

  async savePlayer(player: Player): Promise<void> {
    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('players', 'readwrite');
        const store = tx.objectStore('players');
        const req = store.put(player);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = getLocalStorage<Player[]>('players', []);
      const idx = list.findIndex((p) => p.id === player.id);
      if (idx >= 0) list[idx] = player;
      else list.push(player);
      setLocalStorage('players', list);
    }
  },

  async savePlayersBatch(players: Player[]): Promise<void> {
    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('players', 'readwrite');
        const store = tx.objectStore('players');
        for (const p of players) {
          store.put(p);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      const existing = getLocalStorage<Player[]>('players', []);
      const map = new Map<string, Player>(existing.map((p) => [p.id, p]));
      for (const p of players) {
        map.set(p.id, p);
      }
      setLocalStorage('players', Array.from(map.values()));
    }
  },

  async deletePlayer(id: string): Promise<void> {
    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('players', 'readwrite');
        const store = tx.objectStore('players');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = getLocalStorage<Player[]>('players', []).filter((p) => p.id !== id);
      setLocalStorage('players', list);
    }
  },

  // Matches
  async getAllMatches(): Promise<Match[]> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('matches', 'readonly');
        const store = tx.objectStore('matches');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return getLocalStorage<Match[]>('matches', []);
    }
  },

  async getMatchesByTournament(tournamentId: string): Promise<Match[]> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('matches', 'readonly');
        const store = tx.objectStore('matches');
        const index = store.index('tournamentId');
        const req = index.getAll(tournamentId);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return getLocalStorage<Match[]>('matches', []).filter((m) => m.tournamentId === tournamentId);
    }
  },

  async saveMatch(match: Match): Promise<void> {
    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('matches', 'readwrite');
        const store = tx.objectStore('matches');
        const req = store.put(match);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = getLocalStorage<Match[]>('matches', []);
      const idx = list.findIndex((m) => m.id === match.id);
      if (idx >= 0) list[idx] = match;
      else list.push(match);
      setLocalStorage('matches', list);
    }
  },

  async saveMatchesBatch(matches: Match[]): Promise<void> {
    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('matches', 'readwrite');
        const store = tx.objectStore('matches');
        for (const m of matches) {
          store.put(m);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      const existing = getLocalStorage<Match[]>('matches', []);
      const map = new Map<string, Match>(existing.map((m) => [m.id, m]));
      for (const m of matches) {
        map.set(m.id, m);
      }
      setLocalStorage('matches', Array.from(map.values()));
    }
  },

  // Draw Logs
  async getAllDrawLogs(): Promise<DrawLog[]> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('drawLogs', 'readonly');
        const store = tx.objectStore('drawLogs');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return getLocalStorage<DrawLog[]>('drawLogs', []);
    }
  },

  async saveDrawLog(log: DrawLog): Promise<void> {
    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('drawLogs', 'readwrite');
        const store = tx.objectStore('drawLogs');
        const req = store.put(log);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = getLocalStorage<DrawLog[]>('drawLogs', []);
      list.unshift(log);
      setLocalStorage('drawLogs', list);
    }
  },

  // Clear demo data only
  async clearDemoData(): Promise<void> {
    const allTournaments = await this.getAllTournaments();
    const demoTourneys = allTournaments.filter((t) => t.isDemo);
    for (const t of demoTourneys) {
      await this.deleteTournament(t.id);
    }

    const allTeams = await this.getAllTeams();
    const demoTeams = allTeams.filter((t) => t.isDemo);
    for (const t of demoTeams) {
      await this.deleteTeam(t.id);
    }

    const allPlayers = await this.getAllPlayers();
    const demoPlayers = allPlayers.filter((p) => p.isDemo);
    for (const p of demoPlayers) {
      await this.deletePlayer(p.id);
    }
  },

  // Export full backup
  async exportFullBackup(): Promise<AppBackup> {
    const tournaments = await this.getAllTournaments();
    const teams = await this.getAllTeams();
    const players = await this.getAllPlayers();
    const matches = await this.getAllMatches();
    const drawLogs = await this.getAllDrawLogs();

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      app: 'THIS & THAT',
      tournaments,
      teams,
      players,
      matches,
      drawLogs,
    };
  },

  // Restore full backup
  async restoreFullBackup(backup: AppBackup): Promise<{ success: boolean; message: string }> {
    if (!backup || backup.app !== 'THIS & THAT' || !Array.isArray(backup.tournaments)) {
      return { success: false, message: 'Arquivo de backup inválido ou incompatível.' };
    }

    try {
      for (const t of backup.tournaments) await this.saveTournament(t);
      if (Array.isArray(backup.teams)) await this.saveTeamsBatch(backup.teams);
      if (Array.isArray(backup.players)) await this.savePlayersBatch(backup.players);
      if (Array.isArray(backup.matches)) await this.saveMatchesBatch(backup.matches);
      if (Array.isArray(backup.drawLogs)) {
        for (const d of backup.drawLogs) await this.saveDrawLog(d);
      }
      return { success: true, message: 'Backup restaurado com sucesso!' };
    } catch (e: any) {
      return { success: false, message: `Erro ao restaurar: ${e?.message || 'Falha no banco de dados'}` };
    }
  },

  // CSV Generator for Standings
  generateStandingsCSV(standings: any[]): string {
    const headers = ['Posição', 'Equipe', 'Tag', 'Jogos', 'Vitórias', 'Empates', 'Derrotas', 'Pontos', 'Gols/Sets Pró', 'Gols/Sets Contra', 'Saldo', 'Aproveitamento (%)'];
    const rows = standings.map((s, idx) => [
      idx + 1,
      `"${s.teamName.replace(/"/g, '""')}"`,
      `"${s.teamTag}"`,
      s.matchesPlayed,
      s.wins,
      s.draws,
      s.losses,
      s.points,
      s.scoreFor,
      s.scoreAgainst,
      s.scoreDiff,
      `${s.winRate}%`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  // CSV Generator for Matches
  generateMatchesCSV(matches: Match[], teamsMap: Map<string, Team>): string {
    const headers = ['ID Partida', 'Fase', 'Rodada', 'Equipe 1', 'Placar 1', 'Placar 2', 'Equipe 2', 'Status', 'Vencedor', 'Mapa', 'Modalidade'];
    const rows = matches.map((m) => {
      const t1 = m.team1Id ? teamsMap.get(m.team1Id)?.name || m.team1Id : 'A definir';
      const t2 = m.team2Id ? teamsMap.get(m.team2Id)?.name || m.team2Id : 'A definir';
      const winner = m.winnerId ? teamsMap.get(m.winnerId)?.name || m.winnerId : '-';
      return [
        m.id,
        `"${m.stage}"`,
        `"${m.roundName}"`,
        `"${t1.replace(/"/g, '""')}"`,
        m.score1,
        m.score2,
        `"${t2.replace(/"/g, '""')}"`,
        m.status,
        `"${winner.replace(/"/g, '""')}"`,
        `"${m.mapName || ''}"`,
        `"${m.modality || ''}"`,
      ];
    });

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};
