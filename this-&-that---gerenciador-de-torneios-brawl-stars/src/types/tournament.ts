/**
 * THIS & THAT - Tournament Management System
 * Core Types & Data Definitions
 */

export type TournamentFormat = 
  | 'single_elimination' 
  | 'double_elimination' 
  | 'groups_playoffs' 
  | 'round_robin' 
  | 'league';

export type TournamentStatus = 
  | 'draft' 
  | 'registration' 
  | 'ready' 
  | 'in_progress' 
  | 'paused' 
  | 'finished' 
  | 'archived';

export type BrawlModality = 
  | 'Fute-Brawl' 
  | 'Pique-Gema' 
  | 'Zona Estratégica' 
  | 'Nocaute' 
  | 'Roubo' 
  | 'Caça-Estrelas' 
  | 'Combate' 
  | 'Mista';

export type TeamType = '3v3' | '1v1' | 'duo';

export interface ScoringRules {
  win: number;
  draw: number;
  loss: number;
  allowDraws: boolean;
}

export type TiebreakerCriterion = 
  | 'points' 
  | 'wins' 
  | 'diff' 
  | 'scored' 
  | 'head_to_head';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  organizer: string;
  modality: BrawlModality;
  format: TournamentFormat;
  teamType: TeamType;
  status: TournamentStatus;
  isPublic: boolean;
  createdAt: string;
  startDate: string;
  endDate?: string;
  scoring: ScoringRules;
  tiebreakerOrder: TiebreakerCriterion[];
  teamsCount: number;
  playersPerTeam: number;
  groupsCount?: number;
  qualifiersPerGroup?: number;
  doubleEliminationGrandFinalReset?: boolean;
  championTeamId?: string;
  runnerUpTeamId?: string;
  thirdPlaceTeamId?: string;
  isDemo?: boolean;
  enrolledTeamIds: string[];
}

export interface Team {
  id: string;
  name: string;
  tag: string; // e.g. #BRAWL
  color: string;
  badgeIcon: string; // e.g. 'flame' | 'skull' | 'star' | 'sword' | 'shield' | 'zap' | 'crosshair' | 'crown'
  captain: string;
  notes?: string;
  status: 'active' | 'pending' | 'disqualified';
  createdAt: string;
  isDemo?: boolean;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  tag: string; // Brawl Stars in-game tag, e.g. #Y809LQP
  role: 'captain' | 'member' | 'substitute';
  favoriteBrawler?: string;
  stats: {
    matches: number;
    wins: number;
    mvps: number;
  };
  isDemo?: boolean;
}

export type MatchStage = 
  | 'group' 
  | 'bracket_winners' 
  | 'bracket_losers' 
  | 'grand_final' 
  | 'grand_final_reset' 
  | 'third_place'
  | 'round_robin';

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Match {
  id: string;
  tournamentId: string;
  stage: MatchStage;
  groupId?: string; // 'A', 'B', 'C', 'D'
  round: number;
  roundName: string;
  matchNumber: number;
  team1Id?: string;
  team2Id?: string;
  score1: number;
  score2: number;
  status: MatchStatus;
  winnerId?: string;
  loserId?: string;
  nextMatchId?: string;
  nextMatchSlot?: 1 | 2;
  loserNextMatchId?: string; // for double elimination
  loserNextMatchSlot?: 1 | 2;
  isBye?: boolean;
  mapName?: string;
  modality?: BrawlModality;
  notes?: string;
  updatedAt?: string;
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  teamTag: string;
  teamColor: string;
  teamBadgeIcon: string;
  groupId?: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  scoreFor: number;
  scoreAgainst: number;
  scoreDiff: number;
  winRate: number; // in percent 0-100
  headToHeadPoints?: Record<string, number>;
  statusNote?: string;
}

export interface DrawLog {
  id: string;
  tournamentId?: string;
  type: 'groups' | 'bracket' | 'custom';
  timestamp: string;
  title: string;
  eligibleParticipants: string[];
  results: Record<string, string[]> | string[];
  notes?: string;
}

export interface AppBackup {
  version: string;
  exportedAt: string;
  app: 'THIS & THAT';
  tournaments: Tournament[];
  teams: Team[];
  players: Player[];
  matches: Match[];
  drawLogs: DrawLog[];
}
