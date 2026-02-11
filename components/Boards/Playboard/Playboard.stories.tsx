import type { Meta, StoryObj } from '@storybook/react';
import {
  ChessFEN,
  ShortChessColor,
  ShortChessMove,
  getNewChessGame,
} from '@/lib/ChessRouler';
import { useEffect, useState } from 'react';
import { Playboard } from './Playboard';
import { FenPreview } from '@/modules/Room/activities/Learn/components/FenPreview';
import { ChessFENBoard, swapColor } from '@/lib/ChessFENBoard';

const meta: Meta<typeof Playboard> = {
  component: Playboard,
  title: 'Playboard',
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {},
    },
  },
};

export default meta;
type Story = StoryObj<typeof Playboard>;

export const Main: Story = {
  args: {
    sizePx: 500,
    fen: ChessFENBoard.STARTING_FEN,
  },
  render: ({ fen: argFen, ...args }) => {
    const [state, setState] = useState<{
      fen: ChessFEN;
      turn: ShortChessColor;
    }>({
      fen: argFen,
      turn: 'w',
    });

    useEffect(() => {
      setState((prev) => ({ ...prev, fen: argFen }));
    }, [argFen]);

    return (
      <>
        <Playboard
          {...args}
          fen={state.fen}
          canPlay
          turn={state.turn}
          playingColor={state.turn}
          onMove={(move) => {
            const instance = getNewChessGame({ fen: state.fen });
            instance.move(move);

            const nextFen = instance.fen();

            setState((prev) => ({
              ...prev,
              fen: nextFen,
              turn: swapColor(state.turn),
            }));
          }}
        />
        <div className="pt-2" />
        <FenPreview fen={state.fen} className="pt-2" />
      </>
    );
  },
};

export const PlaySideBySide: Story = {
  args: {
    sizePx: 500,
    fen: ChessFENBoard.STARTING_FEN,
  },
  render: ({ fen: argFen, ...args }) => {
    const [state, setState] = useState<{
      fen: ChessFEN;
      turn: ShortChessColor;
      lastMove?: ShortChessMove;
    }>({
      fen: argFen,
      turn: 'w',
    });
    useEffect(() => {
      setState((prev) => ({ ...prev, fen: argFen }));
    }, [argFen]);

    const onMove = (move: ShortChessMove) => {
      const instance = getNewChessGame({ fen: state.fen });

      try {
        instance.move(move);

        const nextFen = instance.fen();

        setState((prev) => ({
          ...prev,
          fen: nextFen,
          turn: swapColor(state.turn),
          lastMove: instance.history({ verbose: true }).slice(-1)[0],
        }));
      } catch (e) {
        console.log('[story.onMove] Error', e);
      }
    };

    return (
      <div className="w-full h-full">
        <div className="flex flex-1 gap-4 contetnt-between">
          <Playboard
            {...args}
            fen={state.fen}
            lastMove={state.lastMove}
            canPlay
            playingColor="w"
            turn={state.turn}
            onMove={onMove}
          />
          <Playboard
            {...args}
            fen={state.fen}
            lastMove={state.lastMove}
            playingColor="b"
            canPlay
            turn={state.turn}
            onMove={onMove}
          />
        </div>

        <div className="pt-2" />
        <div className="flex-1 flex items-center justify-center">
          <FenPreview fen={state.fen} className="pt-2" />
        </div>
      </div>
    );
  },
};

export const CheckPromotion: Story = {
  args: {
    sizePx: 500,
    fen: 'rnbqkbnr/ppp1ppPp/8/8/8/8/PPpPP1PP/RNBQKBNR w KQkq - 0 5',
  },
  render: ({ fen: argFen, ...args }) => {
    const [state, setState] = useState<{
      fen: ChessFEN;
      turn: ShortChessColor;
    }>({
      fen: argFen,
      turn: 'w',
    });

    useEffect(() => {
      setState((prev) => ({ ...prev, fen: argFen }));
    }, [argFen]);

    return (
      <>
        <Playboard
          {...args}
          fen={state.fen}
          playingColor={state.turn}
          onMove={(move) => {
            const instance = getNewChessGame({ fen: state.fen });
            instance.move(move);

            const nextFen = instance.fen();

            setState((prev) => ({
              ...prev,
              fen: nextFen,
              turn: swapColor(state.turn),
            }));
          }}
        />
        <div className="pt-2" />
        <FenPreview fen={state.fen} className="pt-2" />
      </>
    );
  },
};
