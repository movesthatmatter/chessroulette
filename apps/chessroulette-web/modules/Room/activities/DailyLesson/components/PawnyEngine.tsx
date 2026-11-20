import { useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { ChessFEN } from '@xmatter/util-kit';
import type { Lesson } from '../lessonDatabase';
import {
  getStockfishWorker,
  withStockfishLock,
} from '@app/modules/ChessEngine/stockfishWorker.js';

type Props = {
  fen: ChessFEN;
  /** Da li je Pawny na potezu SAD (crni) i treba da odigra ovu poziciju. */
  active: boolean;
  /** UCI string Pawny-jevog poteza (npr. 'e7e5'). */
  onMove: (uci: string) => void;
  /**
   * Vidi RANDOM_MOVE_CHANCE ispod - opciono po lekciji, da Pawny moze biti
   * MALO jaci u kasnijim partijama (npr. Day 18 "Game 2" - "malo ostriji")
   * bez diranja Day 14 ponasanja. Default (nedefinisano) = RANDOM_MOVE_CHANCE.
   */
  randomMoveChance?: number;
  /** Lesson.pawnyRating - rejting ove partije; kad je zadat, menja randomMoveChance po potezu. */
  rating?: number;
  ratingConfig?: Lesson['pawnyRating'];
};

/**
 * Pawny (Day 14 "Your First Game") - namerno MNOGO slabiji od "samo Skill
 * Level 0" (to se ispostavilo i dalje prejako - Stockfish-ov Skill Level 0
 * je i dalje otprilike 1100-1400, daleko iznad 100-300 koliko Pawny tvrdi
 * da je). Umesto da se oslanja na Stockfish parametre (nepouzdano ispod
 * njegovog standardnog "poda"), VECINU vremena ignorise Stockfish-ov predlog
 * i odigra NASUMICAN LEGALAN potez (chess.js) - jedini nacin da se garantuje
 * genuinely slaba, "deca ovo pobede" igra, bez obzira sta engine iznutra radi.
 */
const RANDOM_MOVE_CHANCE = 0.8; // "deli figure za zabavu" - uglavnom nasumican potez, retko "pametan"

function legalMovesUci(fen: string): string[] {
  try {
    return new Chess(fen).moves({ verbose: true }).map((m) => {
      // Pesak koji stize na krajnji red MORA imati slovo promocije u UCI
      // stringu (inace ChessFENBoard.move() nema sta da stavi na to polje
      // osim samog pesaka - "Invalid FEN: some pawns are on the edge rows"
      // je bas to). chess.js obicno vec vraca m.promotion za ove poteze,
      // ali ovo je eksplicitna sigurnosna mreza ako ikad ne bude.
      const isPromotion =
        m.piece === 'p' && (m.to[1] === '1' || m.to[1] === '8');
      const promotion = m.promotion ?? (isPromotion ? 'q' : '');
      return `${m.from}${m.to}${promotion}`;
    });
  } catch {
    return [];
  }
}

function randomOf(moves: string[]): string | null {
  return moves.length > 0
    ? moves[Math.floor(Math.random() * moves.length)]
    : null;
}

/**
 * Stockfish-ov predlog vazi SAMO ako je legalan bas u ovoj poziciji. Kasni
 * 'bestmove' iz prethodne pretrage (posle safety timeout-a) ili pad workera
 * na mobilnom (nema 'bestmove' uopste) su ranije ostavljali Pawny-ja bez
 * poteza zauvek (prijavljeno: Day 14, crni kralj u sahu sa jednim izlazom) -
 * sad se u tom slucaju igra nasumican legalan potez.
 */
function pickStockfishOrRandom(
  stockfishUci: string | null,
  legal: string[]
): string | null {
  if (stockfishUci && legal.includes(stockfishUci)) return stockfishUci;
  return randomOf(legal);
}

// Pawny "razmislja" ovoliko DUGO pre nego sto stvarno odigra potez (izbor
// izmedju nasumicnog i Stockfish-ovog predloga je trenutan, ovo je samo
// vestacka pauza da partija ne deluje robotski). NIKAD duze od 3 sekunde,
// cela partija - samo 1, 2 ili 3s, nasumicno, bez izuzetaka.
// Rejting poteza (T +- jitter, u granicama) prevodi se u udeo nasumicnih poteza.
function randomChanceForRating(
  rating: number,
  cfg: NonNullable<Lesson['pawnyRating']>
) {
  const jittered = rating + (Math.random() * 2 - 1) * cfg.jitter;
  const elo = Math.min(cfg.clampMax, Math.max(cfg.clampMin, jittered));
  const t = (elo - cfg.clampMin) / (cfg.clampMax - cfg.clampMin);
  return cfg.randomAtMin + t * (cfg.randomAtMax - cfg.randomAtMin);
}

const FIRST_MOVE_THINK_MS = 300;

function pickPawnyThinkMs(fen: string) {
  // prvi Pawny potez partije (potez 1 u FEN-u) ide odmah
  if (fen.split(' ')[5] === '1') return FIRST_MOVE_THINK_MS;
  const quick = [1000, 2000, 3000];
  return quick[Math.floor(Math.random() * quick.length)];
}

export const PawnyEngine = ({
  fen,
  active,
  onMove,
  randomMoveChance = RANDOM_MOVE_CHANCE,
  rating,
  ratingConfig,
}: Props) => {
  const lastRepliedFenRef = useRef<string | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const thinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const worker = getStockfishWorker();
    worker.postMessage('setoption name Skill Level value 0');
    worker.postMessage('setoption name Contempt value 0');
    // NAMERNO se worker ne gasi na unmount (terminateStockfish) - deljen je
    // (singleton) kroz celu partiju/sesiju, isti kao kod ostalih Stockfish
    // potrosaca u ovom repou. Gasenje ovde je u React 18 Strict Mode (dev)
    // izazivalo mount->cleanup->mount na SVAKI load stranice, sto je ubijalo
    // i odmah ponovo pravilo worker tacno dok je prvi "go" vec bio u toku.
  }, []);

  useEffect(() => {
    if (thinkTimeoutRef.current) {
      clearTimeout(thinkTimeoutRef.current);
      thinkTimeoutRef.current = null;
    }
    if (!active) return;
    // Vec odigrano za ovu tacnu poziciju - ne pitaj engine ponovo (fen se
    // jos nije promenio dok Movex ne potvrdi prethodni Pawny potez).
    if (lastRepliedFenRef.current === fen) return;

    let cancelled = false;
    const legal = legalMovesUci(fen);
    if (legal.length === 0) return;

    // lastRepliedFenRef se postavlja tek kad potez STVARNO ode - ako cleanup
    // otkaze zakazan potez (rerender tokom "razmisljanja"), sledeci prolaz
    // efekta ga ponovo racuna umesto da tiho preskoci poziciju.
    const playAfterThinking = (uci: string | null) => {
      if (cancelled || !uci) return;
      thinkTimeoutRef.current = setTimeout(() => {
        lastRepliedFenRef.current = fen;
        onMoveRef.current(uci);
      }, pickPawnyThinkMs(fen));
    };

    // Nasumican potez ne treba Stockfish uopste - ne zavisi od workera.
    const chance =
      rating != null && ratingConfig
        ? randomChanceForRating(rating, ratingConfig)
        : randomMoveChance;
    if (Math.random() < chance) {
      playAfterThinking(randomOf(legal));
    } else {
      // Vidi MateDefenseEngine.tsx - isti razlog za withStockfishLock (deljeni
      // worker, Hint box-method upiti su se preplitali sa ovim upitom).
      withStockfishLock(
        (worker: Worker) =>
          new Promise<void>((resolve) => {
            let settled = false;
            const finish = (stockfishUci: string | null) => {
              if (settled) return;
              settled = true;
              worker.removeEventListener('message', onMessage);
              clearTimeout(safetyTimeout);
              playAfterThinking(pickStockfishOrRandom(stockfishUci, legal));
              resolve();
            };
            const onMessage = (event: MessageEvent) => {
              const data = event.data;
              if (typeof data === 'string' && data.startsWith('bestmove')) {
                finish(data.split(' ')[1] ?? null);
              }
            };
            // Worker se ne javlja (npr. pao na mobilnom) - Pawny ipak igra.
            const safetyTimeout = setTimeout(() => {
              worker.postMessage('stop');
              finish(null);
            }, 5000);
            worker.addEventListener('message', onMessage);

            worker.postMessage('stop');
            worker.postMessage(`position fen ${fen}`);
            worker.postMessage('go movetime 150');
          })
      );
    }

    return () => {
      cancelled = true;
      if (thinkTimeoutRef.current) {
        clearTimeout(thinkTimeoutRef.current);
        thinkTimeoutRef.current = null;
      }
    };
  }, [fen, active, randomMoveChance, rating, ratingConfig]);

  return null;
};
