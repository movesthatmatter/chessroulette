import { deepmerge } from 'deepmerge-ts';
import { getNewChessGame, isShortChessColor, toShortColor } from '../ChessRouler/lib';
import type { ChessFEN, ChessFENStateNotation } from '../ChessRouler/types';
import type {
  FENBoard,
  FenBoardPieceSymbol,
  FenBoardPromotionalPieceSymbol,
  FenBoardDetailedChessMove,
} from './types';
import { invoke, isOneOf } from '../misc';
import {
  emptyBoard,
  fenBoardPieceSymbolToDetailedChessPiece,
  getFileRank,
  isPieceSymbolOfColor,
  isUpperCase,
  matrixIndexToSquare,
  swapColor,
} from './util';
import { SQUARES, type Color, type Square } from 'chess.js';
import { Err, Ok, Result } from 'ts-results';
import type { DeepPartial } from '../miscType';
import {
  duplicateMatrix,
  matrixFind,
  matrixReduce,
  printMatrix,
} from '../matrix';

export type FenState = {
  turn: Color;
  castlingRights: {
    w: { kingSide: boolean; queenSide: boolean };
    b: { kingSide: boolean; queenSide: boolean };
  };
  enPassant: Square | undefined;
  halfMoves: number;
  fullMoves: number;
};

export type FenStateAsString = string; // this could be branded

export class ChessFENBoard {
  static STARTING_FEN: ChessFEN =
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  static ONLY_KINGS_FEN: ChessFEN = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
  // '8/8/8/8/8/8/8/8 w - - 0 1'; // TODO: Add ability to have an empty baord

  // This is a get because it's meant to be readonly
  static get STARTING_FEN_STATE(): FenState {
    return {
      turn: 'w',
      castlingRights: {
        w: { kingSide: true, queenSide: true },
        b: { kingSide: true, queenSide: true },
      },
      enPassant: undefined,
      halfMoves: 0,
      fullMoves: 1, // This always needs to be bigger than 0
    };
  }

  private _state: {
    board: FENBoard;
    fen: ChessFEN;
    fenState: FenState;
  } = {
    board: ChessFENBoard.calculateBoard(ChessFENBoard.STARTING_FEN),
    fen: ChessFENBoard.STARTING_FEN,
    fenState: ChessFENBoard.STARTING_FEN_STATE,
  };

  constructor(fen?: ChessFEN) {
    if (fen) {
      this.loadFen(fen);
    }
  }

  /**
   * Gets the piece at a square
   *
   * @param {string} square - The square. Eg: "a2"
   * @return {string} piece - the ascii representation of a piece. Eg: "K"
   */
  piece(square: Square) {
    const [file, rank] = getFileRank(square);
    return ChessFENBoard.getPiece(this._state.board, file, rank);
  }

  /**
   * Places a piece or empty on the given square.
   *
   * @param {string} square - The square. Eg: "a2"
   * @param {string} piece - the ascii representation of a piece. Eg: "K"
   */
  private put(
    square: Square,
    piece: FenBoardPieceSymbol | '',
    validate = true
  ) {
    const [file, rank] = getFileRank(square);

    // TODO: Add it back This needs to recalcualte the fen as well
    const nextBoard = ChessFENBoard.setPieceInBoard(
      duplicateMatrix(this.board),
      file,
      rank,
      piece
    );

    const next = ChessFENBoard.calculateFen(
      nextBoard,
      this._state.fenState,
      validate
    );

    // TODO: Can Optimize to not calc fen all the time
    this._state = {
      board: nextBoard,
      fen: next.fen,
      fenState: next.fenState,
    };
  }

  /**
   * Removes the piece at the given square.
   *
   * @param {string} square - The square. Eg: "a2"
   */
  // private clear(square: Square) {
  //   // TODO: Add it back This needs to recalcualte the fen as well
  //   this.put(square, '');
  // }

  addPiece(square: Square, piece: FenBoardPieceSymbol | '') {
    return this.put(square, piece, true);
  }

  clearSquare(square: Square, { validate = true }: { validate: boolean }) {
    return this.put(square, '', validate);
  }

  // This is the actual piece move on the board
  private movePieceOnBoardAndValidate({
    from,
    to,
    piece,
  }: {
    from: Square;
    to: Square;
    piece: FenBoardPieceSymbol;
  }) {
    const [fromFile, fromRank] = getFileRank(from);
    const [toFile, toRank] = getFileRank(to);
    const nextBoard = ChessFENBoard.setPieceInBoard(
      // Clear the square Board
      ChessFENBoard.setPieceInBoard(
        duplicateMatrix(this.board),
        fromFile,
        fromRank,
        ''
      ),
      toFile,
      toRank,
      piece
    );

    const next = ChessFENBoard.calculateFen(nextBoard, this._state.fenState);

    this._state = {
      board: nextBoard,
      fen: next.fen,
      fenState: next.fenState,
    };
  }

  /**
   * Moves a piece and does all the needed checks and additional moves!
   *
   * @param param0
   * @returns
   */
  move({
    from,
    to,
    promoteTo,
  }: {
    from: Square;
    to: Square;
    promoteTo?: FenBoardPromotionalPieceSymbol;
  }): FenBoardDetailedChessMove {
    const piece = promoteTo || this.piece(from);

    if (!piece) {
      throw new Error(`Move Error: the from square (${from}) was empty!`);
    }

    const castlingMove = this.isCastlingMove({ from, to, piece });
    const enPassant = this.isEnPassantMove({ from, to, piece });

    const capturedPieceViaEnPassant = this.getCapturedPieceViaEnPassant({
      from,
      to,
      piece,
    });

    if (capturedPieceViaEnPassant) {
      // Remove the captured pawn (no need to valdate yet)
      this.clearSquare(capturedPieceViaEnPassant.square, { validate: false });
    }

    const captured = this.piece(to) || capturedPieceViaEnPassant?.piece;

    this.movePieceOnBoardAndValidate({ from, to, piece });

    // Check for castling
    if (castlingMove) {
      const rookPiece = this.piece(castlingMove.rookFrom);
      // Move the rook as well
      if (rookPiece) {
        this.movePieceOnBoardAndValidate({
          from: castlingMove.rookFrom,
          to: castlingMove.rookTo,
          piece: rookPiece,
        });
      }
    }

    const detailedPiece = fenBoardPieceSymbolToDetailedChessPiece(piece);

    const prevFenState = this._state.fenState;

    // Refresh the Fen State
    this.setFenState({
      // turn: prevFenState.turn === 'b' ? 'w' : 'b',
      turn: toShortColor(swapColor(detailedPiece.color)),

      ...(castlingMove && {
        // Remove the castling rights if applied this move
        castlingRights: {
          [detailedPiece.color]: {
            kingSide: false,
            queenSide: false,
          },
        },
      }),

      enPassant,

      /**
       * Half Moves reset when there is a capture or a pawn advance otherwise they increment
       *
       * See this https://www.chess.com/terms/fen-chess#halfmove-clock
       */
      halfMoves:
        captured || detailedPiece.type === 'p' ? 0 : prevFenState.halfMoves + 1,

      /**
       * Full Moves increment when there is a black move (complete turn)
       *
       * See this https://www.chess.com/terms/fen-chess#fullmove-number
       */
      fullMoves: prevFenState.fullMoves + (detailedPiece.color === 'b' ? 1 : 0),
    });

    const san = invoke(() => {
      const getSuffix = () => {
        const chessGame = getNewChessGame({ fen: this.fen });

        if (chessGame.isGameOver()) {
          return '#';
        }

        if (chessGame.inCheck()) {
          return '+';
        }

        return '';
      };

      if (castlingMove) {
        return castlingMove.side === 'k' ? '0-0' : '0-0-0';
      }

      if (promoteTo) {
        return `${to}=${detailedPiece.type.toLocaleUpperCase()}${getSuffix()}`;
      }

      const sanPiece =
        detailedPiece.type === 'p'
          ? ''
          : detailedPiece.type.toLocaleUpperCase();

      const sanCaptured = invoke(() => {
        if (!captured) {
          return '';
        }

        if (detailedPiece.type === 'p') {
          return `${from[0]}x`;
        }

        return 'x';
      });

      return `${sanPiece}${sanCaptured}${to}${getSuffix()}`;
    });

    return {
      color: detailedPiece.color,
      piece: detailedPiece.type,
      captured,
      san,
      to,
      from,
      promoteTo,
    };
  }

  private isCastlingMove({
    from,
    to,
    piece,
  }: {
    from: Square;
    to: Square;
    piece: FenBoardPieceSymbol;
  }): null | { rookFrom: Square; rookTo: Square; side: 'q' | 'k' } {
    if (!isOneOf(piece, ['K', 'k'])) {
      return null;
    }

    // white
    if (piece === 'K') {
      if (!isOneOf(to, ['g1', 'c1'])) {
        return null;
      }

      // If King side
      if (to === 'g1') {
        if (!this._state.fenState.castlingRights.w.kingSide) {
          return null;
        }

        // If there are piece at f1 or g1 fail
        if (this.piece('f1') || this.piece('g1')) {
          return null;
        }

        if (this.piece('h1') !== 'R') {
          return null;
        }

        return { rookFrom: 'h1', rookTo: 'f1', side: 'k' };
      }

      // If Queen side
      else if (to === 'c1') {
        if (!this._state.fenState.castlingRights.w.queenSide) {
          return null;
        }

        if (this.piece('d1') || this.piece('c1')) {
          return null;
        }

        if (this.piece('a1') !== 'R') {
          return null;
        }

        return { rookFrom: 'a1', rookTo: 'd1', side: 'q' };
      }
    }

    // black
    if (piece === 'k') {
      if (!isOneOf(to, ['g8', 'c8'])) {
        return null;
      }

      // If King side
      if (to === 'g8') {
        if (!this._state.fenState.castlingRights.b.kingSide) {
          return null;
        }

        // If there are piece at f1 or g1 fail
        if (this.piece('f8') || this.piece('g8')) {
          return null;
        }

        if (this.piece('h8') !== 'r') {
          return null;
        }

        return { rookFrom: 'h8', rookTo: 'f8', side: 'k' };
      }

      // If Queen side
      else if (to === 'c8') {
        if (!this._state.fenState.castlingRights.b.queenSide) {
          return null;
        }

        if (this.piece('d8') || this.piece('c8')) {
          return null;
        }

        if (this.piece('a8') !== 'r') {
          return null;
        }

        return { rookFrom: 'a8', rookTo: 'd8', side: 'q' };
      }
    }

    return null;
  }

  private isEnPassantMove({
    from,
    to,
    piece,
  }: {
    from: Square;
    to: Square;
    piece: FenBoardPieceSymbol;
  }): Square | undefined {
    if (isOneOf(piece, ['P', 'p'])) {
      const [fileFrom, rankFrom] = from;
      const [fileTo, rankTo] = to;

      if (fileFrom === fileTo) {
        // White
        if (rankFrom === '2' && rankTo === '4') {
          return `${fileFrom}3` as Square;
        }

        // Black
        if (rankFrom === '7' && rankTo === '5') {
          return `${fileFrom}6` as Square;
        }
      }
    }

    return undefined;
  }

  private getCapturedPieceViaEnPassant({
    from,
    to,
    piece,
  }: {
    from: Square;
    to: Square;
    piece: FenBoardPieceSymbol;
  }): { piece: FenBoardPieceSymbol; square: Square } | undefined {
    if (
      this._state.fenState.enPassant &&
      to === this._state.fenState.enPassant && // the fen State enPassant is exactly the to square
      isOneOf(piece, ['p', 'P']) && // the captureer is a pawn
      isOneOf(from[1], ['4', '5']) // the capturer is on the same rank as the captured
    ) {
      const targetRank = to[1] === '3' ? Number(to[1]) + 1 : Number(to[1]) - 1;

      const targetSquare = `${to[0]}${targetRank}` as Square;
      const targetPiece = this.piece(targetSquare);

      if (targetPiece) {
        return {
          piece: targetPiece,
          square: targetSquare,
        };
      }
    }

    return undefined;
  }

  /**
   * Set the current position.
   *
   * @param {string} fen - a position string as FEN
   */
  loadFen(fen: ChessFEN) {
    if (this._state.fen === fen) {
      // They are the same
      return;
    }

    const nextBoard = ChessFENBoard.calculateBoard(fen);

    const nextFenStateResult = ChessFENBoard.extractFenStateString(fen).andThen(
      ChessFENBoard.fenStateAsStringToFenState
    );

    // Throw for now
    if (nextFenStateResult.err) {
      throw nextFenStateResult.val;
    }

    const nextFen = ChessFENBoard.calculateFen(
      nextBoard,
      nextFenStateResult.val
    );

    this._state = {
      board: nextBoard,
      fen: nextFen.fen,
      fenState: nextFen.fenState,
    };
  }

  setFenState(from: DeepPartial<FenState> | FenStateAsString) {
    const prevFen = this.fen;
    const prevFenStringWithoutState =
      ChessFENBoard.extractFenPositionString(prevFen);

    const prevFenState = this._state.fenState;

    const nextState = invoke(() => {
      if (typeof from === 'string') {
        const nextFenStateAsString = from;
        const nextFenStateResult =
          ChessFENBoard.fenStateAsStringToFenState(nextFenStateAsString);

        if (!nextFenStateResult.ok) {
          throw nextFenStateResult.val;
        }

        return {
          ...this._state,
          fen: `${prevFenStringWithoutState} ${nextFenStateAsString}`,
          fenState: nextFenStateResult.val,
        };
      }

      // From is FenState Object

      const nextFenState = deepmerge(prevFenState, from) as FenState;
      const isValidFenStateResult =
        ChessFENBoard.validateFenState(nextFenState);

      if (isValidFenStateResult.err) {
        throw isValidFenStateResult.val;
      }

      const nextFenStateString =
        ChessFENBoard.fenStateToFenStateAsString(nextFenState);

      return {
        ...this._state,
        fen: `${prevFenStringWithoutState} ${nextFenStateString}`,
        fenState: nextFenState,
      };
    });

    ChessFENBoard.validateFenString(nextState.fen).unwrap();

    this._state = {
      ...this._state,
      ...nextState,
    };
  }

  getFenPositionString() {
    return ChessFENBoard.extractFenPositionString(this.fen);
  }

  getFenStateString() {
    return ChessFENBoard.extractFenStateString(this.fen);
  }

  getFenState() {
    return this._state.fenState;
  }

  private static calculateBoard(fromFen: ChessFEN): FENBoard {
    const nextBoard = emptyBoard();

    // TODO: Can optimize a little if fen is starting fen just return the empty board

    let rank = 0;
    let file = 0;
    let fenIndex = 0;

    let fenChar;
    let count;

    while (fenIndex < fromFen.length) {
      fenChar = fromFen[fenIndex];

      if (fenChar === ' ') {
        break; // ignore the rest
      }
      if (fenChar === '/') {
        rank++;
        file = 0;
        fenIndex++;
        continue;
      }

      if (isNaN(parseInt(fenChar, 10))) {
        ChessFENBoard.setPieceInBoard(
          nextBoard,
          file,
          rank,
          fenChar as FenBoardPieceSymbol
        );
        file++;
      } else {
        count = parseInt(fenChar, 10);
        for (let i = 0; i < count; i++) {
          ChessFENBoard.setPieceInBoard(nextBoard, file, rank, '');
          file++;
        }
      }

      fenIndex++;
    }

    return nextBoard;
  }

  /**
   * This is the fenState -> "w KQkq - 0 1"
   *
   * @param fenStateAsString
   * @returns
   */
  private static fenStateAsStringToFenState = (
    fenStateAsString: FenStateAsString
  ): Result<FenState, unknown> => {
    const [turn, castlingRights, enPassant, halfMoves, fullMoves] =
      fenStateAsString.trim().split(' ');

    let state: FenState = ChessFENBoard.STARTING_FEN_STATE;

    if (turn && isShortChessColor(turn)) {
      state = {
        ...state,
        turn,
      };
    } else {
      return new Err('InvalidTurnNotation');
    }

    // KQkq | Kk | Qq | Kq | kQ | -
    if (
      isOneOf(castlingRights, [
        'KQkq',
        'KQk',
        'KQq',
        'Kkq',
        'Qkq',
        'Kk',
        'Kq',
        'Qq',
        'Qk',
        'KQ',
        'kq',
        'K',
        'Q',
        'k',
        'q',
        '-',
      ])
    ) {
      if (castlingRights !== '-') {
        state = {
          ...state,
          castlingRights: {
            w: {
              kingSide: castlingRights.indexOf('K') > -1,
              queenSide: castlingRights.indexOf('Q') > -1,
            },
            b: {
              kingSide: castlingRights.indexOf('k') > -1,
              queenSide: castlingRights.indexOf('q') > -1,
            },
          },
        };
      } else {
        state = {
          ...state,
          castlingRights: {
            w: {
              kingSide: false,
              queenSide: false,
            },
            b: {
              kingSide: false,
              queenSide: false,
            },
          },
        };
      }
    } else {
      return new Err('InvalidCastlingRightsNotation');
    }

    if (enPassant && isOneOf(enPassant, [...SQUARES, '-'])) {
      state = {
        ...state,
        enPassant: enPassant === '-' ? undefined : (enPassant as Square),
      };
    } else {
      return new Err('InvalidEnPassantNotation');
    }

    if (Number(halfMoves) > -1) {
      state = {
        ...state,
        halfMoves: Number(halfMoves),
      };
    } else {
      return new Err('InvalidHalfMovesNotation');
    }

    if (Number(fullMoves) > 0) {
      state = {
        ...state,
        fullMoves: Number(fullMoves),
      };
    } else {
      return new Err('InvalidFullMovesNotation');
    }

    return new Ok(state);
  };

  private static validateFenState(s: FenState) {
    if (s.fullMoves < 1) {
      return new Err('InvalidFenState:InvalidFullMoves');
    }

    if (s.halfMoves < 0) {
      return new Err('InvalidFenState:InvalidHalfMoves');
    }

    return new Ok(s as FenState);
  }

  static validateFenStateAsString(str: string) {
    return ChessFENBoard.fenStateAsStringToFenState(str).map(
      () => str as ChessFENStateNotation
    );
  }

  static validateFenString(str: string) {
    const slots = str.split(' ');

    if (slots.length !== 6) {
      return new Err('InvalidFenState:InvalidNumberOfSlots');
    }

    try {
      getNewChessGame().load(str);

      return new Ok(str as ChessFEN);
    } catch (e) {
      return new Err(e);
    }
  }

  /**
   * Converts FenState to FenStateAsString
   *
   * @param fenState
   * @returns FenStateAsString
   */
  private static fenStateToFenStateAsString(
    fenState: FenState
  ): FenStateAsString {
    const {
      turn,
      castlingRights: cr,
      enPassant,
      halfMoves,
      fullMoves,
    } = fenState;

    const castlingRightsNotation = `${cr.w.kingSide ? 'K' : ''}${
      cr.w.queenSide ? 'Q' : ''
    }${cr.b.kingSide ? 'k' : ''}${cr.b.queenSide ? 'q' : ''}`;

    return `${turn} ${castlingRightsNotation || '-'} ${
      enPassant || '-'
    } ${halfMoves} ${fullMoves}`;
  }

  private static calculateFen(
    fromBoard: FENBoard,
    fenState: FenState,
    validate = true
  ): {
    fen: ChessFEN;
    fenState: FenState;
    fenStateAsString: FenStateAsString;
  } {
    const nextFen = [];
    for (let i = 0; i < 8; i++) {
      let empty = 0;
      for (let j = 0; j < 8; j++) {
        const piece = ChessFENBoard.getPiece(fromBoard, j, i);
        if (piece) {
          if (empty > 0) {
            nextFen.push(empty);
            empty = 0;
          }
          nextFen.push(piece);
        } else {
          empty++;
        }
      }
      if (empty > 0) {
        nextFen.push(empty);
      }
      nextFen.push('/');
    }
    nextFen.pop();

    const isValidFenStateResult = ChessFENBoard.validateFenState(fenState);

    if (isValidFenStateResult.err) {
      throw isValidFenStateResult.val;
    }

    const nextFenStateAsString =
      ChessFENBoard.fenStateToFenStateAsString(fenState);

    const nextFenString = nextFen.join('') + ` ${nextFenStateAsString}`;

    if (validate) {
      ChessFENBoard.validateFenString(nextFenString).unwrap();
    }

    return {
      fen: nextFenString,
      fenState: fenState,
      fenStateAsString: nextFenStateAsString,
    };
  }

  loadBoard(fenBoard: FENBoard) {
    //
  }

  get board() {
    return this._state.board;
  }

  get fen() {
    return this._state.fen;
  }

  getKingSquare(color: Color) {
    const kingSymbol = color === 'b' ? 'k' : 'K';

    let square: Square | undefined = undefined;

    matrixFind(this.board, (p, index) => {
      if (p === kingSymbol) {
        square = matrixIndexToSquare(index);
        return true;
      }

      return false;
    });

    return square;
  }

  getAllPiecesByColor(color: Color): FenBoardPieceSymbol[] {
    return matrixReduce(
      this.board,
      (prev, next) => {
        if (!next) {
          return prev;
        }

        return isPieceSymbolOfColor(color, next) ? [...prev, next] : prev;
      },
      [] as FenBoardPieceSymbol[]
    );
  }

  static extractFenStateString = (fen: ChessFEN) => {
    const notation = fen.slice(fen.indexOf(' ')).trim();

    if (!notation) {
      return new Err('InvalidFen:AbsentNotation'); // TODO: Add a FEN Validator that will throw this error automatically
    }

    return ChessFENBoard.validateFenStateAsString(notation);
  };

  static extractFenPositionString = (fen: ChessFEN) => {
    return fen.slice(0, fen.indexOf(' ')).trim();
  };

  // Note: Sets the piece in place
  private static setPieceInBoard = (
    board: FENBoard,
    file: number,
    rank: number,
    fenChar: FenBoardPieceSymbol | ''
  ) => {
    board[rank][file] = fenChar;

    return board;
  };

  private static getPiece = (board: FENBoard, file: number, rank: number) => {
    return board[rank][file];
  };

  print() {
    printMatrix(this.board);
  }
}
