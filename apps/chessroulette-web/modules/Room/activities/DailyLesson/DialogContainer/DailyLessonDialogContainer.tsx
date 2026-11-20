import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import Image from 'next/image';
import { Dialog } from '@app/components/Dialog';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import { Icon } from '@app/components/Icon/Icon';
import { dailyLesson } from '../movex';
import { Lesson, LessonStep, getLessonsPagePath } from '../lessonDatabase';

// Popup-ovi (ovaj fajl) naglasavaju **bold** ZELENOM bojom umesto obicnog
// bold-a - za razliku od Conversation.tsx (AI chat) gde ostaje cist bold.
// Isti **...** autorski zapis u lessonDatabase.ts, samo drugaciji render
// po kontekstu (puno teksta na popup-u, treba jace da iskoci).
function renderMarkdownInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return (
        <strong key={i} className="text-[#07DA63]">
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

const KNIGHT_GRID = 5;
const KNIGHT_CELL = 32;

/**
 * Skakac fizicki skace iz centra 5x5 mini table na svako od 8 polja redom
 * (sporo, da se jasno vidi svaki skok) pa se vraca u centar pre sledeceg -
 * isti princip kao King-ova intro animacija, samo L-skokovi umesto susednih polja.
 */
const KnightIntroAnimation = ({ glyph }: { glyph: string }) => (
  <div
    className="relative mx-auto my-3 rounded-md overflow-hidden"
    style={{
      width: KNIGHT_GRID * KNIGHT_CELL,
      height: KNIGHT_GRID * KNIGHT_CELL,
    }}
  >
    <div className="grid grid-cols-5 grid-rows-5 h-full w-full">
      {Array.from({ length: KNIGHT_GRID * KNIGHT_GRID }, (_, i) => {
        const row = Math.floor(i / KNIGHT_GRID);
        const col = i % KNIGHT_GRID;
        const isLight = (row + col) % 2 === 0;
        return (
          <div
            key={i}
            style={{
              background: isLight ? 'rgb(240, 217, 181)' : 'rgb(181, 136, 99)',
            }}
          />
        );
      })}
    </div>
    <div
      className="dl-piece-knight absolute h-8 w-8 flex items-center justify-center text-[30px] leading-none text-[#14181F]"
      style={{
        left: 2 * KNIGHT_CELL,
        top: 2 * KNIGHT_CELL,
        textShadow: '0 1px 2px rgba(255,255,255,0.45)',
      }}
    >
      {glyph}
    </div>
    <style>{`
      /*
        Svaki od 8 pravaca ide u DVE faze tamo - prvo DUZA noga (2 polja), pa
        KRACA (1 polje u stranu) - i ISTIM putem nazad (skida kracu nogu, pa
        duzu) do centra, umesto da dijagonalno "odleti" pravo nazad. Svaka
        faza se zadrzi na trenutak da amater stigne da je uoci.
      */
      @keyframes dl-piece-knight {
        0%       { transform: translate(0, 0); }
        2.5%     { transform: translate(0, 64px); }     /* 2 dole */
        3.75%    { transform: translate(0, 64px); }
        5.625%   { transform: translate(32px, 64px); }  /* +1 desno */
        6.875%   { transform: translate(32px, 64px); }
        8.75%    { transform: translate(0, 64px); }     /* -1 nazad */
        10%      { transform: translate(0, 64px); }
        12.5%    { transform: translate(0, 0); }         /* 2 nazad */

        15%      { transform: translate(0, -64px); }    /* 2 gore */
        16.25%   { transform: translate(0, -64px); }
        18.125%  { transform: translate(32px, -64px); } /* +1 desno */
        19.375%  { transform: translate(32px, -64px); }
        21.25%   { transform: translate(0, -64px); }
        22.5%    { transform: translate(0, -64px); }
        25%      { transform: translate(0, 0); }

        27.5%    { transform: translate(0, 64px); }     /* 2 dole */
        28.75%   { transform: translate(0, 64px); }
        30.625%  { transform: translate(-32px, 64px); } /* +1 levo */
        31.875%  { transform: translate(-32px, 64px); }
        33.75%   { transform: translate(0, 64px); }
        35%      { transform: translate(0, 64px); }
        37.5%    { transform: translate(0, 0); }

        40%      { transform: translate(0, -64px); }    /* 2 gore */
        41.25%   { transform: translate(0, -64px); }
        43.125%  { transform: translate(-32px, -64px); } /* +1 levo */
        44.375%  { transform: translate(-32px, -64px); }
        46.25%   { transform: translate(0, -64px); }
        47.5%    { transform: translate(0, -64px); }
        50%      { transform: translate(0, 0); }

        52.5%    { transform: translate(64px, 0); }     /* 2 desno */
        53.75%   { transform: translate(64px, 0); }
        55.625%  { transform: translate(64px, 32px); }  /* +1 dole */
        56.875%  { transform: translate(64px, 32px); }
        58.75%   { transform: translate(64px, 0); }
        60%      { transform: translate(64px, 0); }
        62.5%    { transform: translate(0, 0); }

        65%      { transform: translate(64px, 0); }     /* 2 desno */
        66.25%   { transform: translate(64px, 0); }
        68.125%  { transform: translate(64px, -32px); } /* +1 gore */
        69.375%  { transform: translate(64px, -32px); }
        71.25%   { transform: translate(64px, 0); }
        72.5%    { transform: translate(64px, 0); }
        75%      { transform: translate(0, 0); }

        77.5%    { transform: translate(-64px, 0); }    /* 2 levo */
        78.75%   { transform: translate(-64px, 0); }
        80.625%  { transform: translate(-64px, 32px); } /* +1 dole */
        81.875%  { transform: translate(-64px, 32px); }
        83.75%   { transform: translate(-64px, 0); }
        85%      { transform: translate(-64px, 0); }
        87.5%    { transform: translate(0, 0); }

        90%      { transform: translate(-64px, 0); }    /* 2 levo */
        91.25%   { transform: translate(-64px, 0); }
        93.125%  { transform: translate(-64px, -32px); } /* +1 gore */
        94.375%  { transform: translate(-64px, -32px); }
        96.25%   { transform: translate(-64px, 0); }
        97.5%    { transform: translate(-64px, 0); }
        100%     { transform: translate(0, 0); }
      }
      .dl-piece-knight { animation: dl-piece-knight 16s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .dl-piece-knight { animation: none; }
      }
    `}</style>
  </div>
);

const QUEEN_GRID = 5;
const QUEEN_CELL = 32;

/**
 * Dama klizi PRAVO (N/S/E/W, kao top) pa DIJAGONALNO (kao lovac) do ivice
 * 5x5 mini table i vraca se u centar pre sledeceg pravca - za razliku od
 * skakaca, ravna linija je ovde sahovski tacna (dama STVARNO ide pravolinijski).
 */
const QueenIntroAnimation = ({ glyph }: { glyph: string }) => (
  <div
    className="relative mx-auto my-3 rounded-md overflow-hidden"
    style={{ width: QUEEN_GRID * QUEEN_CELL, height: QUEEN_GRID * QUEEN_CELL }}
  >
    <div className="grid grid-cols-5 grid-rows-5 h-full w-full">
      {Array.from({ length: QUEEN_GRID * QUEEN_GRID }, (_, i) => {
        const row = Math.floor(i / QUEEN_GRID);
        const col = i % QUEEN_GRID;
        const isLight = (row + col) % 2 === 0;
        return (
          <div
            key={i}
            style={{
              background: isLight ? 'rgb(240, 217, 181)' : 'rgb(181, 136, 99)',
            }}
          />
        );
      })}
    </div>
    <div
      className="dl-piece-queen absolute h-8 w-8 flex items-center justify-center text-[30px] leading-none text-[#14181F]"
      style={{
        left: 2 * QUEEN_CELL,
        top: 2 * QUEEN_CELL,
        textShadow: '0 1px 2px rgba(255,255,255,0.45)',
      }}
    >
      {glyph}
    </div>
    <style>{`
      @keyframes dl-piece-queen {
        0%      { transform: translate(0, 0); }
        4%      { transform: translate(0, -64px); }    /* N */
        8.5%    { transform: translate(0, -64px); }
        12.5%   { transform: translate(0, 0); }

        16.5%   { transform: translate(0, 64px); }      /* S */
        21%     { transform: translate(0, 64px); }
        25%     { transform: translate(0, 0); }

        29%     { transform: translate(64px, 0); }      /* E */
        33.5%   { transform: translate(64px, 0); }
        37.5%   { transform: translate(0, 0); }

        41.5%   { transform: translate(-64px, 0); }     /* W */
        46%     { transform: translate(-64px, 0); }
        50%     { transform: translate(0, 0); }

        54%     { transform: translate(64px, -64px); }  /* NE */
        58.5%   { transform: translate(64px, -64px); }
        62.5%   { transform: translate(0, 0); }

        66.5%   { transform: translate(64px, 64px); }   /* SE */
        71%     { transform: translate(64px, 64px); }
        75%     { transform: translate(0, 0); }

        79%     { transform: translate(-64px, 64px); }  /* SW */
        83.5%   { transform: translate(-64px, 64px); }
        87.5%   { transform: translate(0, 0); }

        91.5%   { transform: translate(-64px, -64px); } /* NW */
        96%     { transform: translate(-64px, -64px); }
        100%    { transform: translate(0, 0); }
      }
      .dl-piece-queen { animation: dl-piece-queen 14s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .dl-piece-queen { animation: none; }
      }
    `}</style>
  </div>
);

/**
 * Za lekcije koje nisu o kretanju figure (npr. istorija saha, vrednosti
 * figura) - nema table uopste, samo naslovna "kartica" sa ikonicom koja
 * blago pulsira. Generican - glyph i tekst dolaze iz Lesson.piece, ne
 * hardkodovan za jednu lekciju.
 */
const StaticIntroBanner = ({
  glyph,
  bannerText,
}: {
  glyph: string;
  bannerText: string;
}) => (
  <div className="relative mx-auto my-3 w-full max-w-[220px] rounded-xl overflow-hidden border border-[#07DA63]/40 bg-gradient-to-b from-[#07DA63]/[0.12] to-transparent px-4 py-5 flex flex-col items-center gap-2">
    <div className="dl-static-icon text-[40px] leading-none">{glyph}</div>
    <p className="text-white font-bold text-sm tracking-wide uppercase text-center">
      {bannerText}
    </p>
    <style>{`
      @keyframes dl-static-glow {
        0%, 100% { filter: drop-shadow(0 0 0px rgba(7,218,99,0)); transform: scale(1); }
        50%      { filter: drop-shadow(0 0 10px rgba(7,218,99,0.7)); transform: scale(1.08); }
      }
      .dl-static-icon { animation: dl-static-glow 2.5s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .dl-static-icon { animation: none; }
      }
    `}</style>
  </div>
);

/**
 * Day 14 "Your First Game" - stvarna Pawny maskota (ne generican glif kao
 * ostale "static" lekcije, i ne Outposty - Pawny je PROTIVNIK, ne trener) na
 * "Meet Pawny" pop-upu, pun vizual + blagi bob. Outposty (postojeca zelena
 * maskota) ostaje trener/brend identitet svuda drugde (AI chat objasnjenja,
 * popup-ovi koji "vise odozgo") - ovde se namerno NE koristi.
 */
const MascotIntroBanner = ({
  bannerText,
  subBannerText,
  mascotSrc = '/pawny/pawny.webp',
  framed,
}: {
  bannerText: string;
  subBannerText?: string;
  /** Lesson.pawnyAvatar (Day 18 "Pawny 2.0") - isti princip kao chat avatar. */
  mascotSrc?: string;
  /** Lesson.pawnyAvatarFramed - slika nosi svoju plocu i postolje. */
  framed?: boolean;
}) => (
  <div className="relative mx-auto my-3 w-full max-w-[260px] rounded-2xl overflow-hidden border border-[#07DA63]/50 bg-[radial-gradient(ellipse_at_50%_40%,rgba(7,218,99,0.22),rgba(7,218,99,0.04)_60%,transparent)] px-5 pt-6 pb-5 flex flex-col items-center gap-2 shadow-[0_0_28px_rgba(7,218,99,0.22),inset_0_0_24px_rgba(7,218,99,0.08)]">
    {/* Nagnuta svetleca ploca iza Pawny-ja */}
    {!framed && (
      <div className="dl-mascot-plate pointer-events-none absolute left-1/2 top-[38px] h-[120px] w-[120px] -translate-x-1/2 rotate-[14deg] rounded-[22px] border border-[#07DA63]/30 bg-[#07DA63]/[0.10] shadow-[0_0_30px_rgba(7,218,99,0.35)]" />
    )}
    <div
      className={`dl-mascot-bob relative ${
        framed ? 'h-[170px] w-[210px]' : 'h-[150px] w-[150px]'
      }`}
    >
      <Image src={mascotSrc} alt="Pawny" fill className="object-contain" />
    </div>
    {/* Svetleci postolje ispod */}
    {!framed && (
      <div className="pointer-events-none -mt-3 h-[6px] w-[96px] rounded-full bg-[#07DA63]/70 blur-[3px] shadow-[0_0_14px_rgba(7,218,99,0.8)]" />
    )}
    <p className="mt-2 text-white font-bold text-lg tracking-wide uppercase text-center">
      {bannerText}
    </p>
    {subBannerText && (
      <p className="text-[#07DA63] text-sm font-semibold tracking-wide text-center -mt-1">
        {subBannerText}
      </p>
    )}
    <style>{`
      @keyframes dl-mascot-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      .dl-mascot-bob { animation: dl-mascot-bob 1.6s ease-in-out infinite; }
      @keyframes dl-mascot-plate { 0%, 100% { opacity: .75; } 50% { opacity: 1; } }
      .dl-mascot-plate { animation: dl-mascot-plate 2.6s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .dl-mascot-bob, .dl-mascot-plate { animation: none; }
      }
    `}</style>
  </div>
);

// Puni (ne suplji) glifovi - isti kao glyph polje svih ostalih lekcija
// (Rook ♜, Bishop ♝, King ♚, Knight ♞, Queen ♛, Pawn ♟) - suplji bi na
// svetloj pozadini nestao.
const PIECE_VALUE_CHIPS: [string, string][] = [
  ['♟', '1'],
  ['♞', '3'],
  ['♝', '3'],
  ['♜', '5'],
  ['♛', '9'],
  ['♚', '∞'],
];

/**
 * Za Piece Values lekciju - umesto table, figura+vrednost "cipovi" iskacu
 * jedan po jedan (redom 1,3,3,5,9,∞), svaki na svoj tempo (animation-delay).
 * Broj ima SOPSTVENU animaciju (malo kasni za figurom i "uskoci" sa
 * odskokom) da se jasno vidi da je broj POVEZAN sa upravo tom figurom, ne
 * samo da je sve zajedno jedna mrlja koja se pali/gasi.
 */
const PieceValuesIntroAnimation = () => (
  <div className="relative mx-auto my-3 w-full max-w-[260px] rounded-xl overflow-hidden border border-[#07DA63]/40 bg-gradient-to-b from-[#07DA63]/[0.12] to-transparent px-4 py-5">
    <div className="grid grid-cols-3 gap-3">
      {PIECE_VALUE_CHIPS.map(([glyph, value], i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-0.5"
          style={{ animationDelay: `${i * 0.4}s` }}
        >
          <span
            className="dl-value-piece text-[28px] leading-none text-white"
            style={{
              animationDelay: `${i * 0.4}s`,
              textShadow: '0 1px 2px rgba(0,0,0,0.6)',
            }}
          >
            {glyph}
          </span>
          <span
            className="dl-value-number text-[#07DA63] font-black text-lg leading-none"
            style={{ animationDelay: `${i * 0.4}s` }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
    <style>{`
      @keyframes dl-value-piece-pop {
        0%, 15%   { opacity: 0; transform: scale(0.4); }
        25%, 75%  { opacity: 1; transform: scale(1); }
        90%, 100% { opacity: 0; transform: scale(0.4); }
      }
      /* Kasni malo za figurom (18% umesto 15%) i "preskoci" preko 1 pre nego
         sto se smiri - osecaj da broj broji/uskace POSLE figure, ne zajedno. */
      @keyframes dl-value-number-pop {
        0%, 18%   { opacity: 0; transform: scale(0.2) translateY(4px); }
        28%       { opacity: 1; transform: scale(1.35) translateY(0); }
        36%, 75%  { opacity: 1; transform: scale(1) translateY(0); }
        90%, 100% { opacity: 0; transform: scale(0.2) translateY(4px); }
      }
      .dl-value-piece { display: inline-block; animation: dl-value-piece-pop 6s ease-in-out infinite; }
      .dl-value-number { display: inline-block; animation: dl-value-number-pop 6s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .dl-value-piece, .dl-value-number { animation: none; opacity: 1; transform: scale(1); }
      }
    `}</style>
  </div>
);

/**
 * Mini tabla na kojoj figura klizi po tabli - samo za uvod. `movement`
 * bira putanju: 'straight' (top - ivice table), 'diagonal' (lovac) ili
 * 'king' (jedno polje u svih 8 pravaca, redom, iz centra).
 */
const PieceIntroAnimation = ({
  glyph,
  movement,
  bannerText,
  subBannerText,
  mascotSrc,
  mascotFramed,
}: {
  glyph: string;
  movement:
    | 'straight'
    | 'diagonal'
    | 'king'
    | 'knight'
    | 'queen'
    | 'pawn'
    | 'static'
    | 'numbers'
    | 'mascot';
  /** Samo za movement:'static'/'mascot' - tekst na uvodnoj kartici. */
  bannerText?: string;
  /** Samo za movement:'mascot' - manji podnaslov ispod bannerText. */
  subBannerText?: string;
  /** Samo za movement:'mascot' - vidi MascotIntroBanner. */
  mascotSrc?: string;
  mascotFramed?: boolean;
}) => {
  if (movement === 'knight') return <KnightIntroAnimation glyph={glyph} />;
  if (movement === 'queen') return <QueenIntroAnimation glyph={glyph} />;
  if (movement === 'numbers') return <PieceValuesIntroAnimation />;
  // Day 14 "Your First Game" - prava Pawny slika, ne generican glif.
  if (movement === 'mascot')
    return (
      <MascotIntroBanner
        bannerText={bannerText ?? 'Meet Pawny'}
        subBannerText={subBannerText}
        mascotSrc={mascotSrc}
        framed={mascotFramed}
      />
    );
  if (movement === 'static')
    return (
      <StaticIntroBanner glyph={glyph} bannerText={bannerText ?? 'Time!'} />
    );

  return (
    <div className="relative mx-auto my-3 h-[128px] w-[128px] rounded-md overflow-hidden">
      <div className="grid grid-cols-4 grid-rows-4 h-full w-full">
        {Array.from({ length: 16 }, (_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const isLight = (row + col) % 2 === 0;
          return (
            <div
              key={i}
              style={{
                background: isLight
                  ? 'rgb(240, 217, 181)'
                  : 'rgb(181, 136, 99)',
              }}
            />
          );
        })}
      </div>
      {/*
      Pun glif (npr. ♜/♝), ne suplji (♖/♗) - suplji je beo i nestaje na
      svetlim poljima. Svetli obris drzi kontrast i na tamnim poljima.
      'king' krece iz centralnog polja (32,32) da bi svih 8 suseda ostalo
      unutar 4x4 mreze - 'straight'/'diagonal' i dalje krecu iz gornjeg levog.
      'pawn' krece sa reda ispred krajnjeg (top-16, ne bas na ivici mreze) i
      ide NAGORE (negativan translate) - to je "napred" za belog; da krene sa
      vrha i ide nadole izgledalo bi kao da pesak ide unazad.
      ('static' se vraca ranije, kao HistoryIntroBanner - nikad ne stize ovde.)
    */}
      <div
        className={`dl-piece-${movement} absolute ${
          movement === 'king'
            ? 'left-8 top-8'
            : movement === 'pawn'
            ? 'left-0 top-16'
            : 'left-0 top-0'
        } h-8 w-8 flex items-center justify-center text-[30px] leading-none text-[#14181F]`}
        style={{ textShadow: '0 1px 2px rgba(255,255,255,0.45)' }}
      >
        {glyph}
      </div>
      <style>{`
      @keyframes dl-piece-straight {
        0%   { transform: translate(0, 0); }
        25%  { transform: translate(96px, 0); }
        50%  { transform: translate(96px, 96px); }
        75%  { transform: translate(0, 96px); }
        100% { transform: translate(0, 0); }
      }
      @keyframes dl-piece-diagonal {
        0%   { transform: translate(0, 0); }
        50%  { transform: translate(96px, 96px); }
        100% { transform: translate(0, 0); }
      }
      @keyframes dl-piece-king {
        0%      { transform: translate(0, 0); }
        6.25%   { transform: translate(0, -32px); }     /* N */
        12.5%   { transform: translate(0, 0); }
        18.75%  { transform: translate(32px, -32px); }  /* NE */
        25%     { transform: translate(0, 0); }
        31.25%  { transform: translate(32px, 0); }      /* E */
        37.5%   { transform: translate(0, 0); }
        43.75%  { transform: translate(32px, 32px); }   /* SE */
        50%     { transform: translate(0, 0); }
        56.25%  { transform: translate(0, 32px); }      /* S */
        62.5%   { transform: translate(0, 0); }
        68.75%  { transform: translate(-32px, 32px); }  /* SW */
        75%     { transform: translate(0, 0); }
        81.25%  { transform: translate(-32px, 0); }     /* W */
        87.5%   { transform: translate(0, 0); }
        93.75%  { transform: translate(-32px, -32px); } /* NW */
        100%    { transform: translate(0, 0); }
      }
      @keyframes dl-piece-pawn {
        0%, 28%   { transform: translate(0, 0); }         /* pocetno polje */
        35%, 55%  { transform: translate(0, -32px); }      /* prvo: jedno polje NAPRED */
        62%       { transform: translate(0, 0); }
        70%, 90%  { transform: translate(0, -64px); }       /* zatim: dva polja NAPRED (bonus) */
        100%      { transform: translate(0, 0); }
      }
      .dl-piece-straight { animation: dl-piece-straight 4s ease-in-out infinite; }
      .dl-piece-diagonal { animation: dl-piece-diagonal 3s ease-in-out infinite; }
      .dl-piece-king { animation: dl-piece-king 8s ease-in-out infinite; }
      .dl-piece-pawn { animation: dl-piece-pawn 8s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .dl-piece-straight, .dl-piece-diagonal, .dl-piece-king, .dl-piece-pawn { animation: none; }
      }
    `}</style>
    </div>
  );
};

const CASTLE_LAYOUTS = {
  // indeksi polja u nizu (e1..h1 / a1..e1), 0 = najlevlje polje u traci
  'castle-kingside': {
    squares: 4,
    kingStart: 0,
    kingEnd: 2,
    rookStart: 3,
    rookEnd: 1,
  },
  'castle-queenside': {
    squares: 5,
    kingStart: 4,
    kingEnd: 2,
    rookStart: 0,
    rookEnd: 3,
  },
} as const;

const CASTLE_CELL = 32;

/**
 * Mini traka polja (samo prvi red, e1-h1 ili a1-e1) na kojoj kralj i top
 * animirano odigraju rokadu - isti vizuelni jezik kao PieceIntroAnimation
 * iznad, samo horizontalna traka umesto 4x4 table jer rokada zivi na jednom redu.
 */
const FEN_GLYPHS: Record<string, string> = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};
const FEN_CELL = 26;

// Staticna tabla iz FEN-a za uvodni popup (introSteps.diagramFen).
const FenDiagram = ({
  fen,
  highlightRank,
}: {
  fen: string;
  highlightRank?: number;
}) => {
  const rows = fen
    .split(' ')[0]
    .split('/')
    .map((row) =>
      row
        .split('')
        .flatMap((c) => (/\d/.test(c) ? Array(Number(c)).fill('') : [c]))
    );
  return (
    <div
      className="mx-auto my-3 rounded-md overflow-hidden grid grid-cols-8"
      style={{ width: FEN_CELL * 8 }}
    >
      {rows.map((row, r) =>
        row.map((piece: string, f: number) => {
          const dark = (r + f) % 2 === 1;
          const highlighted = highlightRank === 8 - r;
          return (
            <div
              key={`${r}-${f}`}
              className="flex items-center justify-center leading-none"
              style={{
                width: FEN_CELL,
                height: FEN_CELL,
                fontSize: 21,
                background: highlighted
                  ? dark
                    ? 'rgb(96, 170, 98)'
                    : 'rgb(150, 210, 140)'
                  : dark
                  ? 'rgb(181, 136, 99)'
                  : 'rgb(240, 217, 181)',
                color:
                  piece && piece === piece.toUpperCase() ? '#fff' : '#14181F',
                textShadow:
                  piece && piece === piece.toUpperCase()
                    ? '0 0 2px #14181F, 0 0 1px #14181F'
                    : 'none',
              }}
            >
              {piece ? FEN_GLYPHS[piece.toLowerCase()] : ''}
            </div>
          );
        })
      )}
    </div>
  );
};

const CastlingDiagram = ({
  side,
}: {
  side: 'castle-kingside' | 'castle-queenside';
}) => {
  const { squares, kingStart, kingEnd, rookStart, rookEnd } =
    CASTLE_LAYOUTS[side];
  const width = squares * CASTLE_CELL;
  const kingAnim = `dl-castle-king-${side}`;
  const rookAnim = `dl-castle-rook-${side}`;

  return (
    <div
      className="relative mx-auto my-3 rounded-md overflow-hidden"
      style={{ width, height: CASTLE_CELL }}
    >
      <div className="flex h-full w-full">
        {Array.from({ length: squares }, (_, i) => (
          <div
            key={i}
            style={{
              width: CASTLE_CELL,
              height: CASTLE_CELL,
              background:
                i % 2 === 0 ? 'rgb(240, 217, 181)' : 'rgb(181, 136, 99)',
            }}
          />
        ))}
      </div>
      <div
        className={`${kingAnim} absolute top-0 left-0 h-8 w-8 flex items-center justify-center text-[26px] leading-none text-[#14181F]`}
        style={{ textShadow: '0 1px 2px rgba(255,255,255,0.45)' }}
      >
        ♔
      </div>
      <div
        className={`${rookAnim} absolute top-0 left-0 h-8 w-8 flex items-center justify-center text-[26px] leading-none text-[#14181F]`}
        style={{ textShadow: '0 1px 2px rgba(255,255,255,0.45)' }}
      >
        ♖
      </div>
      <style>{`
        @keyframes ${kingAnim} {
          0%, 20%   { transform: translateX(${kingStart * CASTLE_CELL}px); }
          50%, 85%  { transform: translateX(${kingEnd * CASTLE_CELL}px); }
          100%      { transform: translateX(${kingStart * CASTLE_CELL}px); }
        }
        @keyframes ${rookAnim} {
          0%, 20%   { transform: translateX(${rookStart * CASTLE_CELL}px); }
          50%, 85%  { transform: translateX(${rookEnd * CASTLE_CELL}px); }
          100%      { transform: translateX(${rookStart * CASTLE_CELL}px); }
        }
        .${kingAnim} { animation: ${kingAnim} 4s ease-in-out infinite; }
        .${rookAnim} { animation: ${rookAnim} 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .${kingAnim}, .${rookAnim} { animation: none; }
        }
      `}</style>
    </div>
  );
};

export type DailyLessonDialogContainerProps = {
  lesson: Lesson | null;
  step: LessonStep | null;
  lessonState: dailyLesson;
  showIntro: boolean;
  isLastStep: boolean;
  onStartLesson: () => void;
  onDismissCelebration: () => void;
  onRepeatLesson: () => void;
  onNextStep: () => void;
  /** Vodi na sledecu lekciju u nizu (npr. Rook -> Bishop). Undefined ako je ovo poslednja za sad. */
  onNextLesson?: () => void;
  /** endScreenButtons action:'review' (Day 14) - otvara Game Review sa PGN-om odigrane partije. */
  onGameReview?: () => void;
  /**
   * endScreenButtons action:'testOpening' (Day 28 "My First Opening with
   * White — London") - skace DIREKTNO na Lesson.testStepId korak (BEZ
   * ponovnog prolaska kroz vodjeni deo), resetujuci brojace kao Repeat.
   */
  onTestOpening?: () => void;
  /** Popup pre koraka koji uvodi novu pod-temu (npr. rokada) - null ako trenutni korak nema jedan. */
  preStepIntro: LessonStep['preStepIntro'] | null;
  onDismissPreStepIntro: () => void;
  /** Indeksi kviz koraka odgovorenih netacno - koristi se za lesson.scoreSummary na kraju. */
  wrongQuizSteps?: Set<number>;
};

export const DailyLessonDialogContainer = ({
  lesson,
  step,
  lessonState,
  showIntro,
  isLastStep,
  onStartLesson,
  onDismissCelebration,
  onRepeatLesson,
  onNextStep,
  onNextLesson,
  onGameReview,
  onTestOpening,
  preStepIntro,
  onDismissPreStepIntro,
  wrongQuizSteps,
}: DailyLessonDialogContainerProps) => {
  const firedForRef = useRef<string | null>(null);
  // Visestepeni uvodni popup (lesson.introSteps) - lokalni UI-only indeks,
  // resetuje se na 0 svaki put kad se showIntro ponovo prikaze (npr. Repeat).
  const [introStepIndex, setIntroStepIndex] = useState(0);
  // Tooltip placeholder dugmeta, prikazan kao tekst na klik (mobilni nema hover).
  const [placeholderNote, setPlaceholderNote] = useState<string | null>(null);
  useEffect(() => {
    if (showIntro) setIntroStepIndex(0);
  }, [showIntro]);

  useEffect(() => {
    // Konfeti ide SAMO na kraju cele lekcije (End Screen), ne na pojedinacne
    // "celebrate" korake usred lekcije (npr. mat u primeru 4) - tamo vise
    // nema ni popup-a, pa ni konfeta ne treba da bude.
    if (!lessonState.popup || !step || !lessonState.completed) return;
    if (firedForRef.current === step.id) return;
    firedForRef.current = step.id;

    confetti({
      startVelocity: 50,
      particleCount: 150,
      spread: 170,
      origin: { y: 0.6 },
    });
  }, [lessonState.popup, lessonState.completed, step]);

  useEffect(() => {
    if (!lessonState.popup) firedForRef.current = null;
  }, [lessonState.popup]);

  if (showIntro && lesson) {
    // Visestepeni uvod (lesson.introSteps, npr. Next -> Got it -> Start) -
    // isti Dialog/naslov/animacija kroz sve ekrane, samo tekst i dugme se
    // menjaju po lokalnom indeksu. Bez introSteps, ponasanje je nepromenjeno
    // (jedan ekran, "Let's start").
    const introStep = lesson.introSteps?.[introStepIndex];
    const isLastIntroStep =
      !lesson.introSteps || introStepIndex >= lesson.introSteps.length - 1;
    return (
      <Dialog
        title={
          <span className="text-white font-bold">
            {introStep?.title ?? lesson.intro.title}
          </span>
        }
        content={
          <div className="flex flex-col px-4 py-2 items-center">
            {introStep?.diagramFen ? (
              <FenDiagram
                fen={introStep.diagramFen}
                highlightRank={introStep.diagramHighlightRank}
              />
            ) : (
              <PieceIntroAnimation
                glyph={lesson.piece.glyph}
                movement={lesson.piece.movement}
                bannerText={lesson.piece.bannerText}
                subBannerText={lesson.piece.subBannerText}
                mascotSrc={lesson.pawnyAvatar}
                mascotFramed={lesson.pawnyAvatarFramed}
              />
            )}
            <p className="text-slate-300 text-sm text-center leading-relaxed">
              {renderMarkdownInline(introStep?.text ?? lesson.intro.text)}
            </p>
            {introStep?.bullets && introStep.bullets.length > 0 && (
              <ul className="mt-3 w-full text-slate-300 text-sm space-y-1.5">
                {introStep.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#07DA63] mt-0.5">•</span>
                    <span>{renderMarkdownInline(bullet)}</span>
                  </li>
                ))}
              </ul>
            )}
            {lesson.piece.movement === 'mascot' ? (
              // Pawny partije - stakleno dugme sa zelenim sjajem (dizajn za Pawny 4.0).
              <button
                type="button"
                className="group relative mt-5 flex h-[50px] w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-white/15 bg-gradient-to-b from-white/[0.13] to-white/[0.04] text-[17px] font-bold text-white shadow-[0_10px_26px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:border-[#07DA63]/60 hover:shadow-[0_10px_26px_rgba(0,0,0,0.4),0_0_22px_rgba(7,218,99,0.35),inset_0_1px_0_rgba(255,255,255,0.18)] active:scale-[0.98]"
                onClick={() => {
                  if (isLastIntroStep) {
                    onStartLesson();
                  } else {
                    setIntroStepIndex((i) => i + 1);
                  }
                }}
              >
                <Icon name="PlayIcon" kind="outline" className="h-6 w-6" />
                {introStep?.buttonText ?? "Let's start"}
                <span className="pointer-events-none absolute bottom-0 left-1/2 h-[2px] w-2/3 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-[#07DA63] to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
              </button>
            ) : (
              <ButtonGreen
                size="lg"
                icon="PlayIcon"
                iconKind="outline"
                className="w-full text-[16px] h-[44px] rounded-[22px]"
                style={{ marginTop: 20 }}
                onClick={() => {
                  if (isLastIntroStep) {
                    onStartLesson();
                  } else {
                    setIntroStepIndex((i) => i + 1);
                  }
                }}
              >
                &nbsp;{introStep?.buttonText ?? "Let's start"}
              </ButtonGreen>
            )}
          </div>
        }
      />
    );
  }

  // Generican "nova pod-tema" popup (npr. rokada) - jedini treci popup u
  // lekciji, ne krsi pravilo "samo intro + zavrsni", jer je opt-in po koraku
  // (preStepIntro), ne prikazuje se izmedju SVAKOG primera.
  if (preStepIntro) {
    return (
      <Dialog
        title={
          <span className="text-white font-bold">{preStepIntro.title}</span>
        }
        content={
          <div className="flex flex-col px-4 py-2 items-center">
            {preStepIntro.diagram && (
              <CastlingDiagram side={preStepIntro.diagram} />
            )}
            {preStepIntro.diagramFen && (
              <FenDiagram
                fen={preStepIntro.diagramFen}
                highlightRank={preStepIntro.diagramHighlightRank}
              />
            )}
            <p className="text-slate-300 text-sm text-center leading-relaxed">
              {renderMarkdownInline(preStepIntro.text)}
            </p>
            {preStepIntro.bullets && preStepIntro.bullets.length > 0 && (
              <ul className="mt-3 w-full text-slate-300 text-sm space-y-1.5">
                {preStepIntro.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#07DA63] mt-0.5">•</span>
                    <span>{renderMarkdownInline(bullet)}</span>
                  </li>
                ))}
              </ul>
            )}
            <ButtonGreen
              size="lg"
              icon="PlayIcon"
              iconKind="outline"
              className="w-full text-[16px] h-[44px] rounded-[22px]"
              style={{ marginTop: 20 }}
              onClick={onDismissPreStepIntro}
            >
              &nbsp;{preStepIntro.buttonText ?? "Let's go!"}
            </ButtonGreen>
          </div>
        }
      />
    );
  }

  // lesson.scoreSummary (npr. Piece Values "6/6 correct!") - racuna se SAMO
  // od koraka navedenih u stepIds (npr. samo Faza 1), ne svih kviz koraka.
  // tiers su poredjani opadajuce po min, prvi koji odgovara pobedjuje.
  const scoreTier = (() => {
    if (!lesson?.scoreSummary) return null;
    const { stepIds, tiers } = lesson.scoreSummary;
    const stepIndices = stepIds
      .map((id) => lesson.steps.findIndex((s) => s.id === id))
      .filter((i) => i >= 0);
    const correctCount =
      stepIndices.length -
      stepIndices.filter((i) => wrongQuizSteps?.has(i)).length;
    const tier = tiers.find((t) => correctCount >= t.min);
    return tier ? { ...tier, correctCount, total: stepIndices.length } : null;
  })();

  // Broj gresaka na zavrsnom ekranu - za lekcije bez scoreSummary, svaki
  // kviz/markSquares korak je TACNO jedan pokusaj (Day 27 "Chess Notation" i
  // dalje), pa `wrongQuizSteps.size` (isti Set koji boji roze segmente na
  // traci) uvek TACNO odgovara broju roze segmenata - korisnica prijavila
  // da se `lessonState.totalErrors` (persistira kroz Movex, PREZIVI reload)
  // vidi rastao mimo ovog lokalnog Set-a (resetuje se na svaki remount),
  // pa su se brojevi razilazili. Lekcije SA scoreSummary (npr. Day 23
  // "Piece Values") zadrzavaju totalErrors - tamo vise pokusaja po koraku
  // JESU dozvoljeni, pa su "koliko si puta pogresio" i "koliko pitanja je
  // ikad bilo pogresno" namerno razliciti brojevi.
  const errorCount =
    lesson?.flatProgressSegments && !lesson?.scoreSummary
      ? wrongQuizSteps?.size ?? 0
      : lessonState.totalErrors;

  // Lesson.graduationTest (Day 30/31 "Graduation Test") - zavrsni ekran ima
  // DVE do TRI varijante (naslov/tekst/dugmad) zavisno od lessonState.score
  // i (za finalScreen) da li se stiglo preko "Start Test 2" sa vec polozenog
  // Day 30 - racuna se OVDE, na svaki render, iz trenutnog skora + URL-a (ne
  // cuva se "passed" negde posebno). Generican mehanizam.
  const graduationResult = lesson?.graduationTest
    ? (() => {
        const gt = lesson.graduationTest;
        const passed = lessonState.score >= gt.maxScore * gt.passThreshold;
        // Day 31 finalScreen - LAGANA, URL-bazirana potvrda da je prethodni
        // test vec polozen (vidi napomenu uz finalScreen u lessonDatabase.ts)
        const arrivedFromPriorPass =
          typeof window !== 'undefined' &&
          gt.finalScreen &&
          new URLSearchParams(window.location.search).get('fromLessonId') ===
            gt.finalScreen.requiresPriorPassLessonId;
        if (passed && arrivedFromPriorPass && gt.finalScreen) {
          return {
            passed: true,
            title: gt.finalScreen.title,
            body: gt.finalScreen.body,
            buttons: gt.finalScreen.buttons,
          };
        }
        return {
          passed,
          title: passed ? gt.passTitle : gt.failTitle,
          body: passed ? gt.passBody : gt.failBody,
          buttons: passed ? gt.passButtons : gt.failButtons,
        };
      })()
    : null;

  // Popup se prikazuje SAMO na pocetku (intro, iznad) i na samom kraju cele
  // lekcije - medjukoraci (i pojedinacni mat u primeru) vise nemaju
  // prekidajuci popup, samo konfeti (efekat ispod) + inline "Next" u chatu.
  if (lessonState.popup && step && lessonState.completed) {
    return (
      <Dialog
        title={
          <span
            className={`font-bold animate-pulse ${
              graduationResult && !graduationResult.passed
                ? 'text-[#f2358d]'
                : 'text-[#07DA63]'
            }`}
          >
            {graduationResult
              ? graduationResult.title
              : lesson?.endScreenTitle ?? 'Lesson complete! 🎉'}
          </span>
        }
        content={
          <div className="flex flex-col px-4 py-2 items-center">
            <p className="text-slate-300 text-sm text-center leading-relaxed">
              {renderMarkdownInline(
                graduationResult
                  ? graduationResult.body
                  : lesson?.endScreenText ?? step.doneText
              )}
            </p>
            {scoreTier && (
              <div className="mt-3 w-full border border-[#07DA63]/30 bg-[#07DA63]/[0.07] rounded-xl px-3 py-2.5 text-center">
                <p className="text-[#07DA63] text-xs font-bold tracking-wide uppercase">
                  {scoreTier.correctCount}/{scoreTier.total} correct ·{' '}
                  {scoreTier.title}
                </p>
                <p className="text-slate-300 text-xs mt-1">
                  {renderMarkdownInline(scoreTier.text)}
                </p>
              </div>
            )}
            {graduationResult && (
              <div className="mt-3 w-full border border-[#07DA63]/30 bg-[#07DA63]/[0.07] rounded-xl px-3 py-2.5 text-center">
                <p className="text-[#07DA63] text-xs font-bold tracking-wide uppercase">
                  {Math.round(lessonState.score * 100) / 100} /{' '}
                  {lesson?.graduationTest?.maxScore} points
                </p>
              </div>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Icon name="LightBulbIcon" kind="outline" className="h-4 w-4" />
                {lessonState.totalHints} hint
                {lessonState.totalHints !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="XMarkIcon" kind="outline" className="h-4 w-4" />
                {errorCount} error
                {errorCount !== 1 ? 's' : ''}
              </span>
            </div>
            {/* "Mastered ... today" tagline ne odgovara jednom ocenjenom
                testu (graduationTest) - preskace se tamo. */}
            {!graduationResult && (
              <p className="text-slate-400 text-xs text-center mt-3">
                You mastered the {lesson?.piece.name ?? 'piece'} today. Come
                back tomorrow for the next lesson!
              </p>
            )}
            {/* Neke lekcije (npr. Day 13 Openings) zamenjuju standardni red
                dugmadi svojim - vidi Lesson.endScreenButtons. Lesson.
                graduationTest (Day 30) ide JOS ispred toga - pass/fail
                varijanta bira SOPSTVENI red dugmadi, nezavisno od
                endScreenButtons (test obicno i nema to polje postavljeno). */}
            {(
              graduationResult
                ? graduationResult.buttons
                : lesson?.endScreenButtons
            ) ? (
              (graduationResult
                ? graduationResult.buttons
                : lesson!.endScreenButtons!
              ).map((btn, i) => (
                <ButtonGreen
                  key={btn.label}
                  icon={
                    btn.action === 'repeat'
                      ? 'ArrowPathIcon'
                      : btn.action === 'done'
                      ? 'CheckIcon'
                      : btn.action === 'review'
                      ? 'ChartBarIcon'
                      : btn.action === 'play'
                      ? 'PlayIcon'
                      : btn.action === 'testOpening'
                      ? 'AcademicCapIcon'
                      : btn.action === 'nextLesson' ||
                        btn.action === 'placeholder'
                      ? 'ArrowRightIcon'
                      : 'LightBulbIcon'
                  }
                  iconKind="outline"
                  size="lg"
                  className="w-full text-[16px] h-[44px] rounded-[22px]"
                  style={{
                    marginTop: i === 0 ? 20 : 12,
                    // isti zeleni Next Lesson kao na standardnom End Screen-u
                    ...(btn.action === 'nextLesson' && onNextLesson
                      ? {
                          backgroundColor: 'rgba(7, 218, 99)',
                          color: '#000000',
                        }
                      : {}),
                    ...(btn.action === 'placeholder' ? { opacity: 0.45 } : {}),
                  }}
                  disabled={btn.action === 'nextLesson' && !onNextLesson}
                  tooltip={
                    btn.action === 'placeholder'
                      ? (btn as { tooltip?: string }).tooltip ?? 'Coming soon'
                      : btn.action === 'nextLesson' && !onNextLesson
                      ? 'More lessons coming soon'
                      : undefined
                  }
                  onClick={
                    btn.action === 'repeat'
                      ? () => {
                          onDismissCelebration();
                          onRepeatLesson();
                        }
                      : btn.action === 'done'
                      ? () => {
                          window.location.href = getLessonsPagePath(lesson?.id);
                        }
                      : btn.action === 'review'
                      ? onGameReview
                      : btn.action === 'play'
                      ? () => {
                          // Vodi na Play (matchmaking) stranicu glavne
                          // web-app, isto kao postojece "Home" dugme u
                          // Puzzle aktivnosti (puzzleAi), samo druga ruta.
                          window.location.href =
                            'https://app.outpostchess.com/intsearch';
                        }
                      : btn.action === 'testOpening'
                      ? () => {
                          onDismissCelebration();
                          onTestOpening?.();
                        }
                      : btn.action === 'nextLesson'
                      ? onNextLesson
                      : () =>
                          setPlaceholderNote(
                            (btn as { tooltip?: string }).tooltip ??
                              'Coming soon'
                          )
                  }
                >
                  &nbsp;{btn.label}
                </ButtonGreen>
              ))
            ) : (
              <>
                {/* Next Lesson ostaje uvek u End Screen-u, i kad sledeca
                    lekcija jos ne postoji u bazi - samo se ugasi dok se ne
                    doda (Path 1, 31 lekcija ukupno), ne zeli se da se ceo red
                    dugmadi pomera. */}
                <ButtonGreen
                  icon="ArrowRightIcon"
                  iconKind="outline"
                  size="lg"
                  className="w-full text-[16px] h-[44px] rounded-[22px] transition-[filter,transform] duration-150 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
                  style={
                    onNextLesson
                      ? {
                          marginTop: 20,
                          backgroundColor: 'rgba(7, 218, 99)',
                          color: '#000000',
                        }
                      : { marginTop: 20 }
                  }
                  disabled={!onNextLesson}
                  tooltip={
                    onNextLesson ? undefined : 'More lessons coming soon'
                  }
                  onClick={onNextLesson}
                >
                  &nbsp;Next Lesson
                </ButtonGreen>
                <ButtonGreen
                  icon="ArrowPathIcon"
                  iconKind="outline"
                  size="lg"
                  className="w-full text-[16px] h-[44px] rounded-[22px]"
                  style={{ marginTop: onNextLesson ? 12 : 20 }}
                  onClick={() => {
                    onDismissCelebration();
                    onRepeatLesson();
                  }}
                >
                  &nbsp;Repeat
                </ButtonGreen>
                <ButtonGreen
                  icon="CheckIcon"
                  iconKind="outline"
                  size="lg"
                  className="w-full text-[16px] h-[44px] rounded-[22px]"
                  style={{ marginTop: 12 }}
                  onClick={() => {
                    window.location.href = getLessonsPagePath(lesson?.id);
                  }}
                >
                  &nbsp;Done
                </ButtonGreen>
              </>
            )}
            {placeholderNote && (
              <p className="text-slate-300 text-xs text-center mt-3">
                {placeholderNote}
              </p>
            )}
          </div>
        }
      />
    );
  }

  return null;
};
