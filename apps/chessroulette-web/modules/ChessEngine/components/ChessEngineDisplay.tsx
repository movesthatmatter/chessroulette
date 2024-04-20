import { ChessFEN } from '@xmatter/util-kit';
import { useChessEngineFromFen } from '../hooks/useChessEngine';

type Props = {
  /**
   * This can be the gameId or anything unique that doesn't change on every move
   * It's used to tell the engine to set a new game
   */
  gameId: string;
  fen: ChessFEN;
};

export type EngineState = {
  bestMove?: string;
  line?: {
    depth: number;
    score: {
      unit: string; // 'cp' | 'mate'
      value: number;
    };
    pv?: string;
    // evaluation: {
    //   heightsPct: {
    //     w: number;
    //     b: number;
    //   };
    //   evalAsStr: string;
    // };
  };
};

export const ChessEngineDisplay = ({ gameId, fen }: Props) => {
  const { bestLine, bestMove, ...engineProps } = useChessEngineFromFen(
    gameId,
    fen,
    { depth: 12 }
  );

  return (
    <div className="text-sm pb-2 spx-2 border-b border-slate-600 soverflow-hidden">
      {bestLine ? (
        <>
          <p className="flex justify-between pb-2 items-center">
            <span>
              <span className="text-lg font-bold">
                {bestLine.evaluation.evalAsStr}{' '}
              </span>
              {bestMove && (
                <span>
                  <span className="font-bold">Best Move:</span> {bestMove} |{' '}
                </span>
              )}
              <span>
                <span className="font-bold">Depth:</span> {bestLine.depth}
              </span>
            </span>

            <span className="font-bold italic">{engineProps.id?.name}</span>
          </p>
          <p className="wrap inline-block">
            {bestLine.pv?.map((move, i) => (
              <span
                key={`${i}-${move}`}
                className="inline-block sp-1 hover:bg-slate-600 hover:cursor-pointer rounded-sm"
                style={{
                  padding: '.1em',
                }}
              >
                {move}
              </span>
            ))}
          </p>
        </>
      ) : (
        <span>Loading Engine...</span>
      )}
    </div>
  );
};
