import { Chess, Move } from 'chess.js';
import {
  ChessColor,
  ChessFEN,
  ChessMove,
  ChessPGN,
  GameOverReason,
  ShortChessColor,
} from './types';
import { DistributivePick } from '../miscType';
import { ChessFENBoard, swapColor } from '../ChessFENBoard';
import { localChessMoveToChessLibraryMove } from './lib';
import { toDictIndexedBy } from '../misc';

type SpecificChessJS = DistributivePick<
  Chess,
  'fen' | 'pgn' | 'move' | 'turn' | 'history' | 'moveNumber'
>;

export class ChessRouler implements SpecificChessJS {
  public chess: Chess = new Chess();

  constructor(
    props?:
      | { pgn: ChessPGN; fen?: undefined }
      | { fen: ChessFEN; pgn?: undefined }
  ) {
    try {
      if (props?.pgn) {
        this.chess.loadPgn(props.pgn);
      }

      if (props?.fen) {
        this.chess.load(props.fen);
      }
    } catch (e) {
      console.error('[ChessRouler] new', e);
    }
  }

  fen = this.chess.fen.bind(this.chess);
  pgn = this.chess.pgn.bind(this.chess);
  turn = this.chess.turn.bind(this.chess);
  history = this.chess.history.bind(this.chess);
  move = this.chess.move.bind(this.chess);
  moveNumber = this.chess.moveNumber.bind(this.chess);

  isValidMove(move: ChessMove) {
    const _instance = new ChessRouler({ pgn: this.pgn() });

    try {
      _instance.move(localChessMoveToChessLibraryMove(move));

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * This is based on the FIDE rule that it is a draw if opponent cannot force mate
   * See this thread: https://www.chess.com/forum/view/general/what-is-considered-insufficient-material#comment-31144738
   *
   * There is distinction between Force Mate and Help Mate, which is the difference between the Fide regulation and the USCIF
   * We're checking for forceMates only here!
   *
   * Note: The case where there are 2 bishops of the same color and a King only, currently returns true, where it should be false!
   *
   * @param color
   * @param fen
   */
  hasSufficientMaterialToForceMate(color: ShortChessColor) {
    const allPiecesByColor = new ChessFENBoard(this.fen()).getAllPiecesByColor(
      color
    );

    if (allPiecesByColor.length > 3) {
      return true;
    }

    const indexedPieces = toDictIndexedBy(
      new ChessFENBoard(this.fen()).getAllPiecesByColor(color),
      (k) => k.toLowerCase()
    );

    if (allPiecesByColor.length === 3) {
      // Check for Knight and Bishop
      if (indexedPieces['b'] && indexedPieces['n']) {
        return true;
      }

      // Otherwise, false with 2 knights
      return !indexedPieces['n'];
    }

    if (allPiecesByColor.length === 2) {
      // False if one of the pieces besides the king is a knight or bishop
      return !(indexedPieces['n'] || indexedPieces['b']);
    }

    // Otherwise false
    return false;
  }

  /**
   * This take sin account "timeouts" and the reasons why a game is completed
   *
   * @param hasTimedOut
   * @returns
   */
  isGameOver(hasTimedOut: ShortChessColor | undefined):
    | {
        over: true;
        reason: GameOverReason;
        isDraw: boolean;
      }
    | {
        over: false;
      } {
    if (hasTimedOut) {
      return {
        over: true,
        reason: GameOverReason['timeout'],

        // According to FIDE, if the player's flag fails (i.e. times out) but the opponent doesn't have sufficient material to force mate
        // the player is awarded a draw, instead of a loss due to timeout
        // See this for more: https://www.chess.com/forum/view/general/what-is-considered-insufficient-material#comment-31144738
        isDraw: !this.hasSufficientMaterialToForceMate(swapColor(hasTimedOut)),
      };
    }

    if (this.chess.isCheckmate()) {
      return {
        over: true,
        reason: GameOverReason['checkmate'],
        isDraw: this.chess.isDraw(),
      };
    }

    if (this.chess.isDraw()) {
      return {
        over: true,
        reason: GameOverReason['draw'],
        isDraw: true,
      };
    }

    if (this.chess.isInsufficientMaterial()) {
      return {
        over: true,
        reason: GameOverReason['insufficientMaterial'],
        isDraw: this.chess.isDraw(),
      };
    }

    if (this.chess.isStalemate()) {
      return {
        over: true,
        reason: GameOverReason['stalemate'],
        isDraw: this.chess.isDraw(),
      };
    }

    if (this.chess.isThreefoldRepetition()) {
      return {
        over: true,
        reason: GameOverReason['threefoldRepetition'],
        isDraw: this.chess.isDraw(),
      };
    }

    return { over: false };
  }

  // Statics

  // /**
  //  * !!! deprecate !!! deprecate !!! deprecate !!! deprecate
  //  * deprecate the need for this!
  //  *
  //  * !!! This is an adapter for now but it should be removed in favor of using that directly
  //  *
  //  * @deprecate
  //  *
  //  * @param m
  //  * @returns
  //  */
  // static localChessMoveToChessLibraryMove = ({
  //   from,
  //   to,
  //   promoteTo,
  // }: ChessMove): ShortChessJsMove => ({
  //   from,
  //   to,
  //   ...(promoteTo && {
  //     promotion: fenBoardPieceSymbolToPieceSymbol(promoteTo),
  //   }),
  // });
}
