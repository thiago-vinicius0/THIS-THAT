/**
 * THIS & THAT - Competitive Tournament Rules & Bracket Engine
 * Pure logic decoupled from UI for strict unit testing and deterministic calculations.
 */

import { Match, ScoringRules, Team, TeamStanding, TiebreakerCriterion, Tournament } from '../types/tournament';

/**
 * Calculates next power of 2 greater than or equal to n (minimum 2)
 */
export function getNextPowerOfTwo(n: number): number {
  if (n <= 2) return 2;
  let power = 2;
  while (power < n) {
    power *= 2;
  }
  return power;
}

/**
 * Returns round display name for single elimination
 */
export function getRoundName(roundTotalMatches: number): string {
  switch (roundTotalMatches) {
    case 1:
      return 'Grande Final';
    case 2:
      return 'Semifinal';
    case 4:
      return 'Quartas de Final';
    case 8:
      return 'Oitavas de Final';
    case 16:
      return 'Fase Preliminar (1/16)';
    default:
      return `Rodada (${roundTotalMatches * 2} Equipes)`;
  }
}

/**
 * Generates Standard Seed Pairings for single elimination
 * (e.g., for 8 teams: [1,8], [4,5], [2,7], [3,6])
 */
export function getSeededPairings(bracketSize: number): Array<[number, number]> {
  let rounds = [1, 2];
  while (rounds.length < bracketSize) {
    const nextRounds: number[] = [];
    const sum = rounds.length * 2 + 1;
    for (const seed of rounds) {
      nextRounds.push(seed);
      nextRounds.push(sum - seed);
    }
    rounds = nextRounds;
  }

  const pairings: Array<[number, number]> = [];
  for (let i = 0; i < rounds.length; i += 2) {
    pairings.push([rounds[i], rounds[i + 1]]);
  }
  return pairings;
}

/**
 * Generates Single Elimination Tournament Bracket
 */
export function generateSingleEliminationMatches(
  tournamentId: string,
  teamIds: string[],
  includeThirdPlace: boolean = true
): Match[] {
  const numTeams = teamIds.length;
  if (numTeams < 2) return [];

  const bracketSize = getNextPowerOfTwo(numTeams);
  const totalRounds = Math.log2(bracketSize);
  const matches: Match[] = [];

  // Seeded pairings (1-indexed)
  const pairings = getSeededPairings(bracketSize);

  let matchCounter = 1;
  const roundMatchesMap = new Map<number, Match[]>();

  // Create rounds from Final backwards down to Round 1 to wire nextMatchId cleanly
  for (let r = totalRounds; r >= 1; r--) {
    const matchesInRound = Math.pow(2, totalRounds - r);
    const roundList: Match[] = [];
    const roundName = getRoundName(matchesInRound);

    for (let m = 0; m < matchesInRound; m++) {
      const matchId = `match_${tournamentId}_r${r}_m${m + 1}`;
      const match: Match = {
        id: matchId,
        tournamentId,
        stage: r === totalRounds ? 'grand_final' : 'bracket_winners',
        round: r,
        roundName,
        matchNumber: 0, // Assigned below in forward order
        score1: 0,
        score2: 0,
        status: 'scheduled',
      };

      // Wire to next round match if not final
      if (r < totalRounds) {
        const nextRoundList = roundMatchesMap.get(r + 1);
        if (nextRoundList) {
          const parentIndex = Math.floor(m / 2);
          const parentMatch = nextRoundList[parentIndex];
          if (parentMatch) {
            match.nextMatchId = parentMatch.id;
            match.nextMatchSlot = (m % 2 === 0 ? 1 : 2);
          }
        }
      }

      roundList.push(match);
    }
    roundMatchesMap.set(r, roundList);
  }

  // Populate Round 1 with teams and handle byes
  const round1Matches = roundMatchesMap.get(1) || [];
  for (let i = 0; i < pairings.length; i++) {
    const [seed1, seed2] = pairings[i];
    const match = round1Matches[i];
    if (!match) continue;

    const team1 = seed1 <= numTeams ? teamIds[seed1 - 1] : undefined;
    const team2 = seed2 <= numTeams ? teamIds[seed2 - 1] : undefined;

    match.team1Id = team1;
    match.team2Id = team2;

    // Handle Bye
    if (team1 && !team2) {
      match.status = 'completed';
      match.winnerId = team1;
      match.score1 = 1;
      match.score2 = 0;
      match.isBye = true;
      match.notes = 'Avançou por folga (Bye)';
    } else if (!team1 && team2) {
      match.status = 'completed';
      match.winnerId = team2;
      match.score1 = 0;
      match.score2 = 1;
      match.isBye = true;
      match.notes = 'Avançou por folga (Bye)';
    }
  }

  // Assign match numbers in natural forward order and flatten
  let matchNumberSeq = 1;
  for (let r = 1; r <= totalRounds; r++) {
    const list = roundMatchesMap.get(r) || [];
    for (const m of list) {
      m.matchNumber = matchNumberSeq++;
      matches.push(m);
    }
  }

  // Propagate Byes to Round 2
  for (const match of round1Matches) {
    if (match.isBye && match.winnerId && match.nextMatchId) {
      const nextMatch = matches.find((m) => m.id === match.nextMatchId);
      if (nextMatch) {
        if (match.nextMatchSlot === 1) nextMatch.team1Id = match.winnerId;
        else if (match.nextMatchSlot === 2) nextMatch.team2Id = match.winnerId;
      }
    }
  }

  // Optional 3rd place match (between losers of the semifinals)
  if (includeThirdPlace && totalRounds >= 2) {
    const semiRound = roundMatchesMap.get(totalRounds - 1);
    if (semiRound && semiRound.length === 2) {
      const thirdPlaceMatch: Match = {
        id: `match_${tournamentId}_third_place`,
        tournamentId,
        stage: 'third_place',
        round: totalRounds,
        roundName: 'Disputa do 3º Lugar',
        matchNumber: matchCounter++,
        score1: 0,
        score2: 0,
        status: 'scheduled',
      };
      // Wire losers of semifinal 1 & 2 to 3rd place
      semiRound[0].loserNextMatchId = thirdPlaceMatch.id;
      semiRound[0].loserNextMatchSlot = 1;
      semiRound[1].loserNextMatchId = thirdPlaceMatch.id;
      semiRound[1].loserNextMatchSlot = 2;
      matches.push(thirdPlaceMatch);
    }
  }

  return matches;
}

/**
 * Generates Round-Robin Matches for a list of teams
 * (e.g. within a group or a full league)
 */
export function generateRoundRobinMatches(
  tournamentId: string,
  teamIds: string[],
  stage: 'group' | 'round_robin' = 'round_robin',
  groupId?: string,
  startMatchNumber: number = 1
): Match[] {
  const matches: Match[] = [];
  const teams = [...teamIds];
  let hasGhost = false;

  if (teams.length % 2 !== 0) {
    teams.push('__BYE__');
    hasGhost = true;
  }

  const numTeams = teams.length;
  const numRounds = numTeams - 1;
  const half = numTeams / 2;

  let currentNumber = startMatchNumber;

  for (let round = 0; round < numRounds; round++) {
    const roundNumber = round + 1;
    for (let i = 0; i < half; i++) {
      const teamA = teams[i];
      const teamB = teams[numTeams - 1 - i];

      // If one of the teams is a ghost, this is a bye (we don't create a real match or mark as bye)
      if (teamA === '__BYE__' || teamB === '__BYE__') {
        continue;
      }

      // Alternate home/away for fair distribution
      const isHome = (round + i) % 2 === 0;
      const team1Id = isHome ? teamA : teamB;
      const team2Id = isHome ? teamB : teamA;

      const groupLabel = groupId ? `Grupo ${groupId} - ` : '';

      matches.push({
        id: `match_${tournamentId}_${groupId ? `grp_${groupId}_` : ''}r${roundNumber}_m${currentNumber}`,
        tournamentId,
        stage,
        groupId,
        round: roundNumber,
        roundName: `${groupLabel}Rodada ${roundNumber}`,
        matchNumber: currentNumber++,
        team1Id,
        team2Id,
        score1: 0,
        score2: 0,
        status: 'scheduled',
      });
    }

    // Rotate teams array keeping first team fixed (Berger system)
    const fixed = teams[0];
    const rotated = [fixed, teams[teams.length - 1], ...teams.slice(1, teams.length - 1)];
    teams.splice(0, teams.length, ...rotated);
  }

  return matches;
}

/**
 * Generates Groups + Playoffs Tournament Matches
 */
export function generateGroupsAndPlayoffsMatches(
  tournamentId: string,
  teamIds: string[],
  groupsCount: number = 2,
  qualifiersPerGroup: number = 2
): { matches: Match[]; groupAssignments: Record<string, string[]> } {
  const groupAssignments: Record<string, string[]> = {};
  const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, groupsCount);

  for (const name of groupNames) {
    groupAssignments[name] = [];
  }

  // Distribute teams evenly into groups
  teamIds.forEach((id, idx) => {
    const groupName = groupNames[idx % groupsCount];
    groupAssignments[groupName].push(id);
  });

  const allMatches: Match[] = [];
  let matchNumber = 1;

  // Generate round-robin for each group
  for (const groupName of groupNames) {
    const groupTeams = groupAssignments[groupName];
    const groupMatches = generateRoundRobinMatches(tournamentId, groupTeams, 'group', groupName, matchNumber);
    matchNumber += groupMatches.length;
    allMatches.push(...groupMatches);
  }

  return { matches: allMatches, groupAssignments };
}

/**
 * Generates Knockout Bracket from Group Stage Qualifiers
 * Supports standard cross-group pairings:
 * e.g., for 2 groups with 2 qualifiers:
 * Semi 1: 1st Group A vs 2nd Group B
 * Semi 2: 1st Group B vs 2nd Group A
 */
export function generatePlayoffBracketFromGroups(
  tournamentId: string,
  qualifiedTeamIds: string[], // In seeded order
  includeThirdPlace: boolean = true
): Match[] {
  return generateSingleEliminationMatches(tournamentId, qualifiedTeamIds, includeThirdPlace);
}

/**
 * Calculates Standings for a list of teams and completed matches
 */
export function calculateStandings(
  teams: Team[],
  matches: Match[],
  scoring: ScoringRules,
  tiebreakerOrder: TiebreakerCriterion[] = ['points', 'wins', 'diff', 'scored', 'head_to_head']
): TeamStanding[] {
  const standingsMap = new Map<string, TeamStanding>();

  for (const team of teams) {
    standingsMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      teamTag: team.tag,
      teamColor: team.color,
      teamBadgeIcon: team.badgeIcon,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      scoreFor: 0,
      scoreAgainst: 0,
      scoreDiff: 0,
      winRate: 0,
      headToHeadPoints: {},
    });
  }

  for (const match of matches) {
    // Only count completed or byes with score
    if (match.status !== 'completed') continue;
    if (!match.team1Id || !match.team2Id) continue;

    const t1 = standingsMap.get(match.team1Id);
    const t2 = standingsMap.get(match.team2Id);

    if (t1) {
      t1.matchesPlayed += 1;
      t1.scoreFor += match.score1;
      t1.scoreAgainst += match.score2;
      t1.scoreDiff = t1.scoreFor - t1.scoreAgainst;
    }

    if (t2) {
      t2.matchesPlayed += 1;
      t2.scoreFor += match.score2;
      t2.scoreAgainst += match.score1;
      t2.scoreDiff = t2.scoreFor - t2.scoreAgainst;
    }

    if (match.score1 > match.score2) {
      if (t1) {
        t1.wins += 1;
        t1.points += scoring.win;
        t1.headToHeadPoints![match.team2Id] = (t1.headToHeadPoints![match.team2Id] || 0) + scoring.win;
      }
      if (t2) {
        t2.losses += 1;
        t2.points += scoring.loss;
      }
    } else if (match.score2 > match.score1) {
      if (t2) {
        t2.wins += 1;
        t2.points += scoring.win;
        t2.headToHeadPoints![match.team1Id] = (t2.headToHeadPoints![match.team1Id] || 0) + scoring.win;
      }
      if (t1) {
        t1.losses += 1;
        t1.points += scoring.loss;
      }
    } else {
      // Draw (if allowed)
      if (t1) {
        t1.draws += 1;
        t1.points += scoring.draw;
        t1.headToHeadPoints![match.team2Id] = (t1.headToHeadPoints![match.team2Id] || 0) + scoring.draw;
      }
      if (t2) {
        t2.draws += 1;
        t2.points += scoring.draw;
        t2.headToHeadPoints![match.team1Id] = (t2.headToHeadPoints![match.team1Id] || 0) + scoring.draw;
      }
    }
  }

  // Compute win rate
  for (const standing of standingsMap.values()) {
    standing.winRate = standing.matchesPlayed > 0 
      ? Math.round((standing.wins / standing.matchesPlayed) * 100) 
      : 0;
  }

  const standingsList = Array.from(standingsMap.values());

  // Sort according to configurable tiebreakers
  standingsList.sort((a, b) => {
    for (const criterion of tiebreakerOrder) {
      if (criterion === 'points' && b.points !== a.points) {
        return b.points - a.points;
      }
      if (criterion === 'wins' && b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      if (criterion === 'diff' && b.scoreDiff !== a.scoreDiff) {
        return b.scoreDiff - a.scoreDiff;
      }
      if (criterion === 'scored' && b.scoreFor !== a.scoreFor) {
        return b.scoreFor - a.scoreFor;
      }
      if (criterion === 'head_to_head') {
        const aPointsVsB = a.headToHeadPoints?.[b.teamId] ?? 0;
        const bPointsVsA = b.headToHeadPoints?.[a.teamId] ?? 0;
        if (aPointsVsB !== bPointsVsA) {
          return bPointsVsA - aPointsVsB;
        }
      }
    }
    // Final fallback: alphabetical by name
    return a.teamName.localeCompare(b.teamName);
  });

  return standingsList;
}

/**
 * Advances a winner and loser through the bracket tree
 * Returns the modified matches list
 */
export function updateMatchScoreAndAdvance(
  matches: Match[],
  matchId: string,
  score1: number,
  score2: number,
  allowDraws: boolean = false
): { updatedMatches: Match[]; winnerId?: string; loserId?: string; error?: string } {
  const matchIndex = matches.findIndex((m) => m.id === matchId);
  if (matchIndex === -1) {
    return { updatedMatches: matches, error: 'Partida não encontrada.' };
  }

  const targetMatch = { ...matches[matchIndex] };
  if (!targetMatch.team1Id || !targetMatch.team2Id) {
    return { updatedMatches: matches, error: 'A partida ainda não possui ambas as equipes definidas.' };
  }

  if (score1 === score2 && !allowDraws && targetMatch.stage !== 'group' && targetMatch.stage !== 'round_robin') {
    return { updatedMatches: matches, error: 'Partidas eliminatórias não podem terminar empatadas.' };
  }

  const cloneList = matches.map((m) => ({ ...m }));
  const matchToUpdate = cloneList[matchIndex];

  matchToUpdate.score1 = score1;
  matchToUpdate.score2 = score2;
  matchToUpdate.status = 'completed';
  matchToUpdate.updatedAt = new Date().toISOString();

  let winnerId: string | undefined;
  let loserId: string | undefined;

  if (score1 > score2) {
    winnerId = matchToUpdate.team1Id;
    loserId = matchToUpdate.team2Id;
  } else if (score2 > score1) {
    winnerId = matchToUpdate.team2Id;
    loserId = matchToUpdate.team1Id;
  }

  matchToUpdate.winnerId = winnerId;
  matchToUpdate.loserId = loserId;

  // Advance winner
  if (winnerId && matchToUpdate.nextMatchId) {
    const nextMatch = cloneList.find((m) => m.id === matchToUpdate.nextMatchId);
    if (nextMatch) {
      if (matchToUpdate.nextMatchSlot === 1) {
        nextMatch.team1Id = winnerId;
      } else if (matchToUpdate.nextMatchSlot === 2) {
        nextMatch.team2Id = winnerId;
      }
    }
  }

  // Advance loser (e.g. 3rd place match or double elimination losers bracket)
  if (loserId && matchToUpdate.loserNextMatchId) {
    const loserMatch = cloneList.find((m) => m.id === matchToUpdate.loserNextMatchId);
    if (loserMatch) {
      if (matchToUpdate.loserNextMatchSlot === 1) {
        loserMatch.team1Id = loserId;
      } else if (matchToUpdate.loserNextMatchSlot === 2) {
        loserMatch.team2Id = loserId;
      }
    }
  }

  return { updatedMatches: cloneList, winnerId, loserId };
}
