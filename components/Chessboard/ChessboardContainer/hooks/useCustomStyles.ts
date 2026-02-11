import { useMemo } from 'react';
import { getInCheckSquareMap } from '../util';
import { BoardTheme } from '@/hooks/useTheme/defaultTheme';
import { toDictIndexedBy } from '@/lib/misc';
import { ChessFEN, ShortChessMove } from '@/lib/ChessRouler';
import {
  ChessboardPreMove,
  ChessBoardPendingMove,
  ReactChessBoardProps,
} from '../types';
import { Square } from 'chess.js';
import { CirclesMap } from '../../types';
import { objectKeys } from 'movex-core-util';
import { deepmerge } from 'deepmerge-ts';

export const useCustomStyles = ({
  boardTheme,
  fen,
  lastMove,
  pendingMove,
  preMove,
  circlesMap,
  customSquareStyles,
  isMyTurn,
  hoveredSquare,
  ...props
}: {
  boardTheme: BoardTheme;
  fen: ChessFEN;
  lastMove?: ShortChessMove;
  pendingMove?: ChessBoardPendingMove;
  preMove?: ChessboardPreMove;
  circlesMap?: CirclesMap;
  isMyTurn?: boolean;
  hoveredSquare?: Square;
} & Pick<
  ReactChessBoardProps,
  | 'customDarkSquareStyle'
  | 'customLightSquareStyle'
  | 'customBoardStyle'
  | 'customSquareStyles'
>) => {
  const inCheckSquares = useMemo(() => getInCheckSquareMap(fen), [fen]);

  const customStyles = useMemo(
    () => ({
      customDarkSquareStyle: props.customDarkSquareStyle || {
        backgroundColor: boardTheme.darkSquare,
      },
      customLightSquareStyle: props.customLightSquareStyle || {
        backgroundColor: boardTheme.lightSquare,
      },
      customBoardStyle: props.customBoardStyle || { backgroundColor: 'white' },
    }),
    [
      props.customDarkSquareStyle,
      props.customLightSquareStyle,
      props.customBoardStyle,
    ],
  );

  const mergedCustomSquareStyles = useMemo(() => {
    const lastMoveStyle = lastMove && {
      [lastMove.from]: {
        background: boardTheme.lastMoveFromSquare,
      },
      [lastMove.to]: {
        background: boardTheme.lastMoveToSquare,
      },
    };

    const circledStyle =
      circlesMap &&
      toDictIndexedBy(
        Object.values(circlesMap),
        ([sq]) => sq,
        ([_, hex]) => ({
          position: 'relative',
          '> .circleDiv': {
            position: 'absolute',
            left: '0',
            top: '0',
            right: '0',
            bottom: '0',
            background: `radial-gradient(ellipse at     center, 
              rgba(255,113,12,0) 60%,
              ${hex} 51.5%)`,
            borderRadius: '50%',
          },
        }),
      );

    const checkedStyle =
      inCheckSquares &&
      toDictIndexedBy(
        objectKeys(inCheckSquares),
        (sq) => sq,
        () => ({
          position: 'relative',
          '> .inCheckDiv': {
            // content: `''`,
            position: 'absolute',
            left: '0',
            top: '0',
            right: '0',
            bottom: '0',
            background: 'red',
            borderRadius: '50%',
            opacity: 0.7,
          },
        }),
      );

    const touchedSquareStyle = {
      ...(pendingMove?.from && {
        [pendingMove?.from]: {
          background: boardTheme.clickedPieceSquare,
        },
      }),
    };

    const hoveredSquareStyle = {
      ...(isMyTurn &&
        pendingMove &&
        hoveredSquare &&
        hoveredSquare !== pendingMove.from && {
          [hoveredSquare]: {
            background: boardTheme.clickedPieceSquare,
          },
        }),
    };

    const premoveSquaresStyle = {
      ...(preMove && {
        [preMove.from]: {
          background: boardTheme.preMoveFromSquare,
        },
        ...(preMove.to && {
          [preMove.to]: {
            background: boardTheme.preMoveToSquare,
          },
        }),
      }),
    };

    // const x = deepmerge(
    //   customSquareStyles || {},
    //   // touchedSquareStyle,
    //   // hoveredSquareStyle,
    // );

    // customSquareStyles || {},
    return deepmerge(
      lastMoveStyle || {},
      circledStyle || {},
      checkedStyle || {},
      touchedSquareStyle,
      hoveredSquareStyle,
      premoveSquaresStyle,

      // TODO: this throws "Type instantiation is excessively deep and possibly infinite.ts(2589)" so I recast it
      // UPDATED on Feb 11 2026
      (customSquareStyles as {}) || {},
    );
  }, [
    lastMove,
    circlesMap,
    inCheckSquares,
    customSquareStyles,
    boardTheme,
    hoveredSquare,
    pendingMove?.from,
    isMyTurn,
    preMove,
  ]);

  return useMemo(
    () => ({
      customSquareStyles: mergedCustomSquareStyles,
      ...customStyles,
    }),
    [customStyles, mergedCustomSquareStyles],
  );
};
