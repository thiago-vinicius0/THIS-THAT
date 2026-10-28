/**
 * Unit Tests for Tournament Rules & Engine
 * Executed via Node test runner (npx --yes tsx --test)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNextPowerOfTwo,
  getSeededPairings,
  generateSingleEliminationMatches,
  generateRoundRobinMatches,
  calculateStandings,
  updateMatchScoreAndAdvance,
} from './rules';
import { ScoringRules, Team } from '../types/tournament';

test('getNextPowerOfTwo calculates correct powers', () => {
  assert.equal(getNextPowerOfTwo(2), 2);
  assert.equal(getNextPowerOfTwo(3), 4);
  assert.equal(getNextPowerOfTwo(4), 4);
  assert.equal(getNextPowerOfTwo(5), 8);
  assert.equal(getNextPowerOfTwo(8), 8);
  assert.equal(getNextPowerOfTwo(9), 16);
});

test('getSeededPairings creates proper 1 vs 8, 4 vs 5 pairings', () => {
  const pairings8 = getSeededPairings(8);
  assert.equal(pairings8.length, 4);
  // Standard esports 8-seed bracket: [1,8], [4,5], [2,7], [3,6]
  assert.deepEqual(pairings8[0], [1, 8]);
  assert.deepEqual(pairings8[1], [4, 5]);
  assert.deepEqual(pairings8[2], [2, 7]);
  assert.deepEqual(pairings8[3], [3, 6]);
});

test('generateSingleEliminationMatches generates 7 matches + 3rd place for 8 teams', () => {
  const teamIds = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'];
  const matches = generateSingleEliminationMatches('tourney1', teamIds, true);

  // 4 quarters + 2 semis + 1 final + 1 third place = 8 matches
  assert.equal(matches.length, 8);

  const round1 = matches.filter((m) => m.round === 1);
  assert.equal(round1.length, 4);
  assert.equal(round1[0].team1Id, 't1');
  assert.equal(round1[0].team2Id, 't8');

  // Verify nextMatchId links round 1 to round 2
  const r1m1 = round1[0];
  assert.ok(r1m1.nextMatchId);
  const nextMatch = matches.find((m) => m.id === r1m1.nextMatchId);
  assert.ok(nextMatch);
  assert.equal(nextMatch.round, 2);
});

test('generateSingleEliminationMatches handles odd number of teams with byes', () => {
  const teamIds = ['t1', 't2', 't3', 't4', 't5']; // 5 teams -> 8 bracket size, 3 byes
  const matches = generateSingleEliminationMatches('tourney_odd', teamIds, false);

  const round1 = matches.filter((m) => m.round === 1);
  assert.equal(round1.length, 4);

  const byeMatches = round1.filter((m) => m.isBye);
  assert.equal(byeMatches.length, 3);

  // Top seeds should advance automatically to Round 2
  const round2 = matches.filter((m) => m.round === 2);
  const advancedTeams = round2.flatMap((m) => [m.team1Id, m.team2Id]).filter(Boolean);
  assert.ok(advancedTeams.includes('t1')); // seed 1 had bye
});

test('generateRoundRobinMatches creates correct number of rounds without duplicates', () => {
  const teamIds = ['t1', 't2', 't3', 't4'];
  const matches = generateRoundRobinMatches('tourney_rr', teamIds);

  // For 4 teams: 4 * 3 / 2 = 6 matches
  assert.equal(matches.length, 6);

  // Check each pair plays exactly once
  const pairSet = new Set<string>();
  for (const match of matches) {
    assert.ok(match.team1Id && match.team2Id);
    const sortedKey = [match.team1Id, match.team2Id].sort().join(' vs ');
    assert.equal(pairSet.has(sortedKey), false, `Pair ${sortedKey} should not be duplicated`);
    pairSet.add(sortedKey);
  }
  assert.equal(pairSet.size, 6);
});

test('calculateStandings computes points, diff and ties accurately', () => {
  const teams: Team[] = [
    { id: 't1', name: 'Alpha', tag: 'ALP', color: '#ff0000', badgeIcon: 'flame', captain: 'Cap1', status: 'active', createdAt: '' },
    { id: 't2', name: 'Beta', tag: 'BET', color: '#00ff00', badgeIcon: 'skull', captain: 'Cap2', status: 'active', createdAt: '' },
    { id: 't3', name: 'Gamma', tag: 'GAM', color: '#0000ff', badgeIcon: 'star', captain: 'Cap3', status: 'active', createdAt: '' },
  ];

  const scoring: ScoringRules = { win: 3, draw: 1, loss: 0, allowDraws: true };

  const matches = [
    {
      id: 'm1',
      tournamentId: 't',
      stage: 'round_robin' as const,
      round: 1,
      roundName: 'R1',
      matchNumber: 1,
      team1Id: 't1',
      team2Id: 't2',
      score1: 2,
      score2: 0,
      status: 'completed' as const,
    },
    {
      id: 'm2',
      tournamentId: 't',
      stage: 'round_robin' as const,
      round: 2,
      roundName: 'R2',
      matchNumber: 2,
      team1Id: 't2',
      team2Id: 't3',
      score1: 3,
      score2: 1,
      status: 'completed' as const,
    },
    {
      id: 'm3',
      tournamentId: 't',
      stage: 'round_robin' as const,
      round: 3,
      roundName: 'R3',
      matchNumber: 3,
      team1Id: 't3',
      team2Id: 't1',
      score1: 0,
      score2: 2,
      status: 'completed' as const,
    },
  ];

  const standings = calculateStandings(teams, matches, scoring);

  // t1: 2 wins, 0 losses = 6 points, diff = +4
  // t2: 1 win, 1 loss = 3 points, diff = 0
  // t3: 0 wins, 2 losses = 0 points, diff = -4
  assert.equal(standings[0].teamId, 't1');
  assert.equal(standings[0].points, 6);
  assert.equal(standings[0].wins, 2);
  assert.equal(standings[0].scoreDiff, 4);

  assert.equal(standings[1].teamId, 't2');
  assert.equal(standings[1].points, 3);

  assert.equal(standings[2].teamId, 't3');
  assert.equal(standings[2].points, 0);
});

test('updateMatchScoreAndAdvance advances winner to next match', () => {
  const teamIds = ['t1', 't2', 't3', 't4'];
  const matches = generateSingleEliminationMatches('tourney_adv', teamIds, true);

  const r1m1 = matches.find((m) => m.round === 1 && m.matchNumber === 1)!;
  assert.ok(r1m1);
  assert.equal(r1m1.team1Id, 't1');
  assert.equal(r1m1.team2Id, 't4');

  // Submit score: t1 wins 2-0
  const result = updateMatchScoreAndAdvance(matches, r1m1.id, 2, 0);
  assert.equal(result.winnerId, 't1');
  assert.equal(result.loserId, 't4');

  // Check that next match now has t1 as team1Id or team2Id
  const finalMatch = result.updatedMatches.find((m) => m.id === r1m1.nextMatchId)!;
  assert.ok(finalMatch);
  assert.equal(finalMatch.team1Id, 't1');
});

test('calculateStandings prioritizes custom tiebreaker criteria', () => {
  const teams: Team[] = [
    { id: 'tA', name: 'Alpha', tag: 'ALP', color: '#ff0000', badgeIcon: 'flame', captain: 'C1', status: 'active', createdAt: '' },
    { id: 'tB', name: 'Bravo', tag: 'BRV', color: '#00ff00', badgeIcon: 'skull', captain: 'C2', status: 'active', createdAt: '' },
  ];

  // Both have 3 points:
  // tA has 1 win (3 pts) and +5 diff
  // tB has 3 draws (3 pts) and 0 diff
  const scoring: ScoringRules = { win: 3, draw: 1, loss: 0, allowDraws: true };

  const matchesA = [
    { id: 'm1', tournamentId: 't', stage: 'group' as const, round: 1, roundName: 'R1', matchNumber: 1, team1Id: 'tA', team2Id: 'dummy', score1: 5, score2: 0, status: 'completed' as const },
    { id: 'm2', tournamentId: 't', stage: 'group' as const, round: 2, roundName: 'R2', matchNumber: 2, team1Id: 'tB', team2Id: 'dummy', score1: 1, score2: 1, status: 'completed' as const },
    { id: 'm3', tournamentId: 't', stage: 'group' as const, round: 3, roundName: 'R3', matchNumber: 3, team1Id: 'tB', team2Id: 'dummy2', score1: 2, score2: 2, status: 'completed' as const },
    { id: 'm4', tournamentId: 't', stage: 'group' as const, round: 4, roundName: 'R4', matchNumber: 4, team1Id: 'tB', team2Id: 'dummy3', score1: 0, score2: 0, status: 'completed' as const },
  ];

  // If tiebreaker is ['points', 'wins'], tA (1 win) beats tB (0 wins)
  const standingsByWins = calculateStandings(teams, matchesA, scoring, ['points', 'wins', 'diff']);
  assert.equal(standingsByWins[0].teamId, 'tA');

  // Both have same points (3)
  assert.equal(standingsByWins[0].points, 3);
  assert.equal(standingsByWins[1].points, 3);
});

test('handles 3-team single elimination with 1 bye cleanly', () => {
  const matches = generateSingleEliminationMatches('t3', ['a', 'b', 'c'], false);
  // 4 bracket size: 2 matches in R1 (1 real, 1 bye), 1 in R2 (Final) = 3 matches
  assert.equal(matches.length, 3);
  const byes = matches.filter((m) => m.isBye);
  assert.equal(byes.length, 1);
  assert.equal(byes[0].status, 'completed');
});

