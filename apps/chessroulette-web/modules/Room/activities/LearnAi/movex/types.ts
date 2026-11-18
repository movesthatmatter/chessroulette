import {
  ChessColor,
  ChessFEN,
  ChessMove,
  FBHHistory,
  FBHIndex,
} from '@xmatter/util-kit';
import {
  ArrowsMap,
  CircleDrawTuple,
  CirclesMap,
} from '@app/components/Chessboard/types';
import { ImportedInput } from '@app/components/PgnInputBox/PgnInputBox';
import { Action } from 'movex-core-util';
import { Square } from 'chess.js';

export type LearnAiActivityState = {
  activityType: 'ailearn';
  activityState: {
    // TODO: This is the LessonModel induced LessonState
    loadedChapterId: Chapter['id'];
    chaptersMap: Record<Chapter['id'], Chapter>;
    // TODO: This should only be last chapter Index or smtg like that, because otherwise it skips counts if deleting the last one
    chaptersIndex: number;
  };
};

export type Chapter = {
  id: string;
  // createdAt: number;
} & ChapterState;

export type MovePiece = {
  from: Square;
  to: Square;
  promoteTo?: 'Q' | 'R' | 'B' | 'N' | 'q' | 'r' | 'b' | 'n';
};

export type aiLearn = {
  mode: 'opening' | 'midgame' | 'endgame' | 'test';
  name: string;
  // uci: string,
  moves: string[];
  moves_test: string[];
  errors: number;
  hints: number;
  orientationChange: boolean;
  popup: boolean;
};

export type EvaluationMove = {
  moveNum: number;
  move: string;
  moveLan: Array<string>;
  topMove: Array<string>;
  moveCalc: number;
  eval: number;
  diff: string;
  bestMoves: string[];
};
export type Message = {
  content: string;
  participantId: string;
  idResponse: string;
};

export type UserData = {
  name_first: string;
  name_last: string;
  picture: string;
  is_trial: boolean;
  new_product_id?: string;
  subscriptionProduct?: string;
  user_id: string;
  isLoaded?: boolean; // getSubscribeInfo se vratio
};
export type ChapterState = {
  name: string;
  messages: Message[];
  // Also the chapter might get a type: position, or puzzle (containing next correct moves)
  aiLearn: aiLearn;
  //evaluation: evaluation;
  notation: {
    // The starting fen is the chapter fen
    history: FBHHistory;
    focusedIndex: FBHIndex;
    startingFen: ChessFEN; // This could be strtingPGN as well especially for puzzles but not necessarily
  };
} & ChapterBoardState;

export type ChapterBoardState = {
  // Board State
  displayFen: ChessFEN; // This could be strtingPGN as well especially for puzzles but not necessarily
  arrowsMap: ArrowsMap;
  circlesMap: CirclesMap;
  orientation: ChessColor;
};

export type LearnAiActivityActions =
  // Chapter Logistcs
  | Action<'createChapter', ChapterState>
  | Action<
      'updateChapter',
      {
        id: Chapter['id'];
        state: Partial<ChapterState>; // The notation is updateable via addMove or history actions only
      }
    >
  | Action<'deleteChapter', { id: Chapter['id'] }>
  | Action<'loadChapter', { id: Chapter['id'] }>
  | Action<'loadedChapter:addMove', ChessMove>
  | Action<'loadedChapter:addLearnAiMove', ChessMove>
  | Action<'loadedChapter:setLearnAi', aiLearn>
  | Action<'loadedChapter:writeMessage', Message>
  | Action<'loadedChapter:focusHistoryIndex', FBHIndex>
  | Action<'loadedChapter:deleteHistoryMove', FBHIndex>
  | Action<'loadedChapter:drawCircle', CircleDrawTuple>
  | Action<'loadedChapter:gameEvaluation', number>
  | Action<'loadedChapter:clearCircles'>
  | Action<'loadedChapter:setArrows', ArrowsMap>
  | Action<'loadedChapter:setOrientation', { color: ChessColor }>
  | Action<'loadedChapter:takeBack', FBHIndex>
  | Action<'loadedChapter:updateFen', ChessFEN>
  | Action<'loadedChapter:import', { input: ImportedInput }>;
