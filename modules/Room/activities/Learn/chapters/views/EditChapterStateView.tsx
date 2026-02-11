import { useEffect, useState } from 'react';
import { DeepPartial } from '@/lib/misc';
import { FenPreview } from '../../components/FenPreview';
import {
  PgnInputBox,
  PgnInputBoxProps,
} from '@/components/PgnInputBox/PgnInputBox';
import useInstance from '@use-it/instance';
import { SQUARES, Square } from 'chess.js';
import { ChapterState } from '../../movex';
import { ChessFENBoard, FenState } from '@/lib/ChessFENBoard';

export type EditChapterStateViewProps = {
  state: ChapterState;
  isBoardEditorShown: boolean;
  onUpdate: (s: ChapterState) => void;
  onToggleBoardEditor: (show: boolean) => void;
  onImport: PgnInputBoxProps['onChange'];
};

const EN_PASSANT_SQUARES = SQUARES.filter(
  (sq) => sq[1] === '3' || sq[1] === '6',
);

export const EditChapterStateView = ({
  state,
  onUpdate,
  onImport,
}: EditChapterStateViewProps) => {
  const fenBoardInstance = useInstance<ChessFENBoard>(
    new ChessFENBoard(state.displayFen),
  );

  const [boardFenState, setBoardFenState] = useState<FenState>(
    fenBoardInstance.getFenState(),
  );

  useEffect(() => {
    fenBoardInstance.loadFen(state.displayFen);
    setBoardFenState(fenBoardInstance.getFenState());
  }, [state.displayFen]);

  const partialUpdate = (partial: Partial<ChapterState>) =>
    onUpdate({ ...state, ...partial });

  const updateFenState = (nextFenState: DeepPartial<FenState>) => {
    fenBoardInstance.setFenState(nextFenState);

    partialUpdate({ displayFen: fenBoardInstance.fen });
  };

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3">
        <label className="font-bold text-sm text-gray-400">Title</label>

        <input
          id="title"
          type="text"
          name="title"
          value={state.name}
          className="w-fulls text-sm rounded-md border-slate-400 focus:border-slate-400 border border-transparent block bg-slate-500 text-white block py-1 px-2"
          onChange={(e) => {
            partialUpdate({ name: e.target.value });
          }}
        />
      </div>

      <div className="flex items-center gap-3 sbg-red-100">
        <label className="font-bold text-sm text-gray-400">Turn</label>
        <div className="flex items-center">
          <input
            id="turn-white"
            type="radio"
            checked={boardFenState.turn === 'w'}
            name="turn-white"
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            onChange={() => updateFenState({ turn: 'w' })}
          />
          <label
            htmlFor="turn-white"
            className="ml-1 ms-2 text-sm font-medium text-gray-300"
          >
            White
          </label>
        </div>
        <div className="flex items-center smb-4">
          <input
            id="turn-black"
            type="radio"
            checked={boardFenState.turn === 'b'}
            name="turn-black"
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            onChange={() => updateFenState({ turn: 'b' })}
          />
          <label
            htmlFor="turn-black"
            className="ml-1 ms-2 text-sm font-medium text-gray-300"
          >
            Black
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 sbg-red-100">
        <label className="font-bold text-sm text-gray-400">Orientation</label>
        <div className="flex items-center">
          <input
            id="orientation-white"
            type="radio"
            checked={state.orientation === 'w'}
            name="orientation-white"
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            onChange={() => partialUpdate({ orientation: 'w' })}
          />
          <label
            htmlFor="orientation-white"
            className="ml-1 ms-2 text-sm font-medium text-gray-300"
          >
            White
          </label>
        </div>
        <div className="flex items-center smb-4">
          <input
            id="orientation-black"
            type="radio"
            checked={state.orientation === 'b'}
            name="orientation-black"
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            onChange={() => partialUpdate({ orientation: 'b' })}
          />
          <label
            htmlFor="orientation-black"
            className="ml-1 ms-2 text-sm font-medium text-gray-300"
          >
            Black
          </label>
        </div>
      </div>

      <div className="flex gap-3 sflex-col sitems-center">
        <label className="font-bold text-sm text-gray-400">Castling</label>
        <div className="flex flex-1s gap-3">
          <div className="flex items-center">
            <input
              id="white-king-castle"
              type="checkbox"
              checked={boardFenState.castlingRights.w.kingSide}
              name="white-king-castle"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              onChange={() => {
                updateFenState({
                  castlingRights: {
                    w: {
                      kingSide: !boardFenState.castlingRights.w.kingSide,
                    },
                  },
                });
              }}
            />
            <label
              htmlFor="white-king-castle"
              className="ml-1 ms-2 text-sm font-medium text-gray-300"
            >
              White O-O
            </label>
          </div>
          <div className="flex items-center smb-4">
            <input
              id="white-queen-castle"
              type="checkbox"
              // value=""
              checked={boardFenState.castlingRights.w.queenSide}
              name="white-queen-castle"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              onChange={() => {
                updateFenState({
                  castlingRights: {
                    w: {
                      queenSide: !boardFenState.castlingRights.w.queenSide,
                    },
                  },
                });
              }}
            />
            <label
              htmlFor="white-queen-castle"
              className="ml-1 ms-2 text-sm font-medium text-gray-300"
            >
              White O-O-O
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="black-king-castle"
              type="checkbox"
              checked={boardFenState.castlingRights.b.kingSide}
              name="black-king-castle"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              onChange={() => {
                updateFenState({
                  castlingRights: {
                    b: {
                      kingSide: !boardFenState.castlingRights.b.kingSide,
                    },
                  },
                });
              }}
            />
            <label
              htmlFor="black-king-castle"
              className="ml-1 ms-2 text-sm font-medium text-gray-300"
            >
              Black O-O
            </label>
          </div>
          <div className="flex items-center smb-4">
            <input
              id="black-queen-castle"
              type="checkbox"
              // value=""
              checked={boardFenState.castlingRights.b.queenSide}
              name="black-queen-castle"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              onChange={() => {
                updateFenState({
                  castlingRights: {
                    b: {
                      queenSide: !boardFenState.castlingRights.b.queenSide,
                    },
                  },
                });
              }}
            />
            <label
              htmlFor="black-queen-castle"
              className="ml-1 ms-2 text-sm font-medium text-gray-300"
            >
              Black O-O-O
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="font-bold text-sm text-gray-400">En Passant</label>
        <select
          id="countries"
          className="bg-slate-500 p-1 border border-slate-400 text-gray-900 text-sm rounded-lg block w-20 "
          onChange={(e) => {
            updateFenState({ enPassant: e.target.value as Square });
          }}
        >
          <option value={undefined}>-</option>
          {EN_PASSANT_SQUARES.map((sq) => (
            <option key={sq} value={sq}>
              {sq}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <label className="font-bold text-sm text-gray-400">Import</label>
        <PgnInputBox compact containerClassName="flex-1" onChange={onImport} />
      </div>

      {/* <div className="flex flex-col gap-3">
        <label className="font-bold text-sm text-gray-400">Board</label>

        <div className="flex gap-3 sjustify-between">
          <Button
            size="sm"
            type="secondary"
            onClick={() => {
              partialUpdate({ displayFen: ChessFENBoard.ONLY_KINGS_FEN });
            }}
            icon="TrashIcon"
            iconKind="outline"
          >
            Clear
          </Button>
          <Button
            size="sm"
            type="secondary"
            onClick={() => {
              partialUpdate({ displayFen: ChessFENBoard.STARTING_FEN });
            }}
            icon="ArrowPathIcon"
            iconKind="outline"
          >
            Start Position
          </Button>
          {isBoardEditorShown ? (
            <Button
              size="sm"
              type="custom"
              bgColor="green"
              icon="PencilSquareIcon"
              onClick={() => onToggleBoardEditor(false)}
            >
              Close Board Editor
            </Button>
          ) : (
            <Button
              size="sm"
              type="custom"
              bgColor="green"
              icon="PencilSquareIcon"
              onClick={() => onToggleBoardEditor(true)}
            >
              Board Editor
            </Button>
          )}
        </div>
      </div> */}

      <FenPreview fen={state.displayFen} />
    </div>
  );
};
