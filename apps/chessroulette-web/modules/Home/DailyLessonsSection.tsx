'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Chessboard as ReactChessboard } from 'react-chessboard';
import { toLongChessColor } from '@xmatter/util-kit';
import { Paywall } from '@app/components/Paywall/Paywall';
import { getProductLabel, isProSubscription } from '@app/modules/User';
import { links } from '../Room/links';
import {
  LESSON_DATABASE,
  Lesson,
} from '../Room/activities/DailyLesson/lessonDatabase';
import {
  LESSONS_UNLOCK_ALL,
  LessonAccessStatus,
  LessonProgress,
  getLessonAccess,
  getSubscribeInfo,
  readLessonProgress,
} from '../Room/activities/DailyLesson/util';

const DAYS_PER_WEEK = 7;

type Props = {
  lessons?: Lesson[];
  levelLabel?: string;
};

type Row = {
  lesson: Lesson;
  index: number;
  status: LessonAccessStatus;
  canOpen: boolean;
};

const lessonHref = (lessonId: string) =>
  links.getOnDemandRoomCreationLink({
    activity: 'dailylesson',
    lessonId,
    theme: 'op',
  });

const LockIcon = ({ size = 14, stroke = '#B5C4BA' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#001008"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

const PlayIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#001008"
    aria-hidden="true"
  >
    <path d="M7 4v16l13-8z" />
  </svg>
);

// Zakljucana lekcija nije link; u admin modu (LESSONS_UNLOCK_ALL) jeste.
const LessonLink: React.FC<{
  row: Row;
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ row, className, style, children }) =>
  row.canOpen ? (
    <Link
      href={lessonHref(row.lesson.id)}
      className={`${className} hover:brightness-110 transition`}
      style={style}
    >
      {children}
    </Link>
  ) : (
    <div aria-disabled="true" className={className} style={style}>
      {children}
    </div>
  );

const ProgressSegments: React.FC<{ rows: Row[]; currentIndex: number }> = ({
  rows,
  currentIndex,
}) => {
  const done = rows.filter((r) => r.status === 'done').length;
  return (
    <div className="flex flex-col gap-2">
      <div
        role="progressbar"
        aria-label={`${done} of ${rows.length} lessons complete`}
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={rows.length}
        className="grid gap-[2px] md:gap-[3px]"
        style={{
          gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))`,
        }}
      >
        {rows.map((r) => (
          <span
            key={r.lesson.id}
            className="h-2 rounded-[2px]"
            style={{
              background:
                r.status === 'done'
                  ? '#64D771'
                  : r.index === currentIndex
                  ? '#11C6D1'
                  : 'rgba(255,255,255,0.10)',
            }}
          />
        ))}
      </div>
      <span className="text-[13px] font-bold">
        {done} of {rows.length} lessons complete
      </span>
    </div>
  );
};

export const DailyLessonsSection: React.FC<Props> = ({
  lessons = LESSON_DATABASE,
  levelLabel,
}) => {
  const [progress, setProgress] = useState<LessonProgress>({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [isPro, setIsPro] = useState<boolean | undefined>(undefined);
  const [paywallVisible, setPaywallVisible] = useState(false);
  // ?preview=pro | ?preview=free - admin vidi stranicu kao PRO / free korisnik.
  const [preview, setPreview] = useState<'pro' | 'free' | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const currentPathItemRef = useRef<HTMLLIElement>(null);
  const stickyTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProgress(readLessonProgress());
    setProgressLoaded(true);
    const p = new URLSearchParams(window.location.search).get('preview');
    setPreview(p === 'pro' || p === 'free' ? p : null);
    getSubscribeInfo().then((data) =>
      setIsPro(isProSubscription(getProductLabel(data ?? {})))
    );
    // Mini tabla se ne crta na telefonu (sakrivena tabla puca u react-chessboard).
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const unlockAll = LESSONS_UNLOCK_ALL && !preview;
  const effectivePro = preview ? preview === 'pro' : isPro;

  const ordered = useMemo(
    () =>
      [...lessons].sort((a, b) =>
        a.level !== b.level ? a.level - b.level : a.day - b.day
      ),
    [lessons]
  );

  const rows: Row[] = useMemo(() => {
    const access = getLessonAccess(
      ordered.map((l) => l.id),
      progress,
      !!effectivePro,
      unlockAll
    );
    return ordered.map((lesson, index) => ({
      lesson,
      index,
      status: access[index].status,
      canOpen: access[index].canOpen,
    }));
  }, [ordered, progress, effectivePro, unlockAll]);

  const currentIndex = rows.findIndex(
    (r) => r.status === 'next' || r.status === 'tomorrow'
  );
  const allDone = rows.length > 0 && currentIndex === -1;
  const current: Row | undefined =
    rows[allDone ? rows.length - 1 : currentIndex];
  const showProLock = !unlockAll && effectivePro === false;

  // Na telefonu je Up next lekcija centrirana u delu ispod zakucane Continue kartice.
  useEffect(() => {
    if (!progressLoaded) return;
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    const item = currentPathItemRef.current;
    if (!item) return;
    const stickyH = stickyTopRef.current?.offsetHeight ?? 0;
    const itemRect = item.getBoundingClientRect();
    const free = window.innerHeight - stickyH;
    window.scrollTo({
      top: Math.max(
        0,
        itemRect.top + window.scrollY - stickyH - (free - itemRect.height) / 2
      ),
    });
  }, [progressLoaded]);

  if (!current) {
    return (
      <main className="flex flex-1 justify-center px-4 py-10">
        <p className="text-slate-500">No lessons yet.</p>
      </main>
    );
  }

  const firstStep = current.lesson.steps[0];
  const week = Math.floor(current.index / DAYS_PER_WEEK) + 1;

  const renderCta = (variant: 'card' | 'pill') => {
    if (effectivePro === undefined && !unlockAll) return null;
    if (showProLock) {
      return (
        <button
          type="button"
          onClick={() => setPaywallVisible(true)}
          className={
            variant === 'card'
              ? 'flex items-center justify-center gap-2 min-h-[52px] rounded-xl bg-[#64D771] text-[#001008] font-extrabold text-base hover:brightness-110 transition'
              : 'shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full bg-[#11C6D1] text-[#001008] font-extrabold text-[15px]'
          }
        >
          <LockIcon size={15} stroke="#001008" />
          Unlock PRO
        </button>
      );
    }
    if (!current.canOpen) {
      return variant === 'card' ? (
        <div
          aria-disabled="true"
          className="flex items-center justify-center gap-2 min-h-[52px] rounded-xl border border-white/15 text-[#B5C4BA] font-extrabold text-base"
        >
          <LockIcon size={15} />
          Opens tomorrow
        </div>
      ) : null;
    }
    return (
      <Link
        href={lessonHref(current.lesson.id)}
        className={
          variant === 'card'
            ? 'flex items-center justify-center gap-2.5 min-h-[52px] rounded-xl bg-[#64D771] text-[#001008] font-extrabold text-base hover:brightness-110 transition'
            : 'shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full bg-[#11C6D1] text-[#001008] font-extrabold text-[15px] hover:brightness-110 transition'
        }
      >
        <PlayIcon size={variant === 'card' ? 14 : 11} />
        {variant === 'card'
          ? allDone
            ? 'Play it again'
            : 'Continue'
          : 'Start'}
      </Link>
    );
  };

  const weeks: Row[][] = [];
  for (let i = 0; i < rows.length; i += DAYS_PER_WEEK) {
    weeks.push(rows.slice(i, i + DAYS_PER_WEEK));
  }

  return (
    <main className="flex flex-1 justify-center text-white">
      <div className="flex flex-col gap-8 w-full max-w-[1200px] px-4 md:px-8 pt-2 md:pt-6 pb-10 md:pb-24">
        {/* Naslov + Continue kartica; na telefonu zakucani na vrhu dok putanja skroluje */}
        <div
          ref={stickyTopRef}
          className="sticky top-0 z-10 -mx-4 px-4 pt-3 pb-4 bg-[#01210b] shadow-[0_14px_16px_-10px_#01210b] md:static md:mx-0 md:p-0 md:bg-transparent md:shadow-none flex flex-wrap items-center justify-between gap-4 md:gap-8"
        >
          <div className="flex flex-col gap-3 md:gap-3.5 flex-[1_1_400px]">
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {levelLabel && (
                <span className="text-[12px] md:text-[13px] font-extrabold text-[#001008] bg-[#11C6D1] px-2.5 md:px-3 py-1 md:py-1.5 rounded-full">
                  {levelLabel}
                </span>
              )}
              {showProLock && (
                <span className="inline-flex items-center gap-1.5 text-[12px] md:text-[13px] font-extrabold text-[#001008] bg-[#C8A07D] px-2.5 md:px-3 py-1 md:py-1.5 rounded-full">
                  <LockIcon size={13} stroke="#001008" />
                  Lessons are a PRO feature
                </span>
              )}
              {unlockAll && (
                <span className="text-[12px] md:text-[13px] font-bold text-[#C9D6CD] border border-white/20 px-2.5 md:px-3 py-[3px] md:py-[5px] rounded-full">
                  Admin · all lessons open
                </span>
              )}
            </div>
            <h1 className="m-0 text-[34px] md:text-[64px] leading-[1.08] md:leading-none font-extrabold tracking-[-1px] md:tracking-[-2px]">
              {rows.length} lessons.
              <br />
              <span className="text-[#64D771]">
                {allDone ? 'All done.' : `You're on ${current.lesson.day}.`}
              </span>
            </h1>
            <p className="hidden md:block m-0 text-[17px] leading-normal text-[#B5C4BA]">
              One lesson a day. Each one ends on the board.
            </p>
          </div>

          <section
            aria-label="Continue"
            className="flex-[1_1_600px] md:max-w-[680px] rounded-[20px] bg-[#0C2A17] border border-white/[0.08] p-4 md:p-[22px] flex flex-wrap gap-6 items-center"
          >
            {firstStep && isDesktop && (
              <div className=" w-[232px] shrink-0 rounded-[10px] overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.45)] pointer-events-none">
                <ReactChessboard
                  options={{
                    id: 'lessons-continue-board',
                    position: firstStep.fen,
                    boardOrientation: toLongChessColor(firstStep.orientation),
                    allowDragging: false,
                    showNotation: false,
                    animationDurationInMs: 0,
                    darkSquareStyle: { backgroundColor: '#4E8A58' },
                    lightSquareStyle: { backgroundColor: '#CFE3C8' },
                  }}
                />
              </div>
            )}
            <div className="flex-[1_1_260px] min-w-0 flex flex-col gap-3.5">
              <div className="flex items-center gap-3.5 md:gap-3">
                <div
                  aria-hidden="true"
                  className="shrink-0 w-[60px] h-[60px] md:w-[52px] md:h-[52px] rounded-[14px] bg-[#64D771] md:bg-[#11C6D1] text-[#001008] flex items-center justify-center text-[30px] md:text-[26px] font-extrabold"
                >
                  {current.lesson.day}
                </div>
                <div className="flex flex-col gap-[3px] min-w-0">
                  <span className="text-[11px] md:text-[12px] font-extrabold text-[#11C6D1] tracking-[0.6px] md:tracking-[0.8px]">
                    {allDone ? 'ALL DONE' : `CONTINUE · WEEK ${week}`}
                  </span>
                  <h2 className="md:hidden m-0 text-[20px] leading-[1.2] font-extrabold">
                    {current.lesson.title}
                  </h2>
                </div>
              </div>
              <h2 className="hidden md:block m-0 text-[26px] leading-[1.15] font-extrabold">
                {current.lesson.title}
              </h2>
              {firstStep?.prompt && (
                <p className="hidden md:block m-0 text-[14px] leading-normal text-[#D3E0D6]">
                  {firstStep.prompt}
                </p>
              )}
              <ProgressSegments rows={rows} currentIndex={currentIndex} />
              {current.status === 'tomorrow' && !current.canOpen && (
                <p className="m-0 text-[13px] text-[#B5C4BA]">
                  Today&apos;s lesson is done. The next one opens tomorrow.
                </p>
              )}
              {renderCta('card')}
            </div>
          </section>
        </div>

        {/* Desktop: kalendar, red = nedelja, 7 kolona = 7 dana */}
        <div className="hidden md:flex flex-col gap-[22px]">
          {weeks.map((weekRows, w) => {
            const doneCount = weekRows.filter(
              (r) => r.status === 'done'
            ).length;
            const reached =
              allDone || weekRows[0].index <= Math.max(currentIndex, 0);
            return (
              <section
                key={w}
                aria-label={`Week ${w + 1}`}
                className="flex flex-wrap gap-5 items-stretch"
              >
                <div className="basis-[150px] shrink-0 grow-0 flex flex-col justify-center gap-1 py-2">
                  <h3
                    className="m-0 text-[22px] font-extrabold"
                    style={{ color: reached ? '#FFFFFF' : '#64D771' }}
                  >
                    Week {w + 1}
                  </h3>
                  <span className="text-[12px] text-[#B5C4BA]">
                    {doneCount} of {weekRows.length} complete
                  </span>
                </div>
                <ol className="flex-[1_1_600px] min-w-0 list-none m-0 p-0 grid grid-cols-7 gap-2.5">
                  {weekRows.map((r) => (
                    <li key={r.lesson.id} className="flex">
                      <CalendarTile row={r} currentIndex={currentIndex} />
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>

        {/* Mobilni: putanja odozdo nagore, zavrsene ispod, zakljucane iznad */}
        <ol
          aria-label="Lesson path"
          className="md:hidden list-none m-0 -mx-4 pt-6 pb-10 flex flex-col"
        >
          {[...rows].reverse().map((r) => {
            const distance = Math.abs(r.index - Math.max(currentIndex, 0));
            const opacity =
              distance === 0 ? 1 : [0.85, 0.55, 0.3][Math.min(distance, 3) - 1];
            if (r.index === current.index && !allDone) {
              return (
                <li key={r.lesson.id} ref={currentPathItemRef} className="px-3">
                  <div className="flex items-center gap-3.5 p-3.5 rounded-[18px] bg-[#0E2E30] border-2 border-[#11C6D1] shadow-[0_0_0_4px_rgba(17,198,209,0.12),0_12px_36px_rgba(17,198,209,0.25)]">
                    <span
                      aria-hidden="true"
                      className="shrink-0 w-[52px] h-[52px] rounded-[14px] bg-[#11C6D1] text-[#001008] flex items-center justify-center text-[24px] font-extrabold"
                    >
                      {r.lesson.day}
                    </span>
                    <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <span className="text-[11px] font-extrabold text-[#11C6D1] tracking-[0.8px]">
                        {r.status === 'tomorrow' ? 'OPENS TOMORROW' : 'UP NEXT'}
                      </span>
                      <span className="text-[17px] font-extrabold leading-[1.2]">
                        {r.lesson.title}
                      </span>
                      <span className="text-[12px] font-semibold text-[#11C6D1]">
                        Lesson {r.lesson.day}
                      </span>
                    </span>
                    {renderCta('pill')}
                  </div>
                </li>
              );
            }
            const isDone = r.status === 'done';
            return (
              <li
                key={r.lesson.id}
                className="flex flex-col"
                style={{ opacity }}
              >
                {isDone && (
                  <span
                    aria-hidden="true"
                    className="my-1.5 ml-[51px] w-0.5 h-3.5 bg-[#64D771]"
                  />
                )}
                <LessonLink
                  row={r}
                  className="flex items-center gap-4 min-h-[48px] pl-8 pr-4 text-white"
                >
                  {isDone ? (
                    <span className="shrink-0 w-10 h-10 rounded-[10px] bg-[#64D771] flex items-center justify-center">
                      <CheckIcon size={18} />
                    </span>
                  ) : (
                    <span className="shrink-0 w-10 h-10 rounded-[10px] border-[1.5px] border-white/[0.22] bg-[#0A1A10] flex items-center justify-center">
                      <LockIcon size={16} />
                    </span>
                  )}
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[15px] font-bold truncate">
                      {r.lesson.title}
                    </span>
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: isDone ? '#64D771' : '#B5C4BA' }}
                    >
                      Lesson {r.lesson.day} · {isDone ? 'Done' : 'Locked'}
                    </span>
                  </span>
                </LessonLink>
                {!isDone && (
                  <span
                    aria-hidden="true"
                    className="my-1.5 ml-[51px] w-0.5 h-3.5 bg-white/20"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <Paywall
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        defaultPlan="pro"
      />
    </main>
  );
};

const CalendarTile: React.FC<{ row: Row; currentIndex: number }> = ({
  row,
  currentIndex,
}) => {
  const isCurrent = row.index === currentIndex;
  const isDone = row.status === 'done';
  const ahead = row.index - currentIndex;
  const opacity =
    isCurrent || isDone || currentIndex === -1 ? 1 : ahead <= 7 ? 0.85 : 0.55;

  const style: React.CSSProperties = isCurrent
    ? {
        background: '#11C6D1',
        color: '#001008',
        boxShadow: '0 14px 40px rgba(17,198,209,0.35)',
      }
    : isDone
    ? {
        background: '#0F3A1C',
        border: '1px solid rgba(100,215,113,0.25)',
        color: '#9FD9A6',
      }
    : {
        background: 'rgba(255,255,255,0.035)',
        border: '1px solid rgba(255,255,255,0.07)',
        color: '#C9D6CD',
        opacity,
      };

  const statusText = isCurrent
    ? row.status === 'tomorrow'
      ? 'Tomorrow'
      : 'Up next'
    : isDone
    ? 'Done'
    : 'Locked';
  const statusColor = isCurrent ? '#001008' : isDone ? '#64D771' : '#B5C4BA';

  return (
    <LessonLink
      row={row}
      className="flex-1 flex flex-col justify-between gap-2 min-h-[124px] box-border p-3 rounded-[14px]"
      style={style}
    >
      <span className="flex justify-between items-start">
        <span className="text-[26px] font-extrabold leading-none">
          {row.lesson.day}
        </span>
        {isDone && (
          <span
            aria-label="Done"
            className="w-7 h-7 rounded-lg bg-[#64D771] flex items-center justify-center"
          >
            <CheckIcon />
          </span>
        )}
        {!isDone && !isCurrent && (
          <span
            aria-label="Locked"
            className="w-7 h-7 rounded-lg border-[1.5px] border-white/[0.22] bg-[#0A1A10] box-border flex items-center justify-center"
          >
            <LockIcon />
          </span>
        )}
      </span>
      <span className="text-[12px] font-semibold leading-[1.3]">
        {row.lesson.title}
      </span>
      <span
        className="text-[11px] font-extrabold"
        style={{ color: statusColor }}
      >
        {statusText}
      </span>
    </LessonLink>
  );
};
