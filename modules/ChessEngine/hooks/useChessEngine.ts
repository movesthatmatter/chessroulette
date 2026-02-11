import { useContext, useEffect, useState } from 'react';
import { ChessEngineContext } from '../ChessEngineContext';
import { invoke } from '@/lib/misc';
import { evaluate } from '../lib/util';
import { EngineResultState } from '../lib/types';
import { ChessFEN } from '@/lib/ChessRouler';
import { ChessFENBoard } from '@/lib/ChessFENBoard';

export const useChessEngineClient = () => useContext(ChessEngineContext);

type SearchOpts = { depth: number };

export const useChessEngineFromFen = (
  gameId: string,
  fen: ChessFEN,
  searchOpts: SearchOpts = { depth: 10 },
) => {
  const engine = useChessEngineClient();

  const [state, setState] = useState<EngineResultState>({
    canSearch: false,
    fen,
  });

  useEffect(() => {
    if (!engine.ready) {
      // Reset the state if not ready anymore
      setState({
        fen,
        canSearch: false,
      });
      return;
    }

    // Set the Engine Id
    setState((prev) => ({
      ...prev,
      id: engine.client.id,
    }));

    const unsubscribers = [
      engine.client.on('readyok', () => {
        setState((prev) => ({
          ...prev,
          // Any time the readyok is received the seearch can happen
          canSearch: true,
        }));
      }),
      engine.client.on('infoLine', (nextLine) => {
        setState((prev) => {
          // if it's deeper don't update it
          if (prev.bestLine?.depth && prev.bestLine.depth > nextLine.depth) {
            return prev;
          }

          const fenState = new ChessFENBoard(prev.fen).getFenState();

          const nextEvaluation = evaluate(
            {
              data: `info depth ${nextLine.score.unit} ${nextLine.score.value}`,
            },
            fenState.turn,
          );

          return {
            ...prev,
            bestLine: {
              ...nextLine,
              pv: nextLine.pv,
              evaluation: nextEvaluation,
            },
          };
        });
      }),
    ];

    return () => unsubscribers.forEach(invoke);
  }, [engine.ready]);

  // Search
  useEffect(() => {
    if (!engine.ready) {
      // setLoading(true);
      return;
    }

    // If the canSearch is not active return early
    if (!state.canSearch) {
      return;
    }

    // Update the FEN
    setState((prev) => ({
      ...prev,
      fen,
      bestLine: undefined,
      bestMove: undefined,
    }));

    engine.client.search(fen, 10).then(({ bestMove }) => {
      setState((prev) => ({
        ...prev,
        bestMove: bestMove.bestmove,
      }));
    });
  }, [engine.ready, state.canSearch, fen, searchOpts.depth]);

  useEffect(() => {
    if (!engine.ready) {
      return;
    }

    setState((prev) => ({
      ...prev,
      // Set this to false until the new game is ready
      canSearch: false,
    }));

    // Every time the game id changes set a new game
    // This will send a "isready" cmd
    engine.client.newGame();
  }, [engine.ready, gameId]);

  return state;
};
