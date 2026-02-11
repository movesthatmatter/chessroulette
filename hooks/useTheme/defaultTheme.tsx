import { objectKeys, toDictIndexedBy } from '@/lib/misc';
import { Piece } from '@/components/Chessboard/Piece';
import { pieces as MeridaPieces } from '@/components/Chessboard/assets/merida';
import { pieces as CRPieces } from '@/components/Chessboard/assets/pieces';
import { PieceSan } from '@/lib/ChessRouler';
import { ChessboardProps } from 'react-chessboard/dist/chessboard/types';

export type BoardTheme = {
  darkSquare: string;
  lightSquare: string;
  arrowColors: [string, string, string];
  lastMoveToSquare: string;
  lastMoveFromSquare: string;
  preMoveToSquare: string;
  preMoveFromSquare: string;
  hoveredSquare: string;
  clickedPieceSquare: string;
  customPieces?: ChessboardProps['customPieces'];
  renderPiece: (p: {
    pieceSan: PieceSan;
    squareWidth: number;
  }) => React.ReactElement;
};

type Theme = {
  name: string;
  board: BoardTheme;
};

const getPiecesByTheme = (theme: 'merida' | 'cr') => {
  const pieceRegistry = theme === 'merida' ? MeridaPieces : CRPieces;

  const renderPiece: Theme['board']['renderPiece'] = ({
    pieceSan,
    squareWidth,
  }) => (
    <Piece
      registry={pieceRegistry}
      squareSize={squareWidth * 1}
      pieceSan={pieceSan}
    />
  );

  return {
    getCustomPieces: () =>
      toDictIndexedBy(
        objectKeys(pieceRegistry),
        (pieceSan) => pieceSan,
        (pieceSan) => (p: { squareWidth: number }) =>
          renderPiece({ pieceSan, squareWidth: p.squareWidth }),
      ),
    renderPiece,
  };
};

const regularPieceTheme = getPiecesByTheme('merida');
const crPieceTheme = getPiecesByTheme('cr');

const chessrouletteTheme: Theme = {
  name: 'chessroulette',
  board: {
    darkSquare: 'rgba(0, 163, 255, .4)',
    lightSquare: 'white',
    arrowColors: ['#11c6d1', '#f2358d', '#6f7381'],
    lastMoveToSquare: 'rgba(234, 183, 255, .5)',
    lastMoveFromSquare: 'rgba(234, 183, 255, .5)',
    hoveredSquare: 'rgba(204, 183, 255, .9)',
    preMoveFromSquare: 'rgba(21, 183, 155, .5)',
    preMoveToSquare: 'rgba(21, 183, 155, .5)',
    clickedPieceSquare: 'rgba(0, 163, 255, .7)',
    renderPiece: crPieceTheme.renderPiece,
    customPieces: crPieceTheme.getCustomPieces(),
  },
};

const outpostTheme: Theme = {
  name: 'outpost',
  board: {
    darkSquare: '#C8A07D',
    lightSquare: 'white',
    arrowColors: ['#11c6d1', '#f2358d', '#6f7381'],
    lastMoveToSquare: 'rgba(95, 15, 15, .6)',
    lastMoveFromSquare: 'rgba(95, 15, 15, .6)',
    preMoveFromSquare: 'rgba(21, 183, 155, .5)',
    preMoveToSquare: 'rgba(21, 183, 155, .5)',
    hoveredSquare: 'rgba(134, 583, 255, .5)',
    clickedPieceSquare: 'rgba(134, 583, 255, .5)',
    renderPiece: regularPieceTheme.renderPiece,
    customPieces: regularPieceTheme.getCustomPieces(),
  },
};

export const defaultTheme = chessrouletteTheme;

export const themes = {
  outpost: outpostTheme,
  op: outpostTheme,
};
