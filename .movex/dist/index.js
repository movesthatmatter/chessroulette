"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// movex.config.ts
var movex_config_exports = {};
__export(movex_config_exports, {
  default: () => movex_config_default
});
module.exports = __toCommonJS(movex_config_exports);

// lib/misc/misc.ts
function getRandomInt(givenMin, givenMax) {
  const min = Math.ceil(givenMin);
  const max = Math.floor(givenMax);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
var invoke = (fn) => fn();
function toDictIndexedBy(list, getKey, getVal) {
  if (getVal) {
    return list.reduce(
      (prev, next) => ({
        ...prev,
        [getKey(next)]: getVal(next)
      }),
      {}
    );
  }
  return list.reduce(
    (prev, next) => ({
      ...prev,
      [getKey(next)]: next
    }),
    {}
  );
}
var isOneOf = (k, listOfOptions) => !!k && listOfOptions.indexOf(k) > -1;
var isObject = (m) => m !== null && typeof m === "object";

// lib/ChessRouler/lib/chessColor/lib.ts
var isShortChessColor = (s) => s === "b" || s === "w";
var toShortChessColor = (c) => c[0];
var isWhiteColor = (c) => toShortChessColor(c) === "w";
var getRandomColor = () => ["w", "b"][getRandomInt(0, 1)];

// lib/ChessRouler/lib/misc.ts
var import_chess2 = require("chess.js");

// lib/ChessFENBoard/ChessFENBoard.ts
var import_deepmerge_ts = require("deepmerge-ts");

// lib/ChessFENBoard/util/misc.ts
function swapColor(c) {
  return c === "w" ? "b" : "w";
}
var isUpperCase = (s) => s === s.toUpperCase();

// lib/ChessFENBoard/util/piece.ts
var fenBoardPieceSymbolToDetailedChessPiece = (p) => ({
  type: p.toLowerCase(),
  color: isUpperCase(p) ? "w" : "b"
});
var isPieceSymbolOfColor = (color, p) => color === "w" ? isUpperCase(p) : !isUpperCase(p);
var fenBoardPieceSymbolToPieceSymbol = (p) => p.toLowerCase();
var detailedChessMoveToFreeBoardDetailedChessMove = (m) => ({
  from: m.from,
  to: m.to,
  san: m.san,
  piece: fenBoardPieceSymbolToPieceSymbol(m.piece),
  color: m.color,
  ...m.captured && { captured: fenBoardPieceSymbolToPieceSymbol(m.captured) },
  ...m.promotion && {
    promotion: fenBoardPieceSymbolToPieceSymbol(m.promotion)
  }
});

// lib/matrix/matrix.ts
var identity = (n) => n;
var range = (length, startAt = 0) => Array.from({ length }, (_, i) => i + startAt);
var matrixMap = (matrix, fn) => matrix.map(
  (row, rowIndex) => row.map((val, colIndex) => fn(val, [rowIndex, colIndex]))
);
var matrixForEach = (matrix, fn) => {
  matrixMap(matrix, fn);
};
var matrixFind = (matrix, fn) => {
  for (let i = 0; i <= matrix.length - 1; i++) {
    const result = matrix[i].find((val, colIndex) => fn(val, [i, colIndex]));
    if (result) {
      return result;
      break;
    }
  }
  return void 0;
};
var matrixReduce = (matrix, fn, accum) => {
  let res = accum;
  matrixForEach(matrix, (next, index) => {
    res = fn(res, next, index);
  });
  return res;
};
var duplicateMatrix = (matrix) => matrixMap(matrix, identity);
var printMatrix = (matrix) => {
  let res = "";
  matrix.forEach((row) => {
    const r = row.map((s) => String(s)).map(
      (s) => range(4 - s.length).map(() => " ").join("") + s
    );
    res += `${r.join(" | ")}
`;
  });
  console.dir(res);
};

// lib/ChessFENBoard/util/board.ts
var ranks = { 1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 0 };
var files = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 };
function getFileRank(square) {
  const [file, rank] = square;
  return [
    files[file],
    ranks[Number(rank)]
  ];
}
function emptyBoard() {
  const board = [];
  for (let i = 0; i < 8; i++) {
    board[i] = [];
  }
  return board;
}
var indexedFiles = ["a", "b", "c", "d", "e", "f", "g", "h"];
var matrixIndexToSquare = ([row, col]) => {
  const rank = 8 - row;
  const file = indexedFiles[col];
  return `${file}${rank}`;
};

// lib/ChessFENBoard/ChessFENBoard.ts
var import_chess = require("chess.js");
var import_ts_results = require("ts-results");
var ChessFENBoard = class _ChessFENBoard {
  constructor(fen) {
    this._state = {
      board: _ChessFENBoard.calculateBoard(_ChessFENBoard.STARTING_FEN),
      fen: _ChessFENBoard.STARTING_FEN,
      fenState: _ChessFENBoard.STARTING_FEN_STATE
    };
    if (fen) {
      this.loadFen(fen);
    }
  }
  static {
    this.STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  }
  static {
    this.ONLY_KINGS_FEN = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";
  }
  // '8/8/8/8/8/8/8/8 w - - 0 1'; // TODO: Add ability to have an empty baord
  // This is a get because it's meant to be readonly
  static get STARTING_FEN_STATE() {
    return {
      turn: "w",
      castlingRights: {
        w: { kingSide: true, queenSide: true },
        b: { kingSide: true, queenSide: true }
      },
      enPassant: void 0,
      halfMoves: 0,
      fullMoves: 1
      // This always needs to be bigger than 0
    };
  }
  /**
   * Gets the piece at a square
   *
   * @param {string} square - The square. Eg: "a2"
   * @return {string} piece - the ascii representation of a piece. Eg: "K"
   */
  piece(square) {
    const [file, rank] = getFileRank(square);
    return _ChessFENBoard.getPiece(this._state.board, file, rank);
  }
  /**
   * Places a piece or empty on the given square.
   *
   * @param {string} square - The square. Eg: "a2"
   * @param {string} piece - the ascii representation of a piece. Eg: "K"
   */
  put(square, piece, validate = true) {
    const [file, rank] = getFileRank(square);
    const nextBoard = _ChessFENBoard.setPieceInBoard(
      duplicateMatrix(this.board),
      file,
      rank,
      piece
    );
    const next = _ChessFENBoard.calculateFen(
      nextBoard,
      this._state.fenState,
      validate
    );
    this._state = {
      board: nextBoard,
      fen: next.fen,
      fenState: next.fenState
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
  addPiece(square, piece) {
    return this.put(square, piece, true);
  }
  clearSquare(square, { validate = true }) {
    return this.put(square, "", validate);
  }
  // This is the actual piece move on the board
  movePieceOnBoardAndValidate({
    from,
    to,
    piece
  }) {
    const [fromFile, fromRank] = getFileRank(from);
    const [toFile, toRank] = getFileRank(to);
    const nextBoard = _ChessFENBoard.setPieceInBoard(
      // Clear the square Board
      _ChessFENBoard.setPieceInBoard(
        duplicateMatrix(this.board),
        fromFile,
        fromRank,
        ""
      ),
      toFile,
      toRank,
      piece
    );
    const next = _ChessFENBoard.calculateFen(nextBoard, this._state.fenState);
    this._state = {
      board: nextBoard,
      fen: next.fen,
      fenState: next.fenState
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
    promoteTo
  }) {
    const piece = promoteTo || this.piece(from);
    if (!piece) {
      throw new Error(`Move Error: the from square (${from}) was empty!`);
    }
    const castlingMove = this.isCastlingMove({ from, to, piece });
    const enPassant = this.isEnPassantMove({ from, to, piece });
    const capturedPieceViaEnPassant = this.getCapturedPieceViaEnPassant({
      from,
      to,
      piece
    });
    if (capturedPieceViaEnPassant) {
      this.clearSquare(capturedPieceViaEnPassant.square, { validate: false });
    }
    const captured = this.piece(to) || capturedPieceViaEnPassant?.piece;
    this.movePieceOnBoardAndValidate({ from, to, piece });
    if (castlingMove) {
      const rookPiece = this.piece(castlingMove.rookFrom);
      if (rookPiece) {
        this.movePieceOnBoardAndValidate({
          from: castlingMove.rookFrom,
          to: castlingMove.rookTo,
          piece: rookPiece
        });
      }
    }
    const detailedPiece = fenBoardPieceSymbolToDetailedChessPiece(piece);
    const prevFenState = this._state.fenState;
    this.setFenState({
      // turn: prevFenState.turn === 'b' ? 'w' : 'b',
      turn: swapColor(detailedPiece.color),
      ...castlingMove && {
        // Remove the castling rights if applied this move
        castlingRights: {
          [detailedPiece.color]: {
            kingSide: false,
            queenSide: false
          }
        }
      },
      enPassant,
      /**
       * Half Moves reset when there is a capture or a pawn advance otherwise they increment
       *
       * See this https://www.chess.com/terms/fen-chess#halfmove-clock
       */
      halfMoves: captured || detailedPiece.type === "p" ? 0 : prevFenState.halfMoves + 1,
      /**
       * Full Moves increment when there is a black move (complete turn)
       *
       * See this https://www.chess.com/terms/fen-chess#fullmove-number
       */
      fullMoves: prevFenState.fullMoves + (detailedPiece.color === "b" ? 1 : 0)
    });
    const san = invoke(() => {
      const getSuffix = () => {
        const chessGame = getNewChessGame({ fen: this.fen });
        if (chessGame.isGameOver()) {
          return "#";
        }
        if (chessGame.inCheck()) {
          return "+";
        }
        return "";
      };
      if (castlingMove) {
        return castlingMove.side === "k" ? "0-0" : "0-0-0";
      }
      if (promoteTo) {
        return `${to}=${detailedPiece.type.toLocaleUpperCase()}${getSuffix()}`;
      }
      const sanPiece = detailedPiece.type === "p" ? "" : detailedPiece.type.toLocaleUpperCase();
      const sanCaptured = invoke(() => {
        if (!captured) {
          return "";
        }
        if (detailedPiece.type === "p") {
          return `${from[0]}x`;
        }
        return "x";
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
      promoteTo
    };
  }
  isCastlingMove({
    from,
    to,
    piece
  }) {
    if (!isOneOf(piece, ["K", "k"])) {
      return null;
    }
    if (piece === "K") {
      if (!isOneOf(to, ["g1", "c1"])) {
        return null;
      }
      if (to === "g1") {
        if (!this._state.fenState.castlingRights.w.kingSide) {
          return null;
        }
        if (this.piece("f1") || this.piece("g1")) {
          return null;
        }
        if (this.piece("h1") !== "R") {
          return null;
        }
        return { rookFrom: "h1", rookTo: "f1", side: "k" };
      } else if (to === "c1") {
        if (!this._state.fenState.castlingRights.w.queenSide) {
          return null;
        }
        if (this.piece("d1") || this.piece("c1")) {
          return null;
        }
        if (this.piece("a1") !== "R") {
          return null;
        }
        return { rookFrom: "a1", rookTo: "d1", side: "q" };
      }
    }
    if (piece === "k") {
      if (!isOneOf(to, ["g8", "c8"])) {
        return null;
      }
      if (to === "g8") {
        if (!this._state.fenState.castlingRights.b.kingSide) {
          return null;
        }
        if (this.piece("f8") || this.piece("g8")) {
          return null;
        }
        if (this.piece("h8") !== "r") {
          return null;
        }
        return { rookFrom: "h8", rookTo: "f8", side: "k" };
      } else if (to === "c8") {
        if (!this._state.fenState.castlingRights.b.queenSide) {
          return null;
        }
        if (this.piece("d8") || this.piece("c8")) {
          return null;
        }
        if (this.piece("a8") !== "r") {
          return null;
        }
        return { rookFrom: "a8", rookTo: "d8", side: "q" };
      }
    }
    return null;
  }
  isEnPassantMove({
    from,
    to,
    piece
  }) {
    if (isOneOf(piece, ["P", "p"])) {
      const [fileFrom, rankFrom] = from;
      const [fileTo, rankTo] = to;
      if (fileFrom === fileTo) {
        if (rankFrom === "2" && rankTo === "4") {
          return `${fileFrom}3`;
        }
        if (rankFrom === "7" && rankTo === "5") {
          return `${fileFrom}6`;
        }
      }
    }
    return void 0;
  }
  getCapturedPieceViaEnPassant({
    from,
    to,
    piece
  }) {
    if (this._state.fenState.enPassant && to === this._state.fenState.enPassant && // the fen State enPassant is exactly the to square
    isOneOf(piece, ["p", "P"]) && // the captureer is a pawn
    isOneOf(from[1], ["4", "5"])) {
      const targetRank = to[1] === "3" ? Number(to[1]) + 1 : Number(to[1]) - 1;
      const targetSquare = `${to[0]}${targetRank}`;
      const targetPiece = this.piece(targetSquare);
      if (targetPiece) {
        return {
          piece: targetPiece,
          square: targetSquare
        };
      }
    }
    return void 0;
  }
  /**
   * Set the current position.
   *
   * @param {string} fen - a position string as FEN
   */
  loadFen(fen) {
    if (this._state.fen === fen) {
      return;
    }
    const nextBoard = _ChessFENBoard.calculateBoard(fen);
    const nextFenStateResult = _ChessFENBoard.extractFenStateString(fen).andThen(
      _ChessFENBoard.fenStateAsStringToFenState
    );
    if (nextFenStateResult.err) {
      throw nextFenStateResult.val;
    }
    const nextFen = _ChessFENBoard.calculateFen(
      nextBoard,
      nextFenStateResult.val
    );
    this._state = {
      board: nextBoard,
      fen: nextFen.fen,
      fenState: nextFen.fenState
    };
  }
  setFenState(from) {
    const prevFen = this.fen;
    const prevFenStringWithoutState = _ChessFENBoard.extractFenPositionString(prevFen);
    const prevFenState = this._state.fenState;
    const nextState = invoke(() => {
      if (typeof from === "string") {
        const nextFenStateAsString = from;
        const nextFenStateResult = _ChessFENBoard.fenStateAsStringToFenState(nextFenStateAsString);
        if (!nextFenStateResult.ok) {
          throw nextFenStateResult.val;
        }
        return {
          ...this._state,
          fen: `${prevFenStringWithoutState} ${nextFenStateAsString}`,
          fenState: nextFenStateResult.val
        };
      }
      const nextFenState = (0, import_deepmerge_ts.deepmerge)(prevFenState, from);
      const isValidFenStateResult = _ChessFENBoard.validateFenState(nextFenState);
      if (isValidFenStateResult.err) {
        throw isValidFenStateResult.val;
      }
      const nextFenStateString = _ChessFENBoard.fenStateToFenStateAsString(nextFenState);
      return {
        ...this._state,
        fen: `${prevFenStringWithoutState} ${nextFenStateString}`,
        fenState: nextFenState
      };
    });
    _ChessFENBoard.validateFenString(nextState.fen).unwrap();
    this._state = {
      ...this._state,
      ...nextState
    };
  }
  getFenPositionString() {
    return _ChessFENBoard.extractFenPositionString(this.fen);
  }
  getFenStateString() {
    return _ChessFENBoard.extractFenStateString(this.fen);
  }
  getFenState() {
    return this._state.fenState;
  }
  static calculateBoard(fromFen) {
    const nextBoard = emptyBoard();
    let rank = 0;
    let file = 0;
    let fenIndex = 0;
    let fenChar;
    let count;
    while (fenIndex < fromFen.length) {
      fenChar = fromFen[fenIndex];
      if (fenChar === " ") {
        break;
      }
      if (fenChar === "/") {
        rank++;
        file = 0;
        fenIndex++;
        continue;
      }
      if (isNaN(parseInt(fenChar, 10))) {
        _ChessFENBoard.setPieceInBoard(
          nextBoard,
          file,
          rank,
          fenChar
        );
        file++;
      } else {
        count = parseInt(fenChar, 10);
        for (let i = 0; i < count; i++) {
          _ChessFENBoard.setPieceInBoard(nextBoard, file, rank, "");
          file++;
        }
      }
      fenIndex++;
    }
    return nextBoard;
  }
  static {
    /**
     * This is the fenState -> "w KQkq - 0 1"
     *
     * @param fenStateAsString
     * @returns
     */
    this.fenStateAsStringToFenState = (fenStateAsString) => {
      const [turn, castlingRights, enPassant, halfMoves, fullMoves] = fenStateAsString.trim().split(" ");
      let state = _ChessFENBoard.STARTING_FEN_STATE;
      if (turn && isShortChessColor(turn)) {
        state = {
          ...state,
          turn
        };
      } else {
        return new import_ts_results.Err("InvalidTurnNotation");
      }
      if (isOneOf(castlingRights, [
        "KQkq",
        "KQk",
        "KQq",
        "Kkq",
        "Qkq",
        "Kk",
        "Kq",
        "Qq",
        "Qk",
        "KQ",
        "kq",
        "K",
        "Q",
        "k",
        "q",
        "-"
      ])) {
        if (castlingRights !== "-") {
          state = {
            ...state,
            castlingRights: {
              w: {
                kingSide: castlingRights.indexOf("K") > -1,
                queenSide: castlingRights.indexOf("Q") > -1
              },
              b: {
                kingSide: castlingRights.indexOf("k") > -1,
                queenSide: castlingRights.indexOf("q") > -1
              }
            }
          };
        } else {
          state = {
            ...state,
            castlingRights: {
              w: {
                kingSide: false,
                queenSide: false
              },
              b: {
                kingSide: false,
                queenSide: false
              }
            }
          };
        }
      } else {
        return new import_ts_results.Err("InvalidCastlingRightsNotation");
      }
      if (enPassant && isOneOf(enPassant, [...import_chess.SQUARES, "-"])) {
        state = {
          ...state,
          enPassant: enPassant === "-" ? void 0 : enPassant
        };
      } else {
        return new import_ts_results.Err("InvalidEnPassantNotation");
      }
      if (Number(halfMoves) > -1) {
        state = {
          ...state,
          halfMoves: Number(halfMoves)
        };
      } else {
        return new import_ts_results.Err("InvalidHalfMovesNotation");
      }
      if (Number(fullMoves) > 0) {
        state = {
          ...state,
          fullMoves: Number(fullMoves)
        };
      } else {
        return new import_ts_results.Err("InvalidFullMovesNotation");
      }
      return new import_ts_results.Ok(state);
    };
  }
  static validateFenState(s) {
    if (s.fullMoves < 1) {
      return new import_ts_results.Err("InvalidFenState:InvalidFullMoves");
    }
    if (s.halfMoves < 0) {
      return new import_ts_results.Err("InvalidFenState:InvalidHalfMoves");
    }
    return new import_ts_results.Ok(s);
  }
  static validateFenStateAsString(str) {
    return _ChessFENBoard.fenStateAsStringToFenState(str).map(
      () => str
    );
  }
  static validateFenString(str) {
    const slots = str.split(" ");
    if (slots.length !== 6) {
      return new import_ts_results.Err("InvalidFenState:InvalidNumberOfSlots");
    }
    try {
      getNewChessGame().load(str);
      return new import_ts_results.Ok(str);
    } catch (e) {
      return new import_ts_results.Err(e);
    }
  }
  /**
   * Converts FenState to FenStateAsString
   *
   * @param fenState
   * @returns FenStateAsString
   */
  static fenStateToFenStateAsString(fenState) {
    const {
      turn,
      castlingRights: cr,
      enPassant,
      halfMoves,
      fullMoves
    } = fenState;
    const castlingRightsNotation = `${cr.w.kingSide ? "K" : ""}${cr.w.queenSide ? "Q" : ""}${cr.b.kingSide ? "k" : ""}${cr.b.queenSide ? "q" : ""}`;
    return `${turn} ${castlingRightsNotation || "-"} ${enPassant || "-"} ${halfMoves} ${fullMoves}`;
  }
  static calculateFen(fromBoard, fenState, validate = true) {
    const nextFen = [];
    for (let i = 0; i < 8; i++) {
      let empty = 0;
      for (let j = 0; j < 8; j++) {
        const piece = _ChessFENBoard.getPiece(fromBoard, j, i);
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
      nextFen.push("/");
    }
    nextFen.pop();
    const isValidFenStateResult = _ChessFENBoard.validateFenState(fenState);
    if (isValidFenStateResult.err) {
      throw isValidFenStateResult.val;
    }
    const nextFenStateAsString = _ChessFENBoard.fenStateToFenStateAsString(fenState);
    const nextFenString = nextFen.join("") + ` ${nextFenStateAsString}`;
    if (validate) {
      _ChessFENBoard.validateFenString(nextFenString).unwrap();
    }
    return {
      fen: nextFenString,
      fenState,
      fenStateAsString: nextFenStateAsString
    };
  }
  loadBoard(fenBoard) {
  }
  get board() {
    return this._state.board;
  }
  get fen() {
    return this._state.fen;
  }
  getKingSquare(color) {
    const kingSymbol = color === "b" ? "k" : "K";
    let square = void 0;
    matrixFind(this.board, (p, index) => {
      if (p === kingSymbol) {
        square = matrixIndexToSquare(index);
        return true;
      }
      return false;
    });
    return square;
  }
  getAllPiecesByColor(color) {
    return matrixReduce(
      this.board,
      (prev, next) => {
        if (!next) {
          return prev;
        }
        return isPieceSymbolOfColor(color, next) ? [...prev, next] : prev;
      },
      []
    );
  }
  static {
    this.extractFenStateString = (fen) => {
      const notation = fen.slice(fen.indexOf(" ")).trim();
      if (!notation) {
        return new import_ts_results.Err("InvalidFen:AbsentNotation");
      }
      return _ChessFENBoard.validateFenStateAsString(notation);
    };
  }
  static {
    this.extractFenPositionString = (fen) => {
      return fen.slice(0, fen.indexOf(" ")).trim();
    };
  }
  static {
    // Note: Sets the piece in place
    this.setPieceInBoard = (board, file, rank, fenChar) => {
      board[rank][file] = fenChar;
      return board;
    };
  }
  static {
    this.getPiece = (board, file, rank) => {
      return board[rank][file];
    };
  }
  print() {
    printMatrix(this.board);
  }
};

// lib/ChessRouler/lib/misc.ts
var getNewChessGame = (props) => {
  const instance = new import_chess2.Chess();
  try {
    if (props?.pgn) {
      instance.loadPgn(props.pgn);
      return instance;
    }
    if (props?.fen) {
      instance.load(props.fen);
      return instance;
    }
    return instance;
  } catch (e) {
    console.error("GetNewChessGame", e);
    return instance;
  }
};
var isValidPgn = (s) => {
  const instance = new import_chess2.Chess();
  try {
    instance.loadPgn(s);
    return true;
  } catch {
    return false;
  }
};
var localChessMoveToChessLibraryMove = ({
  from,
  to,
  promoteTo
}) => ({
  from,
  to,
  ...promoteTo && { promotion: fenBoardPieceSymbolToPieceSymbol(promoteTo) }
});

// lib/ChessRouler/ChessRouler.ts
var import_chess3 = require("chess.js");
var ChessRouler = class _ChessRouler {
  constructor(props) {
    this.chess = new import_chess3.Chess();
    this.fen = this.chess.fen.bind(this.chess);
    this.pgn = this.chess.pgn.bind(this.chess);
    this.turn = this.chess.turn.bind(this.chess);
    this.history = this.chess.history.bind(this.chess);
    this.move = this.chess.move.bind(this.chess);
    this.moveNumber = this.chess.moveNumber.bind(this.chess);
    try {
      if (props?.pgn) {
        this.chess.loadPgn(props.pgn);
      }
      if (props?.fen) {
        this.chess.load(props.fen);
      }
    } catch (e) {
      console.error("[ChessRouler] new", e);
    }
  }
  isValidMove(move) {
    const _instance = new _ChessRouler({ pgn: this.pgn() });
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
  hasSufficientMaterialToForceMate(color) {
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
      if (indexedPieces["b"] && indexedPieces["n"]) {
        return true;
      }
      return !indexedPieces["n"];
    }
    if (allPiecesByColor.length === 2) {
      return !(indexedPieces["n"] || indexedPieces["b"]);
    }
    return false;
  }
  /**
   * This take sin account "timeouts" and the reasons why a game is completed
   *
   * @param hasTimedOut
   * @returns
   */
  // TODO: Add winner to this as well!
  isGameOver(hasTimedOut) {
    if (hasTimedOut) {
      const opponentColor = swapColor(hasTimedOut);
      if (!this.hasSufficientMaterialToForceMate(opponentColor)) {
        return {
          over: true,
          reason: 9 /* drawAwardedForInsufficientMaterial */,
          isDraw: true
        };
      }
      return {
        over: true,
        reason: 8 /* timeout */,
        isDraw: false
      };
    }
    if (this.chess.isCheckmate()) {
      return {
        over: true,
        reason: 0 /* checkmate */,
        isDraw: this.chess.isDraw()
      };
    }
    if (this.chess.isDraw()) {
      return {
        over: true,
        reason: 1 /* draw */,
        isDraw: true
      };
    }
    if (this.chess.isInsufficientMaterial()) {
      return {
        over: true,
        reason: 3 /* insufficientMaterial */,
        isDraw: this.chess.isDraw()
      };
    }
    if (this.chess.isStalemate()) {
      return {
        over: true,
        reason: 2 /* stalemate */,
        isDraw: this.chess.isDraw()
      };
    }
    if (this.chess.isThreefoldRepetition()) {
      return {
        over: true,
        reason: 4 /* threefoldRepetition */,
        isDraw: this.chess.isDraw()
      };
    }
    return { over: false };
  }
};

// lib/FreeBoardHistory/FreeBoardHistory.ts
var FreeBoardHistory;
((FreeBoardHistory2) => {
  FreeBoardHistory2.getWhiteNonMove = () => ({
    color: "w",
    san: "...",
    isNonMove: true,
    from: void 0,
    to: void 0
  });
  FreeBoardHistory2.getNonMove = (color) => ({
    color,
    san: "...",
    isNonMove: true,
    from: void 0,
    to: void 0
  });
  const createIndex = (turn, color) => [
    turn,
    color === "b" ? 1 : 0
  ];
  FreeBoardHistory2.getStartingIndex = () => createIndex(-1, "b");
  const isStartingHistoryIndex = (i) => (0, FreeBoardHistory2.areIndexesEqual)((0, FreeBoardHistory2.getStartingIndex)(), i);
  FreeBoardHistory2.isLastIndexInHistoryBranch = (h, i) => !isStartingHistoryIndex(i) && // not the starting one
  (0, FreeBoardHistory2.areIndexesEqual)((0, FreeBoardHistory2.getLastIndexInHistory)(h), i);
  FreeBoardHistory2.areIndexesEqual = (a, b) => {
    if (a === -1 || b === -1) {
      return a === b;
    }
    const [aTurnIndex, aMoveIndex, aRecursiveIndex] = a;
    const [bTurnIndex, bMoveIndex, bRecursiveIndex] = b;
    const recursivesAreEqual = () => {
      if (aRecursiveIndex && bRecursiveIndex) {
        return aRecursiveIndex[1] === bRecursiveIndex[1] && // the parallel history branches are equal
        (0, FreeBoardHistory2.areIndexesEqual)(aRecursiveIndex[0], bRecursiveIndex[0]);
      }
      return typeof aRecursiveIndex === typeof bRecursiveIndex;
    };
    return !!(aTurnIndex === bTurnIndex && aMoveIndex === bMoveIndex && recursivesAreEqual());
  };
  FreeBoardHistory2.incrementIndex = ([
    turn,
    move,
    recursiveIndexes
  ]) => {
    if (recursiveIndexes) {
      if (recursiveIndexes[0] === -1) {
        throw new Error("This is not good. need to change it from -1");
      }
      return [
        turn,
        move,
        recursiveIndexes[1] !== void 0 ? [(0, FreeBoardHistory2.incrementIndex)(recursiveIndexes[0]), recursiveIndexes[1]] : [(0, FreeBoardHistory2.incrementIndex)(recursiveIndexes[0])]
        // don't add undefined for the 2nd position
      ];
    }
    return incrementNonRecursiveIndex([turn, move]);
  };
  const incrementNonRecursiveIndex = ([turn, move]) => move === 1 ? [turn + 1, 0] : [turn, move + 1];
  FreeBoardHistory2.decrementIndex = ([
    turn,
    move,
    recursiveIndexes
  ]) => {
    if (recursiveIndexes) {
      if (recursiveIndexes[0] === -1) {
        throw new Error("This is not good. need to change it from -1");
      }
      const nestedIndex = (0, FreeBoardHistory2.decrementIndex)(recursiveIndexes[0]);
      if (nestedIndex[0] === -1) {
        return [turn, move];
      }
      return [
        turn,
        move,
        [(0, FreeBoardHistory2.decrementIndex)(recursiveIndexes[0]), recursiveIndexes[1]]
      ];
    }
    return decrementNonRecursiveIndex([turn, move]);
  };
  FreeBoardHistory2.decrementIndexAbsolutely = ([
    turn,
    move,
    recursiveIndexes
  ]) => {
    if (recursiveIndexes) {
      if (recursiveIndexes[0] === -1) {
        throw new Error("This is not good. need to change it from -1");
      }
      return [
        turn,
        move,
        [(0, FreeBoardHistory2.decrementIndexAbsolutely)(recursiveIndexes[0]), recursiveIndexes[1]]
      ];
    }
    return decrementNonRecursiveIndex([turn, move]);
  };
  const decrementNonRecursiveIndex = ([turn, move]) => move === 1 ? [turn, move - 1] : [turn - 1, 1];
  FreeBoardHistory2.findMoveAtIndex = (history, atIndex) => {
    const turn = findTurnAtIndex(history, atIndex);
    if (!turn) {
      return void 0;
    }
    return turn[getDeepestIndex(atIndex)[1]];
  };
  const findMoveAtIndexNonRecursively = (history, atIndex) => findTurnAtIndexNonRecursively(history, atIndex)?.[atIndex[1]];
  const findTurnAtIndexNonRecursively = (history, [turnIndex]) => history[turnIndex];
  const findTurnAtIndex = (history, [turn, movePosition, recursiveHistoryIndex]) => {
    if (recursiveHistoryIndex) {
      const [recursiveIndexes, paralelBranchIndex = 0] = recursiveHistoryIndex;
      const nestedHistory = history[turn][movePosition]?.branchedHistories?.[paralelBranchIndex];
      if (!nestedHistory) {
        return void 0;
      }
      return findTurnAtIndex(
        nestedHistory,
        recursiveIndexes === -1 ? (0, FreeBoardHistory2.getLastIndexInHistory)(nestedHistory) : recursiveIndexes
      );
    }
    return history[turn];
  };
  const getDeepestIndex = (index) => {
    const nextNestedIndex = getNextDeepIndex(index);
    return nextNestedIndex ? getDeepestIndex(nextNestedIndex) : index;
  };
  const getNextDeepIndex = ([_, __, nestedIndex]) => {
    if (!nestedIndex) {
      return void 0;
    }
    if (nestedIndex[0] === -1) {
      return void 0;
    }
    return nestedIndex[0];
  };
  const getLastTurnInHistory = (history) => history.slice(-1)[0];
  FreeBoardHistory2.getLastIndexInHistory = (history) => {
    const lastTurn = getLastTurnInHistory(history);
    if (!lastTurn) {
      return (0, FreeBoardHistory2.getStartingIndex)();
    }
    return [history.length - 1, isHalfTurn(lastTurn) ? 0 : 1];
  };
  FreeBoardHistory2.addMagicMove = ({
    history,
    atIndex
  }, move) => {
    if (history.length === 0 && move.color === "b") {
      const [nextHistory] = (0, FreeBoardHistory2.addMove)(history, (0, FreeBoardHistory2.getNonMove)(swapColor(move.color)));
      return (0, FreeBoardHistory2.addMove)(nextHistory, move);
    }
    const prevMove = (0, FreeBoardHistory2.findMoveAtIndex)(history, atIndex);
    const atIncrementedIndex = (0, FreeBoardHistory2.incrementIndex)(atIndex);
    const isLast = !(0, FreeBoardHistory2.findMoveAtIndex)(history, atIncrementedIndex);
    return addMoveWithNonMove({
      history,
      move,
      atIndex: isLast ? atIncrementedIndex : atIndex,
      // if last append, otherwise nest
      prevMove
    });
  };
  const addMoveWithNonMove = ({
    history,
    move,
    atIndex,
    prevMove
  }) => {
    if (prevMove?.color === move.color) {
      const [nextHistory, nextIndex] = (0, FreeBoardHistory2.addMove)(
        history,
        (0, FreeBoardHistory2.getNonMove)(swapColor(move.color)),
        atIndex
      );
      return (0, FreeBoardHistory2.addMove)(nextHistory, move, (0, FreeBoardHistory2.incrementIndex)(nextIndex));
    }
    return (0, FreeBoardHistory2.addMove)(history, move, atIndex);
  };
  FreeBoardHistory2.addMove = (history, move, atIndex) => {
    const hasMoveAtIndex = atIndex && findMoveAtIndexNonRecursively(history, atIndex);
    const isNested = !!hasMoveAtIndex;
    if (isNested) {
      const [turnIndex, moveIndex, recursiveIndexes] = atIndex;
      const prevMoveAtIndex = findMoveAtIndexNonRecursively(history, [
        turnIndex,
        moveIndex
      ]);
      if (!prevMoveAtIndex) {
        throw new Error(
          "AddMoveToChessHistory() Error: This should not happen"
        );
      }
      const prevTurnAtIndex = findTurnAtIndexNonRecursively(history, atIndex);
      if (!prevTurnAtIndex) {
        throw new Error("This should not happen b/c findMoveAtIndex() exists");
      }
      const { nextBranchedHistories, nextIndex } = invoke(
        () => {
          if (recursiveIndexes) {
            const [recursiveHistoryIndex, paralelBranchesIndex = 0] = recursiveIndexes;
            const [nextHistoryBranch2, nextNestedIndex] = (0, FreeBoardHistory2.addMove)(
              prevMoveAtIndex.branchedHistories?.[paralelBranchesIndex] || [],
              move,
              recursiveHistoryIndex === -1 ? void 0 : recursiveHistoryIndex
            );
            const nextBranchedHistories3 = [
              ...(prevMoveAtIndex.branchedHistories || []).slice(
                0,
                paralelBranchesIndex
              ),
              nextHistoryBranch2,
              ...(prevMoveAtIndex.branchedHistories || []).slice(
                paralelBranchesIndex + 1
              )
            ];
            return {
              nextBranchedHistories: nextBranchedHistories3,
              nextIndex: [
                turnIndex,
                moveIndex,
                [nextNestedIndex, paralelBranchesIndex]
              ]
            };
          }
          const nextBranchedTurn = isWhiteMove(move) ? [move] : [(0, FreeBoardHistory2.getWhiteNonMove)(), move];
          const nextHistoryBranch = [
            // ...(prevMoveAtIndex.branchedHistories?.[0] || []),
            nextBranchedTurn
          ];
          const nextBranchedHistories2 = [
            ...prevMoveAtIndex.branchedHistories || [],
            nextHistoryBranch
          ];
          const nextRecursiveIndexes = [
            [...(0, FreeBoardHistory2.getLastIndexInHistory)(nextHistoryBranch)],
            nextBranchedHistories2.length - 1
            // The last branch
          ];
          const nextIndex2 = [
            turnIndex,
            moveIndex,
            nextRecursiveIndexes
          ];
          return { nextBranchedHistories: nextBranchedHistories2, nextIndex: nextIndex2 };
        }
      );
      const nextMove = {
        ...prevMoveAtIndex,
        branchedHistories: nextBranchedHistories
      };
      const nextTurn = updateOrInsertMoveInTurn(
        prevTurnAtIndex,
        nextMove
      );
      const nextHistory2 = [
        ...history.slice(0, turnIndex),
        nextTurn,
        ...history.slice(turnIndex + 1)
      ];
      return [nextHistory2, nextIndex];
    }
    const nextHistory = invoke(() => {
      const prevTurn = getLastTurnInHistory(history);
      if (prevTurn && isHalfTurn(prevTurn)) {
        const [historyWithoutLastTurn] = (0, FreeBoardHistory2.sliceHistory)(
          history,
          (0, FreeBoardHistory2.getLastIndexInHistory)(history)
        );
        return [
          ...historyWithoutLastTurn,
          [prevTurn[0], move]
        ];
      }
      return [...history, [move]];
    });
    return [nextHistory, (0, FreeBoardHistory2.getLastIndexInHistory)(nextHistory)];
  };
  const isIndexLowerThan = (a, b) => {
    if (a[0] < b[0]) {
      return true;
    }
    if (a[0] === b[0] && a[1] < b[1]) {
      return true;
    }
    if (a[0] === b[0] && a[1] === b[1] && a[2] && b[2] && a[2][0] !== -1 && b[2][0] !== -1) {
      return isIndexLowerThan(a[2][0], b[2][0]);
    }
    return false;
  };
  FreeBoardHistory2.sliceHistory = (history, toIndex) => {
    const [turnIndex, movePosition, recursiveIndexes] = toIndex;
    if (recursiveIndexes) {
      const [nestedIndex, branchIndex = 0] = recursiveIndexes;
      if (nestedIndex === -1) {
        return [history, (0, FreeBoardHistory2.getLastIndexInHistory)(history)];
      }
      const turnsToIndexExclusively2 = history.slice(0, turnIndex);
      const turnAtIndex2 = history[turnIndex];
      if (!turnAtIndex2) {
        return [
          turnsToIndexExclusively2,
          (0, FreeBoardHistory2.getLastIndexInHistory)(turnsToIndexExclusively2)
        ];
      }
      const moveAtIndex = turnAtIndex2[movePosition];
      if (!moveAtIndex?.branchedHistories?.[branchIndex]) {
        return [history, (0, FreeBoardHistory2.getLastIndexInHistory)(history)];
      }
      const [nextBranch, slicedAtNestedIndex] = (0, FreeBoardHistory2.sliceHistory)(
        moveAtIndex.branchedHistories[branchIndex],
        nestedIndex
      );
      const nextBranchedHistories = [
        ...moveAtIndex.branchedHistories.slice(0, branchIndex),
        ...nextBranch.length > 0 ? [nextBranch] : [],
        // Ensures the empty arrays doesn't get added
        ...moveAtIndex.branchedHistories.slice(branchIndex + 1)
      ];
      const nextMove = {
        ...moveAtIndex,
        branchedHistories: nextBranchedHistories.length > 0 ? nextBranchedHistories : void 0
      };
      const nextTurn = movePosition === 0 ? [nextMove, turnAtIndex2[1]] : [turnAtIndex2[0], nextMove];
      const nextHistory2 = [
        ...turnsToIndexExclusively2,
        nextTurn,
        ...history.slice(turnIndex + 1)
        // turnsFromIndex
      ];
      return [
        nextHistory2,
        [
          turnIndex,
          movePosition,
          // Don't add the nested index if starting position, instead let it jump to the root generation
          (0, FreeBoardHistory2.areIndexesEqual)(slicedAtNestedIndex, (0, FreeBoardHistory2.getStartingIndex)()) ? void 0 : (
            // Don't add the branch index if 0
            [slicedAtNestedIndex, branchIndex > 0 ? branchIndex : void 0]
          )
        ]
      ];
    }
    if (isIndexLowerThan(toIndex, [0, 1])) {
      return [[], (0, FreeBoardHistory2.getStartingIndex)()];
    }
    const [decTurnIndex, decMovePosition] = (0, FreeBoardHistory2.decrementIndexAbsolutely)([
      turnIndex,
      movePosition
    ]);
    const turnsToIndexExclusively = history.slice(
      0,
      decTurnIndex
    );
    const turnAtIndex = history[decTurnIndex];
    if (!turnAtIndex) {
      return [
        turnsToIndexExclusively,
        (0, FreeBoardHistory2.getLastIndexInHistory)(turnsToIndexExclusively)
      ];
    }
    const nextHistory = [
      ...turnsToIndexExclusively,
      decMovePosition === 0 ? [turnAtIndex[0]] : turnAtIndex
    ];
    return [nextHistory, (0, FreeBoardHistory2.getLastIndexInHistory)(nextHistory)];
  };
  FreeBoardHistory2.removeTrailingNonMoves = (history) => {
    const lastTurn = getLastTurnInHistory(history);
    if (!lastTurn) {
      return history;
    }
    const [whiteMove, blackMove] = lastTurn;
    const baseHistory = history.slice(0, -1);
    if (!blackMove) {
      if (whiteMove.isNonMove) {
        return (0, FreeBoardHistory2.removeTrailingNonMoves)(baseHistory);
      }
    } else if (blackMove.isNonMove) {
      return (0, FreeBoardHistory2.removeTrailingNonMoves)([
        ...baseHistory,
        [whiteMove]
      ]);
    }
    return history;
  };
  FreeBoardHistory2.calculateLinearHistoryToIndex = (history, atIndex) => {
    const appendMovesRecursively = (index, cache = []) => {
      const moveAtIndex = (0, FreeBoardHistory2.findMoveAtIndex)(history, index);
      if (!moveAtIndex) {
        return cache;
      }
      if (moveAtIndex.isNonMove) {
        return [
          ...appendMovesRecursively((0, FreeBoardHistory2.decrementIndex)(index), cache)
        ];
      }
      const { branchedHistories, ...moveAtIndexWithoutNested } = moveAtIndex;
      return [
        ...appendMovesRecursively((0, FreeBoardHistory2.decrementIndex)(index), cache),
        moveAtIndexWithoutNested
      ];
    };
    return appendMovesRecursively(atIndex);
  };
  const updateOrInsertMoveInTurn = (turn, move) => isWhiteMove(move) ? [move, ...turn.slice(1)] : [turn[0], move];
  const isFullTurn = (mt) => !!mt[1];
  const isHalfTurn = (mt) => !isFullTurn(mt);
  const isWhiteMove = (m) => isWhiteColor(m.color);
  FreeBoardHistory2.pgnToHistory = (pgn) => linearToTurnHistory(getNewChessGame({ pgn }).history({ verbose: true }));
  FreeBoardHistory2.historyToFen = (h, startingFen = ChessFENBoard.STARTING_FEN) => {
    const fenBoard = new ChessFENBoard(startingFen);
    h.forEach(([wM, bM]) => {
      if (!wM.isNonMove) {
        fenBoard.move(wM);
      }
      if (bM && !bM.isNonMove) {
        fenBoard.move(bM);
      }
    });
    return fenBoard.fen;
  };
  const linearToTurnHistory = (linearHistory) => {
    const { turns, cached } = linearHistory.map(detailedChessMoveToFreeBoardDetailedChessMove).reduce(
      (prev, nextMove, i) => {
        if (i % 2 === 0) {
          if (nextMove.color === "w") {
            return {
              ...prev,
              cached: nextMove
            };
          } else {
            throw new Error(
              `LinearToTurnHistory Error: Move (${i}) ${nextMove.from} ${nextMove.to} is not of correct color!`
            );
          }
        }
        const nextTurn = [prev.cached, nextMove];
        return {
          cached: void 0,
          turns: [...prev.turns, nextTurn]
        };
      },
      { turns: [], cached: void 0 }
    );
    return cached ? [...turns, [cached]] : turns;
  };
  FreeBoardHistory2.findNextValidMoveIndex = (history, index, dir) => {
    if (history.length === 0) {
      return FreeBoardHistory2.getStartingIndex();
    }
    const nextIndex = dir === "right" ? FreeBoardHistory2.incrementIndex(index) : FreeBoardHistory2.decrementIndex(index);
    const foundMove = FreeBoardHistory2.findMoveAtIndex(history, nextIndex);
    if (!foundMove) {
      if (dir === "left") {
        return nextIndex;
      }
      return index;
    }
    if (foundMove.isNonMove) {
      return (0, FreeBoardHistory2.findNextValidMoveIndex)(history, nextIndex, dir);
    }
    return nextIndex;
  };
  FreeBoardHistory2.renderIndex = ([turn, move, nestedIndex]) => {
    const nested = invoke(() => {
      if (!nestedIndex) {
        return "";
      }
      if (nestedIndex[0] === -1) {
        return " -1";
      }
      return ", " + (0, FreeBoardHistory2.renderIndex)(nestedIndex[0]) + (nestedIndex[1] && nestedIndex[1] > 0 ? `:${nestedIndex[1]}` : "");
    });
    return `[${turn}, ${move}${nested}]`;
  };
})(FreeBoardHistory || (FreeBoardHistory = {}));

// modules/Room/activities/Learn/movex/state.ts
var initialChapterState = {
  name: "New Chapter",
  // TODO: Should it have a name?
  displayFen: ChessFENBoard.STARTING_FEN,
  arrowsMap: {},
  circlesMap: {},
  notation: {
    history: [],
    focusedIndex: FreeBoardHistory.getStartingIndex(),
    startingFen: ChessFENBoard.STARTING_FEN
  },
  orientation: "w"
};
var initialDefaultChapter = {
  ...initialChapterState,
  name: "Chapter 1",
  id: "0"
};
var initialLearnStateActivityState = {
  chaptersMap: {
    [initialDefaultChapter.id]: initialDefaultChapter
  },
  loadedChapterId: initialDefaultChapter.id,
  chaptersIndex: 1
};

// modules/Room/activities/Learn/movex/reducer.ts
var findLoadedChapter = (activityState) => activityState.chaptersMap[activityState.loadedChapterId];
var reducer = (prev = initialActivityState, action) => {
  if (prev.activityType !== "learn") {
    return prev;
  }
  if (action.type === "loadedChapter:addMove") {
    try {
      const prevChapter = findLoadedChapter(prev.activityState);
      if (!prevChapter) {
        console.error("The loaded chapter was not found");
        return prev;
      }
      const move = action.payload;
      const fenBoard = new ChessFENBoard(prevChapter.displayFen);
      const fenPiece = fenBoard.piece(move.from);
      if (!fenPiece) {
        console.error("Action Err", action, prev, fenBoard.board);
        throw new Error(`No Piece at ${move.from}`);
      }
      const nextMove = fenBoard.move(move);
      const [nextHistory, addedAtIndex] = FreeBoardHistory.addMagicMove(
        {
          history: prevChapter.notation.history,
          atIndex: prevChapter.notation.focusedIndex
        },
        nextMove
      );
      const nextChapter = {
        ...prevChapter,
        displayFen: fenBoard.fen,
        circlesMap: {},
        arrowsMap: {},
        notation: {
          ...prevChapter.notation,
          history: nextHistory,
          focusedIndex: addedAtIndex
        }
      };
      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [prevChapter.id]: nextChapter
          }
        }
      };
    } catch (e) {
      console.error("Action Error", action, prev, e);
      return prev;
    }
  }
  if (action.type === "loadedChapter:import") {
    const prevChapter = findLoadedChapter(prev.activityState);
    if (!prevChapter) {
      console.error("The chapter wasnt found");
      return prev;
    }
    if (action.payload.input.type === "FEN") {
      if (!ChessFENBoard.validateFenString(action.payload.input.val).ok) {
        console.log("not valid fen");
        return prev;
      }
      const nextFen = action.payload.input.val;
      const nextChapterState = {
        ...prevChapter,
        displayFen: nextFen,
        // When importing PGNs set the notation from this fen
        notation: {
          startingFen: nextFen,
          history: [],
          focusedIndex: FreeBoardHistory.getStartingIndex()
        }
      };
      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [prevChapter.id]: {
              ...prev.activityState.chaptersMap[prevChapter.id],
              ...nextChapterState
            }
          }
        }
      };
    }
    if (action.payload.input.type === "PGN") {
      if (!isValidPgn(action.payload.input.val)) {
        console.log("not valid pgn");
        return prev;
      }
      const chessGame = getNewChessGame({
        pgn: action.payload.input.val
      });
      const nextHistory = FreeBoardHistory.pgnToHistory(
        action.payload.input.val
      );
      const nextChapterState = {
        ...prevChapter,
        displayFen: chessGame.fen(),
        // When importing PGNs set the notation history as well
        notation: {
          startingFen: ChessFENBoard.STARTING_FEN,
          history: nextHistory,
          focusedIndex: FreeBoardHistory.getLastIndexInHistory(nextHistory)
        }
      };
      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [prevChapter.id]: {
              ...prev.activityState.chaptersMap[prevChapter.id],
              ...nextChapterState
            }
          }
        }
      };
    }
  }
  if (action.type === "loadedChapter:focusHistoryIndex") {
    const prevChapter = findLoadedChapter(prev.activityState);
    if (!prevChapter) {
      console.error("The chapter wasnt found");
      return prev;
    }
    const historyAtFocusedIndex = FreeBoardHistory.calculateLinearHistoryToIndex(
      prevChapter.notation.history,
      action.payload
    );
    const fenBoard = new ChessFENBoard(prevChapter.notation.startingFen);
    historyAtFocusedIndex.forEach((m) => {
      if (!m.isNonMove) {
        fenBoard.move(m);
      }
    });
    const nextChapterState = {
      ...prevChapter,
      displayFen: fenBoard.fen,
      notation: {
        ...prevChapter.notation,
        focusedIndex: action.payload
      }
    };
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [prevChapter.id]: {
            ...prev.activityState.chaptersMap[prevChapter.id],
            ...nextChapterState
          }
        }
      }
    };
  }
  if (action.type === "loadedChapter:deleteHistoryMove") {
    const prevChapter = findLoadedChapter(prev.activityState);
    if (!prevChapter) {
      console.error("No loaded chapter");
      return prev;
    }
    const [slicedHistory, lastIndexInSlicedHistory] = FreeBoardHistory.sliceHistory(
      prevChapter.notation.history,
      action.payload
    );
    const nextHistory = FreeBoardHistory.removeTrailingNonMoves(slicedHistory);
    const nextIndex = FreeBoardHistory.findNextValidMoveIndex(
      nextHistory,
      FreeBoardHistory.incrementIndex(lastIndexInSlicedHistory),
      "left"
    );
    const fenBoard = new ChessFENBoard(prevChapter.notation.startingFen);
    nextHistory.forEach((turn, i) => {
      turn.forEach((m) => {
        if (m.isNonMove) {
          return;
        }
        fenBoard.move(m);
      });
    });
    const nextFen = fenBoard.fen;
    const nextChapter = {
      ...prevChapter,
      displayFen: nextFen,
      circlesMap: {},
      arrowsMap: {},
      notation: {
        ...prevChapter.notation,
        history: nextHistory,
        focusedIndex: nextIndex
      }
    };
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapter.id]: nextChapter
        }
      }
    };
  }
  if (action.type === "loadedChapter:setOrientation") {
    const prevChapter = findLoadedChapter(prev.activityState);
    if (!prevChapter) {
      console.error("No loaded chapter");
      return prev;
    }
    const nextChapter = {
      ...prevChapter,
      orientation: action.payload.color
    };
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapter.id]: nextChapter
        }
      }
    };
  }
  if (action.type === "loadedChapter:setArrows") {
    const prevChapter = findLoadedChapter(prev.activityState);
    if (!prevChapter) {
      console.error("No loaded chapter");
      return prev;
    }
    const nextChapter = {
      ...prevChapter,
      arrowsMap: action.payload
    };
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapter.id]: nextChapter
        }
      }
    };
  }
  if (action.type === "loadedChapter:drawCircle") {
    const prevChapter = findLoadedChapter(prev.activityState);
    if (!prevChapter) {
      console.error("No loaded chapter");
      return prev;
    }
    const [at, hex] = action.payload;
    const circleId = `${at}`;
    const { [circleId]: existent, ...restOfCirlesMap } = prevChapter.circlesMap;
    const nextChapter = {
      ...prevChapter,
      circlesMap: {
        ...restOfCirlesMap,
        ...!!existent ? void 0 : { [circleId]: action.payload }
      }
    };
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapter.id]: nextChapter
        }
      }
    };
  }
  if (action.type === "loadedChapter:clearCircles") {
    const prevChapter = findLoadedChapter(prev.activityState);
    if (!prevChapter) {
      console.error("No loaded chapter");
      return prev;
    }
    const nextChapter = {
      ...prevChapter,
      circlesMap: {}
    };
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapter.id]: nextChapter
        }
      }
    };
  }
  if (action.type === "loadedChapter:updateFen") {
    const prevChapter = findLoadedChapter(prev.activityState);
    if (!prevChapter) {
      console.error("No loaded chapter");
      return prev;
    }
    const nextFen = action.payload;
    const nextChapter = {
      ...prevChapter,
      displayFen: nextFen,
      arrowsMap: {},
      circlesMap: {},
      // Ensure the notation resets each time there is an update (the starting fen might change)
      notation: {
        ...initialChapterState.notation,
        // this needs to always start from the given fen, otherwise issues may arise
        startingFen: nextFen
      }
    };
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapter.id]: nextChapter
        }
      }
    };
  }
  if (action.type === "createChapter") {
    const nextChapterIndex = prev.activityState.chaptersIndex + 1;
    const nextChapterId = String(nextChapterIndex);
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapterId]: {
            id: nextChapterId,
            ...action.payload
          }
        },
        loadedChapterId: nextChapterId,
        chaptersIndex: nextChapterIndex
      }
    };
  }
  if (action.type === "updateChapter") {
    const { [action.payload.id]: prevChapter } = prev.activityState.chaptersMap;
    const nextChapter = {
      ...prevChapter,
      ...action.payload.state,
      // Ensure the notation resets each time there is an update (the starting fen might change)
      notation: action.payload.state.notation || initialChapterState.notation
    };
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapter.id]: nextChapter
        },
        loadedChapterId: nextChapter.id
      }
    };
  }
  if (action.type === "deleteChapter") {
    const { [action.payload.id]: removed, ...restChapters } = prev.activityState.chaptersMap;
    const nextChapters = Object.keys(restChapters).length > 0 ? restChapters : {
      [initialDefaultChapter.id]: initialDefaultChapter
    };
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: nextChapters
      }
    };
  }
  if (action.type === "loadChapter") {
    const { [action.payload.id]: chapter } = prev.activityState.chaptersMap;
    if (!chapter) {
      return prev;
    }
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        loadedChapterId: chapter.id
      }
    };
  }
  return prev;
};

// modules/Room/activities/Match/movex/state.ts
var initialMatchActivityState = {
  activityType: "match",
  activityState: null
};

// modules/Game/state.ts
var PENDING_UNTIMED_GAME = {
  status: "pending",
  winner: null,
  startedAt: null,
  pgn: "",
  timeLeft: {
    lastUpdatedAt: null,
    w: 0,
    b: 0
  },
  lastMoveBy: "b",
  lastMoveAt: null,
  timeClass: "untimed",
  gameOverReason: null,
  // TODO: This doesn't need to be an array and it doesn't need to be always defined
  offers: [],
  players: {
    w: "N/A",
    b: "N/A"
  }
};

// modules/Game/constants.ts
var chessGameTimeLimitMsMap = {
  bullet: 6e4,
  blitz: 3e5,
  blitz3: 18e4,
  rapid: 6e5,
  untimed: -1
};

// modules/Game/operations.ts
var createPendingGame = ({
  timeClass,
  players
}) => {
  const timeLeft = chessGameTimeLimitMsMap[timeClass];
  return {
    ...PENDING_UNTIMED_GAME,
    timeClass,
    timeLeft: {
      lastUpdatedAt: null,
      w: timeLeft,
      b: timeLeft
    },
    players
  };
};

// modules/Match/Play/store/state.ts
var initialPlayState = PENDING_UNTIMED_GAME;

// modules/Match/Play/store/util.ts
var calculateTimeLeftAt = ({
  at,
  turn,
  prevTimeLeft
}) => {
  const timeSince = at - prevTimeLeft.lastUpdatedAt;
  const nextTimeLeftForTurn = prevTimeLeft[turn] - timeSince;
  return {
    ...prevTimeLeft,
    [turn]: nextTimeLeftForTurn > 0 ? nextTimeLeftForTurn : 0,
    // Only update this if actually it is different
    ...nextTimeLeftForTurn !== prevTimeLeft[turn] && {
      lastUpdatedAt: at
    }
  };
};

// lib/Logsy.ts
var globalDisabled = false;
var globalLogsyConfigWrapper = {
  config: {
    disabled: false,
    verbose: false
  }
};
var Logsy = class _Logsy {
  constructor(prefix = "", disabled = false, globalConfig) {
    this.prefix = prefix;
    this.globalConfig = globalConfig;
    this.handler = (method, message, ...optionalParams) => {
      if (!this.ON || globalLogsyConfigWrapper.config.disabled) {
        return;
      }
      if ((method === "log" || method === "info" || method === "debug") && !globalLogsyConfigWrapper.config.verbose) {
        return;
      }
      const prefix = this.hasGroupOpen() ? "" : this.prefix;
      if (typeof message === "string") {
        console[method](prefix + " " + message, ...optionalParams);
      } else {
        console[method](prefix, message, ...optionalParams);
      }
    };
    this.ON = globalDisabled || true;
    this.activeGroups = 0;
    this.log = (message, ...optionalParams) => {
      this.handler("log", message, ...optionalParams);
    };
    this.info = (message, ...optionalParams) => {
      this.handler("info", message, ...optionalParams);
    };
    this.warn = (message, ...optionalParams) => {
      this.handler("warn", message, ...optionalParams);
    };
    this.error = (message, ...optionalParams) => {
      this.handler("error", message, ...optionalParams);
    };
    this.group = (message, ...optionalParams) => {
      this.handler("group", message, ...optionalParams);
      this.openGroup();
    };
    this.groupEnd = () => {
      this.handler("groupEnd");
      this.closeGroup();
    };
    this.openGroup = () => {
      this.activeGroups = this.activeGroups + 1;
    };
    this.closeGroup = () => {
      if (this.activeGroups > 0) {
        this.activeGroups = this.activeGroups - 1;
      } else {
        this.activeGroups = 0;
      }
    };
    this.hasGroupOpen = () => this.activeGroups > 0;
    this.debug = (message, ...optionalParams) => {
      this.handler("debug", message, ...optionalParams);
    };
    this.withNamespace = (s) => {
      return new _Logsy(this.prefix + s);
    };
    if (disabled) {
      this.disable();
    }
  }
  enable() {
    this.ON = true;
    if (this.globalConfig) {
      this.globalConfig.config.disabled = false;
    }
  }
  disable() {
    this.ON = false;
    if (this.globalConfig) {
      this.globalConfig.config.disabled = true;
    }
  }
};
var globalLogsy = new Logsy("", false, globalLogsyConfigWrapper);
var logsy = globalLogsy;

// modules/Match/Play/store/reducer.ts
var reducer2 = (prev = initialPlayState, action) => {
  if (action.type === "play:start") {
    if (prev.status !== "pending") {
      return prev;
    }
    return {
      ...prev,
      status: "idling",
      startedAt: action.payload.at,
      lastMoveAt: null,
      players: action.payload.players
    };
  }
  if (action.type === "play:move") {
    if (!(prev.status === "idling" || prev.status === "ongoing")) {
      return prev;
    }
    const { lastMoveBy, pgn } = prev;
    const { moveAt } = action.payload;
    const chessRouler = new ChessRouler({ pgn });
    try {
      chessRouler.move(localChessMoveToChessLibraryMove(action.payload));
    } catch (error) {
      logsy.error('[Play Reducer] ActionError - "Invalid Move"', {
        action,
        prev,
        error
      });
      return prev;
    }
    const nextLastMoveBy = swapColor(lastMoveBy);
    const commonPrevGameProps = {
      timeClass: prev.timeClass,
      offers: prev.offers,
      players: prev.players
    };
    const commonNextGameProps = {
      pgn: chessRouler.pgn(),
      lastMoveBy: nextLastMoveBy,
      lastMoveAt: moveAt
    };
    if (prev.status === "idling") {
      const canAdvanceToOngoing = chessRouler.moveNumber() >= 2;
      const nextStatus = canAdvanceToOngoing ? "ongoing" : "idling";
      if (nextStatus === "idling") {
        return {
          ...prev,
          ...commonNextGameProps
        };
      }
      return {
        ...commonPrevGameProps,
        ...commonNextGameProps,
        status: "ongoing",
        // Copy this over from the "idling" state
        startedAt: prev.startedAt,
        // When moving from Idling to Ongoing (aka. on first black move), the timeLeft doesn't change
        timeLeft: {
          ...prev.timeLeft,
          lastUpdatedAt: moveAt
        },
        winner: null,
        gameOverReason: null
      };
    }
    const nextTimeLeft = calculateTimeLeftAt({
      at: moveAt,
      turn: nextLastMoveBy,
      prevTimeLeft: prev.timeLeft
    });
    const isGameOverResult = chessRouler.isGameOver(
      prev.timeClass !== "untimed" && nextTimeLeft[nextLastMoveBy] <= 0 ? nextLastMoveBy : void 0
    );
    if (isGameOverResult.over) {
      const nextWinner = invoke(() => {
        if (isGameOverResult.isDraw) {
          return "1/2";
        }
        return isGameOverResult.reason === 8 /* timeout */ ? prev.lastMoveBy : nextLastMoveBy;
      });
      return {
        ...commonPrevGameProps,
        ...commonNextGameProps,
        startedAt: prev.startedAt,
        status: "complete",
        winner: nextWinner,
        timeLeft: nextTimeLeft,
        gameOverReason: isGameOverResult.reason
      };
    }
    return {
      ...commonPrevGameProps,
      ...commonNextGameProps,
      status: "ongoing",
      startedAt: prev.startedAt,
      winner: null,
      timeLeft: nextTimeLeft,
      gameOverReason: null
    };
  }
  if (action.type === "play:abortGame") {
    if (prev.status === "idling") {
      return {
        ...prev,
        status: "aborted"
      };
    }
    return prev;
  }
  if (action.type === "play:checkTime") {
    if (prev.status !== "ongoing") {
      return prev;
    }
    const lastOffer = prev.offers.length > 0 && prev.offers[prev.offers.length - 1].status === "pending" ? {
      ...prev.offers[prev.offers.length - 1],
      status: "cancelled"
    } : void 0;
    const turn = swapColor(prev.lastMoveBy);
    const nextTimeLeft = calculateTimeLeftAt({
      at: action.payload.at,
      turn,
      prevTimeLeft: prev.timeLeft
    });
    if (nextTimeLeft[turn] <= 0) {
      const gameOverResult = new ChessRouler({
        pgn: prev.pgn
      }).isGameOver(turn);
      const nextWinnerAndGameOverReason = invoke(() => {
        if (gameOverResult.over && gameOverResult.isDraw) {
          return {
            winner: "1/2",
            gameOverReason: 9 /* drawAwardedForInsufficientMaterial */
          };
        }
        return {
          winner: prev.lastMoveBy,
          gameOverReason: 8 /* timeout */
        };
      });
      return {
        ...prev,
        status: "complete",
        ...nextWinnerAndGameOverReason,
        timeLeft: nextTimeLeft,
        ...lastOffer && {
          gameOffers: [...prev.offers.slice(0, -1), lastOffer]
        }
      };
    }
  }
  if (action.type === "play:resignGame") {
    if (prev.status !== "ongoing") {
      return prev;
    }
    return {
      ...prev,
      status: "complete",
      winner: swapColor(action.payload.color),
      gameOverReason: 5 /* resignation */
    };
  }
  if (action.type === "play:sendOffer") {
    const { byPlayer, offerType } = action.payload;
    const nextOffers = [
      ...prev.offers,
      {
        byPlayer,
        type: offerType,
        status: "pending",
        ...action.payload.timestamp && {
          timestamp: action.payload.timestamp
        }
      }
    ];
    return {
      ...prev,
      offers: nextOffers
    };
  }
  if (action.type === "play:acceptOfferDraw") {
    if (prev.status !== "ongoing") {
      return prev;
    }
    const lastOffer = {
      ...prev.offers[prev.offers.length - 1],
      status: "accepted"
    };
    const nextOffers = [...prev.offers.slice(0, -1), lastOffer];
    return {
      ...prev,
      status: "complete",
      winner: "1/2",
      offers: nextOffers,
      gameOverReason: 6 /* acceptedDraw */
    };
  }
  if (action.type === "play:acceptTakeBack") {
    if (prev.status !== "ongoing") {
      return prev;
    }
    const lastOffer = {
      ...prev.offers[prev.offers.length - 1],
      status: "accepted"
    };
    const newGame = getNewChessGame({
      pgn: prev.pgn.slice(0, prev.pgn.length - 1)
    });
    const takebackAt = prev.offers[prev.offers.length - 1].timestamp || (/* @__PURE__ */ new Date()).getTime();
    const elapsedTime = takebackAt - prev.lastMoveAt;
    const nextTimeLeft = prev.timeLeft[prev.lastMoveBy] - elapsedTime;
    const nextTurn = swapColor(prev.lastMoveBy);
    const nextOffers = [...prev.offers.slice(0, -1), lastOffer];
    return {
      ...prev,
      pgn: newGame.pgn(),
      lastMoveBy: nextTurn,
      timeLeft: {
        ...prev.timeLeft,
        [prev.lastMoveBy]: nextTimeLeft
      },
      offers: nextOffers
    };
  }
  if (isOneOf(action.type, ["play:denyOffer", "play:cancelOffer"])) {
    return {
      ...prev,
      // Remove the last offer
      offers: prev.offers.slice(0, -1)
    };
  }
  return prev;
};

// modules/Match/movex/state.ts
var initialMatchState = null;

// modules/Match/movex/util.ts
var getMatchPlayerRoleById = (players, id) => {
  if (players.challenger.id === id) {
    return "challenger";
  }
  if (players.challengee.id === id) {
    return "challengee";
  }
  return null;
};

// modules/Match/movex/reducer.ts
var reducer3 = (prev = initialMatchState, action) => {
  if (!prev) {
    return prev;
  }
  const prevMatch = prev;
  if (action.type === "match:startNewGame") {
    if (prevMatch.status === "complete") {
      return prev;
    }
    const prevPlay = prevMatch.gameInPlay;
    if (!prevPlay && prevMatch.endedGames.length === 0) {
      return prev;
    }
    const newGameParams = invoke(() => {
      const prevGame = prevPlay || prevMatch.endedGames.slice(-1)[0];
      return {
        timeClass: prevGame.timeClass,
        players: {
          w: prevGame.players.b,
          b: prevGame.players.w
        }
      };
    });
    return {
      ...prev,
      gameInPlay: createPendingGame(newGameParams)
    };
  }
  if (!prevMatch.gameInPlay) {
    return prev;
  }
  const prevOngoingGame = prevMatch.gameInPlay;
  const nextOngoingGame = reducer2(prevOngoingGame, action);
  if (nextOngoingGame.status === "aborted") {
    const abortedCurrentPlay = nextOngoingGame;
    const nextMatchState = invoke(
      () => {
        return prevMatch.endedGames.length === 0 ? {
          status: "aborted",
          winner: null
        } : {
          status: "complete",
          winner: getMatchPlayerRoleById(
            prevMatch,
            nextOngoingGame.players[nextOngoingGame.lastMoveBy]
          )
        };
      }
    );
    return {
      ...prev,
      endedGames: [...prevMatch.endedGames, abortedCurrentPlay],
      gameInPlay: null,
      ...nextMatchState
    };
  }
  if (nextOngoingGame.status !== "complete") {
    const nextOngoingGameStatus = invoke(
      () => {
        if (nextOngoingGame.status === "ongoing") {
          return "ongoing";
        }
        return prevMatch.endedGames.length > 0 ? "ongoing" : "pending";
      }
    );
    return {
      ...prev,
      gameInPlay: nextOngoingGame,
      status: nextOngoingGameStatus,
      ...nextOngoingGameStatus === "aborted" && {
        winner: getMatchPlayerRoleById(
          prevMatch,
          nextOngoingGame.players[swapColor(nextOngoingGame.lastMoveBy)]
        )
      }
    };
  }
  const prevPlayersByRole = {
    challengee: prev.challengee,
    challenger: prev.challenger
  };
  const nextPlayersByRole = invoke(() => {
    if (nextOngoingGame.winner === "1/2") {
      return prevPlayersByRole;
    }
    const winnerByRole = getMatchPlayerRoleById(
      prev,
      nextOngoingGame.players[nextOngoingGame.winner]
    );
    if (!winnerByRole) {
      return prevPlayersByRole;
    }
    return {
      ...prevPlayersByRole,
      [winnerByRole]: {
        ...prevPlayersByRole[winnerByRole],
        points: prevPlayersByRole[winnerByRole].points + 1
      }
    };
  });
  const winner = invoke(() => {
    if (prevMatch.type === "bestOf") {
      const maxRounds = Math.ceil(prevMatch.rounds / 2);
      if (nextPlayersByRole.challenger.points === maxRounds) {
        return "challenger";
      }
      if (nextPlayersByRole.challengee.points === maxRounds) {
        return "challengee";
      }
      return null;
    }
    return null;
  });
  const nextMatchStatus = winner ? "complete" : "ongoing";
  return {
    ...prev,
    endedGames: [...prevMatch.endedGames, nextOngoingGame],
    gameInPlay: null,
    status: nextMatchStatus,
    winner,
    ...nextPlayersByRole
  };
};
reducer3.$transformState = (state, masterContext) => {
  if (!state) {
    return state;
  }
  if (state.status === "complete" || state.status === "aborted") {
    return state;
  }
  const ongoingPlay = state.gameInPlay;
  if (ongoingPlay?.status === "ongoing") {
    const turn = swapColor(ongoingPlay.lastMoveBy);
    const nextTimeLeft = calculateTimeLeftAt({
      at: masterContext.requestAt,
      // TODO: this can take in account the lag as well
      prevTimeLeft: ongoingPlay.timeLeft,
      turn
    });
    return {
      ...state,
      gameInPlay: {
        ...ongoingPlay,
        timeLeft: nextTimeLeft
      }
    };
  }
  if (ongoingPlay?.status === "idling" && masterContext.requestAt > ongoingPlay.startedAt + state.timeToAbortMs) {
    const nextAbortedGame = {
      ...ongoingPlay,
      status: "aborted"
    };
    if (state.status === "pending") {
      return {
        ...state,
        status: "aborted",
        winner: null,
        endedGames: [nextAbortedGame],
        gameInPlay: null
      };
    }
    if (state.status === "ongoing") {
      return {
        ...state,
        status: "complete",
        winner: getMatchPlayerRoleById(
          state,
          ongoingPlay.players[ongoingPlay.lastMoveBy]
        ),
        endedGames: [...state.endedGames, nextAbortedGame],
        gameInPlay: null
      };
    }
  }
  return state;
};

// modules/Match/movex/operations/operations.ts
var createMatchState = (params) => {
  const challengerColor = toShortChessColor(params.startColor || getRandomColor());
  return {
    status: "pending",
    ...params.type === "bestOf" ? {
      type: params.type,
      rounds: params.rounds || 1
      // Default to one round if not specified
    } : {
      type: params.type
    },
    challengee: {
      id: params.challengeeId,
      points: 0
    },
    challenger: {
      id: params.challengerId,
      points: 0
    },
    winner: null,
    endedGames: [],
    gameInPlay: createPendingGame({
      timeClass: params.timeClass || "untimed",
      players: (
        // TODO: here can also just leave the ids as "challenger" & "challengee"
        challengerColor === "w" ? {
          w: params.challengerId,
          b: params.challengeeId
        } : {
          w: params.challengeeId,
          b: params.challengerId
        }
      )
    }),
    timeToAbortMs: params.timeToAbortMs || 3 * 60 * 1e3,
    // default to 3 mins
    breakDurationMs: params.breakDurationMs || 10 * 1e3
    // deafult ot 10 seconds
  };
};

// modules/Game/io.ts
var import_zod = __toESM(require("zod"));
var gameTimeClassRecord = import_zod.default.union([
  import_zod.default.literal("blitz3"),
  import_zod.default.literal("blitz"),
  import_zod.default.literal("rapid"),
  import_zod.default.literal("untimed"),
  import_zod.default.literal("bullet")
]);

// modules/Match/movex/operations/operationsSchemas.ts
var import_zod2 = __toESM(require("zod"));
var whiteChessColorSchema = import_zod2.default.literal("white").or(import_zod2.default.literal("w"));
var blackChessColorSchema = import_zod2.default.literal("black").or(import_zod2.default.literal("b"));
var chessColorSchema = import_zod2.default.union([
  whiteChessColorSchema,
  blackChessColorSchema
]);
var createMatchParamsSchema = import_zod2.default.object({
  // This one is here in order not to copy the whole zod object inside the room
  // I prefer this alternative to having to maintain an exact copy of the whole object in both places
  // See https://github.com/colinhacks/zod/issues/2106 & https://github.com/colinhacks/zod/issues/2567
  //  on why Zod can't intersect and discriminate union at the same time, thus rendering this impossible!
  activity: import_zod2.default.literal("match"),
  type: import_zod2.default.union([
    import_zod2.default.literal("bestOf"),
    // BestOf = best out of N Rounds (e.g. 2 out of 3, 3 out of 5, etc...)
    import_zod2.default.literal("openEnded")
    // This has no predefined rounds
  ]),
  // Rounds is only needed when "type" = "bestOf" and is an Odd Positive Number
  rounds: import_zod2.default.coerce.number().optional(),
  timeClass: gameTimeClassRecord.optional(),
  // Players
  challengerId: import_zod2.default.string(),
  challengeeId: import_zod2.default.string(),
  // This is the color of the challenger
  // If no color specified it's assigned randomly
  startColor: chessColorSchema.optional(),
  timeToAbortMs: import_zod2.default.coerce.number().optional(),
  breakDurationMs: import_zod2.default.coerce.number().optional()
});

// modules/Room/activities/Match/movex/reducer.ts
var reducer4 = (prev = initialMatchActivityState, action) => {
  if (prev.activityType === "match") {
    return {
      ...prev,
      activityState: reducer3(
        prev.activityState,
        action
      )
    };
  }
  return prev;
};
if (reducer3.$transformState) {
  const matchStateTransformer = reducer3.$transformState;
  reducer4.$transformState = (state, masterContext) => {
    if (state.activityType === "match") {
      return {
        ...state,
        activityState: matchStateTransformer(
          state.activityState,
          masterContext
        )
      };
    }
    return state;
  };
}

// modules/Meetup/movex/state.ts
var initialMeetupState = {
  participantsById: {},
  match: null
};

// modules/Meetup/movex/reducer.ts
var reducer5 = (prev = initialMeetupState, action) => {
  if (action.type === "meetup:join") {
    const nextParticipantsById = {
      ...prev.participantsById,
      [action.payload.userId]: {
        id: action.payload.userId,
        role: action.payload.isStar ? "star" : "fan"
      }
    };
    const nextMatch = prev.match ? prev.match : invoke(() => {
      const { fan, star } = toDictIndexedBy(
        Object.values(nextParticipantsById),
        (p) => p.role
      );
      if (star && fan) {
        return createMatchState({
          type: "openEnded",
          challengeeId: fan.id,
          // This is not in order, so it might take any of the fans (if multiple) but normally should not be multiple
          challengerId: star.id
        });
      }
      return null;
    });
    if (action.payload.userId) {
      return {
        ...prev,
        participantsById: nextParticipantsById,
        match: nextMatch
      };
    }
  }
  return {
    ...prev,
    match: reducer3(prev.match, action)
  };
};
if (reducer3.$transformState) {
  const matchStateTransformer = reducer3.$transformState;
  reducer5.$transformState = (state, masterContext) => {
    return {
      ...state,
      match: matchStateTransformer(state.match, masterContext)
    };
  };
}

// modules/Room/activities/Meetup/movex/reducer.ts
var reducer6 = (prev = initialActivityState, action) => {
  if (prev.activityType !== "meetup") {
    return prev;
  }
  return {
    ...prev,
    activityState: reducer5(
      prev.activityState,
      action
    )
  };
};
if (reducer3.$transformState) {
  const matchStateTransformer = reducer3.$transformState;
  reducer6.$transformState = (state, masterContext) => {
    if (state.activityType === "meetup") {
      return {
        ...state,
        activityState: {
          ...state.activityState,
          match: matchStateTransformer(
            state.activityState.match,
            masterContext
          )
        }
      };
    }
    return state;
  };
}

// modules/Room/activities/movex/state.ts
var initialNoneActivityState = {
  activityType: "none",
  activityState: {}
};
var initialActivityState = initialNoneActivityState;

// lib/util.ts
var import_Either = require("fp-ts/lib/Either");
var import_movex_core_util = require("movex-core-util");
var import_ts_results2 = require("ts-results");
var deepObject = __toESM(require("deep-object-diff"));
var wrapReducer = (original, wrapper, wrapperStaticFns) => {
  const fn = (prev, action) => wrapper(original(prev, action), action, prev);
  fn.$canReconcileState = wrapperStaticFns?.$canReconcileState || wrapper.$canReconcileState || original.$canReconcileState;
  const $wrapperTransformState = wrapperStaticFns?.$transformState || wrapper.$transformState;
  fn.$transformState = $wrapperTransformState ? (s, c) => $wrapperTransformState(
    original.$transformState ? original.$transformState(s, c) : s,
    c
  ) : original.$transformState;
  return fn;
};
var composeReducers = (...reducers) => {
  if (reducers.length === 0) {
    return (s, _) => s;
  }
  if (reducers.length === 1) {
    return reducers[0];
  }
  return reducers.reduce(
    (prevReducer, nextReducer) => wrapReducer(prevReducer, nextReducer)
  );
};
var reducerLogger = (reducer8, name = "") => wrapReducer(reducer8, (next, a, prev) => {
  console.group(`${name} Action:`, a.type);
  console.log("Payload:", a.payload);
  console.log("Prev:", prev);
  console.log("Next:", next);
  if (isObject(prev) && isObject(next)) {
    console.log("Detailed Diff", deepObject.detailedDiff(prev, next));
    console.log("Simple Diff", deepObject.diff(prev, next));
  } else {
    console.log("Diff is between primitives");
  }
  console.groupEnd();
  return next;
});

// modules/Room/activities/movex/reducer.ts
var roomActivityReducer = composeReducers(
  reducer,
  reducer6,
  reducer4
);

// modules/Room/movex.ts
var initialRoomState = {
  activity: initialActivityState
};
var reducer7 = (state = initialRoomState, action) => ({
  activity: roomActivityReducer(state.activity, action)
});
if (roomActivityReducer.$transformState) {
  const roomActivityTransformer = roomActivityReducer.$transformState;
  reducer7.$transformState = (state, masterContext) => ({
    ...state,
    activity: roomActivityTransformer(state.activity, masterContext)
  });
}

// config/config.client.ts
var ENV = process.env.NEXT_PUBLIC_ENV;
var DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";
var SIGNALING_SERVER_CONFIG = {
  host: process.env.NEXT_PUBLIC_SIGNALING_SERVER_HOST,
  port: Number(process.env.NEXT_PUBLIC_SIGNALING_SERVER_PORT),
  secure: Number(process.env.NEXT_PUBLIC_SIGNALING_SERVER_SECURE) === 1
};
var MOVEX_ENDPOINT_URL = process.env.NEXT_PUBLIC_MOVEX_ENDPOINT_URL;
var ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL;
var SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
var CAMERA_ON = process.env.NEXT_PUBLIC_CAMERA_ON === "true" || !DEBUG_MODE;
var RELEASE_VERSION = (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || "";
var config = {
  ENV,
  DEBUG_MODE,
  SIGNALING_SERVER_CONFIG,
  MOVEX_ENDPOINT_URL,
  ENGINE_URL,
  CAMERA_ON,
  SENTRY_DSN,
  RELEASE_VERSION
};
if (DEBUG_MODE) {
  console.debug("Client Config", config);
}
console.log(`Welcome to Chessroulette ${RELEASE_VERSION}!`);

// movex.config.ts
console.log("heree");
var movex_config_default = {
  resources: {
    // room: roomReducer,
    // room: reducerLogger(roomReducer, 'Room Movex'),
    room: config.DEBUG_MODE ? reducerLogger(reducer7, "Room Movex") : reducer7
  }
};
