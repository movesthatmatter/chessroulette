import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from '@app/components/FreeBoardNotation';
import { useExtraBottomGap } from '@app/hooks/useExtraBottomGap';
import type { ChapterState, Message, UserData, dailyLesson } from '../../movex';
import type { Lesson, LessonStep } from '../../lessonDatabase';
import { MAX_HINTS_PER_STEP } from '../../lessonDatabase';
import Conversation from './Conversation';
import {
  SendQuestionCoach,
  emphasizeKeyPoints,
  prepareEngineContext,
} from './SendQuestionCoach';
import { FreePlayControls } from './FreePlayControls';

/**
 * Koliko dugo Next dugme puni "pilulicu" pre nego sto samo ucita sledeci
 * primer - dovoljno da se pročita poruka trenera, ali ne toliko da deluje sporo.
 */
const AUTO_ADVANCE_MS = 6000;

const TRAIL_STROKE = 2;
// Prsten oko dugmeta, px van njegove ivice.
const RING_OFFSET = 4;
const SPARKS = [
  { left: '6%', top: '-40%', delay: 0, color: '#64D771' },
  { left: '30%', top: '120%', delay: 0.6, color: '#11C6D1' },
  { left: '58%', top: '-55%', delay: 1.1, color: '#ffffff' },
  { left: '86%', top: '115%', delay: 0.3, color: '#64D771' },
  { left: '102%', top: '10%', delay: 1.5, color: '#11C6D1' },
  { left: '-8%', top: '70%', delay: 0.9, color: '#ffffff' },
];

/**
 * "Upaljeno" dugme kad korisnik igra na tabli umesto da klikne: sjaj na
 * dugmetu, prsten sa svetlom koje kruzi, oreol i iskrice. Meri pravu
 * velicinu i zaobljenje roditeljskog dugmeta.
 */
const NudgeGlow = () => {
  const ref = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ w: number; h: number; r: number } | null>(
    null
  );

  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    const measure = () => {
      const r = parseFloat(getComputedStyle(host).borderTopLeftRadius) || 0;
      setBox({ w: host.offsetWidth, h: host.offsetHeight, r });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  const inset = TRAIL_STROKE / 2;
  const ringW = box ? box.w + RING_OFFSET * 2 - TRAIL_STROKE : 0;
  const ringH = box ? box.h + RING_OFFSET * 2 - TRAIL_STROKE : 0;
  const ringRx = box
    ? Math.max(0, Math.min(box.r + RING_OFFSET - inset, ringH / 2, ringW / 2))
    : 0;

  return (
    <span
      ref={ref}
      aria-hidden
      className="dl-nudge pointer-events-none absolute inset-0"
      style={{ borderRadius: 'inherit' }}
    >
      <span className="dl-nudge-halo absolute" />
      <span
        className="absolute inset-0"
        style={{
          borderRadius: 'inherit',
          background:
            'linear-gradient(180deg, rgba(255,255,255,.32) 0%, rgba(255,255,255,0) 50%)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,.65), inset 0 -3px 8px rgba(0,90,45,.28)',
        }}
      />
      {SPARKS.map((sp, i) => (
        <span
          key={i}
          className="dl-nudge-spark absolute"
          style={{
            left: sp.left,
            top: sp.top,
            background: sp.color,
            boxShadow: `0 0 6px ${sp.color}`,
            animationDelay: `${sp.delay}s`,
          }}
        />
      ))}
      {box && (
        <svg
          className="absolute overflow-visible"
          style={{ left: -RING_OFFSET, top: -RING_OFFSET }}
          width={box.w + RING_OFFSET * 2}
          height={box.h + RING_OFFSET * 2}
        >
          <rect
            x={inset}
            y={inset}
            width={ringW}
            height={ringH}
            rx={ringRx}
            fill="none"
            stroke="rgba(100, 215, 113, 0.45)"
            strokeWidth={1.5}
          />
          <rect
            className="dl-trail-dash"
            x={inset}
            y={inset}
            width={ringW}
            height={ringH}
            rx={ringRx}
            pathLength={100}
            fill="none"
            stroke="#ffffff"
            strokeWidth={TRAIL_STROKE}
            strokeLinecap="round"
          />
        </svg>
      )}
      <style>{`
        @keyframes dl-trail { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -100; } }
        @keyframes dl-ignite { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }
        @keyframes dl-breathe { 0%, 100% { opacity: .65; } 50% { opacity: 1; } }
        @keyframes dl-spark { 0% { opacity: 0; transform: translateY(4px) scale(.6); } 40% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px) scale(1); } }
        .dl-nudge { animation: dl-ignite .35s ease-out both; }
        .dl-nudge-halo { left: -45%; right: -45%; top: -140%; bottom: -140%; z-index: -1; border-radius: 9999px;
          background: radial-gradient(closest-side, rgba(7,218,99,.42), rgba(17,198,209,.14) 60%, transparent);
          filter: blur(6px); animation: dl-breathe 2.6s ease-in-out infinite; }
        .dl-nudge-spark { width: 3px; height: 3px; border-radius: 9999px; animation: dl-spark 2.2s ease-out infinite; }
        .dl-trail-dash { stroke-dasharray: 14 86; animation: dl-trail 3s linear infinite;
          filter: drop-shadow(0 0 3px rgba(255,255,255,.9)) drop-shadow(0 0 6px rgba(100,215,113,.8)); }
        @media (prefers-reduced-motion: reduce) { .dl-nudge, .dl-nudge-halo, .dl-nudge-spark, .dl-trail-dash { animation: none; } }
      `}</style>
    </span>
  );
};

export type DailyLessonWidgetPanelProps = {
  userData: UserData;
  currentChapterState: ChapterState;
  lesson: Lesson | null;
  step: LessonStep | null;
  lessonState: dailyLesson;
  isStepComplete: boolean;
  isLastStep: boolean;
  isBusy: boolean;
  /** Next je spreman za klik - isti trenutak kad progress traka slavi zavrsen korak. */
  nextReady: boolean;
  /** Progress traka (+ Score) iznad chata - na mobilnom kviz koraku deli red sa Hint/Next dugmadima. */
  progressHeader?: React.ReactNode;
  /** Ispod reda sa trakom (npr. Day 30 Score) - ne ulazi u vertikalno centriranje Hint/Next dugmadi. */
  progressFooter?: React.ReactNode;
  isInstructor: boolean;
  onHint: () => void;
  /** LessonStep.liveHint (Day 20 Phase 2) - uzivo poziv u toku, prikazuje "Thinking..." i blokira dupli klik. */
  liveHintLoading?: boolean;
  /** Broj hintova na pocetku trenutnog poteza (limit od 2 vazi po potezu). */
  hintBase?: number;
  /** Korisnik je vukao figuru na vec resenom koraku - Next/Start pulsira dok se ne klikne. */
  nudgeNext?: boolean;
  /** Vraca celu lekciju na prvi korak. */
  onRepeatLesson: () => void;
  onNextStep: () => void;
  onMessage: (message: Message) => void;
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  /** Kviz pitanje (kind:'quiz') - korisnik bira jedno od 4 ponudjena dugmeta. */
  onSelectQuizAnswer: (index: number) => void;
  /** quizMoveOptions - opcija odgovorena potezom na tabli, oznaci je i ovde. */
  boardQuizAnswer?: number | null;
  /** LessonStep.quizMultiSelect (Day 31) - poziva se TEK kad je izabrano tacno onoliko opcija koliko quizCorrectIndices trazi. */
  onSelectMultiQuizAnswer?: (indices: number[]) => void;
  /** step.suggestedMove (Day 17) - klik na potez u chatu, umesto prevlacenja. */
  onPlaySuggestedMove: (uci: string) => void;
  /** LessonStep.suggestSolutionMoves - sledeci potez iz linije, dugme ispod poslednje poruke. */
  nextSolutionMove?: { uci: string; label: string } | null;
  /** kind:'freePlay' (Day 14) - zamenjuju Next dugme, vidi FreePlayControls. */
  onDrawOffer: () => void;
  onTakeBack: () => void;
  onResign: () => void;
  /** Bar jedna cela runda (korisnik + Pawny) odigrana - ima sta da se vrati. */
  canTakeBack: boolean;
};

export const DailyLessonWidgetPanel = ({
  userData,
  currentChapterState,
  lesson,
  step,
  lessonState,
  isStepComplete,
  isLastStep,
  isBusy,
  nextReady,
  progressHeader,
  progressFooter,
  onHint,
  liveHintLoading,
  hintBase = 0,
  nudgeNext = false,
  onRepeatLesson,
  onNextStep,
  onMessage,
  onHistoryNotationRefocus,
  onSelectQuizAnswer,
  boardQuizAnswer = null,
  onSelectMultiQuizAnswer,
  onPlaySuggestedMove,
  nextSolutionMove,
  onDrawOffer,
  onTakeBack,
  onResign,
  canTakeBack,
}: DailyLessonWidgetPanelProps) => {
  const [question, setQuestion] = useState('');
  // Koje dugme je user kliknuo na trenutnom kviz pitanju - lokalno, resetuje
  // se na svaki novi korak. Samo za vizuelno oznacavanje (tacno/netacno).
  const [quizSelectedIndex, setQuizSelectedIndex] = useState<number | null>(
    null
  );
  useEffect(() => {
    setQuizSelectedIndex(null);
  }, [step?.id]);
  useEffect(() => {
    if (boardQuizAnswer !== null) setQuizSelectedIndex(boardQuizAnswer);
  }, [boardQuizAnswer]);
  const handleQuizAnswer = useCallback(
    (index: number) => {
      if (quizSelectedIndex !== null) return;
      setQuizSelectedIndex(index);
      onSelectQuizAnswer(index);
      // Day 15 Position 6 "Yes/No" trik (quizRetryOnWrong) i Day 31 Q14
      // (quizScoredRetry) - netacan odgovor ne zavrsava korak, pa dugmad
      // vracamo posle kratke pauze (dovoljno da se nagovestaj procita) da
      // korisnik moze da proba ponovo.
      if (
        (step?.quizRetryOnWrong || step?.quizScoredRetry) &&
        index !== step?.quizCorrectIndex
      ) {
        setTimeout(() => setQuizSelectedIndex(null), 1600);
      }
    },
    [quizSelectedIndex, onSelectQuizAnswer, step]
  );
  // LessonStep.quizMultiSelect (Day 31 Q2/Q3) - TOGGLE selekcija (ne
  // zakljucava na prvi klik kao standardan kviz) - cim je izabrano tacno
  // `quizCorrectIndices.length` opcija, automatski se salje na ocenjivanje.
  const [multiSelected, setMultiSelected] = useState<number[]>([]);
  const [multiSubmitted, setMultiSubmitted] = useState(false);
  useEffect(() => {
    setMultiSelected([]);
    setMultiSubmitted(false);
  }, [step?.id]);
  const handleToggleMultiOption = useCallback(
    (index: number) => {
      if (multiSubmitted) return;
      const needed = step?.quizCorrectIndices?.length ?? 2;
      setMultiSelected((prev) => {
        const next = prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index];
        if (next.length >= needed) {
          setMultiSubmitted(true);
          onSelectMultiQuizAnswer?.(next);
        }
        return next;
      });
    },
    [multiSubmitted, step, onSelectMultiQuizAnswer]
  );
  // step.suggestedMove (Day 17) dugme - sakriva se ODMAH na klik (lokalno),
  // ne ceka se async dispatch/isStepComplete krug (isti princip kao
  // quizSelectedIndex iznad - inace bi dugme ostalo klikabilno jos jedan
  // render posle klika).
  const [suggestedMovePlayed, setSuggestedMovePlayed] = useState(false);
  useEffect(() => {
    setSuggestedMovePlayed(false);
  }, [step?.id]);
  const handlePlaySuggestedMove = useCallback(
    (uci: string) => {
      if (suggestedMovePlayed) return;
      setSuggestedMovePlayed(true);
      onPlaySuggestedMove(uci);
    },
    [suggestedMovePlayed, onPlaySuggestedMove]
  );
  const [isFocusedInput, setIsFocusedInput] = useState(false);
  const [pulseDot, setPulseDot] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [smallMobile, setSmallMobile] = useState(false);
  const [showMobileChatInput, setShowMobileChatInput] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatLimitPaywallVisible, setChatLimitPaywallVisible] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const extraBottomGap = useExtraBottomGap();

  // Next dugme samo puni "pilulicu" AUTO_ADVANCE_MS i onda samo ucita sledeci
  // primer ako user ne klikne pre toga - vazi samo dok je nextReady (korak
  // gotov, tabla slobodna), ne i za trenutni kratki bljesak zelene dok se
  // ceka protivnikov odgovor (isStepComplete && isBusy). CSS *animacija* (ne
  // transition) namerno - jedino animation-play-state ume da se PAUZIRA na
  // hover i nastavi tacno odakle je stala (transition nema pauzu), pa dok
  // korisnik hoveruje dugme, punjenje stane; cim mis ode, nastavlja dalje.
  const autoAdvanceFiredRef = useRef(false);

  useEffect(() => {
    autoAdvanceFiredRef.current = false;
  }, [nextReady]);

  const handleAutoAdvanceFillDone = useCallback(() => {
    if (autoAdvanceFiredRef.current) return;
    autoAdvanceFiredRef.current = true;
    onNextStep();
  }, [onNextStep]);

  const handleNextClick = useCallback(() => {
    // Spreci da naknadno zavrsena "pilulica" (koja je vec u toku) opet
    // pozove onNextStep posto je user vec rucno kliknuo.
    autoAdvanceFiredRef.current = true;
    onNextStep();
  }, [onNextStep]);

  useEffect(() => {
    setSmallMobile(window.innerWidth < 400);
    setIsMobile(window.innerWidth < 768);
  }, []);

  const addQuestion = useCallback(
    async (raw: string) => {
      const trimmed = raw?.trim() ?? '';
      if (!trimmed) return;

      const lastIdResponse =
        currentChapterState.messages[currentChapterState.messages.length - 1]
          ?.idResponse ?? '';

      onMessage({
        content: trimmed,
        participantId: userData?.user_id || 'user',
        idResponse: lastIdResponse,
      });
      setQuestion('');
      setPulseDot(true);

      const lessonContext = step
        ? `Lesson: ${lesson?.title ?? ''}. Current task: ${step.prompt}.`
        : '';

      const data = await SendQuestionCoach(
        trimmed,
        currentChapterState,
        lessonContext
      );
      setPulseDot(false);

      if (data === 'ai_daily_limit_reached') {
        setChatLimitPaywallVisible(true);
        return;
      }

      const answerText =
        typeof data?.answer === 'string' ? data.answer : data?.answer?.text;
      // Kviz korak nema Hint dugme (nista "tap Hint below" tu ne znaci), pa
      // dobija drugaciji, opustenji fallback - OK je pogresiti, odgovor se
      // bira iznad, objasnjenje stize bilo kako bilo. markSquares ima Hint
      // dugme (pokazuje tacna polja), pa ga pominjemo eksplicitno.
      const fallback =
        step?.kind === 'quiz'
          ? "Didn't catch that. Pick an answer above. **Right or wrong**, I'll explain it."
          : step?.kind === 'markSquares'
          ? "Didn't catch that. **Right-click** the squares you think are right (long-press on mobile). Stuck? Tap **Hint**."
          : "Didn't catch that. Stuck? Tap **Hint** below.";
      onMessage({
        content: answerText ? emphasizeKeyPoints(answerText) : fallback,
        participantId: 'chatGPT123456',
        idResponse: data?.id ?? '',
      });
    },
    [currentChapterState, lesson, step, onMessage, userData]
  );

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
  }, [addQuestion]);

  // Lekcija je gotova -> Next se krije, ostaju Play i Repeat.
  const lessonDone = lessonState.completed;

  // Mobilni: Hint/Next red ide desno od progress trake umesto iznad chata -
  // chat dobija tu visinu. freePlay (Day 14) nema traku, pa ostaje kako je bio.
  const buttonsBesideProgress = isMobile && step?.kind !== 'freePlay';
  // quizAnswerViaNextButton - pre odgovora Next dugme JE odgovor (npr. 'Show me')
  const answerViaNext = !!step?.quizAnswerViaNextButton && !isStepComplete;

  const buttonsRow = (
    <div
      className={
        buttonsBesideProgress
          ? `flex gap-2 relative shrink-0 ${nextReady ? 'z-[95]' : ''}`
          : `flex order-1 md:order-2 gap-3 flex-shrink-0 pt-2 pb-2 md:my-[20px] justify-around sticky top-[-4px] ${
              nextReady ? 'z-[95]' : 'z-10 bg-op-widget'
            }`
      }
    >
      {/* freePlay sa liveHint dobija isto standardno Hint dugme kao ostale lekcije. */}
      {(step?.kind !== 'freePlay' || !!step?.liveHint) &&
        (step?.kind !== 'quiz' || !!step?.extraHintText) && (
          <ButtonGreen
            onClick={onHint}
            icon="LightBulbIcon"
            iconKind="outline"
            size="md"
            className="md:max-w-[110px] max-w-[110px] px-4"
            style={{ maxWidth: smallMobile ? '76px' : '' }}
            disabled={
              isBusy ||
              isStepComplete ||
              liveHintLoading ||
              // step.liveHint (Day 20 Phase 2) - uvek dostupno, NIJE
              // ograniceno MAX_HINTS_PER_STEP brojacem (vidi onHint).
              (!step?.liveHint &&
                lessonState.hints - hintBase >= MAX_HINTS_PER_STEP)
            }
          >
            <p>{liveHintLoading ? 'Thinking...' : 'Hint'}</p>
          </ButtonGreen>
        )}

      {lessonDone ? (
        <>
          <ButtonGreen
            icon="PlayIcon"
            iconKind="outline"
            size="md"
            className="md:max-w-[130px] max-w-[130px] px-4"
            style={{ maxWidth: smallMobile ? '90px' : '' }}
            onClick={() => {
              window.location.href = 'https://app.outpostchess.com/online-list';
            }}
          >
            <p className="whitespace-nowrap">Play</p>
          </ButtonGreen>
          <ButtonGreen
            onClick={onRepeatLesson}
            icon="ArrowPathIcon"
            iconKind="outline"
            size="md"
            className="md:max-w-[130px] max-w-[130px] px-4"
            style={{ maxWidth: smallMobile ? '90px' : '' }}
            disabled={isBusy}
            title="Restart the whole lesson"
          >
            <p className="whitespace-nowrap">Repeat</p>
          </ButtonGreen>
        </>
      ) : step?.kind === 'freePlay' && step.freePlayGoal && !isStepComplete ? (
        // Lessons 2 Day 8 - isti par dugmadi kao Hint/Next u ostalim lekcijama; posle dame Next (Day 27).
        <ButtonGreen
          onClick={onTakeBack}
          icon="ArrowUturnLeftIcon"
          iconKind="outline"
          size="md"
          className="md:max-w-[130px] max-w-[130px] px-4"
          style={{ maxWidth: smallMobile ? '90px' : '' }}
          disabled={isBusy || !canTakeBack}
        >
          <p className="whitespace-nowrap">Take Back</p>
        </ButtonGreen>
      ) : step?.kind === 'freePlay' && !step.freePlayGoal ? (
        <FreePlayControls
          onDrawOffer={onDrawOffer}
          onTakeBack={onTakeBack}
          onResign={onResign}
          // Resign/Draw/Take Back su UVEK aktivni, ne samo dok je
          // korisnikov red - korisnik moze da ih pozove i dok Pawny
          // "razmislja" (ranije je ovo bilo `isBusy`, gasilo sva 3
          // dugmeta tacno tada). canTakeBack ispod ostaje jedino
          // pravo ogranicenje (nema sta da se vrati).
          disabled={false}
          canTakeBack={canTakeBack}
          hideDrawResign={!!step?.requireCheckmate || !!step?.freePlayGoal}
        />
      ) : (
        <ButtonGreen
          onClick={
            answerViaNext ? () => onSelectQuizAnswer(0) : handleNextClick
          }
          icon="ArrowRightIcon"
          iconKind="outline"
          iconClassName="relative z-10"
          size="md"
          // Pored progress trake (mobilni) dugme se siri koliko tekst trazi
          // (npr. Day 13 'London System'), traka uzima ostatak reda.
          className={`${
            buttonsBesideProgress ? '' : 'md:max-w-[130px] max-w-[130px]'
          } px-4 transition-[filter,transform] duration-150 hover:brightness-110 hover:scale-[1.03] active:scale-[0.97] hover:[animation-play-state:paused] ${
            nextReady ? 'animate-attentionPulse' : ''
          }`}
          style={{
            maxWidth: smallMobile && !buttonsBesideProgress ? '90px' : '',
            // Instant zelena samo dok je korak gotov ali jos busy (kratak
            // bljesak dok se ceka protivnikov odgovor) - kad je nextReady,
            // zelenu "puni" pilulica ispod, ne skoci odjednom.
            ...(isStepComplete && !nextReady
              ? { backgroundColor: 'rgba(7, 218, 99)', color: '#000000' }
              : {}),
          }}
          disabled={
            answerViaNext ? isBusy : isBusy || !isStepComplete || isLastStep
          }
        >
          {nextReady && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div
                onAnimationEnd={handleAutoAdvanceFillDone}
                className="dl-next-fill h-full group-hover:[animation-play-state:paused]"
              />
              <style>{`
                  @keyframes dl-next-fill { from { width: 0%; } to { width: 100%; } }
                  .dl-next-fill { background: rgba(7, 218, 99); animation: dl-next-fill ${AUTO_ADVANCE_MS}ms linear forwards; }
                  @media (prefers-reduced-motion: reduce) { .dl-next-fill { animation: none; width: 0%; } }
                `}</style>
            </div>
          )}
          {/* Korisnik igra na tabli umesto da klikne - svetlo putuje po ivici dugmeta. */}
          {nudgeNext && !nextReady && <NudgeGlow />}
          <p className="relative whitespace-nowrap">
            {answerViaNext
              ? step?.quizOptions?.[0]
              : (buttonsBesideProgress && step?.nextButtonTextMobile) ||
                (step?.nextButtonText ?? 'Next')}
          </p>
        </ButtonGreen>
      )}
    </div>
  );

  return (
    <>
      {buttonsBesideProgress ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">{progressHeader}</div>
          {buttonsRow}
        </div>
      ) : (
        progressHeader
      )}
      {progressFooter}
      <div className="flex flex-col flex-1 min-h-0 w-full rounded-lg shadow-2xl">
        {nextReady && (
          <div className="fixed inset-0 z-[90] bg-black/70 pointer-events-none transition-opacity" />
        )}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col border bg-op-widget border-conversation-100 pb-2 px-2 md:px-2 md:pb-4 rounded-lg">
          <div
            className="flex flex-col flex-1 min-h-0 overflow-hidden no-scrollbar md:pb-0"
            style={
              isMobile && !showMobileChatInput
                ? { paddingBottom: extraBottomGap }
                : undefined
            }
          >
            {/* Kviz pitanje ide u chatu (Conversation.tsx) kao normalna poruka,
                a dugmad sa odgovorima odmah ispod nje, u istom skrolujucem
                toku - ne u ovom odvojenom fiksiranom redu (taj mehanizam nije
                radio pouzdano jer se ovaj wrapper ne skroluje sam). Ovde ostaje
                samo standardan Hint/Next red. Hint je sakriven za kviz korake
                OSIM kad korak ima extraHintText (cisto tekstualan trag, npr.
                Day 9 Checkmate vs Stalemate). markSquares UVEK ima Hint -
                pokazuje tacna polja, korisnik ih i dalje sam klikce (vidi onHint). */}
            {!buttonsBesideProgress && buttonsRow}

            <div className="order-2 md:order-1 min-w-0 flex-1 min-h-0 flex flex-col">
              <Conversation
                currentChapterState={currentChapterState}
                userData={userData}
                pulseDot={pulseDot}
                smallMobile={smallMobile}
                isMobile={isMobile}
                chatLimitPaywallVisible={chatLimitPaywallVisible}
                onCloseChatLimitPaywall={() =>
                  setChatLimitPaywallVisible(false)
                }
                nextReady={nextReady}
                step={step}
                quizSelectedIndex={quizSelectedIndex}
                onSelectQuizAnswer={handleQuizAnswer}
                quizMultiSelected={multiSelected}
                onToggleMultiOption={handleToggleMultiOption}
                suggestedMovePlayed={suggestedMovePlayed}
                onPlaySuggestedMove={handlePlaySuggestedMove}
                nextSolutionMove={nextSolutionMove}
                onPlayNextSolutionMove={onPlaySuggestedMove}
                pawnyAvatarSrc={lesson?.pawnyAvatar}
                disableStickyQuizQuestion={!!lesson?.graduationTest}
              />
            </div>

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
                    type="text"
                    placeholder="Ask your coach..."
                    value={question}
                    autoFocus={isMobile}
                    style={{ boxShadow: '0px 0px 10px 0px #07DA6380' }}
                    className="w-full text-[16px] md:text-[14px] rounded-[20px] border border-conversation-100 bg-[#111111]/40 text-white placeholder-[#FFFFFF]/25 px-4 py-1 md:py-2 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-conversation-200 hover:border-conversation-300"
                    onChange={(e) => setQuestion(e.target.value)}
                    onFocus={() => {
                      setIsFocusedInput(true);
                      // engine analizira poziciju dok korisnik kuca, pa odgovor ne ceka Stockfish
                      prepareEngineContext(currentChapterState);
                    }}
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
                        : 'bg-[#D9D9D9]/20 opacity-30 text-slate-300 hover:bg-slate-600 border border-conversation-100'
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
                    disabled={isMobile ? false : question.trim() === ''}
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
                  onClick={() => {
                    setShowMobileChatInput(true);
                    prepareEngineContext(currentChapterState);
                  }}
                  aria-label="Open chat"
                  size="lg"
                  icon="ChatBubbleOvalLeftEllipsisIcon"
                  iconKind="outline"
                  iconClassName="!h-7 !w-7 text-black"
                  className="!fixed !bottom-4 !right-4 !z-30 !h-14 !w-14 !rounded-full !bg-[#07DA63] shadow-lg active:scale-95 transition-transform"
                />
              )}
            </div>
          </div>

          <div className="hidden md:flex flex-shrink-0 md:h-[180px] mt-2 rounded-lg md:p-4 p-2 overflow-y-auto no-scrollbar">
            <FreeBoardNotation
              isMobile={isMobile}
              history={currentChapterState.notation?.history}
              playerNames={[]}
              focusedIndex={currentChapterState.notation?.focusedIndex}
              onRefocus={onHistoryNotationRefocus}
              // U lekciji se potezi ne brisu - notacija je samo za pregled.
              onDelete={() => {}}
              isFocusedInput={isFocusedInput}
              emptyContent="Play a move, make magic✨"
            />
          </div>
        </div>
      </div>
    </>
  );
};
