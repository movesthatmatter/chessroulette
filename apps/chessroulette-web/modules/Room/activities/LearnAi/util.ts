import Cookies from 'js-cookie';
import { Chess } from 'chess.js';
export type ContainerDimensions = {
  width: number;
  height: number;
};

export type Dimensions = ContainerDimensions & {
  verticalPadding: number;
};
export type EvaluationMove = {
  moveNum: number;
  move: string;
  moveCalc: number;
  eval: number;
  diff: string;
  bestMoves: string[];
};

export type Ratios = {
  leftSide: number;
  mainArea: number;
  rightSide: number;
};

export const getMaxKey = <O extends { [k: string]: number }>(obj: O) =>
  Object.keys(obj).reduce(
    (prev, next) => (obj[next] > obj[prev] ? next : prev),
    Object.keys(obj)[0] as keyof O
  );

export const normalizeRatios = (r: Ratios): Ratios => {
  const maxKey = getMaxKey(r);
  const maxVal = r[maxKey];

  return {
    leftSide: r.leftSide / maxVal,
    rightSide: r.rightSide / maxVal,
    mainArea: r.mainArea / maxVal,

    // Replace the maxKey with 1
    [maxKey]: 1,
  };
};

export const getLayoutSizes = (
  containerDimensions: ContainerDimensions,
  ratios: Ratios
): {
  leftSide: number;
  mainArea: number;
  rightSide: number;
  remaining: number;
} => {
  const normalizedRatios = normalizeRatios(ratios);
  const ratio =
    normalizedRatios.mainArea +
    normalizedRatios.leftSide +
    normalizedRatios.rightSide;
  const maxWidth = containerDimensions.height * ratio;
  const diff = containerDimensions.width - maxWidth;

  if (diff >= 0) {
    return {
      leftSide: Math.floor(normalizedRatios.leftSide * (maxWidth / ratio)),
      mainArea: Math.floor(normalizedRatios.mainArea * (maxWidth / ratio)),
      rightSide: Math.floor(normalizedRatios.rightSide * (maxWidth / ratio)),
      remaining: diff,
    };
  }

  const nextContainerHeight =
    containerDimensions.height - Math.abs(diff / ratio);
  return getLayoutSizes(
    {
      ...containerDimensions,
      height: nextContainerHeight,
    },
    ratios
  );
};

export const isMobile = (dimensions: ContainerDimensions) =>
  dimensions.width < 601;

//OPENINGS
// export async function getOpenings() {
//   try {
//     const response = await fetch(
//       process.env.NEXT_PUBLIC_API_WEB + 'opening_random',
//       {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       }
//     );
//     if (!response.ok) {
//       throw new Error(`Error: ${response.status}`);
//     }
//
//     return response.json();
//   } catch (error) {
//     console.error('Fetch error', error);
//   }
// }

export type MessageMoveSegment =
  | { type: 'text'; value: string; start: number; end: number }
  | {
      type: 'move';
      value: string;
      start: number;
      end: number;
      moveNumber: number;
      colorIdx: 0 | 1;
    };

export function buildPgnFromMessageContent(content: string): string | null {
  console.log('buildPgnFromMessageContent', content);
  const segments = parseMessageMoves(content).filter(
    (s): s is Extract<MessageMoveSegment, { type: 'move' }> => s.type === 'move'
  );
  if (segments.length === 0) return null;
  const pairs: [string, string | undefined][] = [];
  for (const seg of segments) {
    const san = seg.value.replace(/^\d+\.(\.\.)?\s*/, '').trim();
    if (!san) continue;
    if (seg.colorIdx === 0) {
      pairs.push([san, undefined]);
    } else {
      if (pairs.length) pairs[pairs.length - 1][1] = san;
    }
  }
  const pgn = pairs
    .map(([w, b], i) => {
      const turn = i + 1;
      return b !== undefined ? `${turn}. ${w} ${b}` : `${turn}. ${w}`;
    })
    .join(' ');
  return pgn ? `[Event "?"]\n[Site "?"]\n\n${pgn}` : null;
}

function normalizeLichessCastlingUci(uci: string): string {
  const castlingMap: Record<string, string> = {
    e1h1: 'e1g1',
    e1a1: 'e1c1',
    e8h8: 'e8g8',
    e8a8: 'e8c8',
  };
  return castlingMap[uci] ?? uci;
}

/** Parses PGN body (no headers) into a list of SAN moves. */
function pgnToSanList(pgn: string): string[] {
  const body = pgn.replace(/^\[\s*Event[^\]]*\][\s\S]*?\n\n?/i, '').trim();
  const tokens = body.split(/\s+/).filter(Boolean);
  const moves: string[] = [];
  for (const t of tokens) {
    if (/^\d+\.(\.\.)?$/.test(t)) continue;
    const san = t.replace(/^[\d.]+\s*/, '').trim();
    if (
      san &&
      /^([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8]=?[NBRQ]?[+#]?|O-O-O|O-O)$/i.test(san)
    )
      moves.push(san);
  }
  return moves;
}

/** Replays moves with chess.js and returns a PGN string with proper SAN (disambiguated). Returns null if replay fails. */
export function buildLoadablePgnFromIdeas(ideas: string): string | null {
  console.log('buildLoadablePgnFromIdeas', ideas);
  const rawPgn = buildPgnFromMessageContent(ideas);
  if (!rawPgn?.trim()) return null;
  const sanList = pgnToSanList(rawPgn);
  if (sanList.length === 0) return null;
  const chess = new Chess();
  const resultSans: string[] = [];
  for (const san of sanList) {
    try {
      const move = chess.move(san);
      if (move?.san) resultSans.push(move.san);
      else break;
    } catch {
      const legal = chess.moves({ verbose: true });
      const toSquare = san.slice(-2);
      const piece = /^[NBRQK]/.test(san) ? san[0] : 'p';
      const matching = legal.filter(
        (m) => m.to === toSquare && m.piece === piece
      );
      if (matching.length === 0) return null;
      const move = chess.move(matching[0]);
      if (move?.san) resultSans.push(move.san);
      else return null;
    }
  }
  if (resultSans.length === 0) return null;
  const pairs: string[] = [];
  let i = 0;
  let turn = 1;
  while (i < resultSans.length) {
    const w = resultSans[i++];
    const b = resultSans[i++];
    if (b !== undefined) pairs.push(`${turn}. ${w} ${b}`);
    else pairs.push(`${turn}. ${w}`);
    turn++;
  }
  const pgnBody = pairs.join(' ');
  return pgnBody ? `[Event "?"]\n[Site "?"]\n\n${pgnBody}` : null;
}

function looksLikeSanMove(word: string): boolean {
  if (!word || word.length > 10) return false;
  if (/^\d+\./.test(word)) return false;
  if (/^\[/.test(word)) return false;
  return /^(O-O-O|O-O|[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](=[NBRQ])?[+#]?)$/.test(
    word.trim()
  );
}

export function parseMessageMoves(content: string): MessageMoveSegment[] {
  const moveRegex = /(\d+\.(?:\.\.)?[ \t]*[^\s\[\]]+)/g; // ne prelazi u novi red
  const moveSegments: Array<{
    start: number;
    end: number;
    moveNumber: number;
    colorIdx: 0 | 1;
    value: string;
  }> = [];
  let match: RegExpExecArray | null;
  while ((match = moveRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const prevChar = content[match.index - 1];
    if (prevChar && /[A-Za-z0-9]/.test(prevChar)) continue; // npr. "Bb7." nije broj poteza
    const numMatch = fullMatch.match(/^(\d+)\.(\.\.)?[ \t]*(.*)$/);
    const san = (numMatch?.[3] ?? '').replace(/[.,;:!?)]+$/, '');
    if (!looksLikeSanMove(san)) continue; // posle broja mora potez
    const moveNumber = numMatch ? parseInt(numMatch[1], 10) : 1;
    const isBlack = !!numMatch?.[2];
    moveSegments.push({
      start: match.index,
      end: match.index + fullMatch.length,
      moveNumber,
      colorIdx: (isBlack ? 1 : 0) as 0 | 1,
      value: fullMatch,
    });
    if (!isBlack) {
      const after = content.slice(match.index + fullMatch.length);
      const inlineBlack = after.match(/^[ \t]+([^\s\[\]]+)/);
      if (inlineBlack && looksLikeSanMove(inlineBlack[1])) {
        const blackValue = inlineBlack[1];
        const blackStart = match.index + fullMatch.length;
        const blackEnd = blackStart + inlineBlack[0].length;
        moveSegments.push({
          start: blackStart,
          end: blackEnd,
          moveNumber,
          colorIdx: 1,
          value: blackValue,
        });
        moveRegex.lastIndex = blackEnd;
      }
    }
  }
  moveSegments.sort((a, b) => a.start - b.start);
  const segments: MessageMoveSegment[] = [];
  let lastEnd = 0;
  for (const seg of moveSegments) {
    if (seg.start > lastEnd) {
      segments.push({
        type: 'text',
        value: content.slice(lastEnd, seg.start),
        start: lastEnd,
        end: seg.start,
      });
    }
    segments.push({
      type: 'move',
      value: seg.value,
      start: seg.start,
      end: seg.end,
      moveNumber: seg.moveNumber,
      colorIdx: seg.colorIdx,
    });
    lastEnd = seg.end;
  }
  if (lastEnd < content.length) {
    segments.push({
      type: 'text',
      value: content.slice(lastEnd),
      start: lastEnd,
      end: content.length,
    });
  }
  return segments;
}

// const OPENING_IDEAS: Record<string, string> = {
//   'sicilian defense':
//     '1.e4 c5 [Sicilian Defense. Black fights for the center.] 2.Nf3 [The most common move. White develops a knight and controls d4.] 2...d6 [Black prepares to develop the dark-squared bishop.] 3.d4 [White opens the center.] 3...cxd4 [Black challenges the center.] 4.Nxd4 [White recaptures the pawn.] 4...Nf6 [Black develops the knight and attacks e4.] 5.Nc3 [White develops the knight and defends e4.] 5...a6 [The Najdorf Variation. Black prevents Bb5 and prepares ...b5.] 6.Be3 [White develops the bishop.] 6...e5 [Black challenges the knight on d4.] 7.Nb3 [White retreats the knight.] 7...Be7 [Black develops the bishop and prepares to castle.] 8.f3 [White strengthens the center and prepares to launch a kingside attack.] 8...Be6 [Black develops the bishop and controls d5.] 9.Qd2 [White connects the rooks and prepares to castle queenside.] 9...O-O [Black castles.] 10.O-O-O [White castles queenside, initiating a race to attack.]',
//   'caro-kann defense':
//     "1.e4 c6 [Caro-Kann Defense. A solid defense, preparing ...d5.] 2.d4 d5 [Black challenges the center.] 3.Nc3 [White develops the knight.] 3...dxe4 [Black exchanges the central pawn.] 4.Nxe4 [White recaptures with the knight.] 4...Bf5 [The Classical Variation. Black develops the bishop and pins the knight.] 5.Ng3 [White retreats the knight.] 5...Bg6 [Black retreats the bishop.] 6.h4 [White begins a kingside attack.] 6...h6 [Black prevents Ng5.] 7.Nf3 [White develops the knight.] 7...Nd7 [Black develops the knight, preparing ...Ngf6.] 8.h5 [White attacks the bishop.] 8...Bh7 [Black retreats the bishop.] 9.Bd3 [White develops the bishop and challenges Black's bishop.] 9...Bxd3 [Black exchanges the bishops.] 10.Qxd3 [White recaptures with the queen.] 10...Qc7 [Black develops the queen and prepares to castle.] 11.Bd2 [White develops the bishop.] 11...Ngf6 [Black develops the knight.] 12.O-O-O [White castles queenside.]",
//   'french defense':
//     "1.e4 e6 [French Defense. A solid and resilient defense.] 2.d4 d5 [Black challenges the center.] 3.Nc3 [The Tarrasch Variation. White develops the knight.] 3...Bb4 [The Winawer Variation. Black pins the knight.] 4.e5 [White advances the pawn, gaining space.] 4...c5 [Black attacks the center.] 5.a3 [White challenges the pin.] 5...Bxc3+ [Black exchanges the bishop for the knight.] 6.bxc3 [White recaptures with the pawn, creating a pawn majority on the queenside.] 6...Ne7 [Black develops the knight, preparing to challenge White's center.] 7.Qg4 [White attacks the g7 pawn.] 7...Qc7 [Black defends g7 and develops the queen.] 8.Qxg7 [White takes the pawn.] 8...Rg8 [Black attacks the queen.] 9.Qxh7 [White retreats the queen.] 9...cxd4 [Black opens the c-file.] 10.Ne2 [White develops the knight.] 10...Nbc6 [Black develops the knight.] 11.f4 [White reinforces the e5 pawn.]",
//   'ruy lopez':
//     '1.e4 e5 2.Nf3 Nc6 3.Bb5 [Ruy Lopez. One of the oldest and most respected openings.] 3...a6 [The Morphy Defense. The most popular reply, forcing the bishop to decide.] 4.Ba4 [White retreats the bishop, maintaining the pin.] 4...Nf6 [Black develops the knight and attacks e4.] 5.O-O [White castles, getting the king to safety.] 5...Be7 [The Closed Ruy Lopez. Black prepares to castle.] 6.Re1 [White puts the rook on the semi-open e-file.] 6...b5 [Black attacks the bishop.] 7.Bb3 [White retreats the bishop.] 7...d6 [Black solidifies the center.] 8.c3 [White prepares to play d4.] 8...O-O [Black castles.] 9.h3 [White prevents ...Bg4.] 9...Na5 [Black attacks the bishop, known as the Chigorin Variation.] 10.Bc2 [White retreats the bishop.] 10...c5 [Black attacks the center.] 11.d4 [White opens the center.] 11...Qc7 [Black develops the queen.] 12.Nbd2 [White develops the knight.]',
//   'italian game':
//     "1.e4 e5 2.Nf3 Nc6 3.Bc4 [Italian Game. A classical opening focusing on quick development and control of the center.] 3...Bc5 [The Giuoco Piano. Black mirrors White's development.] 4.c3 [The Italian Gambit. White prepares to play d4.] 4...Nf6 [Black develops the knight and attacks e4.] 5.d4 [White opens the center.] 5...exd4 [Black exchanges the central pawn.] 6.cxd4 [White recaptures the pawn.] 6...Bb4+ [Black checks, forcing White to block.] 7.Nc3 [White develops the knight and blocks the check.] 7...Nxe4 [Black takes the pawn, known as the Møller Attack.] 8.O-O [White castles.] 8...Bxc3 [Black exchanges the bishop for the knight.] 9.bxc3 [White recaptures with the pawn.] 9...d5 [Black attacks the bishop and opens the center.] 10.Ba3 [White pins the d-pawn.] 10...Be6 [Black develops the bishop.]",
//   'pirc defense':
//     '1.e4 d6 2.d4 Nf6 3.Nc3 g6 [Pirc Defense. A hypermodern defense where Black allows White to build a large center.] 4.Nf3 [White develops the knight.] 4...Bg7 [Black develops the bishop, fianchettoing it.] 5.Be2 [White develops the bishop in a solid setup.] 5...O-O [Black castles.] 6.O-O [White castles.] 6...c6 [Black prepares ...Qc7 and ...b5.] 7.a4 [White prevents ...b5.] 7...Nbd7 [Black develops the knight.] 8.Be3 [White develops the bishop.] 8...Qc7 [Black develops the queen.] 9.Qd2 [White connects the rooks.] 9...e5 [Black challenges the center.] 10.dxe5 [White exchanges the central pawn.] 10...dxe5 [Black recaptures with the pawn.] 11.Rad1 [White puts the rook on the semi-open d-file.]',
//   "queen's gambit declined":
//     "1.d4 d5 2.c4 e6 [Queen's Gambit Declined. A classical and solid defense.] 3.Nc3 [White develops the knight.] 3...Nf6 [Black develops the knight and attacks c4.] 4.cxd5 [White exchanges the c-pawn for the d-pawn.] 4...exd5 [Black recaptures with the pawn, keeping the center closed.] 5.Bg5 [The Cambridge Springs Variation is a possibility, but this is the main line. White develops the bishop and pins the knight.] 5...Be7 [Black unpins the knight and prepares to castle.] 6.e3 [White supports the d4 pawn.] 6...O-O [Black castles.] 7.Nf3 [White develops the knight.] 7...Nbd7 [Black develops the knight, supporting the center.] 8.Bd3 [White develops the bishop.] 8...c6 [Black solidifies the center and prepares ...Re8.] 9.O-O [White castles.] 9...Re8 [Black puts the rook on the e-file.] 10.Qc2 [White develops the queen.]",
//   'english opening':
//     '1.c4 [English Opening. A flexible opening that can transpose into many other openings.] 1...e5 [The most common reply, challenging the center.] 2.Nc3 [White develops the knight.] 2...Nf6 [Black develops the knight and attacks e4.] 3.Nf3 [White develops the knight.] 3...Nc6 [Black develops the knight.] 4.g3 [The Reversed Sicilian. White prepares to fianchetto the bishop.] 4...Bc5 [Black develops the bishop, controlling the center.] 5.Bg2 [White develops the bishop, fianchettoing it.] 5...d6 [Black solidifies the center.] 6.O-O [White castles.] 6...O-O [Black castles.] 7.d3 [White solidifies the center.] 7...h6 [Black prevents Ng5.] 8.e3 [White prepares to develop the kingside pieces.] 8...Be6 [Black develops the bishop.]',
//   'sicilian najdorf':
//     "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 [Sicilian Najdorf. One of the most complex and respected openings.] 6.Be3 [The English Attack. White prepares to castle queenside and launch a kingside attack.] 6...e5 [Black challenges the knight on d4.] 7.Nb3 [White retreats the knight.] 7...Be6 [Black develops the bishop.] 8.f3 [White reinforces the e4 pawn and prepares g4.] 8...Be7 [Black develops the bishop and prepares to castle.] 9.Qd2 [White connects the rooks and prepares to castle queenside.] 9...O-O [Black castles.] 10.O-O-O [White castles queenside.] 10...Nbd7 [Black develops the knight, preparing to challenge White's control of the center.] 11.g4 [White begins the kingside attack.] 11...b5 [Black initiates a queenside counter-attack.]",
//   'open sicilian':
//     '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 [The Open Sicilian. Leads to sharp and complex positions.] 6.Be3 [White develops the bishop.] 6...e6 [Black prepares ...Be7.] 7.f3 [White prepares to castle queenside and supports the center.] 7...b5 [Black attacks the c3 knight and prepares a queenside assault.] 8.Qd2 [White develops the queen.] 8...Bb7 [Black develops the bishop, controlling the long diagonal.] 9.O-O-O [White castles queenside.] 9...Be7 [Black develops the bishop and prepares to castle.] 10.g4 [White launches a kingside attack.] 10...h6 [Black prevents Ng5.] 11.h4 [White continues the kingside attack.] 11...Nbd7 [Black develops the knight.] 12.Kb1 [White moves the king to a safer square.]',
//   'sicilian dragon':
//     '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 g6 [Sicilian Dragon. Black fianchettoes the dark-squared bishop, creating a powerful attacking piece.] 6.Be3 [The Yugoslav Attack. White prepares to castle queenside and launch a kingside attack.] 6...Bg7 [Black develops the bishop.] 7.f3 [White reinforces the e4 pawn.] 7...O-O [Black castles.] 8.Qd2 [White develops the queen.] 8...Nc6 [Black develops the knight.] 9.O-O-O [White castles queenside.] 9...d5 [Black challenges the center.] 10.exd5 [White exchanges the central pawn.] 10...Nxd5 [Black recaptures with the knight.] 11.Nxc6 [White exchanges the knights.] 11...bxc6 [Black recaptures with the pawn, opening the b-file for the rook.] 12.Bd4 [White develops the bishop and controls the d4 square.] 12...e5 [Black attacks the bishop and opens the position for the g7 bishop.] 13.Bc5 [White moves the bishop, maintaining the pin on the f8 rook.]',
//   'sicilian kan':
//     "1.e4 c5 2.Nf3 e6 3.d4 cxd4 4.Nxd4 a6 [Sicilian Kan. A flexible and solid system for Black.] 5.Bd3 [White develops the bishop.] 5...Bc5 [Black develops the bishop, controlling the center.] 6.Nb3 [White attacks the bishop.] 6...Be7 [Black retreats the bishop.] 7.c4 [White solidifies the center and prepares to control the d5 square.] 7...Nf6 [Black develops the knight.] 8.Nc3 [White develops the knight.] 8...d6 [Black solidifies the center.] 9.O-O [White castles.] 9...Nbd7 [Black develops the knight.] 10.f4 [White begins a kingside attack and challenges Black's control of e5.] 10...O-O [Black castles.] 11.Be3 [White develops the bishop.] 11...Qc7 [Black develops the queen and connects the rooks.]",
//   'sicilian four knights':
//     '1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 e6 [Sicilian Four Knights. A positional variation.] 6.Ndb5 [White attacks d6.] 6...d6 [Black defends the pawn.] 7.Bf4 [White develops the bishop.] 7...e5 [Black attacks the knight.] 8.Ng3 [The knight retreats.] 8...Be7 [Black prepares to castle.] 9.Bd3 [White develops the bishop.] 9...O-O [Black castles.] 10.O-O [White castles.] 10...Be6 [Black develops the bishop.]',
//   'closed sicilian':
//     '1.e4 c5 2.Nc3 [Closed Sicilian. White plays Nc3 instead of d4.] 2...Nc6 [Black develops the knight.] 3.g3 [White prepares a fianchetto.] 3...g6 [Black responds with their own fianchetto.] 4.Bg2 [White develops the bishop.] 4...Bg7 [Black develops the bishop.] 5.d3 [White solidifies the center.] 5...d6 [Black solidifies the center.] 6.f4 [White begins a kingside attack.] 6...e5 [Black fights for the center.] 7.Nf3 [White develops the knight.] 7...Nf6 [Black develops the knight.] 8.O-O [White castles.] 8...O-O [Black castles.] 9.Be3 [White develops the bishop.] 9...exf4 [Black exchanges in the center.]',
//   'grand prix attack':
//     '1.e4 c5 2.Nc3 Nc6 3.f4 [Grand Prix Attack. White wants a quick kingside attack.] 3...g6 [Black prepares a fianchetto.] 4.Nf3 [White develops the knight.] 4...Bg7 [Black develops the bishop.] 5.Bc4 [White develops the bishop, aiming at f7.] 5...d6 [Black defends the pawn.] 6.d3 [White solidifies the center.] 6...e6 [Black prepares ...Nge7.] 7.O-O [White castles.] 7...Nge7 [Black develops the knight.] 8.f5 [White begins the attack.] 8...exf5 [Black takes the pawn.] 9.exf5 [White takes back the pawn.] 9...gxf5 [Black takes back the pawn.]',
//   'smith-morra gambit':
//     '1.d4 c5 2.e4 [White transposes to a Sicilian Defense.] 2...cxd4 3.c3 [Smith-Morra Gambit. White sacrifices a pawn for development.] 3...dxc3 [Black takes the pawn.] 4.Nxc3 [White recaptures the pawn and has fast development.] 4...Nc6 [Black develops the knight.] 5.Nf3 [White develops the knight.] 5...d6 [Black solidifies the center.] 6.Bc4 [White develops the bishop, aiming at f7.] 6...e6 [Black prepares ...Nf6.] 7.O-O [White castles.] 7...Nf6 [Black develops the knight.] 8.Qe2 [White develops the queen.] 8...Be7 [Black prepares to castle.] 9.Rd1 [White controls the d-file.] 9...O-O [Black castles.] 10.Bf4 [White develops the bishop.]',
//   "king's gambit":
//     "1.e4 e5 2.f4 [King's Gambit. White offers a pawn for an attack.] 2...exf4 [Accepted Gambit. Black takes the pawn.] 3.Nf3 [White develops the knight and attacks f4.] 3...g5 [Black defends the pawn.] 4.h4 [White attacks g5.] 4...g4 [Black attacks the knight.] 5.Ne5 [White sacrifices the knight.] 5...Nf6 [Black develops the knight and attacks e5.] 6.Bc4 [White develops the bishop, aiming at f7.] 6...d5 [Black attacks the bishop.] 7.exd5 [White takes the pawn.] 7...Bg7 [Black develops the bishop.] 8.O-O [White castles.] 8...O-O [Black castles.] 9.d4 [White occupies the center.] 9...Nxd5 [Black takes the pawn.]",
//   'vienna game':
//     "1.e4 e5 2.Nc3 [Vienna Game. White develops the knight and prepares f4.] 2...Nf6 [Black develops the knight and attacks e4.] 3.f4 [White plays a King's Gambit.] 3...d5 [Black attacks the center.] 4.fxe5 [White takes the pawn.] 4...Nxe4 [Black takes the pawn.] 5.Nf3 [White develops the knight.] 5...Be7 [Black develops the bishop.] 6.d4 [White occupies the center.] 6...O-O [Black castles.] 7.Bd3 [White develops the bishop.] 7...Nxc3 [Black exchanges the knights.] 8.bxc3 [White recaptures the knight.] 8...c5 [Black attacks the center.] 9.O-O [White castles.] 9...Nc6 [Black develops the knight.]",
//   'alekhine defense':
//     "1.e4 Nf6 [Alekhine's Defense. Black immediately attacks e4.] 2.e5 [White advances the pawn.] 2...Nd5 [Black retreats the knight.] 3.d4 [White occupies the center.] 3...d6 [Black attacks e5.] 4.c4 [White attacks the knight.] 4...Nb6 [Black retreats the knight.] 5.exd6 [White exchanges the pawns.] 5...exd6 [Black recaptures the pawn.] 6.Nc3 [White develops the knight.] 6...Be7 [Black develops the bishop.] 7.Bd3 [White develops the bishop.] 7...O-O [Black castles.] 8.Nge2 [White develops the knight.] 8...c5 [Black attacks the center.] 9.O-O [White castles.] 9...Nc6 [Black develops the knight.]",
//   'modern defense':
//     '1.e4 g6 [Modern Defense. Black plays ...g6, waiting for White.] 2.d4 [White occupies the center.] 2...Bg7 [Black develops the bishop.] 3.Nc3 [White develops the knight.] 3...d6 [Black solidifies the center.] 4.Be3 [White develops the bishop.] 4...Nf6 [Black develops the knight.] 5.Qd2 [White connects the pieces.] 5...c6 [Black prepares ...b5.] 6.f3 [White reinforces the center.] 6...Nbd7 [Black develops the knight.] 7.Bd3 [White develops the bishop.] 7...O-O [Black castles.] 8.O-O [White castles.] 8...e5 [Black fights for the center.] 9.dxe5 [White exchanges in the center.] 9...dxe5 [Black recaptures the pawn.]',
//   'scotch game':
//     '1.e4 e5 2.Nf3 Nc6 3.d4 [Scotch Game. White immediately opens the center.] 3...exd4 [Black takes the pawn.] 4.Nxd4 [White recaptures the pawn.] 4...Nf6 [Black develops the knight and attacks d4.] 5.Nxc6 [White exchanges the knights.] 5...bxc6 [Black recaptures the knight.] 6.e5 [White attacks the knight.] 6...Qe7 [Black develops the queen and attacks e5.] 7.Qe2 [White defends the pawn.] 7...Nd5 [Black develops the knight.] 8.c4 [White attacks the knight.] 8...Nb6 [Black retreats the knight.] 9.Nd2 [White develops the knight.] 9...Qe6 [Black puts pressure on c4.] 10.Nb3 [White develops the knight.]',
//   "queen's gambit accepted":
//     "1.d4 d5 2.c4 dxc4 [Queen's Gambit Accepted. Black takes the pawn.] 3.e4 [White occupies the center.] 3...e5 [Black fights for the center.] 4.Nf3 [White develops the knight.] 4...Nc6 [Black develops the knight.] 5.Bxc4 [White develops the bishop and recaptures the pawn.] 5...Nf6 [Black develops the knight.] 6.O-O [White castles.] 6...Be7 [Black prepares to castle.] 7.Nc3 [White develops the knight.] 7...Be6 [Black develops the bishop and attacks the bishop.] 8.Be2 [White retreats the bishop.] 8...O-O [Black castles.] 9.h3 [White prevents ...Bg4.] 9...Qd7 [Black develops the queen.]",
//   'grunfeld defense':
//     '1.d4 Nf6 2.c4 g6 3.Nc3 d5 [Grünfeld Defense. Black allows White a center but immediately attacks it.] 4.cxd5 [White exchanges in the center.] 4...Nxd5 [Black recaptures with the knight.] 5.e4 [White occupies the center.] 5...Nxc3 [Black exchanges the knights.] 6.bxc3 [White recaptures the knight.] 6...Bg7 [Black develops the bishop, pressuring the center.] 7.Bc4 [White develops the bishop.] 7...c5 [Black attacks the center.] 8.Ne2 [White develops the knight.] 8...Nc6 [Black develops the knight.] 9.O-O [White castles.] 9...O-O [Black castles.] 10.Be3 [White develops the bishop.]',
//   'nimzo-indian defense':
//     '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 [Nimzo-Indian Defense. Black pins the knight.] 4.e3 [White solidifies the center.] 4...c5 [Black attacks the center.] 5.Bd3 [White develops the bishop.] 5...Nc6 [Black develops the knight.] 6.Nf3 [White develops the knight.] 6...O-O [Black castles.] 7.O-O [White castles.] 7...d5 [Black occupies the center.] 8.a3 [White forces Black to resolve the pin.] 8...Bxc3 [Black exchanges the bishop for the knight.] 9.bxc3 [White recaptures the bishop.] 9...dxc4 [Black exchanges in the center.] 10.Bxc4 [White recaptures the pawn.]',
//   "queen's indian defense":
//     "1.d4 Nf6 2.c4 e6 3.Nf3 b6 [Queen's Indian Defense. Black prepares ...Bb7.] 4.g3 [White prepares a fianchetto.] 4...Bb7 [Black develops the bishop, controlling e4.] 5.Bg2 [White develops the bishop.] 5...Be7 [Black prepares to castle.] 6.O-O [White castles.] 6...O-O [Black castles.] 7.Nc3 [White develops the knight.] 7...Ne4 [Black occupies e4.] 8.Qc2 [White develops the queen and attacks e4.] 8...Nxc3 [Black exchanges the knights.] 9.Qxc3 [White recaptures the knight.] 9...f5 [Black begins a kingside attack.] 10.d5 [White attacks in the center.]",
//   'reti opening':
//     '1.Nf3 d5 2.c4 [Réti Opening. White controls the center from the flank.] 2...e6 [Black prepares ...Nf6.] 3.g3 [White prepares a fianchetto.] 3...Nf6 [Black develops the knight.] 4.Bg2 [White develops the bishop.] 4...c5 [Black attacks the center.] 5.cxd5 [White exchanges in the center.] 5...Nxd5 [Black recaptures with the knight.] 6.O-O [White castles.] 6...Nc6 [Black develops the knight.] 7.d4 [White occupies the center.] 7...cxd4 [Black exchanges in the center.] 8.Nxd4 [White recaptures the pawn.] 8...Nc7 [Black retreats the knight.] 9.Nc3 [White develops the knight.] 9...Bd6 [Black develops the bishop.]',
//   'benoni defense':
//     '1.d4 Nf6 2.c4 c5 3.d5 [Benoni Defense. White closes the center.] 3...e6 [Black attacks d5.] 4.Nc3 [White develops the knight.] 4...exd5 [Black exchanges in the center.] 5.cxd5 [White recaptures the pawn.] 5...d6 [Black solidifies the center.] 6.Nf3 [White develops the knight.] 6...g6 [Black prepares a fianchetto.] 7.e4 [White occupies the center.] 7...Bg7 [Black develops the bishop.] 8.Bb5+ [White checks the king.] 8...Nbd7 [Black develops the knight and blocks the check.] 9.Bd3 [White develops the bishop.] 9...O-O [Black castles.] 10.O-O [White castles.]',
//   'dutch defense':
//     '1.d4 f5 [Dutch Defense. Black fights for the initiative.] 2.c4 [White occupies the center.] 2...Nf6 [Black develops the knight.] 3.g3 [White prepares a fianchetto.] 3...e6 [Black prepares ...Be7.] 4.Bg2 [White develops the bishop.] 4...Be7 [Black prepares to castle.] 5.Nf3 [White develops the knight.] 5...O-O [Black castles.] 6.O-O [White castles.] 6...d5 [Black occupies the center.] 7.Nc3 [White develops the knight.] 7...c6 [Black solidifies the center.] 8.Qc2 [White develops the queen.] 8...Ne4 [Black occupies e4.] 9.Bd2 [White develops the bishop.] 9...Nd7 [Black develops the knight.]',
//   'colle system':
//     '1.d4 d5 2.Nf3 Nf6 3.e3 [Colle System. White builds a solid position.] 3...e6 [Black prepares ...Be7.] 4.Bd3 [White develops the bishop.] 4...c5 [Black attacks the center.] 5.c3 [White solidifies the center.] 5...Nbd7 [Black develops the knight.] 6.Nbd2 [White develops the knight.] 6...Bd6 [Black develops the bishop.] 7.O-O [White castles.] 7...O-O [Black castles.] 8.Re1 [White controls the e-file.] 8...Qe7 [Black develops the queen.] 9.e4 [White begins an attack in the center.] 9...cxd4 [Black exchanges in the center.] 10.cxd4 [White recaptures the pawn.]',
//   'trompowsky attack':
//     '1.d4 Nf6 2.Bg5 [Trompowsky Attack. An aggressive move that avoids theory.] 2...Ne4 [The best reply. Black attacks the bishop.] 3.Bf4 [White retreats the bishop.] 3...c5 [Black attacks the center.] 4.d5 [White advances the pawn.] 4...Qb6 [Black develops the queen and attacks b2.] 5.Qc1 [White defends the pawn.] 5...Nc6 [Black develops the knight.] 6.Nf3 [White develops the knight.] 6...e6 [Black attacks d5.] 7.e3 [White solidifies the center.] 7...Be7 [Black prepares to castle.] 8.Be2 [White develops the bishop.] 8...O-O [Black castles.]',
//   'bogo-indian defense':
//     '1.d4 Nf6 2.c4 e6 3.Nf3 Bb4+ [Bogo-Indian Defense. Black checks the king.] 4.Nbd2 [The most common reply. White develops the knight.] 4...b6 [Black prepares ...Bb7.] 5.g3 [White prepares a fianchetto.] 5...Bb7 [Black develops the bishop.] 6.Bg2 [White develops the bishop.] 6...O-O [Black castles.] 7.O-O [White castles.] 7...d5 [Black occupies the center.] 8.cxd5 [White exchanges in the center.] 8...Nxd5 [Black recaptures with the knight.] 9.Qe2 [White develops the queen.] 9...Nc6 [Black develops the knight.] 10.Rd1 [White controls the d-file.]',
//   'budapest gambit':
//     '1.d4 Nf6 2.c4 e5 [Budapest Gambit. Black sacrifices a pawn for development.] 3.dxe5 [White takes the pawn.] 3...Ng4 [Black attacks e5.] 4.Bf4 [White develops the bishop and defends the pawn.] 4...Nc6 [Black develops the knight.] 5.Nf3 [White develops the knight.] 5...Bb4+ [Black checks the king.] 6.Nbd2 [White develops the knight and blocks the check.] 6...Qe7 [Black develops the queen and puts pressure on e5.] 7.a3 [White forces Black to resolve the pin.] 7...Bxd2+ [Black exchanges the bishop for the knight.] 8.Qxd2 [White recaptures with the queen.] 8...Nxe5 [Black takes the pawn.] 9.Nxe5 [White exchanges the knights.] 9...Qxe5 [Black recaptures with the queen.]',
//   'evans gambit':
//     '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4 [Evans Gambit. White sacrifices a pawn for development.] 4...Bxb4 [Black takes the pawn.] 5.c3 [White prepares d4.] 5...Ba5 [Black retreats the bishop, attacking c3.] 6.d4 [White opens the center.] 6...exd4 [Black takes the pawn.] 7.O-O [White castles, sacrificing a pawn.] 7...d6 [Black gives back the pawn.] 8.cxd4 [White recaptures the pawn.] 8...Bb6 [Black retreats the bishop.] 9.Nc3 [White develops the knight.] 9...Nf6 [Black develops the knight.]',
//   'two knights defense':
//     '1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 [Two Knights Defense. Black attacks e4.] 4.Ng5 [The aggressive variation. White attacks f7.] 4...d5 [Black sacrifices a pawn for development.] 5.exd5 [White takes the pawn.] 5...Na5 [Black attacks the bishop.] 6.Bb5+ [White checks the king.] 6...c6 [Black blocks the check.] 7.dxc6 [White takes the pawn.] 7...bxc6 [Black recaptures the pawn.] 8.Be2 [White retreats the bishop.] 8...h6 [Black attacks the knight.] 9.Nf3 [White retreats the knight.] 9...e4 [Black attacks the knight.]',
//   'four knights game':
//     '1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6 [Four Knights Game. A quiet, positional game.] 4.Bb5 [White develops the bishop and pins the knight.] 4...Bb4 [Black returns the pin.] 5.O-O [White castles.] 5...O-O [Black castles.] 6.d3 [White solidifies the center.] 6...d6 [Black solidifies the center.] 7.Bg5 [White pins the knight.] 7...Bxc3 [Black exchanges the bishops.] 8.bxc3 [White recaptures the bishop.] 8...Qe7 [Black develops the queen.] 9.Re1 [White controls the e-file.] 9...Nd8 [Black retreats the knight, preparing ...Ne6.]',
//   'sveshnikov variation':
//     "1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 e5 [Sveshnikov Variation. A sharp line.] 6.Ndb5 [White attacks d6.] 6...d6 [Black defends the pawn.] 7.Bg5 [White pins the knight.] 7...a6 [Black attacks the knight.] 8.Na3 [White retreats the knight to an unusual square.] 8...b5 [Black attacks a3.] 9.Bxf6 [White exchanges the knights.] 9...gxf6 [Black recaptures with the pawn, weakening the kingside but opening lines for an attack.] 10.Nd5 [White's knight comes to a strong square.] 10...f5 [Black begins a counter-attack.]",
//   'accelerated dragon':
//     '1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 g6 [Accelerated Dragon. Black wants to develop the g7 bishop faster.] 5.c4 [White plays the Maróczy Bind.] 5...Bg7 [Black develops the bishop.] 6.Be3 [White develops the bishop.] 6...Nf6 [Black develops the knight.] 7.Nc3 [White develops the knight.] 7...Ng4 [Black attacks the bishop.] 8.Qxg4 [White takes the knight.] 8...Nxd4 [Black takes the knight.] 9.Qd1 [White retreats the queen.] 9...e5 [Black fights for the center.] 10.Nb3 [White retreats the knight.] 10...Be6 [Black develops the bishop.]',
//   'maroczy bind':
//     '1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 g6 5.c4 [Maróczy Bind. White establishes strong central control.] 5...Bg7 [Black develops the bishop.] 6.Be3 [White develops the bishop.] 6...Nf6 [Black develops the knight.] 7.Nc3 [White develops the knight.] 7...O-O [Black castles.] 8.Be2 [White develops the bishop.] 8...Nxd4 [Black exchanges the knights.] 9.Bxd4 [White recaptures with the bishop.] 9...Bxd4 [Black exchanges the bishops.] 10.Qxd4 [White recaptures with the queen.]',
//   'winawer variation':
//     '1.e4 e6 2.d4 d5 3.Nc3 Bb4 [Winawer Variation. The sharpest line of the French.] 4.e5 [White advances the pawn.] 4...c5 [Black attacks the center.] 5.a3 [White forces Black to resolve the pin.] 5...Bxc3+ [Black exchanges the bishop for the knight.] 6.bxc3 [White recaptures the bishop.] 6...Ne7 [Black develops the knight, preparing ...Nf5.] 7.Qg4 [White attacks g7.] 7...Qc7 [Black defends g7 and develops the queen.] 8.Qxg7 [White takes the pawn.] 8...Rg8 [Black attacks the queen.] 9.Qxh7 [White retreats the queen.] 9...cxd4 [Black exchanges in the center.] 10.Ne2 [White develops the knight.]',
//   'marshall attack':
//     '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 O-O 8.c3 d5 [Marshall Attack. Black sacrifices a pawn for a sharp attack.] 9.exd5 [White takes the pawn.] 9...Nxd4 [Black sacrifices the knight.] 10.cxd4 [White takes the knight.] 10...e4 [Black attacks the knight.] 11.Nd2 [White retreats the knight.] 11...f5 [Black continues the attack.] 12.Nf3 [White develops the knight.] 12...Qh4 [Black develops the queen, increasing the pressure.]',
//   'panov-botvinnik attack':
//     '1.e4 c6 2.d4 d5 3.exd5 cxd5 4.c4 [Panov-Botvinnik Attack. White creates an isolated pawn on d4.] 4...Nf6 [Black develops the knight.] 5.Nc3 [White develops the knight.] 5...e6 [Black prepares ...Bd6.] 6.Nf3 [White develops the knight.] 6...Bb4 [Black pins the knight.] 7.cxd5 [White exchanges in the center.] 7...Nxd5 [Black recaptures with the knight.] 8.Bd3 [White develops the bishop.] 8...O-O [Black castles.] 9.O-O [White castles.] 9...Nc6 [Black develops the knight.]',
//   'advance variation':
//     '1.e4 e6 2.d4 d5 3.e5 [Advance Variation. White fixes the center.] 3...c5 [Black attacks the pawn chain.] 4.c3 [White solidifies the center.] 4...Nc6 [Black develops the knight.] 5.Nf3 [White develops the knight.] 5...Qb6 [Black develops the queen and attacks b2.] 6.Bd3 [White develops the bishop.] 6...Bd7 [Black develops the bishop.] 7.O-O [White castles.] 7...Nge7 [Black develops the knight, preparing ...Nf5.] 8.Na3 [White develops the knight, aiming for c4.] 8...cxd4 [Black exchanges in the center.] 9.cxd4 [White recaptures the pawn.]',
// };

export async function getOpeningFromAiByName(
  openingName: string,
  previousMessageId: string = ''
): Promise<{ name: string; pgn: string; ideas: string } | null> {
  if (!openingName?.trim()) return null;
  const prompt = `You are a chess coach. The user wants to learn the opening called "${openingName.trim()}".

Reply with exactly two parts separated by a line containing only "---".

Part 1 - PGN: Give only the main line of this opening in standard PGN format (e.g. [Event "?"]\n[Site "?"]\n\n1. e4 e5 2. Nf3 Nc6 ...). Use 6–12 half-moves.

Part 2 - Basic ideas: The same line with brief move-by-move comments in this exact format:
1.e4 e5 [short comment] 2.Nf3 [short comment] ...
Use the format: move [comment]. No other text.`;
  console.log('getOpeningFromAiByName', openingName);
  const data = await ai_prompt(prompt, previousMessageId, 'gpt-5.1');
  const text = data?.answer?.text;
  if (!text?.trim()) return null;

  const parts = text.split(/\n---\n/).map((s: string) => s.trim());
  const pgnPart = parts[0]?.replace(/^Part 1[^\n]*\n?/i, '').trim() || '';
  const ideasPart = parts[1]?.replace(/^Part 2[^\n]*\n?/i, '').trim() || '';

  const pgnMatch = pgnPart.match(/(\d+\.\s+[^\n]+(?:\s+\d+\.\s+[^\n]+)*)/);
  const pgn = pgnMatch ? pgnMatch[1].trim() : pgnPart;
  if (!pgn || !ideasPart) return null;

  const name = openingName.trim().replace(/\b\w/g, (c) => c.toUpperCase());

  return { name, pgn: `[Event "?"]\n[Site "?"]\n\n${pgn}`, ideas: ideasPart };
}

// export function getOpeningByUserInput(
//   userText: string
// ): { name: string; pgn: string } | null {
//   console.log('getOpeningByUserInput', userText);
//   const normalized = normalizeOpeningName(userText);
//   if (!normalized || normalized.length < 2) return null;
//   const keys = Object.keys(OPENING_IDEAS).sort((a, b) => b.length - a.length);
//   for (const key of keys) {
//     const userWantsOpening =
//       normalized.includes(key) ||
//       key.includes(normalized) ||
//       normalized.includes(key.replace(/-/g, ' ')) ||
//       key.replace(/-/g, ' ').includes(normalized);
//     if (!userWantsOpening) continue;
//     const ideas = OPENING_IDEAS[key];
//     if (!ideas) continue;
//     let pgn = buildLoadablePgnFromIdeas(ideas);
//     if (!pgn?.trim()) {
//       pgn = buildPgnFromMessageContent(ideas);
//     }
//     if (!pgn || !pgn.trim()) {
//       const simple = ideas.match(/(\d+\.\s*(?:[^\s\[\]]+\s*)+)/g);
//       if (!simple?.length) continue;
//       const oneLine = simple.slice(0, 6).join(' ').replace(/\s+/g, ' ').trim();
//       if (!oneLine) continue;
//       const fallbackPgn = `[Event "?"]\n[Site "?"]\n\n${oneLine}`;
//       const name = key.replace(/\b\w/g, (c) => c.toUpperCase());
//       return { name, pgn: fallbackPgn };
//     }
//     const name = key.replace(/\b\w/g, (c) => c.toUpperCase());
//     return { name, pgn };
//   }
//   return null;
// }

const OPENING_REQUEST_PREFIXES = [
  'show me the ',
  'show me ',
  'play the ',
  'play ',
  'i want to play ',
  'i want to learn ',
  "let's play ",
  "let's do ",
  'can we play ',
  'teach me ',
  'learn ',
  'give me ',
  'open with ',
  'opening: ',
  'i want ',
  'want to play ',
  'want to learn ',
  'try ',
  'the ',
];

/** Ako poruka zvuči kao zahtev za otvaranje (npr. "show me the Italian game"), izvuče naziv otvaranja za AI. */
// export function extractOpeningNameFromPhrase(text: string): string | null {
//   const normalized = normalizeOpeningName(text);
//   if (!normalized || normalized.length < 3) return null;
//   let candidate = normalized;
//   for (const prefix of OPENING_REQUEST_PREFIXES) {
//     if (candidate.startsWith(prefix)) {
//       candidate = candidate.slice(prefix.length).trim();
//       break;
//     }
//   }
//   const suffix = ' opening';
//   if (candidate.endsWith(suffix))
//     candidate = candidate.slice(0, -suffix.length).trim();
//   if (candidate.endsWith(' please')) candidate = candidate.slice(0, -7).trim();
//   if (candidate.length >= 2 && candidate.length <= 80) return candidate;
//   return null;
// }

// export async function getOpeningCommentFromAi(
//   pgn: string,
//   previousMessageId: string = ''
// ): Promise<string | null> {
//   if (!pgn?.trim()) return null;
//   const prompt = `Comment the following chess opening PGN with brief move-by-move ideas. Use the format: move [comment]. Example: 1.e4 e5 [King's pawn. Black mirrors.] 2.Nf3 [Develop knight.]. Reply only with the commented line.\n\nPGN:\n${pgn.trim()}`;
//   const data = await ai_prompt(prompt, previousMessageId, 'gpt-5.1');
//   if (!data?.answer?.text) return null;
//   return data.answer.text;
// }

// function normalizeOpeningName(name: string): string {
//   return name.toLowerCase().replace(/\s+/g, ' ').trim();
// }

/** Vraća kratak opis osnovnih ideja otvaranja za dati naziv, ili null ako nema unosa. */
// export function getOpeningIdeas(openingName: string): string | null {
//   const normalized = normalizeOpeningName(openingName);
//   if (!normalized) return null;

//   if (OPENING_IDEAS[normalized]) {
//     console.log('OPENING_IDEAS[normalized]', OPENING_IDEAS[normalized]);
//     return OPENING_IDEAS[normalized];
//   }
//   for (const key of Object.keys(OPENING_IDEAS)) {
//     if (normalized.includes(key) || key.includes(normalized)) {
//       console.log('OPENING_IDEAS[key]', OPENING_IDEAS[key]);
//       return OPENING_IDEAS[key];
//     }
//   }
//   return null;
// }

const LICHESS_EXPLORER = 'https://explorer.lichess.ovh';

const OUTPOST_NEXT_MOVES_API =
  process.env.NEXT_PUBLIC_API_WEB + '/chess_next_moves';

export type OutpostNextMoveRaw = { next: string; opening: string; cnt: string };

/** Fetch next moves for a position from Outpost API. moves = space-separated UCI. */
export async function getOutpostNextMoves(
  uciMoves: string
): Promise<OutpostNextMoveRaw[]> {
  try {
    const encoded = encodeURIComponent(uciMoves.trim());
    const url = `${OUTPOST_NEXT_MOVES_API}?moves=${encoded}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('Outpost next moves error', e);
    return [];
  }
}

export type OutpostSuggestion = {
  uci: string;
  san: string;
  opening: string;
  cnt: number;
};

function extractNextUciFromLine(
  nextLine: string,
  currentMoveCount: number
): string | null {
  const tokens = nextLine.trim().split(/\s+/).filter(Boolean);
  if (tokens.length <= currentMoveCount) return null;
  const uci = tokens[currentMoveCount];
  return uci && uci.length >= 4 ? normalizeLichessCastlingUci(uci) : null;
}

export function uciToSan(fen: string, uci: string): string {
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promo = uci.length >= 5 ? uci[4] : undefined;
    const move = chess.move({ from, to, promotion: promo as any });
    return move ? move.san : uci;
  } catch {
    return uci;
  }
}

/** Parse API response: one suggestion per line (next move UCI + SAN + opening). */
export function parseOutpostResponseToSuggestions(
  data: OutpostNextMoveRaw[],
  currentUciMoves: string,
  fen: string
): OutpostSuggestion[] {
  const currentCount = currentUciMoves.trim()
    ? currentUciMoves.trim().split(/\s+/).length
    : 0;
  const out: OutpostSuggestion[] = [];
  for (const item of data) {
    const uci = extractNextUciFromLine(item.next, currentCount);
    if (!uci) continue;
    const san = uciToSan(fen, uci);
    const cnt = parseInt(String(item.cnt ?? 0), 10) || 0;
    out.push({ uci, san, opening: item.opening || '', cnt });
  }
  return out;
}

/** If openingKeyword set: matching moves first (by cnt), then the rest. */
export function filterAndOrderByOpening(
  suggestions: OutpostSuggestion[],
  openingKeyword: string | null
): OutpostSuggestion[] {
  if (!openingKeyword?.trim()) {
    return [...suggestions].sort((a, b) => b.cnt - a.cnt);
  }
  const key = openingKeyword.toLowerCase().trim();
  const matching = suggestions.filter((s) =>
    s.opening.toLowerCase().includes(key)
  );
  const rest = suggestions.filter(
    (s) => !s.opening.toLowerCase().includes(key)
  );
  return [
    ...matching.sort((a, b) => b.cnt - a.cnt),
    ...rest.sort((a, b) => b.cnt - a.cnt),
  ];
}

/** Vraća UCI glavnog poteza (najpopularniji u Lichess master bazi) za dati FEN, ili null. */
// export async function getLichessBestMove(fen: string): Promise<string | null> {
//   try {
//     const encoded = encodeURIComponent(fen.trim());
//     const url = `${LICHESS_EXPLORER}/master?fen=${encoded}`;
//     const res = await fetch(url, { method: 'GET' });
//     if (!res.ok) return null;
//     const data = await res.json();
//     const moves = data?.moves;
//     if (!Array.isArray(moves) || moves.length === 0) return null;
//     const first = moves[0];
//     return typeof first?.uci === 'string' ? first.uci : null;
//   } catch (e) {
//     console.warn('Lichess explorer error', e);
//     return null;
//   }
// }

// Define type for top moves if not defined yet.
type LichessExplorerMove = {
  uci: string;
  san: string;
};

export async function getLichessTopMoves(
  fen: string,
  limit: number = 9
): Promise<LichessExplorerMove[]> {
  try {
    const encoded = encodeURIComponent(fen.trim());
    const url = `${LICHESS_EXPLORER}/master?fen=${encoded}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return [];
    const data = await res.json();
    const moves = data?.moves;
    if (!Array.isArray(moves) || moves.length === 0) return [];
    return moves
      .slice(0, limit)
      .map((m: { uci?: string; san?: string }) => {
        const rawUci = typeof m?.uci === 'string' ? m.uci : '';
        const uci = normalizeLichessCastlingUci(rawUci);
        return {
          uci,
          san: typeof m?.san === 'string' ? m.san : m?.uci ?? '',
        };
      })
      .filter((m) => m.uci.length >= 4);
  } catch (e) {
    console.warn('Lichess explorer error', e);
    return [];
  }
}

//ANALYZE MOVES AND GET FREQUENTLY USED
export async function analyzeMovesPGN(uciMoves: string) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + `chess_next_moves?moves=${uciMoves}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error', error);
  }
}

//GET TOKEN
export async function getToken() {
  const token = Cookies.get('sessionToken');
  return token;
}

export async function ai_prompt(
  question: string,
  previusMessageId: string,
  model: string
) {
  const token = Cookies.get('sessionToken');
  const body: Record<string, string> = {
    prompt: question,
    model: model,
    agent_name: 'Opening',
  };
  if (previusMessageId?.trim()) body.previous_response_id = previusMessageId;
  try {
    //ai_prompt_v2r
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + `ai_prompt_agent_v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return data?.message || `Error: ${response.status}`;
    }
    return data;
  } catch (error) {
    console.error('Fetch error', error);
  }
}

export async function getUserInfo() {
  const token = Cookies.get('sessionToken');

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + 'current_user_info',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch error', error);
  }
}
export async function getSubscribeInfo() {
  const token = Cookies.get('sessionToken');

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + 'current_user_subscription',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch error', error);
  }
}
//
let movexUpdateQueue = Promise.resolve();

export function enqueueMovexUpdate<T>(
  updateFn: () => Promise<T> | void
): Promise<void> {
  movexUpdateQueue = movexUpdateQueue
    .then(async () => {
      await updateFn();
      // dispatch() returns void immediately but Movex does async work internally
      // (server roundtrip + syncState). Without this delay all queued dispatches
      // fire in the same event loop tick → "PromiseDelegate is already settled"
      await new Promise<void>((resolve) => setTimeout(resolve, 150));
    })
    .catch((err) => console.error('Error in Movex update:', err));

  return movexUpdateQueue;
}

export async function getWikibooksContent(title: string) {
  console.log('title', title);
  try {
    const url = `https://en.wikibooks.org/w/api.php?titles=${encodeURIComponent(
      title
    )}&action=query&prop=extracts&formatversion=1&format=json&origin=*`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Wikibooks request failed', response.status);
      return null;
    }
    return response.json();
  } catch (error) {
    console.error('Fetch error', error);
    return null;
  }
}
