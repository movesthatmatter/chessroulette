import { useEffect } from 'react';
import {  noop } from '@/lib/misc';
import { useChessEngineFromFen } from '../hooks/useChessEngine';
import { EngineResultState } from '../lib/types';
import { ChessFEN } from '@/lib/ChessRouler';

type Props = {
  /**
   * This can be the gameId or anything unique that doesn't change on every move
   * It's used to tell the engine to set a new game
   */
  gameId: string;
  fen: ChessFEN;
  onUpdate?: (s: EngineResultState) => void;
};

export const ChessEngineAnalysisDisplay = ({
  gameId,
  fen,
  onUpdate = noop,
}: Props) => {
  const engineState = useChessEngineFromFen(gameId, fen, { depth: 12 });

  useEffect(() => {
    onUpdate(engineState);
  }, [engineState]);

  return (
    <div className="text-sm pb-2 spx-2 border-b border-slate-600 soverflow-hidden">
      <p className="text-xs text-slate-400">{engineState.id?.name} Engine</p>
      {engineState.bestLine ? (
        <>
          <p className="flex items-center gap-2">
            <span className="text-lg font-bold ">
              {engineState.bestLine.evaluation.evalAsStr}{' '}
            </span>
            {engineState.bestMove && (
              <span>
                <span className="font-bold">Best Move:</span>{' '}
                {engineState.bestMove}{' '}
                <span className="text-slate-400 italic">
                  (Depth {engineState.bestLine.depth})
                </span>
              </span>
            )}
          </p>
          <div>
            {engineState.bestLine.pv?.split(' ').slice(0, 8)?.map((move, i) => (
              <span
                key={`${i}-${move}`}
                className="inline-block sp-1 hover:text-slate-300 hover:cursor-pointer rounded-sm"
                style={{ margin: '.1em' }}
              >
                {move}
              </span>
            ))}
          </div>
        </>
      ) : (
        <span>Loading Engine...</span>
      )}
    </div>
  );
};
