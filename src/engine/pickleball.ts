export type MatchFormat = 'doubles' | 'singles';
export type ScoringRule = 'traditional' | 'rally';
export type TeamId = 'A' | 'B';
export type CourtSide = 'right' | 'left';
export type QuickButtonAction = 'point_my_team' | 'undo' | 'side_out';

export type MatchEventType =
  | 'INIT'
  | 'POINT_A'
  | 'POINT_B'
  | 'NEXT_SERVER'
  | 'SIDE_OUT'
  | 'UNDO'
  | 'SET_WON'
  | 'MATCH_WON';

export interface MatchConfig {
  matchId: string;
  teamAName: string;
  teamBName: string;
  format: MatchFormat;
  scoringRule: ScoringRule;
  targetPoints: 11 | 15 | 21;
  bestOfSets: 1 | 3;
  quickButtonAction: QuickButtonAction;
  initialServingTeam: TeamId;
}

export interface TimelineEntry {
  seq: number;
  timestamp: number;
  eventType: MatchEventType;
  description: string;
  scoreA: number;
  scoreB: number;
  servingTeam: TeamId;
  serverNumber: 1 | 2;
  serverSide: CourtSide;
}

export interface MatchSnapshot {
  scoreA: number;
  scoreB: number;
  servingTeam: TeamId;
  serverNumber: 1 | 2;
  serverSide: CourtSide;
  setsWonA: number;
  setsWonB: number;
  currentSet: number;
  setScores: Array<{ a: number; b: number }>;
  isMatchOver: boolean;
  winner: TeamId | null;
  seq: number;
  ralliesPlayed: number;
}

export interface PickleballMatchState extends MatchSnapshot {
  config: MatchConfig;
  startedAt: number;
  historyStack: MatchSnapshot[];
  timeline: TimelineEntry[];
}

export function createInitialMatchState(
  config: MatchConfig,
  now = Date.now()
): PickleballMatchState {
  const initialServerNumber: 1 | 2 = config.format === 'doubles' ? 2 : 1;
  const startingTeam: TeamId = config.initialServingTeam ?? 'A';
  const startingTeamName =
    startingTeam === 'A' ? config.teamAName : config.teamBName;

  const initialSnapshot: MatchSnapshot = {
    scoreA: 0,
    scoreB: 0,
    servingTeam: startingTeam,
    serverNumber: initialServerNumber,
    serverSide: 'right',
    setsWonA: 0,
    setsWonB: 0,
    currentSet: 1,
    setScores: [],
    isMatchOver: false,
    winner: null,
    seq: 1,
    ralliesPlayed: 0,
  };

  return {
    ...initialSnapshot,
    config: {
      ...config,
      initialServingTeam: startingTeam,
    },
    startedAt: now,
    historyStack: [],
    timeline: [
      {
        seq: 1,
        timestamp: now,
        eventType: 'INIT',
        description: `Inicio (${config.format === 'doubles' ? 'Dobles' : 'Individuales'} · A ${config.targetPoints} · Saca ${startingTeamName})`,
        scoreA: 0,
        scoreB: 0,
        servingTeam: startingTeam,
        serverNumber: initialServerNumber,
        serverSide: 'right',
      },
    ],
  };
}

export function switchInitialServingTeam(
  state: PickleballMatchState,
  now = Date.now()
): PickleballMatchState {
  if (state.ralliesPlayed > 0 || state.isMatchOver) {
    return state;
  }

  const nextTeam: TeamId = state.servingTeam === 'A' ? 'B' : 'A';
  const nextTeamName =
    nextTeam === 'A' ? state.config.teamAName : state.config.teamBName;
  const nextSeq = state.seq + 1;

  return {
    ...state,
    servingTeam: nextTeam,
    config: {
      ...state.config,
      initialServingTeam: nextTeam,
    },
    seq: nextSeq,
    timeline: [
      {
        seq: nextSeq,
        timestamp: now,
        eventType: 'INIT',
        description: `Saque inicial cambiado a ${nextTeamName}`,
        scoreA: state.scoreA,
        scoreB: state.scoreB,
        servingTeam: nextTeam,
        serverNumber: state.serverNumber,
        serverSide: state.serverSide,
      },
      ...state.timeline,
    ],
  };
}

export function formatWatchCallout(state: PickleballMatchState): string {
  if (state.config.format === 'doubles') {
    const servingScore = state.servingTeam === 'A' ? state.scoreA : state.scoreB;
    const receivingScore = state.servingTeam === 'A' ? state.scoreB : state.scoreA;
    return `${servingScore} - ${receivingScore} - ${state.serverNumber}`;
  }
  const servingScore = state.servingTeam === 'A' ? state.scoreA : state.scoreB;
  const receivingScore = state.servingTeam === 'A' ? state.scoreB : state.scoreA;
  return `${servingScore} - ${receivingScore}`;
}

export function checkSetWinner(
  scoreA: number,
  scoreB: number,
  targetPoints: number
): TeamId | null {
  if (scoreA >= targetPoints && scoreA - scoreB >= 2) {
    return 'A';
  }
  if (scoreB >= targetPoints && scoreB - scoreA >= 2) {
    return 'B';
  }
  return null;
}

function flipSide(side: CourtSide): CourtSide {
  return side === 'right' ? 'left' : 'right';
}

function takeSnapshot(state: PickleballMatchState): MatchSnapshot {
  return {
    scoreA: state.scoreA,
    scoreB: state.scoreB,
    servingTeam: state.servingTeam,
    serverNumber: state.serverNumber,
    serverSide: state.serverSide,
    setsWonA: state.setsWonA,
    setsWonB: state.setsWonB,
    currentSet: state.currentSet,
    setScores: state.setScores.map((s) => ({ ...s })),
    isMatchOver: state.isMatchOver,
    winner: state.winner,
    seq: state.seq,
    ralliesPlayed: state.ralliesPlayed,
  };
}

function applyPointAndCheckSet(
  state: PickleballMatchState,
  scoringTeam: TeamId,
  nextSeq: number,
  nextServerSide: CourtSide,
  nextServingTeam: TeamId,
  nextServerNumber: 1 | 2,
  now: number,
  eventType: MatchEventType,
  baseDesc: string
): PickleballMatchState {
  const newScoreA = scoringTeam === 'A' ? state.scoreA + 1 : state.scoreA;
  const newScoreB = scoringTeam === 'B' ? state.scoreB + 1 : state.scoreB;

  const setWinner = checkSetWinner(newScoreA, newScoreB, state.config.targetPoints);
  if (!setWinner) {
    const nextState: PickleballMatchState = {
      ...state,
      scoreA: newScoreA,
      scoreB: newScoreB,
      servingTeam: nextServingTeam,
      serverNumber: nextServerNumber,
      serverSide: nextServerSide,
      seq: nextSeq,
      ralliesPlayed: state.ralliesPlayed + 1,
      historyStack: [...state.historyStack, takeSnapshot(state)],
      timeline: [
        {
          seq: nextSeq,
          timestamp: now,
          eventType,
          description: baseDesc,
          scoreA: newScoreA,
          scoreB: newScoreB,
          servingTeam: nextServingTeam,
          serverNumber: nextServerNumber,
          serverSide: nextServerSide,
        },
        ...state.timeline,
      ],
    };
    return nextState;
  }

  const nextSetsWonA = setWinner === 'A' ? state.setsWonA + 1 : state.setsWonA;
  const nextSetsWonB = setWinner === 'B' ? state.setsWonB + 1 : state.setsWonB;
  const setsNeeded = Math.ceil(state.config.bestOfSets / 2);
  const completedSetScores = [...state.setScores, { a: newScoreA, b: newScoreB }];
  const isMatchWon = nextSetsWonA >= setsNeeded || nextSetsWonB >= setsNeeded;

  if (isMatchWon) {
    const winnerName = setWinner === 'A' ? state.config.teamAName : state.config.teamBName;
    return {
      ...state,
      scoreA: newScoreA,
      scoreB: newScoreB,
      setsWonA: nextSetsWonA,
      setsWonB: nextSetsWonB,
      setScores: completedSetScores,
      isMatchOver: true,
      winner: setWinner,
      seq: nextSeq,
      ralliesPlayed: state.ralliesPlayed + 1,
      historyStack: [...state.historyStack, takeSnapshot(state)],
      timeline: [
        {
          seq: nextSeq,
          timestamp: now,
          eventType: 'MATCH_WON',
          description: `Partido ganado por ${winnerName} (${newScoreA}-${newScoreB})`,
          scoreA: newScoreA,
          scoreB: newScoreB,
          servingTeam: nextServingTeam,
          serverNumber: nextServerNumber,
          serverSide: nextServerSide,
        },
        ...state.timeline,
      ],
    };
  }

  // Advance to next set
  const nextStartingTeam: TeamId = state.currentSet % 2 === 1 ? 'B' : 'A';
  const nextSetServerNum: 1 | 2 = state.config.format === 'doubles' ? 2 : 1;
  const setWinnerName = setWinner === 'A' ? state.config.teamAName : state.config.teamBName;

  return {
    ...state,
    scoreA: 0,
    scoreB: 0,
    setsWonA: nextSetsWonA,
    setsWonB: nextSetsWonB,
    currentSet: state.currentSet + 1,
    setScores: completedSetScores,
    servingTeam: nextStartingTeam,
    serverNumber: nextSetServerNum,
    serverSide: 'right',
    seq: nextSeq,
    ralliesPlayed: state.ralliesPlayed + 1,
    historyStack: [...state.historyStack, takeSnapshot(state)],
    timeline: [
      {
        seq: nextSeq,
        timestamp: now,
        eventType: 'SET_WON',
        description: `Set ${state.currentSet} para ${setWinnerName} (${newScoreA}-${newScoreB}). Inicia Set ${state.currentSet + 1}`,
        scoreA: 0,
        scoreB: 0,
        servingTeam: nextStartingTeam,
        serverNumber: nextSetServerNum,
        serverSide: 'right',
      },
      ...state.timeline,
    ],
  };
}

/**
 * Triggered when the user taps Team A or Team B on the Watch.
 * - In Traditional scoring:
 *   - If the tapped team is currently serving -> awards +1 point and flips server side.
 *   - If the tapped team is receiving -> advances fault/side-out (Server 1 -> Server 2 or Side Out).
 * - In Rally scoring:
 *   - Tapping either team awards +1 point to that team; if receiving team won, they also take serve.
 */
export function recordTeamRallyWin(
  state: PickleballMatchState,
  winningTeam: TeamId,
  now = Date.now()
): PickleballMatchState {
  if (state.isMatchOver) return state;

  const nextSeq = state.seq + 1;
  const teamName = winningTeam === 'A' ? state.config.teamAName : state.config.teamBName;

  if (state.config.scoringRule === 'rally') {
    if (winningTeam === state.servingTeam) {
      const nextSide: CourtSide =
        state.config.format === 'singles'
          ? ((winningTeam === 'A' ? state.scoreA + 1 : state.scoreB + 1) % 2 === 0
              ? 'right'
              : 'left')
          : flipSide(state.serverSide);

      return applyPointAndCheckSet(
        state,
        winningTeam,
        nextSeq,
        nextSide,
        state.servingTeam,
        state.serverNumber,
        now,
        winningTeam === 'A' ? 'POINT_A' : 'POINT_B',
        `Punto (Rally) para ${teamName}`
      );
    }

    // Receiving team wins rally in Rally Scoring -> +1 point & takes serve
    const newScore = (winningTeam === 'A' ? state.scoreA : state.scoreB) + 1;
    const nextSide: CourtSide = newScore % 2 === 0 ? 'right' : 'left';
    return applyPointAndCheckSet(
      state,
      winningTeam,
      nextSeq,
      nextSide,
      winningTeam,
      1,
      now,
      winningTeam === 'A' ? 'POINT_A' : 'POINT_B',
      `Punto y recuperación de saque para ${teamName}`
    );
  }

  // Traditional (Side-Out) Scoring
  if (winningTeam === state.servingTeam) {
    const nextSide: CourtSide =
      state.config.format === 'singles'
        ? ((winningTeam === 'A' ? state.scoreA + 1 : state.scoreB + 1) % 2 === 0
            ? 'right'
            : 'left')
        : flipSide(state.serverSide);

    return applyPointAndCheckSet(
      state,
      winningTeam,
      nextSeq,
      nextSide,
      state.servingTeam,
      state.serverNumber,
      now,
      winningTeam === 'A' ? 'POINT_A' : 'POINT_B',
      `Punto para ${teamName} (${winningTeam === 'A' ? state.scoreA + 1 : state.scoreA}-${winningTeam === 'B' ? state.scoreB + 1 : state.scoreB})`
    );
  }

  // Receiving team won rally in Traditional scoring -> fault / side-out
  return recordServeFault(state, now);
}

/**
 * Explicitly records a service fault / loss of rally by the current serving team.
 * - Doubles Server 1 -> Doubles Server 2 (flips serverSide).
 * - Doubles Server 2 or Singles -> Side-Out to receiving team.
 */
export function recordServeFault(
  state: PickleballMatchState,
  now = Date.now()
): PickleballMatchState {
  if (state.isMatchOver) return state;

  const nextSeq = state.seq + 1;

  if (state.config.format === 'doubles' && state.serverNumber === 1) {
    const nextSide = flipSide(state.serverSide);
    const servingName = state.servingTeam === 'A' ? state.config.teamAName : state.config.teamBName;
    return {
      ...state,
      serverNumber: 2,
      serverSide: nextSide,
      seq: nextSeq,
      ralliesPlayed: state.ralliesPlayed + 1,
      historyStack: [...state.historyStack, takeSnapshot(state)],
      timeline: [
        {
          seq: nextSeq,
          timestamp: now,
          eventType: 'NEXT_SERVER',
          description: `Cambio a Servidor 2 (${servingName})`,
          scoreA: state.scoreA,
          scoreB: state.scoreB,
          servingTeam: state.servingTeam,
          serverNumber: 2,
          serverSide: nextSide,
        },
        ...state.timeline,
      ],
    };
  }

  // Side-out to the other team
  const nextTeam: TeamId = state.servingTeam === 'A' ? 'B' : 'A';
  const nextTeamName = nextTeam === 'A' ? state.config.teamAName : state.config.teamBName;
  const nextTeamScore = nextTeam === 'A' ? state.scoreA : state.scoreB;
  const nextSide: CourtSide =
    state.config.format === 'singles'
      ? nextTeamScore % 2 === 0
        ? 'right'
        : 'left'
      : 'right';

  return {
    ...state,
    servingTeam: nextTeam,
    serverNumber: 1,
    serverSide: nextSide,
    seq: nextSeq,
    ralliesPlayed: state.ralliesPlayed + 1,
    historyStack: [...state.historyStack, takeSnapshot(state)],
    timeline: [
      {
        seq: nextSeq,
        timestamp: now,
        eventType: 'SIDE_OUT',
        description: `Cambio de saque (Side-Out) -> Saca ${nextTeamName}`,
        scoreA: state.scoreA,
        scoreB: state.scoreB,
        servingTeam: nextTeam,
        serverNumber: 1,
        serverSide: nextSide,
      },
      ...state.timeline,
    ],
  };
}

export function undoLastAction(
  state: PickleballMatchState,
  now = Date.now()
): PickleballMatchState {
  if (state.historyStack.length === 0) return state;

  const previous = state.historyStack[state.historyStack.length - 1];
  const nextHistory = state.historyStack.slice(0, -1);
  const nextSeq = state.seq + 1;

  return {
    ...state,
    ...previous,
    seq: nextSeq,
    historyStack: nextHistory,
    timeline: [
      {
        seq: nextSeq,
        timestamp: now,
        eventType: 'UNDO',
        description: `Deshacer jugada -> Marcador restaurado (${previous.scoreA}-${previous.scoreB})`,
        scoreA: previous.scoreA,
        scoreB: previous.scoreB,
        servingTeam: previous.servingTeam,
        serverNumber: previous.serverNumber,
        serverSide: previous.serverSide,
      },
      ...state.timeline,
    ],
  };
}
