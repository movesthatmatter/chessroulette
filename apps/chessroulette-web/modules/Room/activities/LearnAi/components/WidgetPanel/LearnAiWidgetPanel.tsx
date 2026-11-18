import React, {
  useCallback,
  // useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';

import { ChessFENBoard, FreeBoardHistory, isValidPgn } from '@xmatter/util-kit';
import { Button } from '@app/components/Button';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from '@app/components/FreeBoardNotation';
// import debounce from 'debounce';
import { Tabs, TabsRef } from '@app/components/Tabs';
import {
  getLichessTopMoves,
  getOutpostNextMoves,
  parseOutpostResponseToSuggestions,
  uciToSan,
} from '../../util';
import type {
  Chapter,
  ChapterState,
  MovePiece,
  Message,
  UserData,
  EvaluationMove,
  aiLearn,
} from '../../movex/types';
import { CircleDrawTuple, ArrowsMap } from '@app/components/Chessboard/types';
import { PgnInputBoxProps } from '@app/components/PgnInputBox/PgnInputBox';
import Conversation from './Conversation';

import { Square, Chess } from 'chess.js';
import StockFishEngineAI from '@app/modules/ChessEngine/ChessEngineAI';
import { ChessEngineProbabilityCalc } from '@app/modules/ChessEngine/components/ChessEngineCalculator';
import { EvalBar } from '@app/modules/ChessEngine/components/EvalBar';
import { ChaptersTab, ChaptersTabProps } from '../../chapters/ChaptersTab';
import { useWidgetPanelTabsNavAsSearchParams } from '../useWidgetPanelTabsNav';
import { SendQuestionCoach } from './SendQuestionCoach';
import { useUpdateableSearchParams } from '@app/hooks/useSearchParams';
import { useExtraBottomGap } from '@app/hooks/useExtraBottomGap';
import { isProSubscription } from '@app/modules/User';

import {
  // getOpenings, // replaced by local OPENING_DATABASE
  // getWikibooksContent,
  //getLichessBestMove,
  // getOpeningIdeas,
  //getOpeningCommentFromAi,
  buildPgnFromMessageContent,
  // getOpeningByUserInput,
  getOpeningFromAiByName,
  // extractOpeningNameFromPhrase,
} from '../../util';
import {
  OPENING_DATABASE,
  findOpeningFamily,
  getNextBranchMoves,
  getTrunkMoves,
  type OpeningBranchMove,
} from '../../openingDatabase';

const SUGGESTED_ARROW_DIM = 'rgba(242, 53, 141, 0.28)';

// Openings available without a Pro subscription — everything else in
// OPENING_DATABASE is shown locked (with a random pick) until the user
// upgrades.
const FREEMIUM_OPENING_NAMES = ['London System', 'Caro-Kann Defense'];

// function parseIdeasToMoveCommentsAligned(
//   ideas: string,
//   sanMoves: string[]
// ): (string | null)[] {
//   const result: (string | null)[] = new Array(sanMoves.length).fill(null);
//   const list: { san: string; comment: string }[] = [];
//   const bracketRegex = /\[([^\]]*)\]/g;
//   let match;
//   let lastIndex = 0;
//   console.log('ideje', ideas);
//   while ((match = bracketRegex.exec(ideas)) !== null) {
//     const partBeforeBracket = ideas.slice(lastIndex, match.index).trim();
//     lastIndex = match.index + match[0].length;
//     const tokens = partBeforeBracket.split(/\s+/).filter(Boolean);
//     const lastToken = tokens[tokens.length - 1] || '';
//     const san = lastToken.replace(/^\d+\.{1,3}\s*/, '').trim();
//     if (san) list.push({ san, comment: match[1].trim() });
//   }
//   let listIdx = 0;
//   for (const { san, comment } of list) {
//     const j = sanMoves.indexOf(san, listIdx);
//     if (j !== -1) {
//       result[j] = comment;
//       listIdx = j + 1;
//     }
//   }
//   console.log('result', result);
//   return result;
// }

function getCurrentPositionUci(notation: {
  history: any[];
  focusedIndex: [number, number];
}): string {
  const { history, focusedIndex } = notation;
  if (!Array.isArray(history) || history.length === 0) return '';
  const [moveIdx, colorIdx] = focusedIndex;
  if (moveIdx < 0) return '';
  const pairs = history.slice(0, moveIdx + 1);
  const lastPair = pairs[pairs.length - 1];
  const moves: string[] = [];
  for (let i = 0; i < pairs.length - 1; i++) {
    const [w, b] = pairs[i];
    if (w && !(w as any).isNonMove)
      moves.push(
        `${(w as any).from}${(w as any).to}${(w as any).promotion ?? ''}`
      );
    if (b && !(b as any).isNonMove)
      moves.push(
        `${(b as any).from}${(b as any).to}${(b as any).promotion ?? ''}`
      );
  }
  if (lastPair) {
    if (lastPair[0] && !(lastPair[0] as any).isNonMove)
      moves.push(
        `${(lastPair[0] as any).from}${(lastPair[0] as any).to}${
          (lastPair[0] as any).promotion ?? ''
        }`
      );
    if (colorIdx === 1 && lastPair[1] && !(lastPair[1] as any).isNonMove)
      moves.push(
        `${(lastPair[1] as any).from}${(lastPair[1] as any).to}${
          (lastPair[1] as any).promotion ?? ''
        }`
      );
  }
  return moves.join(' ');
}

function buildArrowsFromUciMoves(
  uciMoves: string[],
  hexColor: string,
  options?: { highlightUci?: string | null; dimColor?: string }
): ArrowsMap {
  const map: ArrowsMap = {} as ArrowsMap;
  const dimColor = options?.dimColor ?? SUGGESTED_ARROW_DIM;
  const highlightUci = options?.highlightUci ?? null;
  uciMoves.forEach((uci) => {
    if (uci.length >= 4) {
      const from = uci.slice(0, 2) as Square;
      const to = uci.slice(2, 4) as Square;
      const color =
        highlightUci == null || uci === highlightUci ? hexColor : dimColor;
      const id = `${from}${to}-${color}` as keyof ArrowsMap;
      map[id] = [from, to, color];
    }
  });

  return map;
}

type Props = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number;
  currentChapterState: ChapterState;

  onMove: (move: MovePiece) => void;
  onTakeBack: FreeBoardNotationProps['onRefocus'];
  onCircleDraw: (tuple: CircleDrawTuple) => void;
  onArrowsChange: (tuple: ArrowsMap) => void;
  onMessage: (message: Message) => void;
  playerNames: Array<string>;
  // Board
  onImport: PgnInputBoxProps['onChange'];
  onQuickImport: PgnInputBoxProps['onChange'];
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];
  onCanPlayChange: (canPlay: boolean) => void;
  userData: UserData;
  addLearnAi: (data: aiLearn) => void;
  onFlipBoard?: () => void;
  onSetOrientation?: (color: 'w' | 'b') => void;
  onRegisterNewOpening?: (fn: () => void) => void;
  onRegisterKeepPlaying?: (fn: () => void) => void;
  addGameEvaluation?: (score: number) => void;

  // Engine
  showEngine?: boolean;
  // engine?: EngineData;
} & Pick<
  ChaptersTabProps,
  | 'onLoadChapter'
  | 'onCreateChapter'
  | 'onDeleteChapter'
  | 'onUpdateChapter'
  | 'onUpdateInputModeState'
  | 'inputModeState'
  | 'onActivateInputMode'
  | 'onDeactivateInputMode'
  | 'currentLoadedChapterId'
>;

export const LearnAiWidgetPanel = React.forwardRef<TabsRef, Props>(
  (
    {
      chaptersMap,
      chaptersMapIndex,
      currentLoadedChapterId,
      currentChapterState,
      // engine,
      onCanPlayChange,
      addLearnAi,
      playerNames,
      showEngine,
      onImport,
      onTakeBack,
      onCircleDraw,
      onArrowsChange,
      onMove,
      onMessage,
      onQuickImport,
      onHistoryNotationDelete,
      onHistoryNotationRefocus,
      onFlipBoard,
      onSetOrientation,
      onRegisterNewOpening,
      onRegisterKeepPlaying,
      addGameEvaluation,
      userData,
      ...chaptersTabProps
    },
    tabsRef
  ) => {
    const isPro = isProSubscription(userData?.subscriptionProduct);

    // const settings = useAichessActivitySettings();
    const [pendingOpening, setPendingOpening] = useState<{
      name: string;
      pgn: string;
      content: string;
      uciMoves: string[];
    } | null>(null);

    const [suggestedMoves, setSuggestedMoves] = useState<Array<{
      uci: string;
      san: string;
    }> | null>(null);
    const [hoveredSuggestedUci, setHoveredSuggestedUci] = useState<
      string | null
    >(null);
    const [suggestedMainMoveUci, setSuggestedMainMoveUci] = useState<
      string | null
    >(null);
    const widgetPanelTabsNav = useWidgetPanelTabsNavAsSearchParams();

    const updateableSearchParams = useUpdateableSearchParams();
    // Mobile chat bubble → footer input (same pattern as Review/Puzzle)
    const [showMobileChatInput, setShowMobileChatInput] = useState(false);
    const [pulseDot, setPulseDot] = useState(false);
    const [chatLimitPaywallVisible, setChatLimitPaywallVisible] =
      useState(false);
    const [isFocusedInput, setIsFocusedInput] = useState(false);
    const [question, setQuestion] = useState('');

    const [reviewData, setReviewData] = useState<EvaluationMove[]>([]);
    const [freezeButton, setFreezeButton] = useState(false);
    const [deviatedFromOpening, setDeviatedFromOpening] = useState(false);
    const deviationMsgSentRef = useRef(false);
    const [hintActive, setHintActive] = useState(true);

    const [showOfferMoves, setShowOfferMoves] = useState(true);

    const isBrowsing = (() => {
      const history = currentChapterState.notation?.history ?? [];
      const focusedIndex = currentChapterState.notation?.focusedIndex;
      if (!focusedIndex || history.length === 0) return false;
      const lastIndex = FreeBoardHistory.getLastIndexInHistory(history);
      return (
        focusedIndex[0] !== lastIndex[0] || focusedIndex[1] !== lastIndex[1]
      );
    })();
    const [scoreCP, setScoreCP] = useState(0);
    const [prevScoreCP, setprevScoreCP] = useState(0);
    const [percentW, setPercentW] = useState(50);
    const [percentB, setPercentB] = useState(50);
    const [showColorChoice, setShowColorChoice] = useState(false);
    const [lastOpeningIntroContent, setLastOpeningIntroContent] =
      useState<string>('');
    // const [waitingForCustomOpeningName, setWaitingForCustomOpeningName] =
    //   useState(false);
    // Starts false on both server and the client's first render (avoids a
    // hydration mismatch), then syncs to the real width right after mount.
    const [smallMobile, setSmallMobile] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
      setSmallMobile(window.innerWidth < 400);
      setIsMobile(window.innerWidth < 768);
    }, []);
    const extraBottomGap = useExtraBottomGap();
    const [isOutpostWebViewAndroid, setIsOutpostWebViewAndroid] =
      useState(false);
    const [isOutpostWebViewIos, setIsOutpostWebViewIos] = useState(false);
    useEffect(() => {
      setIsOutpostWebViewAndroid(
        navigator.userAgent.includes('OutpostChessApp/android')
      );
      setIsOutpostWebViewIos(
        navigator.userAgent.includes('OutpostChessApp/ios')
      );
    }, []);
    const [newRatingEngine, setRatingBotEngine] = useState(
      isMobile ? 1999 : 2099
    );
    const [currentRatingEngine, setCurrentRatingEngine] = useState<
      number | null
    >(null);

    const [playVsBot, setPlayVsBot] = useState(false);

    const [suggestedOpenings, setSuggestedOpenings] = useState<Array<{
      name: string;
      pgn: string;
    }> | null>(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<{ stop: () => void } | null>(null);

    const [branchMoves, setBranchMoves] = useState<Array<
      OpeningBranchMove & { san: string }
    > | null>(null);
    const [currentVariantName, setCurrentVariantName] = useState<string | null>(
      null
    );
    const [openingComplete, setOpeningComplete] = useState(false);
    const [keepPlaying, setKeepPlaying] = useState(false);
    const openingCompleteMessageSentRef = useRef(false);
    const openingMovesTestSetRef = useRef(false);

    function parseIdeasToMoveComments(ideas: string): string[] {
      const comments: string[] = [];
      const regex = /\[([^\]]*)\]/g;
      let m;
      while ((m = regex.exec(ideas)) !== null) {
        comments.push(m[1].trim());
      }
      return comments;
    }

    const startVoiceInput = useCallback(() => {
      if (typeof window === 'undefined') return;
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        console.warn('Speech recognition not supported');
        return;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setIsListening(false);
        return;
      }
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      //recognition.lang = 'en-US';
      recognition.onresult = (event: {
        results: { [key: number]: { [key: number]: { transcript?: string } } };
      }) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim() || '';
        if (transcript) addQuestion(transcript);
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        setIsListening(false);
      };
      recognition.onerror = () => {
        recognitionRef.current = null;
        setIsListening(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    }, [currentChapterState.messages, currentChapterState.notation.history]);

    const buildOpeningPick = (family: (typeof OPENING_DATABASE)[number]) => {
      const variant = family.variants[0];
      const chess = new Chess();
      for (const uci of variant.moves) {
        try {
          chess.move({
            from: uci.slice(0, 2),
            to: uci.slice(2, 4),
            promotion: uci[4] as any,
          });
        } catch {}
      }
      return {
        name: family.name,
        pgn: `[Event "?"]\n[Site "?"]\n\n${chess.pgn()}`,
      };
    };

    // Quick-access picks shown alongside the "subscribe to unlock" gate
    // message, so the user can jump straight into a free opening instead
    // of having to type it again.
    const getFreemiumOpeningPicks = () =>
      FREEMIUM_OPENING_NAMES.map((name) => findOpeningFamily(name))
        .filter((f): f is NonNullable<typeof f> => !!f)
        .map(buildOpeningPick);

    const fetchOpeningSuggestions = (
      _count: number = 3,
      excludeNames: string[] = []
    ): Promise<Array<{ name: string; pgn: string; locked?: boolean }>> => {
      // Old API-based code (kept for reference):
      // const results = await Promise.all(
      //   Array.from({ length: count }, () => getOpenings())
      // );
      // const byName = new Map<string, { name: string; pgn: string }>();
      // results.forEach((data) => {
      //   if (data?.name && data?.pgn)
      //     byName.set(data.name, { name: data.name, pgn: data.pgn });
      // });
      // return Array.from(byName.values()).slice(0, count);

      if (!isPro) {
        // Freemium: only the two free openings are playable, plus one
        // random locked pick to hint at what subscribing unlocks.
        const freeFamilies = FREEMIUM_OPENING_NAMES.map((name) =>
          findOpeningFamily(name)
        ).filter((f): f is NonNullable<typeof f> => !!f);

        const lockedCandidates = OPENING_DATABASE.filter(
          (f) =>
            !FREEMIUM_OPENING_NAMES.includes(f.name) &&
            !excludeNames.includes(f.name)
        ).sort(() => Math.random() - 0.5);
        const lockedPick = lockedCandidates[0];

        const picks = [
          ...freeFamilies.map((f) => ({ ...buildOpeningPick(f) })),
          ...(lockedPick
            ? [{ ...buildOpeningPick(lockedPick), locked: true }]
            : []),
        ];
        return Promise.resolve(picks);
      }

      const shuffled = [...OPENING_DATABASE]
        .filter((f) => !excludeNames.includes(f.name))
        .sort(() => Math.random() - 0.5);
      const suggestions = shuffled.slice(0, 4).map(buildOpeningPick);
      return Promise.resolve(suggestions);
    };

    const handleSelectOpening = async (
      opening: { name: string; pgn: string },
      precomputedIdeas?: string
    ) => {
      const intro = `Let's play the ${opening.name}.`;
      //console.log('opening', opening.name, opening.pgn);

      // let ideas = precomputedIdeas ?? getOpeningIdeas(opening.name);
      // if (!ideas && opening.pgn?.trim()) {
      // const lastId =
      //   currentChapterState.messages[currentChapterState.messages.length - 1]
      //     ?.idResponse ?? '';
      // const aiComment = await getOpeningCommentFromAi(opening.pgn, lastId);
      // if (aiComment) ideas = aiComment;
      // }

      setLastOpeningIntroContent(intro);
      setCurrentVariantName(null);

      let pgnToImport = opening.pgn;
      // if (ideas) {
      //   const pgnFromText = buildPgnFromMessageContent(ideas);
      //   if (pgnFromText) {
      //     try {
      //       const testChess = new Chess();
      //       testChess.loadPgn(pgnFromText);
      //       if (testChess.history().length > 0) {
      //         pgnToImport = pgnFromText;
      //       }
      //     } catch {
      //       // ostavi opening.pgn
      //     }
      //   }
      // }

      onQuickImport({ type: 'FEN', val: ChessFENBoard.STARTING_FEN });
      setShowOfferMoves(false);
      const chess = new Chess();
      chess.loadPgn(pgnToImport);
      setSuggestedOpenings(null);
      // const sanMoves = chess.history();
      // console.log(ideas, sanMoves);
      // const moveComments = ideas
      //   ? parseIdeasToMoveCommentsAligned(ideas, sanMoves)
      //   : [];
      // setOpeningMoveComments(moveComments);
      const uciMoves = chess
        .history({ verbose: true })
        .map((m) => `${m.from}${m.to}${m.promotion ?? ''}`);

      addLearnAi({
        ...currentChapterState.aiLearn,
        mode: 'opening',
        name: opening.name,
        moves: uciMoves,
        moves_test: [],
      });
      onMessage({
        content: intro + '\n\nWould you like to play as White or Black?',
        participantId: 'chatGPT123456',
        idResponse: '',
      });

      setTimeout(() => {
        setShowOfferMoves(true);
        setShowColorChoice(true);
      }, 800);
    };

    const hasAutoOpenedFromUrlRef = useRef(false);
    useEffect(() => {
      if (!userData?.isLoaded) return; // cekaj proveru pretplate
      if (hasAutoOpenedFromUrlRef.current) return;
      if (currentChapterState.aiLearn.name) return;

      const openingParam = updateableSearchParams.get('opening');
      if (!openingParam) return;

      const family = findOpeningFamily(openingParam);
      if (!family) return;

      hasAutoOpenedFromUrlRef.current = true;

      if (!isPro && !FREEMIUM_OPENING_NAMES.includes(family.name)) {
        onMessage({
          content: `The ${family.name} is a Pro opening. Subscribe to unlock every opening in the database — for now you can try the London System or the Caro-Kann Defense for free.`,
          participantId: 'chatGPT123456sales',
          idResponse: '',
        });
        return;
      }

      const variant = family.variants[0];
      const chess = new Chess();
      for (const uci of variant.moves) {
        try {
          chess.move({
            from: uci.slice(0, 2) as Square,
            to: uci.slice(2, 4) as Square,
            promotion: uci[4] as any,
          });
        } catch {}
      }
      handleSelectOpening({
        name: family.name,
        pgn: `[Event "?"]\n[Site "?"]\n\n${chess.pgn()}`,
      });
    }, [currentChapterState.aiLearn.name, userData?.isLoaded]);

    const handleSomethingElse = async () => {
      // Old: ask user to type name
      // setSuggestedOpenings(null);
      // setWaitingForCustomOpeningName(true);
      // onMessage({
      //   content: "Please type the name of the opening you'd like to play (e.g. Italian Game, Sicilian Defense, Caro-Kann).",
      //   participantId: 'chatGPT123456',
      //   idResponse: '',
      // });

      const shownNames = suggestedOpenings?.map((o) => o.name) ?? [];
      const picks = await fetchOpeningSuggestions(4, shownNames);
      setSuggestedOpenings(picks);
      // onMessage({
      //   content:
      //    'Here are some openings you could try:',
      //   participantId: 'chatGPT123456',
      //   idResponse: '',
      // });
    };

    // const formatOpeningTextForDisplay = (text: string): string => {
    //   if (!text?.trim()) return text;
    //   return text
    //     .replace(/\]\s+/g, ']\n') // novi red posle ] (kraj komentara)
    //     .replace(/\s+\[/g, '\n[') // novi red pre [ (početak komentara)
    //     .replace(/\.\s+/g, '.\n'); // novi red posle tačke (rečenice)
    // };

    const handleSelectColor = (color: 'w' | 'b') => {
      setShowOfferMoves(false);
      onSetOrientation?.(color);
      onMessage({
        content: color === 'w' ? 'White' : 'Black',
        participantId: userData?.user_id || 'user',
        idResponse:
          currentChapterState.messages[currentChapterState.messages.length - 1]
            ?.idResponse || '',
      });
      onMessage({
        content:
          color === 'w'
            ? "Great! You're playing as White. Let's explore the opening."
            : "Perfect! You're playing as Black. Let's begin.",
        participantId: 'chatGPT123456',
        idResponse: '',
      });

      setShowColorChoice(false);

      setTimeout(() => {
        setShowOfferMoves(true);
      }, 500);
    };

    const requestAnotherOpening = async () => {
      setShowColorChoice(false);
      addLearnAi({
        ...currentChapterState.aiLearn,
        moves: [],
        moves_test: [],
        errors: 0,
        hints: 0,
        popup: false,
        name: '',
        mode: 'opening',
      });
      onMessage({
        content: 'Another opening',
        participantId: userData?.user_id || 'user',
        idResponse:
          currentChapterState.messages[currentChapterState.messages.length - 1]
            ?.idResponse || '',
      });
      const list = await fetchOpeningSuggestions(4);
      setSuggestedOpenings(list);
      onMessage({
        content: 'Here are some openings you could try:',
        participantId: 'chatGPT123456',
        idResponse: '',
      });
    };

    useEffect(() => {
      onRegisterNewOpening?.(requestAnotherOpening);
    }, []);

    // Debounced function to fetch wiki content
    // const fetchWikiContent = useCallback(
    //   async (history: any[]) => {
    //     let title = 'Chess_Opening_Theory';
    //     history.forEach((pair, index) => {
    //       const moveNum = index + 1;
    //       if (pair[0]) title += `/${moveNum}._${pair[0].san}`;
    //       if (pair[1]) title += `/${moveNum}...${pair[1].san}`;
    //     });
    //     if (fetchedWikiTitlesRef.current.has(title)) return;
    //     fetchedWikiTitlesRef.current.add(title);
    //     try {
    //       const data = await getWikibooksContent(title);
    //       if (data && data.query && data.query.pages) {
    //         const pages = data.query.pages;
    //         const pageId = Object.keys(pages)[0];
    //         if (!pages[pageId].missing) {
    //           const raw: string = pages[pageId].extract ?? '';
    //           const stripped = raw
    //             .replace(/<h[1-3][^>]*>[\s\S]*?<\/h[1-4]>/gi, '')
    //             .replace(/<p[^>]*>[\s\S]*?<\/p>/i, '')
    //             .replace(/<[^>]+>/g, '')
    //             .replace(/\n+/g, ' ')
    //             .trim();
    //           const parts = stripped.split(/(?<!\d)\.\s+(?=[A-Z])/);
    //           const snippet = parts.slice(0, 2).join('. ');
    //           const text = (snippet.endsWith('.') ? snippet : snippet + '.').trim();
    //           if (text) onMessage({ content: text, participantId: 'chatGPT123456', idResponse: '' });
    //         }
    //       }
    //     } catch (e) {
    //       console.error('Wiki fetch error', e);
    //     }
    //   },
    //   [onMessage]
    // );

    // const debouncedFetchWiki = useMemo(
    //   () => debounce(fetchWikiContent, 500),
    //   [fetchWikiContent]
    // );

    const prevMoveCountRef = useRef(0);
    const prevOpeningNameRef = useRef('');
    // const fetchedWikiTitlesRef = useRef<Set<string>>(new Set());

    useEffect(() => {
      if (!openingComplete) {
        openingCompleteMessageSentRef.current = false;
        openingMovesTestSetRef.current = false;
        return;
      }
      if (openingCompleteMessageSentRef.current) return;
      openingCompleteMessageSentRef.current = true;
      onMessage({
        content:
          "Great job ⭐! You've completed the opening. Click Opening Test to practice it from memory, or Keep Playing to continue the game.",
        participantId: 'chatGPT123456',
        idResponse: '',
      });
    }, [openingComplete, onMessage]);

    useEffect(() => {
      if (currentChapterState.aiLearn.mode !== 'opening') return;

      const historyMoves: string[] = [];
      ((currentChapterState.notation?.history as any[][]) ?? []).forEach(
        (pair) =>
          (pair as any[]).forEach((m: any) => {
            if (m && !m.isNonMove)
              historyMoves.push(`${m.from}${m.to}${m.promotion ?? ''}`);
          })
      );
      const moveCount = historyMoves.length;

      if (moveCount > prevMoveCountRef.current && moveCount > 0) {
        const commentIndex = moveCount - 1;
        let comment: string | null = null;

        const openingName = (currentChapterState.aiLearn.name ?? '').trim();
        const family = findOpeningFamily(openingName);
        if (family) {
          // Find the variant that matches the full played sequence
          const matchingVariant = family.variants.find((v) =>
            historyMoves.every((m, i) => v.moves[i] === m)
          );
          if (matchingVariant) {
            comment = matchingVariant.comments[commentIndex] ?? null;
          }
        }
        // else if (moveCount <= 8) {
        //   comment = openingMoveComments[commentIndex] ?? null;
        // }

        if (comment) {
          onMessage({
            content: comment,
            participantId: 'chatGPT123456',
            idResponse: '',
          });
        }
        prevMoveCountRef.current = moveCount;
      } else {
        prevMoveCountRef.current = moveCount;
      }
    }, [
      currentChapterState.notation.history,
      currentChapterState.aiLearn.name,
      onMessage,
    ]);

    //const [visibleSuggestedCount, setVisibleSuggestedCount] = useState(3);

    const [visibleSuggestedRows, setVisibleSuggestedRows] = useState(1);

    useEffect(() => {
      // console.log('krk', currentChapterState.displayFen,currentChapterState.aiLearn.mode, currentChapterState.aiLearn.name)

      if (currentChapterState.aiLearn.mode !== 'opening') return;
      const fen = currentChapterState.displayFen;
      const openingName = (currentChapterState.aiLearn.name ?? '').trim();
      const hasOpeningSelected = openingName.length > 0;

      // Reset keepPlaying only when a different opening is selected
      if (openingName !== prevOpeningNameRef.current) {
        prevOpeningNameRef.current = openingName;
        setKeepPlaying(false);
        setPlayVsBot(false);
        openingCompleteMessageSentRef.current = false;
        openingMovesTestSetRef.current = false;
      }

      setSuggestedMoves(null);
      setBranchMoves(null);
      setOpeningComplete(false);
      setHoveredSuggestedUci(null);
      setVisibleSuggestedRows(1);
      setDeviatedFromOpening(false);
      deviationMsgSentRef.current = false;
      onArrowsChange({} as ArrowsMap);

      if (hasOpeningSelected) {
        // Read full history directly (not via focusedIndex) so refresh restores correctly
        const historyMoves: string[] = [];
        ((currentChapterState.notation?.history as any[][]) ?? []).forEach(
          (pair) =>
            (pair as any[]).forEach((m: any) => {
              if (m && !m.isNonMove)
                historyMoves.push(`${m.from}${m.to}${m.promotion ?? ''}`);
            })
        );
        const playedMoves = historyMoves;
        const currentUci = historyMoves.join(' ');

        // Branch mode: opening from local database → show arrows for all variants
        const family = findOpeningFamily(openingName);
        console.log('family', family);
        console.log('playedMoves', playedMoves);
        if (family) {
          const rawBranches = getNextBranchMoves(family, playedMoves);
          console.log('rawBranches', rawBranches);
          if (rawBranches.length > 0) {
            setBranchMoves(
              rawBranches.map((bm) => ({ ...bm, san: uciToSan(fen, bm.uci) }))
            );
            return;
          }
          // All variants exhausted → opening complete
          setOpeningComplete(true);
          if (!openingMovesTestSetRef.current) {
            openingMovesTestSetRef.current = true;
            addLearnAi({
              ...currentChapterState.aiLearn,
              moves_test: playedMoves,
            });
          }
          if (!keepPlaying) return;
          if (playVsBot) return;
        }

        const moveCount = playedMoves.length;
        const openingMoves = currentChapterState.aiLearn.moves ?? [];
        const followsOpening =
          openingMoves.length > moveCount &&
          playedMoves.every((m, i) => openingMoves[i] === m);

        if (moveCount < openingMoves.length && followsOpening) {
          const nextUci = openingMoves[moveCount];
          const san = uciToSan(fen, nextUci);
          setSuggestedMoves([{ uci: nextUci, san }]);
          setSuggestedMainMoveUci(nextUci);
        } else {
          getOutpostNextMoves(currentUci).then((data) => {
            if (data.length === 0) {
              setDeviatedFromOpening(true);
              if (!deviationMsgSentRef.current) {
                deviationMsgSentRef.current = true;

                // onMessage({
                //   content:
                //     "You've moved outside the known opening lines — there's no recorded continuation for this position. Start over to practice the full variation, then click Opening Test when you're ready!",
                //   participantId: 'chatGPT123456',
                //   idResponse: '',
                // });
              }
              return;
            }
            const parsed = parseOutpostResponseToSuggestions(
              data,
              currentUci,
              fen
            );
            const openingLower = openingName.toLowerCase();
            const firstWord = openingLower.split(/\s+/)[0] || openingLower;
            const matchKeys = [openingLower, firstWord];
            if (firstWord === 'petrov' || openingLower.includes('petrov'))
              matchKeys.push('russian', "petrov's");
            if (firstWord === 'vienna' || openingLower.includes('vienna'))
              matchKeys.push('vienna');
            const onlyThisVariant = parsed
              .filter((s) => {
                const o = (s.opening || '').toLowerCase();
                return matchKeys.some((k) => o.includes(k));
              })
              .sort((a, b) => b.cnt - a.cnt);
            let asUi = onlyThisVariant.map((m) => ({
              uci: m.uci,
              san: m.san,
            }));

            if (asUi.length === 0 && parsed.length > 0) {
              asUi = parsed
                .sort((a, b) => b.cnt - a.cnt)
                .map((m) => ({ uci: m.uci, san: m.san }));
            }
            if (asUi.length > 0) {
              setSuggestedMoves(asUi);
              setSuggestedMainMoveUci(asUi[0].uci);
            } else {
              setSuggestedMainMoveUci(null);
              getLichessTopMoves(fen, 9).then((moves) => {
                if (moves.length > 0) {
                  setSuggestedMoves(moves);
                  setSuggestedMainMoveUci(moves[0].uci);
                }
              });
            }
          });
        }
      } else {
        getLichessTopMoves(fen, 9).then((moves) => {
          if (moves.length > 0) {
            setSuggestedMoves(moves);
            setSuggestedMainMoveUci(moves[0].uci);
          } else {
            setSuggestedMainMoveUci(null);
          }
        });
      }
    }, [
      currentChapterState.displayFen,
      currentChapterState.aiLearn.mode,
      currentChapterState.aiLearn.name,
      currentChapterState.notation.history.length, // ensures restore on refresh when FEN alone doesn't change
      keepPlaying,
      playVsBot,
    ]);

    // Sync arrows with exactly the moves visible in Conversation (SAN dedup + visibleSuggestedRows)
    useEffect(() => {
      // Branch mode: colored arrows per variant
      if (branchMoves && branchMoves.length > 0) {
        const map: ArrowsMap = {} as ArrowsMap;
        branchMoves.forEach(({ uci, colorHex }) => {
          if (uci.length >= 4) {
            const from = uci.slice(0, 2) as Square;
            const to = uci.slice(2, 4) as Square;
            const id = `${from}${to}-${colorHex}` as keyof ArrowsMap;
            map[id] = [from, to, colorHex];
          }
        });
        onArrowsChange(map);
        return;
      }
      if (!suggestedMoves || suggestedMoves.length === 0) {
        onArrowsChange({} as ArrowsMap);
        return;
      }
      const seenSan = new Set<string>();
      const uniqueMoves = suggestedMoves.filter((m) => {
        if (seenSan.has(m.san)) return false;
        seenSan.add(m.san);
        return true;
      });
      const visible = uniqueMoves.slice(0, visibleSuggestedRows * 3);
      onArrowsChange(
        buildArrowsFromUciMoves(
          visible.map((m) => m.uci),
          '#11C6D1'
        )
      );
    }, [suggestedMoves, visibleSuggestedRows, branchMoves]);

    useEffect(() => {
      const lastMessage = currentChapterState?.messages?.at(-1)?.content;
      if (lastMessage?.includes('Here are some openings you could try')) {
        const getNewOpenings = async () => {
          const list = await fetchOpeningSuggestions(4);
          setSuggestedOpenings(list);
        };
        getNewOpenings();
      }
    }, []);
    //GUTA OBRISO
    // useEffect(() => {
    //   if (
    //     currentChapterState.aiLearn.mode !== 'opening' ||
    //     !suggestedMoves?.length
    //   )
    //     return;
    //   const blue = '#11C6D1';
    //   //#11c6d1
    //   const openingSelected = !!currentChapterState.aiLearn.name;
    //   const visible = suggestedMoves.slice(0, visibleSuggestedRows * 3);
    //   console.log('krk 4',visible)
    //   onArrowsChange(
    //     buildArrowsFromUciMoves(
    //       visible.map((m) => m.uci),
    //       blue,
    //       {
    //         highlightUci: hoveredSuggestedUci,
    //         dimColor: SUGGESTED_ARROW_DIM,
    //       }
    //     )
    //   );
    // }, [
    //   suggestedMoves,
    //   visibleSuggestedRows,
    //   hoveredSuggestedUci,
    //   currentChapterState.aiLearn.mode,
    //   onArrowsChange,
    // ]);

    const handleOtherSuggested = useCallback(() => {
      setVisibleSuggestedRows((prev) =>
        Math.min(prev + 1, Math.ceil((suggestedMoves?.length ?? 0) / 3))
      );
    }, [suggestedMoves?.length]);
    // Effect to follow the board (PGN/History) — only fires after a suggested move
    // useEffect(() => {
    //   if (currentChapterState.aiLearn.mode !== 'opening') return;
    //   if (
    //     currentChapterState?.notation?.history &&
    //     currentChapterState?.notation?.history.length > 4
    //   ) {
    //     const { history } = currentChapterState.notation;
    //     let activeHistory: any[] = history;
    //     debouncedFetchWiki(activeHistory);
    //   }
    // }, [currentChapterState.displayFen]);

    // const currentTabIndex = useMemo(
    //   () => widgetPanelTabsNav.getCurrentTabIndex(),
    //   [widgetPanelTabsNav.getCurrentTabIndex]
    // );

    const onTabChange = useCallback(
      (p: { tabIndex: number }) => {
        widgetPanelTabsNav.setTabIndex(p.tabIndex);
      },
      [widgetPanelTabsNav.setTabIndex]
    );
    const isMyTurn =
      currentChapterState.displayFen.split(' ')[1] ===
      currentChapterState.orientation;
    const openingTestDisabled =
      currentChapterState.aiLearn.mode === 'test' ||
      (currentChapterState.aiLearn.mode === 'opening' && !openingComplete);

    const checkAnswerGPT = async (data: any) => {
      const answerText =
        typeof data.answer === 'string' ? data.answer : data.answer?.text;
      if (
        currentChapterState.messages[
          currentChapterState?.messages?.length - 1
        ]?.participantId.includes('sales')
      ) {
        onMessage({
          content: answerText,
          participantId: 'chatGPT123456sales',
          idResponse: data.id,
        });
      } else {
        onMessage({
          content: answerText,
          participantId: 'chatGPT123456',
          idResponse: data.id,
        });
      }
    };

    const addQuestion = async (question: string) => {
      const trimmed = question?.trim() ?? '';
      if (!trimmed) return;
      var lastIdResponse =
        currentChapterState.messages[currentChapterState.messages.length - 1]
          ?.idResponse ?? '';
      const url = new URL(window.location.href);
      const userId = url.searchParams.get('userId');

      // 1) Uvek prvo proveri da li je to otvaranje iz naše baze (i za "Something else" i za običan unos)
      // const openingFromDb = getOpeningByUserInput(trimmed);
      // console.log('trt', trimmed, userId, waitingForCustomOpeningName);
      // if (openingFromDb) {
      //   if (userId) {
      //     onMessage({
      //       content: trimmed,
      //       participantId: userId,
      //       idResponse: lastIdResponse,
      //     });
      //   }
      //   setQuestion('');
      //   setWaitingForCustomOpeningName(false);
      //   handleSelectOpening(openingFromDb);
      //   return;
      // }

      // 2) Ako je kliknuo "Something else", tražimo naziv koji nije u bazi → pitaj OpenAI
      // if (waitingForCustomOpeningName) {
      //   setWaitingForCustomOpeningName(false);
      //   if (userId)
      //     onMessage({
      //       content: trimmed,
      //       participantId: userId,
      //       idResponse: lastIdResponse,
      //     });
      //   setQuestion('');
      //   setPulseDot(true);
      //   const fromAi = await getOpeningFromAiByName(trimmed, lastIdResponse);
      //   setPulseDot(false);
      //   if (fromAi) {
      //     handleSelectOpening(
      //       { name: fromAi.name, pgn: fromAi.pgn },
      //       fromAi.ideas
      //     );
      //   } else {
      //     onMessage({
      //       content:
      //         "I couldn't find that opening. Try typing another name (e.g. Italian Game, Sicilian) or pick one from the list.",
      //       participantId: 'chatGPT123456',
      //       idResponse: '',
      //     });
      //     const list = await fetchOpeningSuggestions(4);
      //     setSuggestedOpenings(list);
      //     onMessage({
      //       content:
      //         'Here are some openings you could try:',
      //       participantId: 'chatGPT123456',
      //       idResponse: '',
      //     });
      //   }
      //   return;
      // }
      // 3) Nije u bazi, ali poruka zvuči kao zahtev za otvaranje → pitaj OpenAI (i bez "Something else")
      // const extractedName = extractOpeningNameFromPhrase(trimmed);
      // if (extractedName && extractedName.length > 1) {
      //   if (userId)
      //     onMessage({
      //       content: trimmed,
      //       participantId: userId,
      //       idResponse: lastIdResponse,
      //     });
      //   setQuestion('');
      //   onMessage({
      //     content: 'One moment...',
      //     participantId: 'chatGPT123456',
      //     idResponse: '',
      //   });
      //   setPulseDot(true);
      //   const fromAi = await getOpeningFromAiByName(
      //     extractedName,
      //     lastIdResponse
      //   );
      //   setPulseDot(false);
      //   if (fromAi) {
      //     handleSelectOpening(
      //       { name: fromAi.name, pgn: fromAi.pgn },
      //       fromAi.ideas
      //     );
      //   } else {
      //     onMessage({
      //       content:
      //         "I couldn't find that opening. Try another name or pick one from the list.",
      //       participantId: 'chatGPT123456',
      //       idResponse: '',
      //     });
      //   }
      //   return;
      // }

      if (userId) {
        onMessage({
          content: question,
          participantId: userId,
          idResponse: lastIdResponse,
        });
      }
      setQuestion('');
      setTimeout(() => {
        setPulseDot(true);
      }, 500);

      const uciMoves = currentChapterState.notation.history
        .flat()
        .filter(
          (move): move is NonNullable<typeof move> =>
            !!move && !(move as any).isNonMove
        )
        .map((move) => `${move.from}${move.to}${(move as any).promotion ?? ''}`)
        .join(' ');

      let variantContext = '';
      const openingFamily = findOpeningFamily(
        currentChapterState.aiLearn.name ?? ''
      );
      if (openingFamily) {
        const variant = currentVariantName
          ? openingFamily.variants.find(
              (v) => v.variantName === currentVariantName
            )
          : openingFamily.variants[0];
        if (variant) {
          const refChess = new Chess();
          const annotatedMoves: string[] = [];
          let moveNumber = 1;
          variant.moves.forEach((uci, i) => {
            try {
              const m = refChess.move({
                from: uci.slice(0, 2) as Square,
                to: uci.slice(2, 4) as Square,
                ...(uci.length >= 5
                  ? { promotion: uci[4] as 'q' | 'r' | 'b' | 'n' }
                  : {}),
              });
              if (!m) return;
              const comment = variant.comments?.[i];
              const isWhite = i % 2 === 0;
              const prefix = isWhite ? `${moveNumber}.` : `${moveNumber}...`;
              if (isWhite) moveNumber++;
              annotatedMoves.push(
                comment
                  ? `${prefix} ${m.san} (${comment})`
                  : `${prefix} ${m.san}`
              );
            } catch {}
          });
          variantContext = `Opening reference — ${variant.variantName} (${
            variant.eco
          }, difficulty: ${openingFamily.category}):\n${annotatedMoves.join(
            ' '
          )}`;
        } else {
          variantContext = `Opening difficulty: ${openingFamily.category}`;
        }
      }

      if (branchMoves && branchMoves.length > 0) {
        const branchOptions = branchMoves
          .map((b) => `${b.san} (${b.variantName})`)
          .join(', ');
        const branchContext = `The user is currently at a branch point — these move options are shown on the board right now: ${branchOptions}. If their question is about which move/variation to pick or what these options mean, answer using this exact list.`;
        variantContext = variantContext
          ? `${variantContext}\n\n${branchContext}`
          : branchContext;
      }

      const subscriptionContext = isPro
        ? 'Subscription status: PRO — every opening in the database is unlocked.'
        : `Subscription status: FREE — only these openings are unlocked: ${FREEMIUM_OPENING_NAMES.join(
            ', '
          )}. If the user asks for any other opening, do not emit an [[OPEN:...]] tag; instead explain it requires a Pro subscription and suggest the free openings or subscribing.`;

      const data = await SendQuestionCoach(
        question,
        currentChapterState,
        uciMoves,
        currentVariantName,
        variantContext,
        subscriptionContext
      );

      if (data) {
        setPulseDot(false);
      }
      if (data === 'ai_daily_limit_reached') {
        setChatLimitPaywallVisible(true);
        onMessage({
          content: `You've hit your daily limit.
Unlock Unlimited Puzzles, Unlimited Game Reviews, and Unlimited AI Chat for just €4/Month,  and improve faster with AI-powered analysis and training.`,
          participantId: 'chatGPT123456sales',
          idResponse: '',
        });
        return;
      }
      //promena rejtinga
      // if (data?.answer?.messageType === 'ratingChange') {
      //   const number = data.answer.text?.match(/\d+/);
      //   if (number) {
      //     const newRating = parseInt(number[0], 10);
      //     setRatingBotEngine(newRating);
      //   }
      // }
      const answerText =
        typeof data?.answer === 'string' ? data.answer : data?.answer?.text;
      if (answerText) {
        // Parse [[OPEN:Family Name]] tag from AI response
        const openMatch = answerText.match(/\[\[OPEN:([^\]]+)\]\]/);
        // [[SUBSCRIBE_GATE]] is emitted when the AI declines a non-free
        // opening request — mark the message as "sales" immediately (rather
        // than waiting for a follow-up) and surface the free openings.
        const gateMatch = answerText.match(/\[\[SUBSCRIBE_GATE\]\]/);
        // Fallback for when the backend prompt hasn't been updated with the
        // tag above (or the AI just doesn't include it): a non-Pro user, no
        // [[OPEN:...]] tag, and the reply names one of the free openings is
        // already a reliable enough signal that this is a decline message.
        const mentionsFreeOpeningByName =
          !isPro &&
          !openMatch &&
          FREEMIUM_OPENING_NAMES.some((name) => answerText.includes(name));
        const isGateResponse = !!gateMatch || mentionsFreeOpeningByName;
        const cleanText = answerText
          .replace(/\[\[OPEN:[^\]]+\]\]/g, '')
          .replace(/\[\[SUBSCRIBE_GATE\]\]/g, '')
          .trim();
        // Display cleaned text (without the tags)
        if (isGateResponse) {
          onMessage({
            content: cleanText,
            participantId: 'chatGPT123456sales',
            idResponse: data.id,
          });
        } else {
          checkAnswerGPT({ ...data, answer: cleanText });
        }
        // Trigger opening selection if AI requested it
        if (openMatch) {
          const openingName = openMatch[1].trim();
          const family = findOpeningFamily(openingName);
          if (family) {
            // Safety net in case the AI backend doesn't honor the
            // subscription context — never load a non-free opening
            // client-side for a non-Pro user.
            if (!isPro && !FREEMIUM_OPENING_NAMES.includes(family.name)) {
              onMessage({
                content: `The ${family.name} is a Pro opening. Subscribe to unlock every opening in the database — for now you can try the London System or the Caro-Kann Defense for free.`,
                participantId: 'chatGPT123456sales',
                idResponse: '',
              });
            } else {
              const variant = family.variants[0];
              const chess = new Chess();
              for (const uci of variant.moves) {
                try {
                  chess.move({
                    from: uci.slice(0, 2) as Square,
                    to: uci.slice(2, 4) as Square,
                    promotion: uci[4] as any,
                  });
                } catch {}
              }
              handleSelectOpening({
                name: family.name,
                pgn: `[Event "?"]\n[Site "?"]\n\n${chess.pgn()}`,
              });
            }
          }
        }
      } else {
        onMessage({
          content:
            'Something went wrong. Please try again or ask something else.',
          participantId: 'chatGPT123456',
          idResponse: '',
        });
      }
    };

    const isMate = async () => {
      console.log('MAT');
    };

    const ratingEngine = (rating: number) => {
      setCurrentRatingEngine(rating);
    };

    const engineLines = () => {};

    const openViewSubscription = async () => {
      (window.location.href = 'https://app.outpostchess.com/subscribe'),
        '_self';
    };

    const setRatingEngine = useCallback(
      (category: number) => {
        setRatingBotEngine(category);
        onMessage({
          content: `Game started! You're playing at ${category} level.`,
          participantId: 'chatGPT123456',
          idResponse: '',
        });
        setFreezeButton(false);
      },
      [onQuickImport, onMessage]
    );

    // const openings = async () => {
    //   const data = await getOpenings();

    //   const pgn = data.pgn;
    //   const chess = new Chess();
    //   chess.loadPgn(pgn);
    //   const uciMoves = chess
    //     .history({ verbose: true })
    //     .map((m) => `${m.from}${m.to}${m.promotion ?? ''}`);
    //   addLearnAi({
    //     ...currentChapterState.aiLearn,
    //     mode: 'opening',
    //     name: data.name,
    //     moves: uciMoves,
    //   });
    // };

    const manualFetchWiki = () => {
      onTabChange({ tabIndex: 1 });
    };

    const takeBack = async () => {
      if (currentChapterState.notation.focusedIndex[0] !== -1) {
        if (currentChapterState.notation.focusedIndex[0] == 0) {
          onTakeBack([0, 0]);
        } else if (currentChapterState.notation.focusedIndex[1] == 0) {
          onTakeBack([currentChapterState.notation.focusedIndex[0] - 1, 0]);
        } else {
          onTakeBack([currentChapterState.notation.focusedIndex[0] - 1, 1]);
        }
      }
    };
    const playNext = async () => {};

    const lastEngineMoveRef = useRef<string>('');

    const playEngineMove = useCallback(
      (m: string) => {
        if (!m || m === '(none)' || m.length < 4) return;

        const isMyTurn =
          currentChapterState.displayFen.split(' ')[1] ===
          currentChapterState.orientation;
        if (isMyTurn) return;

        const fromChess = m.slice(0, 2) as Square;
        const toChess = m.slice(2, 4) as Square;
        const promoChar = m.length === 5 ? m[4] : undefined;
        const promotion =
          promoChar === 'q' ||
          promoChar === 'r' ||
          promoChar === 'b' ||
          promoChar === 'n'
            ? promoChar
            : undefined;

        const payload =
          promotion != null
            ? { from: fromChess, to: toChess, promotion }
            : { from: fromChess, to: toChess };

        setTimeout(() => {
          onMove(payload);
        }, 900);
      },
      [currentChapterState.displayFen, currentChapterState.orientation, onMove]
    );

    const engineMove = (m: string) => {
      if (!m || m === '(none)' || m.length < 4) return;
      lastEngineMoveRef.current = m;

      const isKeepPlayingMode =
        currentChapterState.aiLearn.mode === 'opening' &&
        keepPlaying &&
        playVsBot;
      if (!isKeepPlayingMode) return;

      playEngineMove(m);
    };

    // Play immediately if Play vs Bot is turned on while it's already the
    // bot's turn, using whatever move the engine last computed for this
    // position instead of waiting for the next fresh engine callback.
    useEffect(() => {
      if (currentChapterState.aiLearn.mode !== 'opening') return;
      if (!keepPlaying || !playVsBot) return;
      playEngineMove(lastEngineMoveRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playVsBot, keepPlaying]);

    const handleSuggestedMove = useCallback(
      (uci: string) => {
        const from = uci.slice(0, 2) as Square;
        const to = uci.slice(2, 4) as Square;
        const promotion =
          uci.length >= 5 ? (uci[4] as 'q' | 'r' | 'b' | 'n') : undefined;
        const turn = currentChapterState.displayFen.split(' ')[1] as 'w' | 'b';
        const promoteTo = promotion
          ? turn === 'w'
            ? (promotion.toUpperCase() as 'Q' | 'R' | 'B' | 'N')
            : promotion
          : undefined;
        const selected = branchMoves?.find((b) => b.uci === uci);
        if (selected) setCurrentVariantName(selected.variantName);
        setSuggestedMoves(null);
        onMove(promoteTo ? { from, to, promoteTo } : { from, to });
      },
      [onMove, currentChapterState.displayFen, branchMoves]
    );

    const handleGameEvaluation = (newScore: number) => {
      setprevScoreCP(scoreCP);
      setScoreCP(newScore);
      addGameEvaluation?.(newScore);
    };

    useEffect(() => {
      if (prevScoreCP !== 0) {
        const probability = async () => {
          const ProbabilityChange = await ChessEngineProbabilityCalc(
            scoreCP,
            prevScoreCP
          );
          if (currentChapterState.orientation == 'w') {
            setPercentW(ProbabilityChange.newPercentage);
            setPercentB(100 - ProbabilityChange.newPercentage);
          } else {
            setPercentB(ProbabilityChange.newPercentage);
            setPercentW(100 - ProbabilityChange.newPercentage);
          }
        };
        probability();
      }
    }, [scoreCP]);
    const handleKeepPlaying = () => {
      setKeepPlaying(true);
      addLearnAi({
        ...currentChapterState.aiLearn,
        mode: 'opening',
        popup: false,
      });
    };

    useEffect(() => {
      onRegisterKeepPlaying?.(handleKeepPlaying);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onRegisterKeepPlaying]);

    const handleNextVariation = () => {
      const openingName = (currentChapterState.aiLearn.name ?? '').trim();
      const family = findOpeningFamily(openingName);
      if (!family) return;

      const trunkMoves = getTrunkMoves(family);
      const chess = new Chess();
      for (const uci of trunkMoves) {
        chess.move({
          from: uci.slice(0, 2) as Square,
          to: uci.slice(2, 4) as Square,
          ...(uci.length >= 5
            ? { promotion: uci[4] as 'q' | 'r' | 'b' | 'n' }
            : {}),
        });
      }

      setCurrentVariantName(null);
      setKeepPlaying(false);
      setPlayVsBot(false);

      addLearnAi({
        ...currentChapterState.aiLearn,
        moves_test: [],
      });

      if (trunkMoves.length === 0) {
        onQuickImport({ type: 'FEN', val: ChessFENBoard.STARTING_FEN });
      } else {
        onQuickImport({ type: 'PGN', val: chess.pgn() });
      }
    };

    const getHint = async () => {
      const history = currentChapterState.notation.history;
      const playedMoves: string[] = [];
      (history as any[]).flat().forEach((m: any) => {
        if (m && !m.isNonMove) {
          playedMoves.push(`${m.from}${m.to}${m.promotion ?? ''}`);
        }
      });
      const moveCount = playedMoves.length;
      const openingMoves = currentChapterState.aiLearn.moves_test ?? [];
      const blue = '#11C6D1';

      if (moveCount < openingMoves.length) {
        onArrowsChange(
          buildArrowsFromUciMoves([openingMoves[moveCount]], blue)
        );
      } else if (suggestedMainMoveUci) {
        onArrowsChange(buildArrowsFromUciMoves([suggestedMainMoveUci], blue));
      }
      addLearnAi({
        ...currentChapterState.aiLearn,
        hints: (currentChapterState.aiLearn.hints ?? 0) + 1,
      });
    };
    const testOpening = async () => {
      setFreezeButton(true);
      addLearnAi({
        ...currentChapterState.aiLearn,
        mode: 'test',
        //    moves_test: currentChapterState.aiLearn.moves_test,
        errors: 0,
        hints: 0,
        popup: false,
      });
      onMessage({
        content: 'Time to review the opening!',
        participantId: 'chatGPT123456',
        idResponse:
          currentChapterState.messages[currentChapterState.messages.length - 1]
            .idResponse ?? '',
      });
      onQuickImport({
        type: 'FEN',
        val: ChessFENBoard.STARTING_FEN,
      });
      // onArrowsChange({});

      setTimeout(() => setFreezeButton(false), 3000);
    };

    const goToMainLine = () => {
      const history = currentChapterState.notation?.history ?? [];
      if (history.length === 0) return;
      const lastIndex = FreeBoardHistory.getLastIndexInHistory(history);
      onHistoryNotationRefocus(lastIndex);
    };

    // Auto-play opponent moves in test mode
    useEffect(() => {
      if (currentChapterState.aiLearn.mode !== 'test') return;

      const userColor = currentChapterState.orientation;
      const currentTurnColor = currentChapterState.displayFen.split(' ')[1];

      if (currentTurnColor === userColor) return;

      const history = currentChapterState.notation.history;
      const playedMoves: string[] = [];
      (history as any[]).flat().forEach((m: any) => {
        if (m && !m.isNonMove) {
          playedMoves.push(`${m.from}${m.to}${m.promotion ?? ''}`);
        }
      });
      const moveCount = playedMoves.length;
      const openingMoves = currentChapterState.aiLearn.moves_test ?? [];

      const timer = setTimeout(() => {
        if (moveCount >= openingMoves.length) return;
        const nextUci = openingMoves[moveCount];
        if (!nextUci || nextUci.length < 4) return;

        const from = nextUci.slice(0, 2) as Square;
        const to = nextUci.slice(2, 4) as Square;
        const promoChar =
          nextUci.length >= 5
            ? (nextUci[4] as 'q' | 'r' | 'b' | 'n')
            : undefined;

        onMove(promoChar ? { from, to, promoteTo: promoChar } : { from, to });
      }, 700);

      return () => clearTimeout(timer);
    }, [
      currentChapterState.aiLearn.mode,
      currentChapterState.notation.history,
    ]);

    return (
      <div className="flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl flex-1 flex min-h-0 ">
        {/* keepPlaying && playVsBot && */}

        <StockFishEngineAI
          fen={currentChapterState.displayFen}
          orientation={currentChapterState.orientation}
          playMode={true}
          isMyTurn={
            currentChapterState.displayFen.split(' ')[1] ===
            currentChapterState.orientation
          }
          engineMove={engineMove}
          engineLines={engineLines}
          IsMate={isMate}
          isMobile={isMobile ?? false}
          newRatingEngine={newRatingEngine}
          ratingEngine={ratingEngine}
          addGameEvaluation={handleGameEvaluation}
        />

        <div className="flex-1 min-h-0 min-w-0 flex flex-col border  bg-op-widget  border-conversation-100 pb-2 px-2 md:px-2 md:pb-4 rounded-lg">
          {/* Conversation (order-2) fills the space below the buttons and
              scrolls internally — this container no longer scrolls as a
              page, it just reserves bottom safe-area room per platform. */}
          <div
            className={`flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden no-scrollbar md:pb-0 ${
              isOutpostWebViewAndroid
                ? 'pb-4'
                : isOutpostWebViewIos
                ? 'pb-0'
                : ''
            }`}
            style={
              isMobile && !isOutpostWebViewAndroid && !isOutpostWebViewIos
                ? { paddingBottom: extraBottomGap }
                : undefined
            }
          >
            {/* Buttons: order-1 on mobile (above conversation), order-2 on desktop (below conversation) */}
            <div className="flex order-1 md:order-2 gap-3 flex-shrink-0 pt-2 pb-2 md:my-[20px] justify-around sticky top-[-4px] z-10 bg-op-widget">
              {currentChapterState.aiLearn.mode === 'opening' && isBrowsing ? (
                <ButtonGreen
                  onClick={goToMainLine}
                  size="md"
                  icon="ArrowUturnLeftIcon"
                  iconKind="outline"
                  className="md:max-w-[175px] max-w-[175px] min-w-[80px]"
                >
                  <p className="whitespace-nowrap">
                    {isMobile ? 'Main Line' : 'Main Line'}
                  </p>
                </ButtonGreen>
              ) : (
                <ButtonGreen
                  onClick={() => {
                    testOpening();
                  }}
                  size="md"
                  icon="BeakerIcon"
                  iconKind="outline"
                  iconClassName={!openingTestDisabled ? 'text-black' : ''}
                  className="md:max-w-[140px] max-w-[140px] min-w-[80px]"
                  style={{
                    ...(!openingTestDisabled
                      ? {
                          backgroundColor: 'rgba(7, 218, 99)',
                          color: '#000000',
                        }
                      : {}),
                  }}
                  disabled={openingTestDisabled}
                >
                  <p className="whitespace-nowrap">
                    {isMobile ? 'Test' : 'Opening Test'}
                  </p>
                </ButtonGreen>
              )}
              {currentChapterState.aiLearn.mode === 'opening' &&
              openingComplete &&
              !keepPlaying ? (
                <ButtonGreen
                  icon="PlayIcon"
                  iconKind="outline"
                  onClick={handleKeepPlaying}
                  size="md"
                  className="md:max-w-[160px] max-w-[160px] min-w-[80px]  md:min-w-[120px] "
                >
                  <p className="text-sm whitespace-nowrap">
                    {' '}
                    {isMobile ? 'Play' : 'Keep Playing'}
                  </p>
                </ButtonGreen>
              ) : currentChapterState.aiLearn.mode === 'opening' &&
                keepPlaying ? (
                <ButtonGreen
                  icon="SparklesIcon"
                  iconKind="outline"
                  onClick={() => {
                    setPlayVsBot(true);
                  }}
                  size="md"
                  className="md:max-w-[160px] max-w-[160px] "
                  disabled={playVsBot}
                >
                  <p>{isMobile ? 'vs Bot' : 'Play vs Bot'}</p>
                </ButtonGreen>
              ) : (
                <ButtonGreen
                  onClick={() => {
                    getHint();
                  }}
                  icon="LightBulbIcon"
                  iconKind="outline"
                  size="md"
                  className="md:max-w-[100px] max-w-[100px]  "
                  style={{ maxWidth: smallMobile ? '68px' : '' }}
                  disabled={
                    (currentChapterState.aiLearn.mode !== 'test' &&
                      hintActive) ||
                    !!currentChapterState.aiLearn.popup
                  }
                >
                  <p>Hint</p>
                </ButtonGreen>
              )}
              <ButtonGreen
                icon="ArrowsRightLeftIcon"
                iconKind="outline"
                onClick={requestAnotherOpening}
                size="md"
                className="max-w-[180px] min-w-[135px] "
                style={{ maxWidth: smallMobile ? '100px' : '' }}
                disabled={currentChapterState.aiLearn.moves.length === 0}
              >
                <p className="whitespace-nowrap">
                  {isMobile ? 'New Opening' : 'Another Opening'}
                </p>
              </ButtonGreen>
            </div>

            {/* Conversation: order-2 on mobile (below buttons), order-1 on desktop */}
            <div className="order-2 md:order-1 min-w-0 flex-1 min-h-0 flex flex-col">
              <Conversation
                showColorChoice={showColorChoice}
                onSelectColor={handleSelectColor}
                suggestedOpenings={suggestedOpenings}
                freemiumOpenings={
                  !isPro ? getFreemiumOpeningPicks() : undefined
                }
                onSelectOpening={handleSelectOpening}
                onSelectSomethingElse={handleSomethingElse}
                currentChapterState={currentChapterState}
                showOfferMoves={showOfferMoves && !isBrowsing}
                openViewSubscription={openViewSubscription}
                onSelectRating={setRatingEngine}
                onSelectLearnMode={async (mode) => {
                  if (mode === 'opening') {
                    const list = await fetchOpeningSuggestions(4);
                    setSuggestedOpenings(list);
                    onMessage({
                      content: 'Here are some openings you could try:',
                      participantId: 'chatGPT123456',
                      idResponse: '',
                    });
                  }
                }}
                pulseDot={pulseDot}
                takeBack={takeBack}
                playNext={playNext}
                userData={userData}
                smallMobile={smallMobile}
                isMobile={isMobile}
                onHistoryNotationRefocus={onHistoryNotationRefocus}
                notationHistoryLength={
                  currentChapterState.notation?.history?.length ?? 0
                }
                suggestedMoves={suggestedMoves}
                branchMoves={branchMoves}
                visibleSuggestedRows={visibleSuggestedRows}
                onOtherSuggested={handleOtherSuggested}
                onSuggestedMove={handleSuggestedMove}
                onSuggestedMoveHover={setHoveredSuggestedUci}
                deviatedFromOpening={deviatedFromOpening}
                onNextVariation={handleNextVariation}
                chatLimitPaywallVisible={chatLimitPaywallVisible}
                onCloseChatLimitPaywall={() =>
                  setChatLimitPaywallVisible(false)
                }
              />
            </div>

            {/* Input: always last (order-3) */}
            <div
              className="order-3"
              style={{
                paddingBottom:
                  isMobile && showMobileChatInput ? '68px' : undefined,
              }}
            >
              {(!isMobile || showMobileChatInput) && (
                <div
                  className={
                    isMobile
                      ? 'flex fixed bottom-0 left-0 right-0 z-30 bg-op-widget border-t border-conversation-100 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] items-center gap-2'
                      : 'flex flex-shrink-0 mb-2 mt-2 px-1 md:mt-0 items-center gap-2'
                  }
                >
                  <input
                    id="title"
                    type="text"
                    name="tags"
                    placeholder="Type here..."
                    value={question}
                    autoFocus={isMobile}
                    style={{ boxShadow: '0px 0px 10px 0px #07DA6380' }}
                    className="w-full text-[16px]  md:text-[14px] rounded-[20px] border border-conversation-100 bg-[#111111]/40 text-white placeholder-[#FFFFFF]/25 px-4 py-1 md:py-2 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-conversation-200 hover:border-conversation-300"
                    onChange={(e) => setQuestion(e.target.value)}
                    onFocus={() => setIsFocusedInput(true)}
                    onBlur={() => setIsFocusedInput(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        addQuestion(question);
                        if (isMobile) setShowMobileChatInput(false);
                      }
                    }}
                  />
                  <ButtonGreen
                    icon="MicrophoneIcon"
                    iconClassName="text-green-800"
                    iconKind="outline"
                    onClick={startVoiceInput}
                    className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                      isListening
                        ? 'bg-red-500/80 text-white'
                        : 'bg-[#111111]/40 bg-[#D9D9D9]/20 opacity-30 text-slate-300 hover:bg-slate-600 border border-conversation-100'
                    }`}
                    title={isListening ? 'Stop listening' : 'Voice input'}
                  />
                  <ButtonGreen
                    size="md"
                    onClick={() => {
                      const isEmpty = question.trim() === '';
                      if (isMobile && isEmpty) {
                        setShowMobileChatInput(false);
                        return;
                      }
                      if (!isEmpty) {
                        addQuestion(question);
                        if (isMobile) setShowMobileChatInput(false);
                      }
                    }}
                    disabled={isMobile ? false : question.trim() == ''}
                    icon={
                      isMobile && question.trim() === ''
                        ? 'XMarkIcon'
                        : 'PaperAirplaneIcon'
                    }
                    iconKind="outline"
                    iconClassName="text-green-800"
                    className="flex-shrink-0 px-4 py-2 duration-200"
                  />
                </div>
              )}
              {isMobile && !showMobileChatInput && (
                <ButtonGreen
                  onClick={() => setShowMobileChatInput(true)}
                  aria-label="Open chat"
                  size="lg"
                  icon="ChatBubbleOvalLeftEllipsisIcon"
                  iconKind="outline"
                  iconClassName="!h-7 !w-7 text-black"
                  className="!fixed !bottom-4 !right-4 !z-30 !h-14 !w-14 !rounded-full !bg-[#07DA63] shadow-lg active:scale-95 transition-transform"
                />
              )}
            </div>

            <div className="order-4">
              <EvalBar
                percentW={percentW}
                percentB={percentB}
                scoreCP={scoreCP}
                hideScore={
                  (currentChapterState.notation?.history?.length ?? 0) === 0
                }
              />
            </div>

            {/* <div className="mt-2 flex flex-wrap items-center gap-1 text-sm text-slate-300 min-w-0 max-h-20 overflow-y-auto overflow-x-hidden">
              {' '}
              {currentChapterState.notation?.history?.map((pair, moveIdx) => (
                <span key={moveIdx} className="flex items-center gap-0.5">
                  <span className="text-slate-500">{moveIdx + 1}.</span>
                  {pair[0] && !(pair[0] as any).isNonMove && (
                    <button
                      type="button"
                      className="px-1 rounded hover:bg-slate-600"
                      onClick={() => onHistoryNotationRefocus([moveIdx, 0])}
                    >
                      {(pair[0] as any).san}
                    </button>
                  )}
                  {pair[1] && !(pair[1] as any).isNonMove && (
                    <button
                      type="button"
                      className="px-1 rounded hover:bg-slate-600"
                      onClick={() => onHistoryNotationRefocus([moveIdx, 1])}
                    >
                      {(pair[1] as any).san}
                    </button>
                  )}
                </span>
              ))}
              {suggestedMainMoveUci &&
                (() => {
                  const from = suggestedMainMoveUci.slice(0, 2) as Square;
                  const to = suggestedMainMoveUci.slice(2, 4) as Square;
                  const promotion =
                    suggestedMainMoveUci.length >= 5
                      ? (suggestedMainMoveUci[4] as 'q' | 'r' | 'b' | 'n')
                      : undefined;
                  let san: string;
                  try {
                    const chess = new Chess(currentChapterState.displayFen);
                    const move = chess.move({ from, to, promotion });
                    if (!move) return null; // ne prikazuj dugme ako potez nije legalan u trenutnoj poziciji
                    san = move.san;
                  } catch {
                    return null; // zastareo predlog ili neusklađen FEN – ne prikazuj dugme
                  }
                  return (
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded bg-green-800/50 hover:bg-green-700/50"
                      onClick={() => onMove({ from, to })}
                    >
                      {san}
                    </button>
                  );
                })()}
            </div> */}
          </div>

          <div className="hidden md:flex flex-shrink-0 md:h-[240px] mt-2 rounded-lg  md:p-4 p-2 overflow-y-auto no-scrollbar">
            <FreeBoardNotation
              // reviewData={reviewData}
              isMobile={isMobile}
              history={currentChapterState.notation?.history}
              playerNames={playerNames}
              focusedIndex={currentChapterState.notation?.focusedIndex}
              onDelete={onHistoryNotationDelete}
              onRefocus={onHistoryNotationRefocus}
              isFocusedInput={isFocusedInput}
            />
          </div>
        </div>
      </div>
    );
  }
);
