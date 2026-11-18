import { useEffect, useState, useRef } from 'react';
import { usePlayActionsDispatch } from '../Match/Play/hooks';
import {
  // ChessColor,
  ChessFEN,
  // ShortChessMove,
  // promotionalPieceSanToFenBoardPromotionalPieceSymbol,
  // toLongChessColor,
} from '@xmatter/util-kit';
import { Chess } from 'chess.js';
import { chatBotList } from '../Match/utils';

type StockfishEngineProps = {
  fen: ChessFEN;
  isMyTurn: boolean;
  bot: string;
  botColor: any;
  engineMove: any;
  botType?: string;
  userRating?: number;
  // engineMove: (m: ShortChessMove) => void;
};

// sansa da bot odigra nasumican legalan potez umesto Stockfish poteza
const BOT_MISTAKE_CHANCE: Record<string, number> = {
  zldVhT0HMLRc1000: 0.25, // Yuki
  _TjQM58i13jmm000: 0.12, // Obbina
  '9aEXYS0xwZS21000': 0.03, // Stella
  '-BihTlRZ-SKTL000': 0.01, // Laura
};

// jacina matchFake botova po nivou (1-8), ne zavisi od rejtinga protivnika
const MATCH_FAKE_LEVELS: Record<
  number,
  { skill: number; depth: number; mistake: number }
> = {
  1: { skill: 0, depth: 1, mistake: 0.3 },
  2: { skill: 0, depth: 1, mistake: 0.2 },
  3: { skill: 0, depth: 2, mistake: 0.12 },
  4: { skill: 1, depth: 3, mistake: 0.07 },
  5: { skill: 3, depth: 4, mistake: 0.04 },
  6: { skill: 5, depth: 5, mistake: 0.02 },
  7: { skill: 7, depth: 6, mistake: 0.01 },
  8: { skill: 9, depth: 8, mistake: 0 },
};

const StockfishEngine: React.FC<StockfishEngineProps> = ({
  fen,
  isMyTurn,
  engineMove,
  botColor,
  botType,
  bot,
}) => {
  // const [stockfishOutput, setStockfishOutput] = useState('Initializing...');
  const [bestMove, setBestMove] = useState('');
  const [depth, setDepth] = useState('1');
  const [skill, setSkill] = useState('');
  const [changeAfterMove, setChangeAfterMove] = useState(0);
  const lastPlayedFenRef = useRef<string | null>(null);
  const fenRef = useRef(fen);
  const isMyTurnRef = useRef(isMyTurn);
  useEffect(() => {
    isMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);
  const [score, setScore] = useState('');
  const [contempt, setContempt] = useState('');
  const stockfishRef = useRef<Worker | null>(null);
  const dispatch = usePlayActionsDispatch();
  // Yuki - najslabiji botelja, slabiji od Viole
  const isYuki = bot == 'zldVhT0HMLRc1000';
  // Obbina - jaca od Yukija, slabija od Viole
  const isObbina = bot == '_TjQM58i13jmm000';
  // osnovni nivo matchFake bota; tokom partije se pomera najvise ±1
  const baseLevel =
    botType === 'matchFake'
      ? chatBotList.find((b) => b.id === bot)?.level ?? 4
      : undefined;
  const [level, setLevel] = useState(baseLevel);
  const randomMoveChance =
    level !== undefined
      ? MATCH_FAKE_LEVELS[level].mistake
      : BOT_MISTAKE_CHANCE[bot] ?? 0;


  useEffect(() => {
    if (typeof window === 'undefined') return; // Ensure it's client-side
    if (baseLevel !== undefined) {
      setDepth(String(MATCH_FAKE_LEVELS[baseLevel].depth));
      setSkill(String(MATCH_FAKE_LEVELS[baseLevel].skill));
      setContempt('0');
    } else if (skill == '' && bot) {
      let baseDepth = 2;
      let baseSkill = 1;
      let baseContempt = 10;
      if (skill === '' && bot) {
        if (bot == 'vpHH6Jf7rYKwN010') {
          baseDepth = 6;
          baseSkill = 12;
          baseContempt = 22;
        } else if (bot == 'KdydnDHbBU1JY008') {
          baseDepth = 8;
          baseSkill = 8;
          baseContempt = 18;
        } else if (bot == 'O8kiLgwcKJWy9005') {
          baseDepth = 7;
          baseSkill = 5;
          baseContempt = 15;
        } else if (bot == 'NaNuXa7Ew8Kac002') {
          baseDepth = 5;
          baseSkill = 3;
          baseContempt = 15;
        } else if (bot == '8WCVE7ljCQJTW020') {
          baseDepth = 4;
          baseSkill = 0;
          baseContempt = 12;
        } else if (isYuki || isObbina) {
          baseDepth = 1;
          baseSkill = 0;
          baseContempt = 0;
        } else if (bot == '9yzBb59_POb9L000') {
          baseDepth = 1;
          baseSkill = 0;
          baseContempt = 0;
        } else if (bot == '9aEXYS0xwZS21000') {
          baseDepth = 3;
          baseSkill = 5;
          baseContempt = 5;
        } else if (bot == 'fH0667J9nJ1Ez000') {
          baseDepth = 4;
          baseSkill = 3;
          baseContempt = 4;
        } else if (bot == '-BihTlRZ-SKTL000') {
          baseDepth = 5;
          baseSkill = 6;
          baseContempt = 8;
        } else if (bot == 'Pjdw8gu5kpiRk000') {
          baseDepth = 6;
          baseSkill = 8;
          baseContempt = 6;
        }
        getFinalSkill(baseDepth, baseSkill, baseContempt);
      }
    }

    try {
      const stockfish = new Worker('/stockfish.js');
      stockfishRef.current = stockfish;

      stockfish.onmessage = (event) => {
        // console.log('stockfish data',event.data)

        if (
          typeof event.data === 'string' &&
          event.data.startsWith('bestmove')
        ) {
          setBestMove(event.data.split(' ')[1]);
          // console.log('best move',event.data.split(' ')[1])
        }
        if (
          typeof event.data === 'string' &&
          event.data.startsWith(`info depth ${depth}`)
        ) {
          const cp = event.data.match(/score cp (-?\d+)/)?.[1];

          if (cp) {
            setScore(cp);
          }
        }
        // setStockfishOutput(event.data);
      };

      // stockfish.onerror = () => {
      //   setStockfishOutput('Stockfish error! Check console.');
      // };

      stockfish.postMessage('uci');

      return () => {
        stockfish.terminate();
        stockfishRef.current = null;
      };
    } catch (error) {
      // setStockfishOutput('Failed to load Stockfish.');
    }
  }, []);

  useEffect(() => {
    if (!isMyTurn) {
      return;
    }
    // Yuki i Obbina ne jacaju kad vode
    if (isYuki || isObbina) {
      return;
    }

    const moveNumber = parseInt(fen.split(' ')[5]);
    if (
      ((moveNumber % 5 === 0 && botType == 'matchFake') ||
        (moveNumber % 10 === 0 &&
          (botType == 'botelja' || botType == 'basic'))) &&
      changeAfterMove !== moveNumber
    ) {
      // score je iz ugla korisnika (racuna se dok je on na potezu)
      if (baseLevel !== undefined && level !== undefined) {
        const s = Number(score);
        const step = s > 500 ? 1 : s < -400 ? -1 : 0;
        const newLevel = Math.max(
          Math.max(1, baseLevel - 1),
          Math.min(Math.min(8, baseLevel + 1), level + step)
        );
        if (s > 2000 && moveNumber > 20) {
          setTimeout(() => {
            dispatch({
              type: 'play:resignGame',
              payload: { color: botColor },
            });
          }, 1500);
        }
        setLevel(newLevel);
        setDepth(String(MATCH_FAKE_LEVELS[newLevel].depth));
        setSkill(String(MATCH_FAKE_LEVELS[newLevel].skill));
        setChangeAfterMove(moveNumber);
        return;
      }

      let newDepth = Number(depth);
      let newSkill = Number(skill);
      let newContempt = Number(contempt);

      if (Number(score) > 500 && Number(score) < 800) {
        newDepth += 1;
        newSkill += 1;
        newContempt += 2;
      }

      if (Number(score) > 800) {
        newDepth += 1;
        newSkill += 2;
        newContempt += 3;
      }

      if (Number(score) < -400 && Number(score) > -700) {
        newDepth -= 1;
        newSkill -= 1;
        newContempt -= 2;
      }

      if (Number(score) < -700) {
        newDepth -= 1;
        newSkill -= 2;
        newContempt -= 3;
      }

      if (Number(score) > 2000 && moveNumber > 20 && botType == 'matchFake') {
        setTimeout(() => {
          dispatch({
            type: 'play:resignGame',
            payload: { color: botColor },
          });
        }, 1500);
      }

      // 👉 zaštita da ne ide ispod 0
      setDepth(String(Math.max(0, newDepth)));
      setSkill(String(Math.max(0, newSkill)));
      setContempt(String(Math.max(0, newContempt)));

      setChangeAfterMove(moveNumber);
    }
  }, [score]);

  const getFinalSkill = (
    baseDepth: number,
    baseSkill: number,
    baseContempt: number
  ) => {
    const randomize = (value: number, delta = 2, min = 0, max = 20) => {
      const magnitude = Math.floor(Math.random() * delta) + 1; // 1 .. delta
      const roll = Math.random();
      // cesce smanjuje nego sto povecava: ~60% nadole, ~25% isto, ~15% nagore
      const rnd = roll < 0.6 ? -magnitude : roll < 0.85 ? 0 : magnitude;
      const v = value + rnd;
      return Math.max(min, Math.min(max, v));
    };
    const finalDepth = randomize(baseDepth, 2, 1, 15);
    const finalSkill = randomize(baseSkill, 2, 0, 20);
    const finalContempt = randomize(baseContempt, 2, 0, 30);
    setDepth(String(finalDepth));
    setSkill(String(finalSkill));
    setContempt(String(finalContempt));
  };
  useEffect(() => {
    console.log(depth, skill, contempt);
  }, [depth]);

  useEffect(() => {
    if (!stockfishRef.current) return;

    stockfishRef.current.postMessage(
      `setoption name Skill Level value ${skill}`
    );
    stockfishRef.current.postMessage(
      `setoption name Contempt value ${contempt}`
    );
  }, [skill, contempt]);
  useEffect(() => {
    fenRef.current = fen;
    if (!stockfishRef.current) return;
    setBestMove(''); // ← reset pre nove analize
    // prekini prethodnu analizu
    stockfishRef.current.postMessage('stop');

    stockfishRef.current.postMessage(`position fen ${fen}`);

    // matchFake: bez UCI_LimitStrength (gazi Skill Level), jacinu nosi nivo
    if (baseLevel !== undefined) {
      stockfishRef.current.postMessage(`go depth ${depth}`);
      return;
    }

    if (depth && Number(depth) > 5) {
      stockfishRef.current.postMessage(`go depth ${depth}`);
    }
    if (depth && Number(depth) > 3) {
      stockfishRef.current.postMessage(
        `setoption name UCI_LimitStrength value true`
      );
      stockfishRef.current.postMessage(`setoption name UCI_Elo value 800`);
      stockfishRef.current.postMessage(`go depth ${depth}`);
    } else if (Number(depth) > 2) {
      stockfishRef.current.postMessage(
        `setoption name UCI_LimitStrength value true`
      );
      stockfishRef.current.postMessage(`setoption name UCI_Elo value 700`);
      stockfishRef.current.postMessage(`go movetime 35`);
    } else {
      stockfishRef.current.postMessage(`go movetime 20`);
      stockfishRef.current.postMessage(
        `setoption name UCI_LimitStrength value true`
      );
      stockfishRef.current.postMessage(`setoption name UCI_Elo value 500`);
    }
  }, [fen, depth]);

  // useEffect(() => {
  //   if (!bestMove) return;
  //   const currentFen = fenRef.current;
  //   let m = bestMove;
  //   if (lastPlayedFenRef.current === currentFen) {
  //   console.log('⛔ already played this position');
  //   return;
  // }
  //   const timeout = setTimeout(() => {
  //     setTimeout(() => {
  //       const parts = currentFen.split(' ');
  //       //  console.log('parts[1]',parts[1])
  //       //   console.log('botColor',botColor)
  //       if (botColor !== parts[1]) {
  //         console.log('❌ NOT BOT TURN (blocked)');
  //         return;
  //       }

  //       if (!isMyTurn && bestMove) {
  //         lastPlayedFenRef.current = currentFen;
  //         engineMove(m);
  //       }
  //     }, 300);
  //     return () => clearTimeout(timeout);
  //   }, 400);
  // }, [bestMove]);

  useEffect(() => {
    if (!bestMove) return;

    const timeout = setTimeout(() => {
      const currentFen = fenRef.current; // 🔥 uzmi NAJNOVIJI fen ovde

      const parts = currentFen.split(' ');

      if (botColor !== parts[1]) {
        return;
      }

      if (lastPlayedFenRef.current === currentFen) {
        console.log('⛔ already played this position');
        setTimeout(() => {
          lastPlayedFenRef.current = null;
          if (!stockfishRef.current) return;
          const retryFen = fenRef.current;
          setBestMove('');
          stockfishRef.current.postMessage('stop');
          stockfishRef.current.postMessage(`position fen ${retryFen}`);
          stockfishRef.current.postMessage(`go movetime 500`);
        }, 5000);
        return;
      }

      if (!isMyTurnRef.current) {
        lastPlayedFenRef.current = currentFen;
        let move = bestMove;
        // bot ponekad previdi i odigra nasumican potez (BOT_MISTAKE_CHANCE)
        if (randomMoveChance > 0 && Math.random() < randomMoveChance) {
          const legalMoves = new Chess(currentFen).moves({ verbose: true });
          if (legalMoves.length > 0) {
            const m = legalMoves[Math.floor(Math.random() * legalMoves.length)];
            move = m.from + m.to + (m.promotion ?? '');
          }
        }
        engineMove(move);
      }
    }, 500);

    return () => clearTimeout(timeout); // ✅ pravi cleanup
  }, [bestMove]);

  return null;
};

export default StockfishEngine;
