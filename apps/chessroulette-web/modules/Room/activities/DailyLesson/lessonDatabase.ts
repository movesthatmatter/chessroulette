import { ChessColor, ChessFEN } from '@xmatter/util-kit';
// Day 28 "My First Opening with White - London" - potezi (UCI) se citaju
// odavde (LearnAi-jeva baza otvaranja, jedini izvor istine za "London
// System" liniju), NE prekucavaju se rucno - vidi DAY_28_FIRST_OPENING ispod.
// Prozni opisi po potezu su ipak NASI, ne kopirani iz te baze - njeni
// komentari idu uz NJEN moves-indeks koji ne mapira 1:1 na nas
// moveExplanations mehanizam (koji okida samo posle KORISNIKOVOG - belog -
// poteza, posle automatskog crnog odgovora), pa su prepisani/verifikovani
// rucno da tacno opisuju poziciju u tom trenutku.
import { OPENING_DATABASE } from '../LearnAi/openingDatabase';

/**
 * 'teach' - korisnik igra vise uzastopnih poteza svojom bojom (bez protivnika).
 * 'puzzle' - klasican puzzle, solution ide naizmenicno korisnik/protivnik.
 * 'quiz' - nije potez na tabli uopste - pitanje sa ponudjenim odgovorima
 * (quizOptions/quizCorrectIndex/quizExplanation), korisnik bira dugme umesto
 * da pomeri figuru. Bez `quizOptions` postaje cista "watch & learn"
 * demonstracija (vidi beginStep) - nema pitanje, samo prikaz + objasnjenje.
 * `fen`/`orientation`/`solution` i dalje postoje (solution je uvek jednoclan
 * placeholder niz, npr. ['quiz']) da bi se ponovo iskoristio isti
 * progress/isStepComplete mehanizam kao za sve druge korake.
 * 'markSquares' - korisnik OBELEZAVA polja na tabli (desni klik na desktopu,
 * tap-and-hold na mobilnom - NE prevlacenje figure), ne pomera nista.
 * `solution` ovde sadrzi OCEKIVANA polja (npr. ['d4','d5','e4','e5']) -
 * tacno kad se obelezeni skup polja poklapa sa njim. Pri prvom netacnom
 * pokusaju korisnik bira "Try Again" (ocisti izbor, pokusaj ponovo) ili
 * "Hint" (otkrije tacna polja + objasnjenje, zavrsava korak).
 */
export type LessonStepKind =
  | 'teach'
  | 'puzzle'
  | 'quiz'
  | 'markSquares'
  | 'freePlay';

/** Protivnicki odgovor koji nije skriptovan - engine bira bilo koji legalan potez. */
export const ANY_LEGAL_REPLY = '*';

/**
 * Korisnikov potez koji nije skriptovan na JEDNO ocekivano polje - bilo koji
 * legalan potez koji daje SAH se prihvata (npr. Day 26 "Perpetual Check" -
 * "koji god sah da se da u redu je"). Koristi se u `solution` na KORISNIKOVIM
 * indeksima (par sa ANY_LEGAL_REPLY na protivnikovim), umesto fiksnog UCI-ja.
 * Vidi LessonStep.requireLegalCheck.
 */
export const ANY_LEGAL_CHECK = '+';

/**
 * Korisnikov potez kralja (npr. 'K>c7'): prihvata se BILO KOJI legalan korak
 * kralja koji ga priblizava polju posle '>', osim poteza koji daje pat.
 * Hint pokazuje jedan takav potez. Day 20 Phase 2.
 */
export const KING_APPROACH = 'K>';

/** Koliko puta korisnik moze da trazi hint po koraku, pre nego sto se dugme ugasi. */
export const MAX_HINTS_PER_STEP = 2;

export type LessonStep = {
  id: string;
  kind: LessonStepKind;
  fen: ChessFEN;
  /** Boja kojom korisnik igra (i orijentacija table). */
  orientation: ChessColor;
  /**
   * UCI potezi.
   * teach: svi potezi su korisnikovi.
   * puzzle: naizmenicno korisnik/protivnik (protivnikov moze biti ANY_LEGAL_REPLY).
   * freePlay: NIJE skriptovano - ignorise se (ostaje []). Svaki legalan
   * potez se prihvata, protivnik je Pawny (Stockfish bot), kraj koraka je
   * bilo koji sahovski zavrsni ishod (mat/pat/remi), ne solution.length.
   * Obicno pocinje korisnikov potez (indeks 0), ali ako prvi potez pripada
   * boji koja NIJE `orientation`, engine ga sam odigra cim se korak ucita -
   * npr. "crni je vec odigrao, sad je belo na potezu".
   */
  solution: string[];
  /**
   * Samo kind:'freePlay' - pool poruka koje "protivnik" (Pawny) salje u chat
   * balonce na svakih 5 poteza (oba igraca zajedno), nasumicno, bez
   * ponavljanja iste u istoj partiji. Kad se pool istroši, vise nema poruka
   * do kraja partije (ne resetuje se, ne kruzi ispocetka).
   */
  freePlayMessages?: string[];
  /**
   * Samo kind:'freePlay' - pool kratkih motivacionih recenica koje TRENER
   * (Outposty, ne Pawny) salje posle KORISNIKOVOG poteza (ne Pawny-jevog).
   * Ucestalost opada kroz partiju: prvih 5 korisnikovih poteza - svaki put;
   * sledecih (do 15.) - na svaki 3.; posle 15. - na svaki 5. Nasumicno, bez
   * ponavljanja iste u istoj partiji (isto pravilo kao freePlayMessages).
   */
  motivationMessages?: string[];
  /**
   * Samo kind:'freePlay' - koliko cesto Pawny (PawnyEngine.tsx) igra cisto
   * NASUMICAN legalan potez umesto Stockfish-ovog predloga (0..1, podrazumevano
   * 0.8 - vecinom nasumican, "deca ovo pobede"). Nize = Pawny malo jaci (npr.
   * Day 18 "Game 2" - "malo ostriji" protivnik nego Day 14). NIJE verifikovana
   * tacna rtg kalibracija (nema formule rtg<->ovaj broj) - samo relativno
   * podesavanje "jace/slabije" od Day 14 podrazumevanog.
   */
  pawnyRandomMoveChance?: number;
  /**
   * Samo kind:'freePlay' - protivnik (crni) igra PUNU snagu Stockfish-a
   * (nema Skill Level ogranicenja, nema nasumicnog poteza) umesto Pawny-jevog
   * namerno slabog engine-a (npr. Day 20 "Deliver Mate" - crni kralj se
   * brani najboljom odbranom, ovo JESTE poenta vezbe). Koristi
   * MateDefenseEngine.tsx umesto PawnyEngine.tsx za render.
   */
  strongOpponent?: boolean;
  /**
   * Samo kind:'freePlay' - Hint dugme NIJE iskljuceno (standardno ponasanje
   * za freePlay, nema skriptovano resenje da se otkrije) - umesto toga,
   * svaki klik trazi od Stockfish-a predlog SLEDECEG poteza za trenutnu
   * poziciju, pa od AI modela (uzivo, ne unapred pripremljen tekst) kratko
   * objasnjenje TOG KONKRETNOG poteza, u Outpost tonu. Nije ograniceno
   * MAX_HINTS_PER_STEP brojacem (dostupno u svakom trenutku). Npr. Day 20
   * "Deliver Mate" Phase 2 - slobodno matiranje, hint mora da bude uzivo jer
   * nema fiksnog "sledeceg poteza" da se unapred napise.
   */
  liveHint?: boolean;
  /**
   * Samo uz `liveHint` - umesto sirovog Stockfish "najboljeg" poteza, Hint
   * predlaze potez po FIKSNOJ pedagoskoj tehnici (checkmateTechnique.ts),
   * cak i kad bi engine nasao brzi mat drugim putem. 'queenBoxMethod' (Day 20
   * "Deliver Mate" Phase 2 - jedina trenutno postojeca tehnika): dama SAMA
   * suzava prostor kralja do jednog reda/kolone, TEK onda sopstveni kralj
   * prilazi u pomoc, pa "kiss of death" mat. Bez ovog polja (samo `liveHint`),
   * pada nazad na sirov engine predlog (requestBestMoveUci).
   */
  hintTechnique?: 'queenBoxMethod' | 'kpkOpposition';
  /**
   * Samo kind:'freePlay' (Lessons 2 Day 8) - korak je gotov cim korisnik
   * promovise pesaka u damu koju crni ne moze odmah da uzme. Bilo koji kraj
   * partije pre toga (remi, pat, pojeden pesak) vraca pocetnu poziciju uz
   * `freePlayFailText`. Draw/Resign su sakriveni, Take Back ostaje.
   */
  freePlayGoal?: 'promote';
  freePlayFailText?: string;
  /**
   * Samo kind:'freePlay' (Lessons 2 Day 27) - Stockfish oceni poziciju posle
   * SVAKOG korisnikovog poteza; ako korisnik vise ne dobija (manje od minCp,
   * podrazumevano 250), potez se vraca uz poruku. firstMoveTexts: posebna
   * poruka po UCI za prvi potez. Ako engine ne odgovori, potez se prihvata.
   */
  freePlayKeepWinning?: {
    wrongText: string;
    firstMoveTexts?: Record<string, string>;
    minCp?: number;
  };
  /** Samo kind:'freePlay' - poruka kad korisnikov potez kraljem uzme direktnu opoziciju. */
  oppositionCoachTexts?: string[];
  /**
   * Samo kind:'freePlay' - korak se NE zavrsava na bilo kakav kraj partije
   * (chess.isGameOver), nego SAMO na stvaran sah-mat. Pat (ili bilo koji
   * drugi zavrsetak bez mata) umesto toga VRACA poslednji (korisnikov) potez
   * (takeback) i salje `stalemateText`, korak ostaje otvoren za ponovni
   * pokusaj. Npr. Day 20 "Deliver Mate" - cilj vezbe je bas mat, ne bilo koji
   * kraj partije (klasicna pocetnicka greska je pat pri matiranju damom).
   */
  requireCheckmate?: boolean;
  /** Poruka na pat - uz `requireCheckmate`, ili za KING_APPROACH potez koji daje pat. */
  stalemateText?: string;
  /** KING_APPROACH korak: poruka kad kralj ne ide ka cilju. */
  kingApproachWrongText?: string;
  /**
   * Samo kind:'freePlay' - pool kratkih saveta o TEHNICI (ne o toku partije
   * kao freePlayMessages/motivationMessages) koji se prikazuje POSLE SVAKOG
   * korisnikovog poteza, bez izuzetka (nema opadajuce ucestalosti kao
   * motivationMessages). Nasumicno, bez ponavljanja iste dva puta zaredom,
   * ali se pool RECIKLIRA kad se potrosi (partija moze trajati duze od broja
   * saveta u pool-u) - za razliku od freePlayMessages/motivationMessages koji
   * samo cute kad se potrose. Npr. Day 20 "Deliver Mate" Phase 2.
   */
  techniqueTips?: string[];
  /** Naslov iznad table. */
  prompt: string;
  /** Poruka trenera kad korak pocne. */
  introText: string;
  /** Poruka trenera posle svakog tacnog poteza koji nije poslednji. */
  successText?: string;
  /**
   * Ako je true, `successText` se salje TACNO kako je napisan, bez mesanja
   * sa generickim frazama ("Keep it up!" i sl.) - koristi kad poruka nosi
   * bitnu uputu za sledeci potez (npr. "sad zagrizi sa druge strane"), ne
   * samo dekorativnu pohvalu. Default (false/nedefinisano) zadrzava postojece
   * ponasanje - nasumicna varijacija radi generickih pohvala.
   */
  successTextAlways?: boolean;
  /**
   * Samo za multi-move puzzle korake (npr. Day 17 "Two Rooks Checkmate" -
   * jedan korak, 5 belih poteza, svaki sa SOPSTVENIM objasnjenjem umesto
   * ponovljenog `successText`). Kljuc je indeks KORISNIKOVOG poteza u
   * `solution` (0, 2, 4... za naizmenicne puzzle korake - protivnikovi
   * potezi su neparni indeksi), vrednost tekst koji se salje UMESTO
   * `successText` na tom mestu, uvek tacno kako je napisan (bez variranja).
   * Ne vazi za POSLEDNJI potez koraka - taj i dalje koristi `doneText`.
   * Generican mehanizam, nije Day17-specifican.
   */
  moveExplanations?: Record<number, string>;
  /**
   * Isto kao `moveExplanations`, ali board highlight (isti arrows/squares
   * oblik kao `quizBoardHighlight`) umesto teksta - primenjuje se ZAJEDNO sa
   * odgovarajucim `moveExplanations[indeks]`, po istom indeksu.
   */
  /** Po indeksu korisnikovog poteza: hint tekst, poruka na pogresan potez i highlight uz oba (Lessons 2 Day 7). */
  moveGuides?: Record<
    number,
    {
      hintText?: string;
      wrongText?: string;
      /** Kao LessonStep.missTexts, samo za ovaj potez. */
      missTexts?: string[];
      /** Prvi hint oznacava ovo polje umesto figure koja igra (Lessons 2 Day 17). */
      hintSquare?: string;
      /** Poruka posle protivnikovog odgovora na ovaj potez, iza moveExplanations. */
      replyText?: string;
      highlight?: {
        arrows?: { from: string; to: string; color: string }[];
        squares?: { square: string; color: string; fill?: boolean }[];
      };
    }
  >;
  /** moveHighlights ostaju i posle protivnikovog odgovora, do sledeceg poteza (Day 20). */
  keepMoveHighlights?: boolean;
  /** Koliko dugo moveHighlight stoji pre protivnikovog odgovora (podrazumevano 900ms, Lessons 2 Day 29). */
  moveHighlightHoldMs?: number;
  moveHighlights?: Record<
    number,
    {
      arrows?: { from: string; to: string; color: string }[];
      squares?: {
        square: string;
        color: string;
        fill?: boolean;
        label?: string;
      }[];
    }
  >;
  /** Poruka trenera kad je korak zavrsen. */
  doneText: string;
  /**
   * Alternativna "gotovo" poruka ako je POSLEDNJI potez koraka bila promocija
   * u NEDAMU (top/lovac/skakac) - i dalje ispravno zavrsava korak, samo drugi
   * ton poruke (blago upozorenje umesto pune pohvale). Generican mehanizam za
   * bilo koji korak sa promocijom, ne samo Pawn lekciju.
   */
  nonQueenPromotionText?: string;
  /**
   * Suprotno od `nonQueenPromotionText` - kad je true, promocija u BILO ŠTA
   * osim dame se tretira kao POGREŠAN potez (standardan takeback + hintText),
   * ne kao "tačno, samo drugi ton" (npr. Day 19 "Pawn Promotion" trke - u
   * trci je top/lovac/skakac stvarno pogrešan izbor, ne alternativa). Default
   * (false/nedefinisano) zadržava postojeće ponašanje - bilo koja promocija
   * je tačna. Generičan mehanizam, ne Day19-specifičan.
   */
  requireExactPromotion?: boolean;
  /** Poruka trenera na pogresan potez. */
  hintText: string;
  /**
   * Ako je true, `hintText` se salje TACNO kako je napisan na SVAKI pogresan
   * potez, bez mesanja sa generickim variranim frazama (vidi
   * pickVariedWrongMoveMessage) - koristi kad lekcija namerno trazi IDENTICAN
   * flow na svaki promasaj, bez eskalacije (npr. Day 17 "Two Rooks" - isti
   * fiksan tekst svaki put). Default (false/nedefinisano) zadrzava postojece
   * ponasanje - nasumicna varijacija. Isti princip kao `successTextAlways`.
   */
  hintTextAlways?: boolean;
  /** Poruka po broju promasaja (poslednja se ponavlja); od drugog promasaja i strelica do resenja (Lessons 2 Day 15). */
  missTexts?: string[];
  /** Umesto doneText kad je korak resen posle promasaja ili hinta. */
  doneTextAfterMiss?: string;
  /** Nastavlja partiju prethodnog koraka: bez novog FEN importa, notacija cuva sve poteze. */
  continuesGame?: boolean;
  /** Fiksna poruka kad je pogresan potez uzimanje (npr. pogresan pesak u "skupi pesake"). */
  wrongCaptureText?: string;
  /** Nelegalan potez se ne racuna kao greska - samo ova poruka u chatu (Day 28/29). */
  illegalMoveText?: string;
  /** Pun celebration overlay sa konfetima na kraju koraka. */
  celebrate?: boolean;
  /**
   * 'teach' korak u kom su vise od jedne mete istovremeno na dohvat iste
   * figure sa trenutne pozicije (npr. kralj koji moze da uzme bilo koji od 2
   * susedna pesaka prvo) - korisnik moze da pokupi mete SVOJIM redosledom,
   * dokle god je svaki potez pojedinacno legalan sa trenutne pozicije.
   * Legalnost (ukljucujuci "ovo polje je jos branjeno" slucajeve) proverava
   * chess.js uzivo, ne rucno nabrojan redosled u `solution`.
   */
  unorderedTargets?: boolean;
  /**
   * Opcioni popup PRE ovog koraka (npr. "vreme je da naucimo rokadu") - jedan
   * generican mehanizam za bilo koju lekciju koja treba da uvede novu pod-temu
   * usred lekcije, ne samo King/rokada. Kad postoji, korak ceka klik na dugme
   * pre nego sto se prikaze tabla/posalje introText.
   */
  preStepIntro?: {
    title: string;
    text: string;
    bullets?: string[];
    buttonText?: string;
    /** Opciona mini-animacija iznad teksta - trenutno samo rokada, generisi po smeru. */
    diagram?: 'castle-kingside' | 'castle-queenside';
    /** Staticna mini-tabla iz FEN-a, sa opciono obojenim redom (Lessons 2 Day 8). */
    diagramFen?: string;
    diagramHighlightRank?: number;
  };
  /**
   * Skakac koji preskace figuru - poljace "izmedju" from/to (racunato
   * geometrijski, ne stvarno postoji na tabli za druge figure) kratko
   * zasvetli zlatno ako je zauzeto, posle tacnog poteza. Generican mehanizam
   * (LessonStep.jumpGlow), ne hardkodovan za Knight lekciju.
   */
  jumpGlow?: boolean;
  /**
   * Alternativni tacni potezi za odredjeni indeks u `solution` (npr. "sa
   * pocetne pozicije prihvatamo i jedno i dva polja - e2e3 ILI e2e4"). Kljuc
   * je indeks u `solution` nizu, vrednost niz dodatnih UCI poteza koji se
   * TAKODJE prihvataju na tom mestu, pored `solution[index]` samog. Generican
   * mehanizam, nije Pawn-specific - bilo koji korak moze da ga koristi kad
   * vise razlicitih poteza validno zavrsava taj deo zadatka.
   */
  altMoves?: Record<number, string[]>;
  /**
   * Samo kind:'puzzle' (npr. Day 26 "Perpetual Check") - korisnikovi indeksi
   * u `solution` su ANY_LEGAL_CHECK (ne fiksan UCI): potez je tacan SAMO ako
   * (1) daje sah I (2) je "bezbedan" - PROVERENO (isSafeCheckMove u
   * lessonEngine.ts, pravi minimax, ne samo "da li je sah") da i dalje vodi
   * ka remiju bez obzira koje legalno bekstvo kralj kasnije odabere. Legalan
   * sah koji NIJE bezbedan (npr. gura damu na polje odakle kralj moze da
   * pobegne u poziciju bez daljeg saha, ili gde dama postaje hvatljiva) NIJE
   * tacan ovde - korisnicin eksplicitan zahtev, "ne sahiramo na najgluplja
   * moguca polja". Vidi `unsafeCheckText` za poruku u tom slucaju.
   * Protivnikovi indeksi ostaju ANY_LEGAL_REPLY (engine bira bilo koji
   * legalan potez - obicno jedini legalan je da kralj pobegne, pozicija je
   * tako postavljena). Hint ovde ide kroz ISTI standardni dvostepeni sistem
   * kao svuda drugde (1. klik oznaci damu, 2./poslednji klik doda strelicu)
   * - "figura" (dama) se trazi na trenutnoj tabli na 1. klik (jeftino), ali
   * STVARAN potez na 2. klik mora biti UZIVO izracunat (findSafeCheckMove,
   * lokalan minimax, ne Stockfish) jer se tacna "bezbedna" sledeca sah-polja
   * menjaju zavisno od toga gde je kralj STVARNO pobegao. Generican
   * mehanizam, ne Day26-specifican.
   */
  requireLegalCheck?: boolean;
  /**
   * Samo uz `requireLegalCheck` - poruka kad je korisnikov potez TEHNICKI
   * sah (legalan, daje sah), ali NIJE deo bezbedne strategije (vidi gore) -
   * razlicita od standardnog `hintText` (koji je za poteze koji uopste NISU
   * sah). Crveni X se prikazuje u oba slucaja (isti standardni pogresan-potez
   * vizuelni jezik), samo je poruka druga.
   */
  unsafeCheckText?: string;
  /**
   * Potez koji NIJE step.solution[indeks] (ne prolazi korak dalje), ali je
   * PREPOZNAT kao svoja sopstvena kategorija vredna POSEBNE poruke, razlicite
   * od generickog `hintText` - npr. Day 21 "Opposition": kad se trazi
   * paralelna opozicija a korisnik odigra dijagonalnu (JESTE opozicija, samo
   * pogresna vrsta), ili potez koji ne spada u ono sto lekcija uci ali je
   * (provereno) objektivno i dalje dobijajuci (ne zelimo da mu kazemo da je
   * partija izgubljena kad nije). Kljuc je indeks u `solution` nizu (isto kao
   * `altMoves`), vrednost niz prepoznatih poteza + njihova poruka. Potez se
   * NE primenjuje (isto ponasanje kao standardan pogresan potez - crveni X,
   * zvuk, hint tacke za pravu figuru - samo je poruka druga, salje se TACNO
   * kako je napisana, bez variranja). Generican mehanizam, nije Day21-specifican.
   */
  otherTypeMoves?: Record<
    number,
    {
      uci: string;
      message: string;
      /** Znak na tabli uz ovaj potez, npr. '?' (Lessons 2 Day 28). */
      glyph?: string;
    }[]
  >;
  /** Po indeksu korisnikovog poteza: znak na tabli posle tacnog poteza, npr. '!' (Lessons 2 Day 28). */
  moveGlyphs?: Record<number, string>;
  /** Kviz odgovori (samo kind:'quiz') - obicno 4 teksta (Yes/No kviz moze imati 2), prikazuju se kao dugmad. */
  quizOptions?: string[];
  /** Indeks tacnog odgovora u quizOptions (0-3), samo kind:'quiz'. Ignorise se kad je zadato `quizMultiSelect`. */
  quizCorrectIndex?: number;
  /**
   * Samo kind:'quiz' (Day 31 "Graduation Test 2" Q2/Q3) - umesto jednog
   * tacnog odgovora, korisnik BIRA TACNO `quizCorrectIndices.length` opcija
   * (dugmad se TOGGLE-uju, ne zakljucavaju na prvi klik) - cim je taj broj
   * izabran, automatski se ocenjuje: TACNO samo ako izabrani skup TACNO
   * odgovara `quizCorrectIndices` (sve-ili-nista, nema delimicnih poena).
   * Jedan pokusaj, bez retry-ja (isto kao standardan kviz). Generican
   * mehanizam.
   */
  quizMultiSelect?: boolean;
  /** Samo uz `quizMultiSelect` - indeksi SVIH tacnih opcija (npr. [0,1] za "biraju se 2"). */
  quizCorrectIndices?: number[];
  /**
   * Samo kind:'quiz' (Day 31 Q14) - netacan odgovor NE zavrsava korak (kao
   * `quizRetryOnWrong`), ALI umesto binarnog ishoda, svaki netacan pokusaj
   * oduzima poene (isti princip kao `anyLegalMoveStreak`/`exactMoveUci` -
   * vidi scoreDeduction, floor 0.25) i automatski prikazuje "crosshair"
   * strelice (fajl + red do tacnog polja, citano iz zavrsetka tacne
   * quizOptions opcije, npr. 'g5') da korisnik vidi KAKO se koordinata cita.
   * Samo za lekcije sa `Lesson.graduationTest`. Generican mehanizam.
   */
  quizScoredRetry?: boolean;
  /**
   * Kratko objasnjenje/prica koje se salje kao trenerova poruka ODMAH posle
   * izbora odgovora - kviz je "jedan pokusaj", ne trazi ponovni pokusaj kao
   * potezi na tabli. Koristi se za TACAN odgovor (i za oba ishoda ako
   * `quizExplanationWrong` nije zadato). Samo kind:'quiz'.
   */
  quizExplanation?: string;
  /**
   * Alternativno objasnjenje za NETACAN odgovor, ako treba drugaciji ton od
   * tacnog (npr. "Close! Actually..." umesto "Correct!..."). Ako nije
   * zadato, pada nazad na `quizExplanation` za oba ishoda.
   */
  quizExplanationWrong?: string;
  /**
   * Umesto FIKSNOG `quizExplanation` na TACAN odgovor, bira NASUMICAN tekst
   * iz ovog fonda (isti princip kao pickVariedMessage - ne ponavlja
   * poslednji poslati) - npr. Day 23 "Bridge" kviz: "That's it."/"Right."/
   * "That's the one.", generican fond za svih 10 pitanja, ne fiksna poruka
   * po pitanju. Ako je zadato, ima prednost nad `quizExplanation`.
   */
  quizCorrectFeedbackPool?: string[];
  /**
   * Umesto autorovanog `quizExplanationWrong`, automatski generise "Not
   * quite. The right answer: {tacan odgovor}." gde je {tacan odgovor} TEKST
   * iz `quizOptions[quizCorrectIndex]` - npr. Day 23 "Bridge" kviz, gde je
   * ovo ISTA generička poruka za svih 10 pitanja, bez potrebe da se tacan
   * odgovor rucno prepisuje u svaku. Ignorise `quizExplanationWrong` kad je
   * zadato oba (ovo ima prednost).
   */
  quizShowCorrectAnswerOnWrong?: boolean;
  /**
   * Netacan odgovor NE zavrsava korak (Day 15 Position 6 "Yes/No" trik) -
   * posalje se `quizExplanationWrong` kao kratak nagovestaj, pa se dugmad
   * ponovo otkljucaju da korisnik proba opet. Korak se zavrsava tek na TACAN
   * odgovor. Bez ovoga (default), netacan odgovor zavrsava korak kao obicno.
   */
  quizRetryOnWrong?: boolean;
  /**
   * UCI potez koji se automatski odigra na tabli posle TACNOG odgovora (pre
   * `quizExplanation` poruke) - npr. Day 15 Position 6: "Yes" je tacno, pa
   * tabla sama odigra rokadu da pokaze da je stvarno legalna. Dispatchuje se
   * kao obican potez (ChessFENBoard sam prepoznaje kralj-dva-polja kao
   * rokadu i pomeri i top).
   */
  quizAutoPlayMove?: string;
  /** Linija poteza (obe boje) koja se odigra posle odgovora, uz opcioni komentar po potezu (Lessons 2 Day 8). */
  quizDemoLine?: {
    uci: string;
    text?: string;
    /** Highlight posle ovog poteza, ostaje do kraja linije. */
    highlight?: {
      arrows?: { from: string; to: string; color: string }[];
      squares?: {
        square: string;
        color: string;
        fill?: boolean;
        label?: string;
      }[];
    };
    /** Konfete i zvuk posle ovog poteza (npr. nova dama). */
    celebrate?: boolean;
    /** Od ovog poteza tabla izlazi napred, ostatak ekrana se zamuti (Lessons 2 Day 13). */
    focus?: boolean;
  }[];
  /** Highlight na kraju quizDemoLine (npr. strelica pesak -> polje promocije). */
  quizDemoEndHighlight?: {
    arrows?: { from: string; to: string; color: string }[];
    squares?: { square: string; color: string; fill?: boolean }[];
  };
  /** Protivnikov odgovor koji se odigra posle quizAutoPlayMove (Lessons 2 Day 5 demo). */
  quizAutoPlayReply?: string;
  /** Kviz se moze odgovoriti i potezom na tabli: indeks = quizOptions indeks, vrednost = UCI potezi te opcije. */
  quizMoveOptions?: string[][];
  /** Posle odgovora oboji centralna polja koja tacan potez zauzima/napada (Lessons 2 Day 4). */
  quizCenterControl?: boolean;
  /**
   * Posle tacnog poteza, animirano (kvadrat po kvadrat) otkrij celu liniju
   * (red/kolona/dijagonala) izmedju `move.from` i `move.to`, koristeci isti
   * vizuelni "hint" mehanizam (tackice na poljima) kao svuda drugde u lekciji
   * - ne izmisljena nova komponenta. Generican, ne History-specific.
   */
  revealPath?: boolean;
  /**
   * Zatamni tablu dok je ovaj kviz korak aktivan (samo kind:'quiz'). Default
   * false - tabla ostaje vidljiva. Postavi na true kad je sadrzaj table
   * nebitan za pitanje (npr. History kviz) i zelimo fokus na chat; ostavi
   * false/izostavljeno kad odgovor zavisi od necega sto se vidi na tabli
   * (npr. Piece Values - korisnik cita figuru/poziciju sa table).
   */
  quizDimBoard?: boolean;
  /**
   * Umesto poredjenja odigranog poteza sa fiksnim "tacnim kvadratom"
   * (solution[progress]), potez se proglasava tacnim ako REZULTUJUCA
   * pozicija posle odigranog poteza zadovoljava ovaj uslov (chess.js
   * isCheckmate()/isStalemate() na poziciji POSLE poteza). Prihvata svaki
   * legalan potez koji dovede do trazenog ishoda, ne samo jedan unapred
   * zamisljen - generican mehanizam za "nadji mat/pat u jednom", ne
   * Day9-specifican. Samo kind:'puzzle', solution i dalje ostaje jednoclan
   * placeholder (npr. ['goal']) da progress/isStepComplete rade nepromenjeno.
   */
  /**
   * 'denyCastleKingside'/'denyCastleQueenside' (Day 15 "Stop the Castle!") -
   * potez se stvarno odigra kroz chess.js i proverava se da li PROTIVNIKOVA
   * rokada na tu stranu postaje nelegalna u rezultujucoj poziciji (bilo koji
   * potez koji to postigne je tacan, ne samo jedan unapred zamisljen).
   */
  goalCondition?:
    | 'checkmate'
    | 'stalemate'
    | 'denyCastleKingside'
    | 'denyCastleQueenside';
  /**
   * Samo kind:'quiz' SA quizOptions i extraHintText - Hint dugme normalno
   * salje extraHintText SAMO JEDNOM po koraku (dalji klikovi ne radi nista,
   * npr. Day 9 Checkmate/Stalemate - hint tu otkriva resenje, nema smisla
   * dvaput). Kad je ovo true, isti generican extraHintText se salje na SVAKI
   * klik, bez ogranicenja (npr. Day 22 "Material" - hint je samo podsetnik na
   * vrednosti figura, ne otkriva odgovor, logicno da radi uvek). Generican
   * mehanizam, ne Day22-specifican.
   */
  unlimitedQuizHint?: boolean;
  /**
   * Hint poruka - za kind:'quiz' korake (nema figure/poteza na tabli uopste)
   * ovo je CELOKUPAN hint, jedan klik, cisto tekstualan. Za kind:'puzzle'
   * korake ovo je tekst koji prati standardni dvostepeni hint (1. hint oznaci
   * figuru, 2. hint doda strelicu) umesto generickog variranog teksta - radi
   * i sa `goalCondition`/`hintMove` i sa obicnim fiksnim `solution` nizom
   * (Day 16 "Secret hint" po puzzli). Generican, ne Day9-specifican.
   */
  extraHintText?: string;
  /**
   * Samo za kind:'puzzle' korake sa `goalCondition`: UCI potez koji Hint
   * dugme crta (1. klik oznaci pocetno polje, 2./poslednji klik doda i
   * strelicu do mete) - isti dvostepeni sistem kao kod ostalih koraka, da
   * korisnik uvek zna sta Hint radi. NIJE jedino prihvatljivo resenje - sama
   * validacija poteza (onMove) i dalje proverava `goalCondition` na
   * rezultujucoj poziciji i prihvata bilo koji potez koji ga zadovoljava;
   * ovo je samo JEDAN tacan potez, za prikaz.
   */
  hintMove?: string;
  /**
   * Samo uz `hintMove` - Hint dugme NIKAD (ni na poslednjem kliku) ne crta
   * strelicu do `hintMove`, ostaje cisto tekstualan trag (Day 15 Part 2 -
   * "Hint ne otkriva direktno resenje"). Umesto toga, strelica/polja se
   * automatski pokazu na PRVI POGRESAN POTEZ - vidi `wrongMoveHighlight`.
   */
  hintNeverRevealsArrow?: boolean;
  /**
   * Scenski board highlight koji se automatski prikazuje na PRVI pogresan
   * potez (kind:'puzzle' sa `goalCondition`) - za korake gde Hint namerno NE
   * otkriva resenje (vidi `hintNeverRevealsArrow`), ali gresan pokusaj ipak
   * zasluzuje vizuelno objasnjenje. Isti arrows/squares oblik kao
   * `quizBoardHighlight`, potpuno nezavisan mehanizam.
   */
  wrongMoveHighlight?: {
    arrows?: { from: string; to: string; color: string }[];
    squares?: { square: string; color: string }[];
  };
  /**
   * Scenski board highlight. Za kind:'quiz' SA quizOptions: prikazuje se
   * POSLE odgovora, uvek, bez obzira na tacnost (korisnik ne sme da prodje
   * kroz pitanje a da ne vidi obrazlozenje nacrtano na tabli). Za kind:'quiz'
   * BEZ quizOptions ("watch & learn" demonstracija): prikazuje se ODMAH pri
   * ucitavanju koraka. Za kind:'puzzle' sa `goalCondition`: prikazuje se
   * posle TACNOG poteza. Generican mehanizam za "oznaci sah liniju / pokrivena
   * polja / blokirana polja odjednom, razlicitim bojama" - ne izmisljena nova
   * komponenta, samo parametrizovan isti squareRenderer/arrowsMap sistem.
   */
  quizBoardHighlight?: {
    arrows?: { from: string; to: string; color: string }[];
    /**
     * `fill` (opciono, podrazumevano false/outline) - puna obojena pozadina
     * polja umesto tankog 3px okvira (npr. Day 27 "Chess Notation" Part A -
     * outline se slabo video na praznoj tabli, korisnica trazila "puno
     * obojeno"). Isti vizuelni jezik kao LessonStep.highlightRookRanks (Day
     * 17), samo po polju umesto po celom redu. `dot` (opciono) dodaje i
     * nasu plavu tackicu na sredini (isti vizuelni jezik kao markSquares
     * korisnikova sopstvena oznaka) - jos jedan sloj kontrasta preko `fill`,
     * korisnica trazila kad ni sama puna boja nije bila dovoljno jasna.
     * Generican, ne Day27-specifican.
     */
    squares?: {
      square: string;
      color: string;
      fill?: boolean;
      dot?: boolean;
      /** Kratak natpis na polju, npr. 'DECOY' (Lessons 2 Day 27). */
      label?: string;
    }[];
  };
  /**
   * Samo za kind:'puzzle' sa `goalCondition` koji ima VISE ispravnih poteza
   * (npr. 4 razlicita mata u istoj poziciji). `hintMove`/`doneText`/
   * `quizBoardHighlight` ostaju PODRAZUMEVANI (ono sto Hint dugme pokazuje),
   * ali ako korisnik odigra neki DRUGI potez koji TAKODJE zadovoljava
   * goalCondition, a nalazi se ovde (po UCI), njegov doneText/
   * quizBoardHighlight imaju prednost - objasnjenje mora da opisuje stvarno
   * odigran potez, ne uvek isti hardkodovan. Generican, ne Day10-specifican.
   */
  altSolutions?: {
    uci: string;
    doneText: string;
    quizBoardHighlight?: {
      arrows?: { from: string; to: string; color: string }[];
      squares?: { square: string; color: string }[];
    };
    /**
     * Ovaj potez TEHNICKI zadovoljava goalCondition (npr. i jeste sah-mat),
     * ali lekcija uci TACNO ODREDJEN obrazac (npr. Day 12 "Kiss of Death" -
     * dama ispred kralja) - ne zelimo da ovaj alternativni mat zavrsi korak.
     * Kad je true, potez se NE primenjuje na tabli (kao pogresan potez),
     * salje se `retryMessage` umesto standardne "pogresno" poruke, i korak
     * ostaje otvoren dok korisnik ne odigra bas trazen potez.
     */
    requireRetry?: boolean;
    /** Poruka za requireRetry potez - ohrabrujuca, ne "pogresno" (igrac JESTE nasao mat, samo ne taj koji ucimo). */
    retryMessage?: string;
  }[];
  /**
   * Samo kind:'quiz' SA quizOptions: prikazuje quizBoardHighlight ODMAH pri
   * ucitavanju koraka (pre odgovora), ne tek posle - za slucaj kad je linija/
   * oznaka na tabli SAM PREDMET pitanja (npr. "sta je ovo nacrtano?"), ne
   * objasnjenje-posle-odgovora. Default false (postojece ponasanje, Day9/10
   * nepromenjeno - highlight bi tu odao odgovor unapred).
   */
  quizBoardHighlightUpfront?: boolean;
  /**
   * Tekst dugmeta kojim se korak zavrsava (dole, pored Hint-a). Default
   * 'Next' (nepromenjeno ponasanje za sve postojece lekcije). Postavi na
   * 'Got it!' za demonstracione korake unutar iste tematske celine.
   */
  nextButtonText?: string;
  /** Kviz sa jednom opcijom: opcija je natpis Next dugmeta (npr. 'Show me'), ne dugme u chatu (Lessons 2 Day 27). */
  quizAnswerViaNextButton?: boolean;
  /**
   * Skracena verzija nextButtonText-a za mobilni, gde dugme stoji u istom
   * redu sa progress trakom (npr. 'London S.' umesto 'London System').
   * Bez nje mobilni prikazuje pun nextButtonText.
   */
  nextButtonTextMobile?: string;
  /**
   * Dodatna trenerova poruka koja se salje POSLE standardnog zavrsetka
   * koraka (watch-step auto-complete, ili markSquares tacan/hint ishod) -
   * za oznacavanje prelaza izmedju vecih tematskih celina lekcije (npr.
   * "Bravo! Let's move on to the next one."). Kad je zadato, podrazumevani
   * `nextButtonText` postaje 'Next' ako nije eksplicitno drugacije zadat.
   */
  transitionText?: string;
  /**
   * Board highlight koji ide UZ `transitionText`, za kind:'teach'/'puzzle'
   * (ne markSquares/quiz - ti imaju sopstvene mehanizme) - npr. Day 17 "Two
   * Rooks" Step 2 "roles-swap illustration": strelice se PRECRTAJU da
   * pokazu koja bi tura sledeca cuvala liniju a koja sahirala, uz prateci
   * tekst. Primenjuje se posle `quizBoardHighlight`/`doneText`, pre
   * `transitionText` poruke. Generican, ne Day17-specifican.
   */
  transitionHighlight?: {
    arrows?: { from: string; to: string; color: string }[];
    squares?: { square: string; color: string }[];
  };
  /**
   * Samo kind:'teach' - umesto (pored) rucnog prevlacenja figure, AI chat
   * prikazuje KLIKABILNO dugme sa potezom (SAN tekst za prikaz) odmah ispod
   * task oblacica, isti princip kao quizOptions dugmad. Klik izvrsava TACNO
   * taj potez kroz isti put kao rucno odigran tacan potez (poziva onMove),
   * nije posebna validaciona grana - rucno prevlacenje i dalje radi normalno
   * pored njega. `uci` mora da se poklapa sa `solution[progress]` u tom
   * trenutku. Koristi za polu-interaktivne demo korake (npr. Day 17 "Two
   * Rooks" Koraci 1-3) gde korisnik klikom "igra" potez umesto prevlacenja.
   */
  suggestedMove?: { uci: string; label: string };
  /** Na svakom korisnikovom potezu chat nudi klikabilan sledeci potez iz `solution` (Lessons 2 Day 29). */
  suggestSolutionMoves?: boolean;
  /**
   * Stalne oznake polja (npr. red koji top drzi) - ne brisu se izmedju poteza
   * ni kroz continuesGame korake, ispod privremenih highlight-a (Lessons 2 Day 29).
   */
  boardBackdrop?: {
    square: string;
    color: string;
    fill?: boolean;
    label?: string;
  }[];
  /** Po indeksu korisnikovog poteza: posle tog poteza zameni boardBackdrop. */
  moveBackdrops?: Record<
    number,
    { square: string; color: string; fill?: boolean; label?: string }[]
  >;
  /**
   * Samo kind:'markSquares': zavrsno objasnjenje kad je JEDINI pokusaj
   * netacan (isto "jedan pokusaj" pravilo kao kviz pitanje - cim korisnik
   * obelezi ocekivani broj polja, korak je gotov, tacno ili ne). Pada nazad
   * na `doneText` ako nije zadato. `quizBoardHighlight` se u oba slucaja
   * prikazuje, `extraHintText` ostaje rezervisan za standardno Hint dugme
   * PRE pokusaja (vidi onHint/onToggleMarkSquare u DailyLessonActivity.tsx).
   */
  retryPromptText?: string;
  /**
   * Samo kind:'markSquares' - objasnjenje na PRVI (jos uvek otvoren) promasaj,
   * razlicito od `retryPromptText` (npr. Day 27 "Chess Notation" Part B -
   * "nadji i obelezi polje X"). I prvi i svaki sledeci netacan pokusaj
   * ODMAH zavrsava korak (korisnik mora moci da klikne Next, ne sme ostati
   * zakljucan dok ne pogodi) - ovo je samo tekst, ne gate na zavrsetak.
   * Bez ovoga pada nazad na `retryPromptText`.
   */
  firstMissText?: string;
  /** Rezervisano za buduce koriscenje (board highlight uz `firstMissText`) - trenutno se ne koristi, obelezavanje pogresnog polja ide kroz `wrongMarkedSquare` u DailyLessonActivity.tsx. */
  firstMissHighlight?: {
    arrows?: { from: string; to: string; color: string }[];
    squares?: { square: string; color: string }[];
  };
  /** markSquares: obican klik bira polje, svaki klik se ocenjuje odmah, greska ne zavrsava korak (Lessons 2 Day 18). */
  markRetryOnWrong?: boolean;
  /** Uz markRetryOnWrong: poruka kad je nadjeno tacno polje, a fali jos neko. */
  markPartialText?: string;
  /** markSquares u ocenjenom testu (Day 31 Q13) - tacan pokusaj donosi poen; jedan pokusaj kao svuda. */
  scoredMarkSquares?: boolean;
  /**
   * Iskljucuje ovaj korak iz brojanja na progress traci (Lesson.
   * flatProgressSegments) - za kratke "watch & learn" prelazne poruke
   * izmedju tematskih celina (npr. Day 27 "Chess Notation" - 4 uvodna/
   * prelazna chat-balona sa sopstvenim dugmetom, ne racunaju se u "16/16").
   * Generican mehanizam, ne Day27-specifican.
   */
  excludeFromProgress?: boolean;
  /** Greska na excludeFromProgress koraku boji PRETHODNI segment, ne sledeci (Lessons 2 Day 24 kviz posle mata). */
  progressAttachToPrevious?: boolean;
  /**
   * Samo kind:'teach'/'puzzle': strelica do resenja (step.solution[progress])
   * se crta ODMAH pri ucitavanju koraka, pre bilo kog pokusaja - za korake
   * gde je vodjenje namerno "ovde tacno igras" (npr. Day 12 "Bring It On!"
   * Move 1/2), ne cekajuci Hint klik. Generican, ne Day12-specifican.
   */
  showSolutionArrowUpfront?: boolean;
  /**
   * Samo kind:'teach'/'puzzle': na PRVI netacan pokusaj, pored standardnog
   * X-a i zelenih tacaka (legalna polja za figuru), ODMAH se nacrta i
   * strelica do tacnog resenja - bez cekanja da korisnik klikne Hint. Za
   * korake gde se vodjenje namerno otkriva tek POSLE prvog promasaja (npr.
   * Day 12 Move 3), umesto od samog pocetka (vidi showSolutionArrowUpfront).
   */
  revealArrowOnWrongMove?: boolean;
  /**
   * Iskljucuje ovaj ZAVRSEN korak iz standardnog "Next spreman" ponasanja
   * (6s auto-advance fill, pun-ekran zatamnjenje, pulsiranje dole) - isto
   * poprilicno kao "watch & learn"/markSquares koraci, ali opt-in PO KORAKU,
   * ne po `kind`. Koristi kad je upravo zavrsena pozicija pedagoski bitna i
   * korisnik treba neograniceno vreme da je prouci pre nego sto klikne dalje
   * (npr. Day 12 Move 1 - "kralju ostaje TACNO jedno polje, ne nula").
   */
  noAutoAdvance?: boolean;
  /**
   * Samo kind:'quiz' - na TACAN odgovor, sledeci korak se ucitava sam posle
   * kratke pauze, BEZ rucnog Next klika (npr. Day 30 "Graduation Checkpoint
   * 1" Part B - "immediate advance" na tacan odgovor). Na NETACAN odgovor
   * ovo se ne primenjuje - uvek ceka rucni Next (user treba vremena da
   * procita objasnjenje). Opt-in PO KORAKU - npr. Day 27 ga namerno ne
   * koristi nigde (korisnica tada trazila iskljucivo rucni Next kroz celu
   * tu lekciju). Generican mehanizam.
   */
  autoAdvanceOnCorrect?: boolean;
  /**
   * Samo kind:'quiz' (quizOptions) i kind:'markSquares' (Day 27 "Chess
   * Notation") - posle odgovora (tacnog ILI netacnog), slovo (file) i broj
   * (rank) tacnog polja ulete iz svoje linije/reda i sretnu se na tom polju,
   * da korisnik vizuelno nauci KAKO se koordinata cita. Ciljno polje se cita
   * iz `solution[0]` (markSquares) ili iz zavrsnog dela tacne quizOptions
   * stringa (kviz, regex `[a-h][1-8]$`) - vidi triggerRevealAnimation u
   * DailyLessonActivity.tsx. Generican mehanizam, ne Day27-specifican.
   */
  revealSquareAnimation?: boolean;
  /**
   * Samo kind:'quiz' (Day 27 "Chess Notation" Part C "napisi potez") - UCI
   * potez (npr. 'g1f3') koji se ODIGRA NA TABLI cim se korak ucita, pre bilo
   * kog odgovora - `fen` je POLAZNA pozicija (figura na polaznom polju), ne
   * gotova pozicija na odredistu. Korisnica trazila da vidi STVARAN potez
   * (npr. konj Ng1-f3), ne samo vec-odigranu poziciju. Generican mehanizam,
   * ne Day27-specifican - vidi beginStep u DailyLessonActivity.tsx.
   */
  playMoveOnLoad?: string | string[];
  /**
   * Samo kind:'teach'/'puzzle' (npr. Day 17 "Two Rooks Checkmate") - posle
   * SVAKOG tacnog poteza (ne samo poslednjeg), CEO red (rank) na kom stoji
   * svaki top korisnikove boje se oboji automatski (racuna se iz stvarne
   * pozicije, ne rucno autorovano po koraku). Top koji je BAS TIM potezom
   * dao sah dobija drugu boju od onog koji samo drzi liniju, da korisnik
   * vidi "ko sece, ko sahira" na prvi pogled. Nezavisan kanal od
   * `quizBoardHighlight`/`moveHighlights` (te dve ostaju za strelice/ostale
   * oznake) - ne gasi ih, ne gasi se njima. Generican, ne Day17-specifican.
   */
  highlightRookRanks?: boolean;
  /**
   * Samo kind:'teach'/'puzzle', prikazuje se ODMAH pri ucitavanju koraka, pre
   * bilo kog pokusaja (npr. Day 17 Step 3 - "zasto ne mozes da sahiras
   * odavde"). Vizuelno objasnjava ZASTO neki ocigledan potez NE radi: roze
   * strelica(e) (ista boja kao pogresan potez) + crveni X na odredisnom
   * polju - isti vizuelni jezik kao kad korisnik STVARNO odigra pogresno,
   * samo prikazan unapred kao upozorenje, ne kao posledica pokusaja. Ostaje
   * na tabli kroz ceo korak (ne gasi se na pogresan potez). Generican, ne
   * Day17-specifican.
   */
  wrongPathPreview?: {
    arrows: { from: string; to: string }[];
    squares: string[];
  };
  /**
   * Samo kind:'teach' (Day 30 "Graduation Checkpoint 1" Part A, Q1-5) -
   * "pokazi mi N legalnih poteza" umesto tacno odredjenog niza u `solution`.
   * Prihvata SVAKI sahovski legalan potez figure na `drillPieceSquare`
   * (chess.js provera na trenutnoj poziciji, ne poredjenje sa unapred
   * zapisanim potezom) - potez se stvarno odigra, figura nastavlja odatle
   * za sledeci pokusaj. Korak je gotov cim korisnik odigra OVOLIKO LEGALNIH
   * poteza UKUPNO - pogresan/ilegalan pokusaj NE resetuje ovaj brojac
   * (korisnica eksplicitno trazila "3 u totalu, cak i pored greske"), samo
   * kosta poene (vidi scoreDeduction). Nezavisno od `solution`, koji ovde
   * ostaje prazan placeholder (progress/isStepComplete mehanizam i dalje
   * racuna preko njegove duzine, vidi engine). Generican mehanizam.
   */
  anyLegalMoveStreak?: number;
  /**
   * Samo uz `anyLegalMoveStreak`/`exactMoveUci`/`raceSolution` - polazno
   * polje figure koja se testira. Potezi sa BILO KOG DRUGOG polja (npr.
   * dummy kralj dodat samo zbog FEN validacije) se TIHO ignorisu, ne broje
   * se niti kao tacni niti kao pogresni - nisu deo ovog zadatka.
   */
  drillPieceSquare?: string;
  /**
   * Samo kind:'teach' (Day 30 Q6/Q7, Day 31 Q5/Q6) - TACNO ODREDJEN potez
   * (UCI) zavrsava korak odmah; jedan string ili VISE prihvatljivih (npr.
   * Day 31 Q5 - Qa8# ILI Qg7#, oba su mat). Promocija se poredi TACNO
   * (movesMatch sa requireExactPromotion) kad UCI nosi peto slovo - Day 31
   * Q6 trazi bas damu, underpromocija se odbija. SVAKI drugi potez sa
   * `drillPieceSquare` (legalan ili ne) se tretira kao pogresan pokusaj -
   * isti penal kao kod `anyLegalMoveStreak`, ali korak se NE zavrsava dok se
   * ne odigra jedan od ovih poteza (streak koncept ne postoji ovde).
   */
  exactMoveUci?: string | string[];
  /**
   * Samo kind:'teach' (Day 30 Q8 "promotion race") - TACNA, unapred zadata
   * sekvenca poteza (UCI niz, npr. dvopoljni skok pa niz jednopoljnih
   * guranja do promocije). Svaki potez se poredi sa
   * `raceSolution[drillMovesPlayedRef.current]` (movesMatch, zahteva TACNU
   * promociju - obicno dama) - SVAKO odstupanje (spor prvi potez umesto
   * dvopoljnog skoka, pogresna figura pri promociji, bilo koji drugi potez)
   * se ODBIJA: ne primenjuje se, penal (vidi scoreDeduction), korisnik mora
   * da odigra TACNO taj potez da bi napredovao. Korisnicin eksplicitan
   * zahtev - prvobitna verzija ("bilo koji legalan potez, penal na kraju za
   * spori put") je bila previse popustljiva.
   */
  raceSolution?: string[];
  /**
   * Samo uz `anyLegalMoveStreak`/`exactMoveUci`/`raceSolution` - frakcioni
   * penal po pogresnom/ilegalnom pokusaju (Day 30 formula: 1.0 start, -0.25
   * po pokusaju, floor 0.25). Default 0.25 ako nije zadato.
   */
  scoreDeduction?: number;
};

export type Lesson = {
  id: string;
  level: 1 | 2 | 3;
  day: number;
  title: string;
  intro: { title: string; text: string };
  /** Figura koju lekcija uci - pokrece uvodnu animaciju i generisane poruke. */
  piece: {
    name: string; // 'rook', 'bishop', ... - koristi se u tekstu ("mastered the {name}")
    glyph: string; // unicode figura za mini-animaciju uvoda
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
    /** Samo za movement:'static' - tekst na uvodnoj kartici (npr. "Chess History Time!"). */
    /** movement:'mascot' (Day 14) - prava Pawny slika umesto glifa, isti bannerText slot. */
    bannerText?: string;
    /** Samo za movement:'mascot' - manji podnaslov ispod bannerText (npr. "Rated 100-300"). */
    subBannerText?: string;
  };
  steps: LessonStep[];
  /**
   * Opcioni ocenjeni rezime na kraju lekcije (npr. "6/6 correct!") - racuna
   * se SAMO od koraka navedenih u `stepIds` (npr. samo Faza 1 kviz pitanja u
   * Piece Values, ne i Faza 2), ne svih koraka lekcije. `tiers` poredjati
   * OPADAJUCE po `min` - prvi ciji je `min <= brojTacnih` pobedjuje. Generican
   * mehanizam, koristi ga bilo koja lekcija sa kviz delom koji zasluzuje
   * sopstvenu ocenu na kraju.
   */
  scoreSummary?: {
    stepIds: string[];
    tiers: { min: number; title: string; text: string }[];
  };
  /**
   * Visestepeni uvodni popup (npr. Next -> Got it -> Start) umesto
   * standardnog jednog ekrana. `intro.title` ostaje fallback TITLE kad neki
   * ekran nema sopstveni `title` (vidi nize) - `intro.text` je isto fallback
   * TEXT (jednak prvom koraku) za bilo koji kod koji eventualno cita
   * `intro.text` direktno. Klik na dugme POSLEDNJEG koraka otvara tablu
   * (isto kao standardni "Let's start"). Generican, ne lekcija-specifican.
   */
  introSteps?: {
    text: string;
    buttonText: string;
    /**
     * Sopstveni naslov za OVAJ ekran (npr. Day 23 "Bridge" - 8 kartica, SVAKA
     * sa drugim naslovom: "Rule number 1", "Where chess began"...). Bez
     * ovoga pada nazad na `intro.title` (postojece ponasanje, nepromenjeno -
     * npr. Day 20/22, gde SVI ekrani deli isti naslov).
     */
    title?: string;
    /**
     * Isti bullet-lista mehanizam kao `preStepIntro.bullets` (npr. Day 23
     * kartica 3 "Quick refresher" - vrednosti figura, isti sadrzaj kao Day
     * 22). Bez ovoga, ekran prikazuje samo `text` (postojece ponasanje).
     */
    bullets?: string[];
    /** Staticna mini-tabla na ovom ekranu (Lessons 2 Day 8), sa opciono obojenim redom. */
    diagramFen?: string;
    diagramHighlightRank?: number;
  }[];
  /**
   * Default: trailing niz kind:'puzzle' koraka na KRAJU lekcije (npr. 5
   * "vezbaj" puzli posle Rook primera) grupise se u JEDAN segment na progress
   * traci koji se puni razlomljeno - ima smisla kad su to ponovljene vezbe
   * istog tipa. Postavi na true da OTKAZES to grupisanje: svaki korak
   * (ukljucujuci puzzle) dobija SVOJ segment, obojen zeleno/roze nezavisno od
   * ostalih. Koristi kad su puzzle koraci tematski razliciti, pojedinacno
   * imenovani primeri (npr. Day 10 "Find the checkmate" - Queen/Rook/Knight/
   * Bishop/Pawn/Bonus) - jedna greska ne sme da oboji SVE njih.
   */
  flatProgressSegments?: boolean;
  /**
   * Zamenjuje standardni "Next Lesson / Repeat / Done" End Screen (npr. Day
   * 13 "Opening Test" / "Play from this position" / "Done!"). action:
   * 'placeholder' je dugme sa tekstom/mestom vec dogovorenim ali ponasanje
   * JOS NIJE odredjeno - prikazuje se disabled sa tooltip-om, pravo ponasanje
   * dolazi kroz poseban task. Kad ovo polje nije zadato, ponasanje je
   * nepromenjeno (postojece 3 dugmeta za sve ostale lekcije).
   */
  endScreenButtons?: {
    label: string;
    /**
     * 'review' (Day 14) - otvara postojecu Game Review aktivnost sa PGN-om
     * ove partije, u novoj sobi. 'play' (Day 16) - vodi na Play (matchmaking)
     * stranicu glavne web-app (app.outpostchess.com/intsearch), isti princip
     * kao postojece "Home"/"Free Play" dugme u Puzzle aktivnosti. 'testOpening'
     * (Day 28 "My First Opening with White — London") - skace direktno na
     * Lesson.testStepId korak, resetujuci brojace (isti princip kao Repeat,
     * ali BEZ ponovnog vodjenog dela) - vidi onTestOpening u DailyLessonActivity.tsx.
     * 'nextLesson' (Day 30 "Graduation Checkpoint 1", "Start Test 2") - isti
     * prelazak kao podrazumevano "Next Lesson" dugme (sledeca lekcija po
     * `day` redosledu), samo sa svojim labelom ovde - onemogucen/sivo dok
     * sledeca lekcija ne postoji u bazi, isti princip kao podrazumevani tok.
     */
    action:
      | 'repeat'
      | 'done'
      | 'review'
      | 'play'
      | 'testOpening'
      | 'nextLesson'
      | 'placeholder';
    /** Samo za action:'placeholder' - objasnjava zasto je dugme neaktivno. */
    tooltip?: string;
  }[];
  /**
   * Samo uz endScreenButtons action:'testOpening' (Day 28) - ID koraka na
   * koji se skace (loadStep po indeksu nadjenom preko ovog ID-a), BEZ
   * ponovnog ucenja/vodjenja - "testiraj me opet" na istoj liniji.
   */
  testStepId?: string;
  /**
   * Zamenjuje standardni naslov "Lesson complete! 🎉" na zavrsnom popup-u
   * (npr. Day 14 "Your first game is complete!" - to JESTE partija, ne
   * lekcija). Kad nije zadato, ostaje podrazumevani naslov.
   */
  endScreenTitle?: string;
  /** Tekst zavrsnog ekrana umesto doneText-a poslednjeg koraka. */
  endScreenText?: string;
  /**
   * Zamenjuje podrazumevani Pawny avatar (`/pawny/pawny.webp`) u AI chat-u
   * (Conversation.tsx) kroz CELU lekciju - npr. Day 18 "Game 2" dobija novi,
   * "sigurniji" vizuel ("Pawny 2.0") umesto Day 14-ovog originala. Path pod
   * `public/`, isti format kao postojeci. Kad nije zadato, ostaje original.
   */
  pawnyAvatar?: string;
  /** Slika vec ima svoju pozadinu i plocu (Pawny 4.0-6.0) - uvodna kartica tada ne crta svoju. */
  pawnyAvatarFramed?: boolean;
  /**
   * Pawny rejting po partiji (Lessons 2 Pawny 4.0): T se bira nasumicno u [min, max] na pocetku
   * i na svaki Play again, `{rating}` u tekstovima lekcije se menja sa T. Svaki potez: T +- jitter,
   * u [clampMin, clampMax]. Stockfish UCI_Elo ne ide ispod 1320, pa se snaga pravi udelom
   * nasumicnih poteza: randomAtMin na clampMin, randomAtMax na clampMax, linearno izmedju.
   * Kalibracija NIJE izmerena, podesava se ovde bez izmene koda.
   */
  pawnyRating?: {
    min: number;
    max: number;
    jitter: number;
    clampMin: number;
    clampMax: number;
    randomAtMin: number;
    randomAtMax: number;
  };
  /**
   * Indeks od kog se SVI sledeci koraci u `steps` nasumicno premestaju
   * (redosled), JEDNOM po pokretanju lekcije (i na svaki Repeat) - npr. Day
   * 22 "Material": 4 fiksna warm-up primera, pa 5 glavnih primera u random
   * redosledu, svaki tacno jednom. Koraci PRE ovog indeksa ostaju u
   * autorovanom redosledu. Generican mehanizam, ne Day22-specifican.
   */
  shuffleStepsFrom?: number;
  /**
   * "Bridge" lekcija bez sahovske table uopste (npr. Day 23 - istorija,
   * geometrija table, faze partije... + kviz, nista od toga ne treba
   * konkretnu poziciju). Standardni split-layout (tabla levo, chat/kviz
   * desno) postaje PUN-EKRAN kviz/chat kartica preko dekorativne, NE-
   * interaktivne pozadine (vidi DailyLessonActivity.tsx) - LessonStep.fen
   * i dalje mora postojati (tip to zahteva), ali se nikad stvarno ne
   * prikazuje kao tabla. Generican mehanizam, ne Day23-specifican.
   */
  boardless?: boolean;
  /**
   * Day 30 "Graduation Checkpoint 1" (i buduci "Test 2") - oznacava lekciju
   * kao OCENJEN test: svaki kind:'quiz' korak (tacan=1/netacno=0) i svaki
   * `anyLegalMoveStreak`/`exactMoveUci`/`raceSolution` korak (frakcioni
   * poeni) sabira se u lessonState.score. Zavrsni ekran, kad je ovo polje
   * zadato, IGNORISE standardni endScreenTitle/step.doneText/endScreenButtons
   * i umesto toga bira pass/fail varijantu po pragu - vidi
   * DailyLessonDialogContainer.tsx. Generican mehanizam, ne Day30-specifican.
   */
  graduationTest?: {
    /** Maksimalan mogu broj poena (zbir svih bodovanih koraka, npr. 16). */
    maxScore: number;
    /** Razlomak potreban za prolaz (0.6 = 60%). */
    passThreshold: number;
    passTitle: string;
    passBody: string;
    /** Akcioni red dugmadi SAMO za prolaz - npr. Done + "Start Test 2". */
    passButtons: { label: string; action: 'done' | 'nextLesson' | 'play' }[];
    failTitle: string;
    failBody: string;
    /** Akcioni red dugmadi SAMO za pad - npr. samo Repeat, bez Done. */
    failButtons: { label: string; action: 'repeat' }[];
    /**
     * Day 31 "Graduation Test 2" - ako je zadato, zamenjuje passTitle/
     * passBody/passButtons kad korisnik prodje OVAJ test I se na njega
     * stiglo preko "Next Lesson"/"Start Test X" dugmeta SA prethodno
     * polozenog `requiresPriorPassLessonId` (vidi onNextLesson - dodaje
     * `?fromLessonId=` u URL). NAPOMENA: ovo je lagana, URL-bazirana
     * provera (nema backend/cross-session cuvanje napretka u ovom repou,
     * vidi ranije ustanovljeno ogranicenje) - pouzdana za normalan tok
     * (klik kroz testove redom), ne i protiv namernog direktnog otvaranja
     * URL-a. Bez ove potvrde, prolaz i dalje prikazuje standardni passTitle/
     * passBody/passButtons (npr. "Test 2 passed"), ne finalni ekran.
     */
    finalScreen?: {
      requiresPriorPassLessonId: string;
      title: string;
      body: string;
      buttons: {
        label: string;
        action: 'done' | 'nextLesson' | 'play' | 'repeat';
      }[];
    };
  };
};

const DAY_1_ROOK: Lesson = {
  id: 'l1-d1-rook',
  level: 1,
  day: 1,
  title: 'Rook: How the Rook Moves',
  piece: { name: 'rook', glyph: '♜', movement: 'straight' },
  intro: {
    title: 'Rook: How the Rook Moves',
    text: 'The rook moves in **straight lines**: left, right, up and down. As far as it likes. It can **never jump** over another piece.',
  },
  steps: [
    {
      id: 'teach-horizontal',
      kind: 'teach',
      fen: '7k/8/8/8/Rp1p2p1/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['a4b4', 'b4d4', 'd4g4'],
      prompt: 'Capture all three pawns',
      introText:
        'Your rook is on a4. Slide it **sideways** and capture every pawn on the row.',
      successText: 'Good. **Keep going.**',
      doneText: 'All pawns gone. The rook owns the **whole row**.',
      hintText: 'The rook moves **straight only**: left, right, up or down.',
    },
    {
      id: 'teach-vertical',
      kind: 'teach',
      fen: '7k/3p4/3p4/8/8/8/8/3R3K w - - 0 1',
      orientation: 'w',
      solution: ['d1d6', 'd6d7'],
      prompt: 'Now capture going up the board',
      introText:
        'Same rook, new direction. Climb the **d-file** and take both pawns.',
      successText: "That's it. **One more.**",
      doneText: 'The rook goes **up and down** too.',
      hintText: "The rook can't jump. Take the **closest pawn** first.",
    },
    {
      id: 'teach-mixed',
      kind: 'teach',
      fen: '7k/8/1p2p3/8/8/4p1p1/8/1R5K w - - 0 1',
      orientation: 'w',
      solution: ['b1b6', 'b6e6', 'e6e3', 'e3g3'],
      prompt: 'Mix it up: sideways, up and down',
      introText:
        'Four pawns this time. Use **both directions** to collect them all.',
      successText: 'Good. **Next pawn.**',
      doneText: 'Four for four. You move the rook in **every direction** now.',
      hintText:
        "Straight lines only. Find a pawn on the rook's **row or column**.",
    },
    {
      id: 'teach-mate',
      kind: 'teach',
      fen: '6k1/5ppp/8/8/8/8/5PPP/2R3K1 w - - 0 1',
      orientation: 'w',
      solution: ['c1c8'],
      prompt: "One move. It's checkmate. Find it.",
      introText:
        'The black king is trapped behind **its own pawns**. One rook move ends the game.',
      doneText:
        "Checkmate. 🎉 You know how the rook moves. That's a **real start**.",
      hintText:
        "The king can't breathe behind its own pawns. Take the **back rank**.",
      celebrate: true,
    },
    {
      id: 'puzzle-1',
      kind: 'puzzle',
      fen: 'r1b3k1/5ppb/pn5p/1p6/5N2/P5P1/1PP3BP/2KR4 w - - 0 1',
      orientation: 'w',
      solution: ['d1d8'],
      prompt: 'White to play: mate in 1',
      introText: 'Same idea as before. The **back rank** is wide open.',
      doneText: 'Checkmate. **One down.**',
      hintText: 'Look at the open **d-file** and the black back rank.',
    },
    {
      id: 'puzzle-2',
      kind: 'puzzle',
      fen: 'r5k1/pp3p1p/2r3pB/5n2/8/P2R3P/1P3PP1/3R2K1 w - - 0 1',
      orientation: 'w',
      solution: ['d3d8', 'a8d8', 'd1d8'],
      prompt: 'White to play: mate in 2',
      introText:
        'You have two rooks on the d-file. **Give the first one away** to open the door.',
      successText: 'Now **finish it**.',
      doneText: 'A **rook sacrifice** into mate. Clean.',
      hintText: 'Sacrifice on **d8** first. The second rook delivers mate.',
    },
    {
      id: 'puzzle-3',
      kind: 'puzzle',
      fen: '4r1k1/pb3pp1/1pn1r2p/8/8/2B3P1/PP2NP1P/R3R1K1 b - - 0 1',
      orientation: 'b',
      solution: ['e6e2', 'e1e2', 'e8e2'],
      prompt: 'Black to play: win a piece',
      introText:
        'You are Black now. Both your rooks look down the e-file. **Count the attackers.**',
      successText: 'Good. Now **take it back**.',
      doneText: 'A **whole knight** up.',
      hintText: 'Stack your rooks on the e-file and take on **e2** twice.',
    },
    {
      id: 'puzzle-4',
      kind: 'puzzle',
      fen: 'r7/5pk1/8/1bR5/1P4p1/1BP3Pp/5P1P/6K1 b - - 0 1',
      orientation: 'b',
      solution: ['a8a1', 'b3d1', 'a1d1'],
      prompt: 'Black to play: mate in 2',
      introText:
        'The white king is stuck on the **back rank** and your pawn on h3 covers g2.',
      successText: 'He blocked. Now **take it**.',
      doneText: 'Checkmate. The **back rank** strikes again.',
      hintText: 'Bring your rook to the **first rank** with check.',
    },
    {
      id: 'puzzle-5',
      kind: 'puzzle',
      fen: '8/6k1/R7/8/5K2/8/8/1R6 w - - 0 1',
      orientation: 'w',
      solution: ['b1b7', ANY_LEGAL_REPLY, 'a6a8'],
      prompt: 'White to play: mate in 2',
      introText:
        'Two rooks, no king needed. Push the black king up **one rank at a time**.',
      successText: 'Now the **other rook** finishes it.',
      doneText:
        'That is a **ladder mate**. Five puzzles, five solved. The rook is yours.',
      hintText:
        'Check with one rook to push the king up, then **mate with the other**.',
      celebrate: true,
    },
  ],
};

const DAY_2_BISHOP: Lesson = {
  id: 'l1-d2-bishop',
  level: 1,
  day: 2,
  title: 'Bishop: How the Bishop Moves',
  piece: { name: 'bishop', glyph: '♝', movement: 'diagonal' },
  intro: {
    title: 'Bishop: How the Bishop Moves',
    text: 'The bishop moves **diagonally**, in all four corner directions. As far as it likes. It can **never jump** over another piece.',
  },
  steps: [
    {
      id: 'teach-diagonal-up-right',
      kind: 'teach',
      fen: '6k1/8/5p2/8/3p4/8/1p6/B6K w - - 0 1',
      orientation: 'w',
      solution: ['a1b2', 'b2d4', 'd4f6'],
      prompt: 'Capture all three pawns',
      introText:
        'Your bishop is on a1. Slide it along the **diagonal** and capture every pawn in its path.',
      successText: 'Good. **Keep going.**',
      doneText: 'All pawns gone. One **diagonal**, three captures.',
      hintText: 'The bishop moves **diagonally only**, like a slanted line.',
    },
    {
      id: 'teach-diagonal-up-left',
      kind: 'teach',
      fen: 'k7/8/2p5/8/8/5p2/8/K6B w - - 0 1',
      orientation: 'w',
      solution: ['h1f3', 'f3c6'],
      prompt: 'Now capture along the other diagonal',
      introText:
        'Same bishop, opposite corner. Climb the diagonal from **h1** and take both pawns.',
      successText: "That's it. **One more.**",
      doneText: 'The bishop goes diagonally in **every direction**.',
      hintText: "The bishop can't jump. Take the **closest pawn** first.",
    },
    {
      id: 'teach-mixed',
      kind: 'teach',
      fen: 'k7/8/4p3/8/8/1p5p/8/3B3K w - - 0 1',
      orientation: 'w',
      solution: ['d1b3', 'b3e6', 'e6h3'],
      prompt: 'Mix it up: zigzag across the diagonals',
      introText:
        'Three pawns, different directions. **Zigzag** across the board to collect them all.',
      successText: 'Good. **Next pawn.**',
      doneText:
        'Three for three. You move the bishop in **every direction** now.',
      hintText: 'Diagonals only. Find a pawn on one of the **four diagonals**.',
    },
    {
      id: 'teach-mate',
      kind: 'teach',
      fen: 'k7/ppK5/8/3B4/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['d5b7'],
      prompt: "One move. It's checkmate. Find it.",
      introText:
        'The black king is trapped in the corner by **its own pawns**. Your king cuts off the escape. One bishop move ends it.',
      doneText:
        "Checkmate. 🎉 You know how the bishop moves. That's a **real start**.",
      hintText: "The king can't breathe in the corner. **Take the pawn.**",
      celebrate: true,
    },
    {
      id: 'puzzle-1',
      kind: 'puzzle',
      fen: '6bk/p6p/1p6/8/3nB3/8/P6P/6BK w - - 0 1',
      orientation: 'w',
      solution: ['g1d4'],
      prompt: 'White to play: mate in 1',
      introText: 'Same idea as before. Find the **diagonal** into the knight.',
      doneText: 'Checkmate. **One down.**',
      hintText: 'Look at both bishops. One of them reaches **d4** with mate.',
    },
    {
      id: 'puzzle-2',
      kind: 'puzzle',
      fen: '6k1/6B1/6K1/8/8/7B/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['h3e6'],
      prompt: 'White to play: mate in 1',
      introText: 'Two bishops, one king with **nowhere to go**.',
      doneText: 'Checkmate. **Two down.**',
      hintText: 'The king on g8 is boxed in. Find the **check that ends it**.',
    },
    {
      id: 'puzzle-3',
      kind: 'puzzle',
      fen: 'r1bk2r1/2pp4/8/8/1PK5/P6P/1B4P1/4R3 w - - 0 1',
      orientation: 'w',
      solution: ['b2f6'],
      prompt: 'White to play: mate in 1',
      introText:
        'The bishop has a **long, clear diagonal** into the black camp.',
      doneText:
        'Checkmate. Three puzzles, three solved. The **bishop** is yours.',
      hintText: 'Follow the long diagonal all the way to **f6**.',
      celebrate: true,
    },
  ],
};

const DAY_3_KING: Lesson = {
  id: 'l1-d3-king',
  level: 1,
  day: 3,
  title: 'King: How the King Moves',
  piece: { name: 'king', glyph: '♚', movement: 'king' },
  intro: {
    title: 'King: How the King Moves',
    text: 'The King moves **one square** at a time, in any direction. Up, down, left, right or diagonal. It can **never move into danger**.',
  },
  steps: [
    {
      id: 'teach-horizontal',
      kind: 'teach',
      fen: '7k/8/8/8/3Kppp1/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['d4e4', 'e4f4', 'f4g4'],
      prompt: 'Collect the pawns',
      introText:
        'Your King is on d4. Step **one square at a time** to capture the pawns to the right.',
      successText: 'Good. **Keep going.**',
      doneText: 'All pawns gone, **one step at a time**.',
      hintText:
        'The King moves only **one square** at a time. Follow the arrows.',
    },
    {
      id: 'teach-vertical-horizontal',
      kind: 'teach',
      fen: '7k/8/8/2pp4/3K4/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['d4d5', 'd5c5'],
      unorderedTargets: true,
      prompt: 'Up and sideways',
      introText:
        'Same King, new directions. Step **forward**, then **sideways**. Either pawn first.',
      doneText:
        'The King walks forward and sideways. **One square, any direction.**',
      hintText:
        'The King moves only **one square** at a time. Follow the arrows.',
    },
    {
      id: 'teach-mixed',
      kind: 'teach',
      fen: '7k/8/8/3pp3/4Kp2/8/8/8 w - - 0 1',
      orientation: 'w',
      // NIJE unorderedTargets: iako su d5 i e5 oba legalna prva poteza sa e4,
      // e5-first vodi u cor-de-sac (posle e5 kralj ne moze legalno do f4 ni
      // do d5->f4 - nije susedno) - samo d5,e5,f4 redosled zaista zavrsava
      // primer. Provereno preko chess.js simulacije svih varijanti.
      solution: ['e4d5', 'd5e5', 'e5f4'],
      prompt: 'Mix: all 8 directions',
      introText:
        'Now mix it up: diagonal, sideways and straight. Find the **fastest route** to all three pawns.',
      successText: 'Good. **Next pawn.**',
      doneText:
        'Three directions, three captures. The King goes **anywhere**, one step at a time.',
      hintText:
        'The King moves only **one square** at a time. Follow the arrows.',
    },
    {
      id: 'king-hunts-pawn',
      kind: 'puzzle',
      fen: '7k/8/8/3K4/7p/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['d5e4', 'h4h3', 'e4f3'],
      prompt: 'Stop the pawn',
      introText:
        'That pawn is about to promote. **Stop it with your King.** Two moves.',
      doneText: 'Your King **catches the pawn**.',
      hintText: 'Chase the pawn. Move your King **one square closer**.',
    },
    {
      id: 'castle-kingside',
      kind: 'teach',
      fen: '4k3/8/8/8/8/8/8/4K2R w K - 0 1',
      orientation: 'w',
      solution: ['e1g1'],
      prompt: 'Castle king-side',
      introText:
        'Small castling is a special king move 👑. The king moves **2 squares toward the rook**, then the rook jumps next to the king.',
      doneText:
        'That is **king-side castling**, or small castling. It keeps the king safe and brings the rook into the game faster.',
      hintText:
        "Move your King **two squares** toward the rook. That's castling.",
      preStepIntro: {
        title: "Let's learn castling",
        text: "Time to learn **castling**, the king's favorite move.",
        bullets: [
          'Castling helps keep your **king safe**',
          'It **connects your rooks** and improves your position',
          'It is one of the **most important moves** in chess opening strategy',
        ],
        buttonText: "Let's go!",
        diagram: 'castle-kingside',
      },
    },
    {
      id: 'castle-queenside',
      kind: 'teach',
      fen: '4k3/8/8/8/8/8/8/R3K3 w Q - 0 1',
      orientation: 'w',
      solution: ['e1c1'],
      prompt: 'Castle queen-side',
      introText:
        'Big castling works the same way, on the other side of the board. Grab the king and move it **two squares toward the rook**. King e1 to **c1**, rook a1 to **d1**. This is queen-side castling, or big castling.',
      doneText:
        'Both castles done. **King lesson complete.** See you tomorrow.',
      hintText: 'Move your King **two squares** toward the a1 rook.',
      celebrate: true,
      preStepIntro: {
        title: "Let's learn queen-side castling",
        text: 'This is **big castling**. Same idea, other side of the board.',
        bullets: [
          'The king still moves just **two squares**',
          'This time it moves toward the **a1 rook**',
          'The rook lands right next to the king, on **d1**',
        ],
        buttonText: "Let's go!",
        diagram: 'castle-queenside',
      },
    },
  ],
};

const DAY_4_KNIGHT: Lesson = {
  id: 'l1-d4-knight',
  level: 1,
  day: 4,
  title: 'Knight: How the Knight Moves',
  piece: { name: 'knight', glyph: '♞', movement: 'knight' },
  intro: {
    title: 'Knight: How the Knight Moves',
    text: "The Knight moves in an **L-shape**: 2 squares in one direction, then 1 to the side. It's the **only piece that can jump** over other pieces.",
  },
  steps: [
    {
      id: 'teach-l-shape-all-directions',
      kind: 'teach',
      fen: '7k/4p3/2p5/5p2/1p1N4/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['d4f5', 'f5e7', 'e7c6', 'c6b4'],
      prompt: 'Collect the pawns',
      introText:
        'Your Knight is on d4. Jump to each pawn. The L-shape can face **any of 8 directions**.',
      successText: "That's it. **Two squares, then one** to the side.",
      doneText:
        "Same **L-shape** every time. Two squares, then one. That's the Knight's signature.",
      hintText:
        'The Knight moves in an **L-shape**: two squares, then one to the side. Follow the arrows.',
    },
    {
      id: 'teach-jump-over',
      kind: 'teach',
      fen: '6k1/8/8/p2p4/1p2p3/3p4/1pp5/N5K1 w - - 0 1',
      orientation: 'w',
      solution: ['a1b3'],
      prompt: 'Find the safe square',
      introText:
        'Every square around the Knight looks blocked. Find the **safe square** anyway.',
      doneText:
        'The Knight ignores traffic. It **jumps over everything**. No other piece can.',
      hintText:
        'The Knight moves in an **L-shape**: two squares, then one to the side. Follow the arrows.',
      jumpGlow: true,
    },
    {
      id: 'teach-zigzag',
      kind: 'teach',
      fen: 'k5N1/4p3/8/5p2/3p4/1p6/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['g8e7', 'e7f5', 'f5d4', 'd4b3'],
      prompt: 'Zigzag across the board',
      introText:
        'Now the Knight zigzags. Every capture faces a **different direction**.',
      successText: "That's it. A **new direction** every jump.",
      doneText:
        'The Knight zigzags like no other piece. The L-shape works in **8 directions**.',
      hintText:
        'The Knight moves in an **L-shape**: two squares, then one to the side. Follow the arrows.',
    },
    {
      id: 'teach-knights-march',
      kind: 'teach',
      fen: '7k/3p4/5p2/2p5/8/1p6/8/N6K w - - 0 1',
      orientation: 'w',
      solution: ['a1b3', 'b3c5', 'c5d7', 'd7f6'],
      prompt: "The Knight's march",
      introText:
        'The Knight starts in the corner. Guide it **across the board**. Four captures.',
      successText: 'The Knight **keeps marching**.',
      doneText: "Corner to corner. 🐴 You've got the **L-shape** down.",
      hintText:
        'Follow the L: two squares then one, or **one then two**. Follow the arrows.',
    },
    {
      id: 'puzzle-warmup',
      kind: 'puzzle',
      fen: '7k/8/8/6p1/8/5N2/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['f3g5'],
      prompt: 'Single capture: warm up',
      introText: 'Test time. **Take the pawn** with the Knight.',
      doneText: 'Got it. **Warm-up done.**',
      hintText:
        "That's not an **L-shape**. Follow the arrows to where the Knight can land.",
    },
    {
      // Dva uzastopna korisnikova poteza bez protivnika - strukturno je
      // 'teach' (forsira potez nazad na belog), iako je u tiketu opisan kao
      // "puzzle" - kind ovde opisuje MEHANIKU poteza, ne UI kategoriju.
      id: 'puzzle-two-captures',
      kind: 'teach',
      fen: '7k/8/8/8/4p3/2p5/8/KN6 w - - 0 1',
      orientation: 'w',
      solution: ['b1c3', 'c3e4'],
      prompt: 'Two captures in sequence',
      introText: 'Two pawns this time. **Plan your route.**',
      successText: 'Good. **One more.**',
      doneText: 'Both pawns. **Route planned right.**',
      hintText:
        "That's not an **L-shape**. Follow the arrows to where the Knight can land.",
    },
    {
      id: 'puzzle-fork',
      kind: 'puzzle',
      fen: '8/8/3K1R2/8/8/2n5/8/7k b - - 0 1',
      orientation: 'b',
      solution: ['c3e4'],
      prompt: 'Find the fork',
      introText: 'One move. Find the **Knight fork**: one jump, two targets.',
      doneText:
        "King and Rook, both attacked. That's a **fork**. 🐴 Knight lesson done, see you tomorrow.",
      hintText:
        "That's not an **L-shape**. Follow the arrows to where the Knight can land.",
      celebrate: true,
    },
  ],
};

const DAY_5_QUEEN: Lesson = {
  id: 'l1-d5-queen',
  level: 1,
  day: 5,
  title: 'Queen: How the Queen Moves',
  piece: { name: 'queen', glyph: '♛', movement: 'queen' },
  intro: {
    title: 'Queen: How the Queen Moves',
    text: "The Queen is the **most powerful piece** on the board. She moves straight and diagonally, in all 8 directions, as far as she likes. She's the **Rook and Bishop combined**.",
  },
  steps: [
    {
      id: 'teach-straight',
      kind: 'teach',
      wrongCaptureText:
        'Wrong pawn. Capture them in an order that lets you take **every pawn in a row**, all the way to the end. Think again ;)',
      fen: 'k7/3p2p1/8/8/3Q4/1p4p1/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['d4d7', 'd7g7', 'g7g3', 'g3b3'],
      prompt: 'Collect the pawns',
      introText: 'Every move must **capture a pawn**. Plan the route ahead.',
      successText: 'Straight line. **Good.**',
      doneText:
        "The Queen moves straight: left, right, up, down. **Like a Rook**, and that's only half of her.",
      hintText:
        'The Queen moves **straight or diagonally**. Every move must capture a pawn, so plan ahead.',
    },
    {
      id: 'teach-diagonal',
      kind: 'teach',
      wrongCaptureText:
        'Wrong pawn. Capture them in an order that lets you take **every pawn in a row**, all the way to the end. Think again ;)',
      fen: 'k7/5p2/6p1/3p4/4Q3/1p6/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['e4d5', 'd5b3', 'b3f7', 'f7g6'],
      prompt: 'Collect the pawns diagonally',
      introText: 'Every move must **capture a pawn**. Plan the route ahead.',
      successText: 'Good. **Diagonal** power.',
      doneText:
        'The Queen also moves diagonally, **like a Bishop**. Queen = Rook + Bishop.',
      hintText:
        'The Queen moves **straight or diagonally**. Check the highlighted squares.',
    },
    {
      id: 'teach-mix',
      kind: 'teach',
      wrongCaptureText:
        'Wrong pawn. Capture them in an order that lets you take **every pawn in a row**, all the way to the end. Think again ;)',
      fen: 'k7/3p4/8/5p2/3Q4/1p3p2/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['d4d7', 'd7f5', 'f5f3', 'f3b3'],
      prompt: 'Mix: every direction',
      introText: 'Every move must **capture a pawn**. Plan the route ahead.',
      successText: "Any direction. **That's the Queen.**",
      doneText:
        'Straight and diagonal, **every direction**. No piece does more.',
      hintText:
        'The Queen moves **straight or diagonally**. Check the highlighted squares.',
    },
    {
      id: 'teach-queens-reign',
      kind: 'teach',
      wrongCaptureText:
        'Wrong pawn. Capture them in an order that lets you take **every pawn in a row**, all the way to the end. Think again ;)',
      fen: 'k7/8/2p2p2/7p/8/5p2/2Q5/7K w - - 0 1',
      orientation: 'w',
      solution: ['c2c6', 'c6f6', 'f6f3', 'f3h5'],
      prompt: "The Queen's reign",
      introText:
        'The Queen starts in the corner. Guide her **across the board**. Every move must capture a pawn.',
      successText: 'Onward, **Your Majesty**.',
      doneText:
        "Up, down, sideways, diagonal. 👑 You've got the **most powerful piece** down.",
      hintText:
        'The Queen moves **straight or diagonally**. Follow the arrows.',
    },
    {
      id: 'puzzle-warmup',
      kind: 'puzzle',
      fen: '6k1/5ppp/7q/8/6Q1/6P1/5P1P/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['g4c8'],
      prompt: 'Checkmate in one',
      introText:
        'Test time, real game. White to play and **checkmate in one**.',
      doneText: 'Checkmate. **Well spotted.**',
      hintText:
        "That's not a **Queen move**. Follow the arrows to where she can go.",
    },
    {
      id: 'puzzle-find-the-mate',
      kind: 'puzzle',
      // beli pesak na e3 zatvara Qf4-c1, pa su i Qe1# i Qa1# mat (chess.js)
      fen: '6k1/5pp1/8/q7/5Q1p/4P3/5PPP/6K1 b - - 0 1',
      orientation: 'b',
      solution: ['a5e1'],
      altMoves: { 0: ['a5a1'] },
      prompt: 'Find the checkmate',
      introText: 'Black to move. Find **mate in one** with the Queen.',
      doneText: 'Checkmate. The **Queen delivers**.',
      hintText:
        "That's not a **Queen move**. Follow the arrows to where she can go.",
    },
    {
      id: 'puzzle-queens-triumph',
      kind: 'puzzle',
      fen: '5rk1/1bp2pp1/1p2q2p/p2p4/P2Q4/1P6/2P2PPP/B4RK1 w - - 0 1',
      orientation: 'w',
      solution: ['d4g7'],
      prompt: "The Queen's triumph",
      introText:
        'This is a real game. White to play, **checkmate in one**. Yes, really.',
      doneText: 'Checkmate. 👑 **Queen lesson done.** See you tomorrow.',
      hintText:
        "That's not a **Queen move**. Follow the arrows to where she can go.",
      celebrate: true,
    },
  ],
};

const DAY_6_PAWN: Lesson = {
  id: 'l1-d6-pawn',
  level: 1,
  day: 6,
  title: 'Pawn: Small but Mighty',
  piece: { name: 'pawn', glyph: '♟', movement: 'pawn' },
  intro: {
    title: 'Pawn: Small but Mighty',
    text: 'The Pawn is the **only piece that can never move backward**. It also has a few **secret rules**. Here they are.',
  },
  steps: [
    {
      id: 'move-one-square',
      kind: 'teach',
      fen: '7k/8/8/8/3P4/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['d4d5'],
      prompt: 'Move the pawn forward',
      introText: "This pawn isn't on its starting square. Move it **forward**.",
      doneText: "Right. **One square forward** is the pawn's everyday move.",
      hintText:
        'Only **one square**. This pawn left its starting square, so the two-square bonus is gone.',
      preStepIntro: {
        title: 'Pawn Movement',
        text: "The Pawn moves **straight ahead**. There's a twist, depending on where it stands.",
        bullets: [
          'Normally, it moves just **one square** forward',
          'From its **starting square**, it gets a bonus: **one or two squares**, just this once',
          "After that first move, it's **always one square** forever",
        ],
        buttonText: "Got it, let's go!",
      },
    },
    {
      id: 'move-two-squares',
      kind: 'teach',
      fen: '7k/8/8/8/8/8/3P4/7K w - - 0 1',
      orientation: 'w',
      solution: ['d2d4'],
      prompt: 'Use the bonus: jump two',
      introText: "This pawn hasn't moved yet. Jump it forward **two squares**.",
      doneText: 'Two squares at once. That bonus works **only once**.',
      hintText:
        'Jump **two squares**. This pawn is still on its starting square.',
    },
    {
      id: 'find-free-pawn',
      kind: 'teach',
      fen: '7k/8/8/8/p1p3p1/P1P3P1/4P3/7K w - - 0 1',
      orientation: 'w',
      solution: ['e2e3'],
      altMoves: { 0: ['e2e4'] },
      prompt: 'Find the pawn that can move',
      introText:
        "Three pawns are stuck and can't move. Find the **free pawn** and move it.",
      doneText: 'One square or two, both work. You found the **free pawn**.',
      hintText:
        'This pawn is **blocked**: an enemy piece stands right in front of it. Try another pawn.',
    },
    {
      id: 'diagonal-capture',
      kind: 'teach',
      fen: '7k/8/2p5/3p4/2P5/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['c4d5', 'd5c6'],
      prompt: 'Capture both pawns',
      introText: 'Capture **diagonally** right, then diagonally left.',
      successText: 'Good. Now capture diagonally to the **other side**.',
      successTextAlways: true,
      doneText:
        "Left and right, diagonally. That's the pawn's **only way to attack**.",
      hintText:
        "The Pawn can't capture straight ahead. It captures **diagonally**. Check the highlighted squares.",
      preStepIntro: {
        title: 'How the Pawn Captures',
        text: 'The Pawn moves straight, but **captures diagonally**.',
        bullets: [
          'It can capture **one square diagonally forward**, left or right',
          'It can **never** capture straight ahead',
          'No target, no diagonal move. It steps diagonally **only onto an enemy piece**',
        ],
        buttonText: 'Show me!',
      },
    },
    {
      id: 'en-passant',
      kind: 'puzzle',
      fen: '7k/7p/p1p1p1p1/P1P1P1P1/8/8/5K2/8 b - - 0 1',
      orientation: 'w',
      solution: ['h7h5', 'g5h6'],
      prompt: 'Find the en passant capture',
      introText:
        'A black pawn just jumped from h7 to h5. **Now or never**: only one of your pawns can capture it en passant. Which one?',
      doneText:
        "g5×h6. The pawn on h5 is gone and yours lands on h6. That's **en passant**, the strangest move in chess.",
      hintText:
        'This pawn is blocked. En passant only works for the pawn **right beside** the black pawn that just jumped.',
      preStepIntro: {
        title: 'En Passant: the Secret Capture',
        text: "The pawn's strangest rule: a **capture nobody expects**.",
        bullets: [
          'If an enemy pawn jumps **two squares** and lands right beside yours, you can capture it **as if it only moved one**',
          'You can only do this **immediately**, on your very next move',
          'Wait even one move and the chance is **gone forever**',
        ],
        buttonText: 'Got it!',
      },
    },
    {
      id: 'promotion',
      kind: 'teach',
      fen: '7k/4P3/8/8/8/8/8/5K2 w - - 0 1',
      orientation: 'w',
      solution: ['e7e8q'],
      prompt: 'Promote to a Queen',
      introText:
        'The pawn is one step from transforming. Move it to the **last rank** and choose a Queen.',
      doneText:
        'Pawn to Queen. ♟️→♛ From the **weakest piece to the strongest** in one move.',
      nonQueenPromotionText:
        "Good, that's a legal move. Still, the **Queen** is always the strongest choice. Promote to a Queen.",
      requireExactPromotion: true,
      hintText: 'The Pawn only moves forward. Get it to the **last rank**.',
      preStepIntro: {
        title: "Promotion: The Pawn's Transformation",
        text: 'When a pawn reaches the last rank, it **transforms** into a new piece.',
        bullets: [
          'You can choose: **Queen**, Rook, Bishop, or Knight',
          "⭐ Almost always choose the **Queen**. She's the most powerful",
          'This is how the weakest piece becomes the strongest, in a single move',
        ],
        buttonText: "Let's try it!",
      },
    },
    {
      id: 'puzzle-movement',
      kind: 'puzzle',
      fen: '7k/8/8/8/4P3/8/8/5K2 w - - 0 1',
      orientation: 'w',
      solution: ['e4e5'],
      prompt: 'How far can it go?',
      introText:
        "Test time. Each puzzle checks one rule. This pawn isn't on e2. **How far** can it go?",
      doneText: 'Right. **One square.**',
      hintText:
        'This pawn is not on its starting square. The bonus only works from **e2 or e7**. From here, one square.',
    },
    {
      id: 'puzzle-capture',
      kind: 'puzzle',
      fen: '7k/8/8/8/3pp3/4P3/8/5K2 w - - 0 1',
      orientation: 'w',
      solution: ['e3d4'],
      prompt: 'Find the capture',
      introText:
        'This pawn is blocked straight ahead. It can still **capture diagonally**.',
      doneText: 'Diagonal capture. The **only way** a pawn attacks.',
      hintText:
        "The Pawn can't capture straight ahead. Capturing is **always diagonal**.",
    },
    {
      id: 'puzzle-en-passant',
      kind: 'puzzle',
      fen: '7k/4p3/3p4/3P4/8/8/5K2/8 b - - 0 1',
      orientation: 'w',
      solution: ['e7e5', 'd5e6'],
      prompt: 'En passant: now or never',
      introText:
        'The black pawn just jumped from e7 to e5. Your pawn on d5 is blocked. **En passant** is the only option.',
      doneText:
        'd5×e6. The black pawn disappears and yours lands behind it. **En passant**, caught in the act.',
      hintText:
        'd6 is blocked. Look at the black pawn on **e5**. It just jumped two squares.',
    },
    {
      id: 'puzzle-promotion',
      kind: 'puzzle',
      fen: '7k/3P4/8/8/8/8/8/5K2 w - - 0 1',
      orientation: 'w',
      solution: ['d7d8q'],
      prompt: 'One step from transformation',
      introText: 'The pawn is on d7, **one step** from becoming a Queen.',
      doneText: 'Promoted. ♟️ **Pawn lesson done.** See you tomorrow.',
      nonQueenPromotionText:
        "Good, that's a legal move. Still, the **Queen** is always the strongest choice. Promote to a Queen.",
      requireExactPromotion: true,
      hintText:
        'The Pawn only moves forward. Get it to the **last rank** and choose your piece.',
      celebrate: true,
    },
  ],
};

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';

// Prazna tabla sa jednom damom na a1 - "univerzalni markr" za red/kolonu/
// dijagonalu zadatak (dama moze da klizi u sva tri pravca, geometrijski
// tacno, iako legalnost ovde uopste nije relevantna - ChessFENBoard ne
// proverava sahovska pravila, poredimo samo string potez sa `solution`).
const LINE_TASK_FEN = '8/8/3k4/8/8/4K3/8/Q7 w - - 0 1';

const DAY_8_PIECE_VALUES: Lesson = {
  id: 'l1-d8-piece-values',
  level: 1,
  day: 8,
  title: 'Piece Values',
  piece: {
    name: 'piece values',
    glyph: '🧮',
    movement: 'numbers',
  },
  intro: {
    title: 'Piece Values',
    text: "Chess has a little math in it. Simple math. Every piece has a **point value**, like a score, and you add them up. That tells you if a **trade is a good deal**. You guess each value, I tell you if you're right. 🎯",
  },
  scoreSummary: {
    // Rezime se racuna na osnovu Phase 2 (9 "mixed position" potpitanja,
    // brojanje materijala, koja dolaze posle sredisnjeg popup-a) - to su
    // "pravi" primeri, ne Phase 1 recall kviz o pojedinacnim figurama.
    stepIds: [
      'mixed1-white',
      'mixed1-black',
      'mixed1-verdict',
      'mixed2-black',
      'mixed2-white',
      'mixed2-verdict',
      'mixed3-white',
      'mixed3-black',
      'mixed3-verdict',
    ],
    tiers: [
      {
        min: 9,
        title: 'Chess mathematician',
        text: 'Nothing gets **past you**.',
      },
      {
        min: 7,
        title: 'Almost there',
        text: "A bit more practice and it's **perfect**.",
      },
      {
        min: 4,
        title: 'Good start',
        text: 'Check the **table** one more time and try again.',
      },
      {
        min: 0,
        title: 'Not yet',
        text: 'Piece values are easy to learn. Give it **another shot**.',
      },
    ],
  },
  steps: [
    {
      id: 'value-pawn',
      kind: 'quiz',
      fen: '7k/8/8/8/8/8/4P3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'How much is a Pawn worth?',
      introText:
        'Start with the humblest piece: the **pawn**. ♟️ How much is one pawn worth?',
      quizOptions: ['1 point', '2 points', '3 points', '5 points'],
      quizCorrectIndex: 0,
      quizExplanation:
        'Correct. A pawn is worth **1 point**. Small, and you have 8 of them. Reach the other end and it **becomes a queen**. 👑',
      quizExplanationWrong:
        "The pawn is the weakest piece: **1 point**. Don't underestimate it. You have 8, and they can become queens. 👑",
      doneText: 'A pawn is worth **1 point**. Small, and there are 8 of them.',
      hintText: '',
    },
    {
      id: 'value-knight',
      kind: 'quiz',
      fen: '7k/8/8/8/8/8/4N3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'How much is a Knight worth?',
      introText:
        'The **knight**. 🐴 It jumps in an L-shape and leaps over pieces. How much is it worth?',
      quizOptions: ['1 point', '2 points', '3 points', '5 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        "Correct. The knight is worth **3 points**. It's the only piece that **jumps over others**.",
      quizExplanationWrong:
        'The knight is worth **3 points**. More than a pawn, less than a rook or queen. Its secret weapon: it **jumps over others**. 🐴',
      doneText:
        "The knight is worth **3 points**, and it's the only piece that jumps.",
      hintText: '',
    },
    {
      id: 'value-bishop',
      kind: 'quiz',
      fen: '7k/8/8/8/8/8/4B3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'How much is a Bishop worth?',
      introText:
        'The **bishop**. ⚡ It slides along diagonals, fast and far. How much is it worth?',
      quizOptions: ['1 point', '3 points', '5 points', '7 points'],
      quizCorrectIndex: 1,
      quizExplanation:
        'Correct. The bishop is worth **3 points**, same as the knight. Same value, different style: the knight jumps, the bishop glides.',
      quizExplanationWrong:
        'The bishop is worth **3 points**, same as the knight. They are "value twins": same score, different moves.',
      doneText:
        'The bishop is worth **3 points**, same as the knight. The "value twins".',
      hintText: '',
    },
    {
      id: 'value-rook',
      kind: 'quiz',
      fen: '7k/8/8/8/8/8/4R3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'How much is a Rook worth?',
      introText:
        'The **rook**. 🏰 It controls entire rows and columns. How many points is it worth?',
      quizOptions: ['3 points', '4 points', '5 points', '7 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Correct. The rook is worth **5 points**, more than a knight or bishop. Trade a knight for a rook and you **win the exchange**. ♜',
      quizExplanationWrong:
        'The rook is worth **5 points**, more than a knight or bishop. Getting a rook for one of them is called **winning the exchange**. ♜',
      doneText: 'The rook is worth **5 points**, more than a knight or bishop.',
      hintText: '',
    },
    {
      id: 'value-king',
      kind: 'quiz',
      fen: '7k/8/8/8/8/8/8/4K3 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'How much is the King worth?',
      introText: 'The **king**. 👑 How much is it worth?',
      quizOptions: [
        '5 points',
        '9 points',
        '10 points',
        "No price. It's worth everything",
      ],
      quizCorrectIndex: 3,
      quizExplanation:
        'Exactly. The king is **priceless**. ∞ Lose the king and you **lose the game**. It can never be traded. 👑',
      quizExplanationWrong:
        "The king has no point value. It's worth **∞**, because when the king falls, the **game is over**. It can fight, never be traded. 👑",
      doneText: 'The king is **priceless**. Lose it and you lose the game.',
      hintText: '',
    },
    {
      id: 'value-queen',
      kind: 'quiz',
      fen: '7k/8/8/8/8/8/4Q3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'How much is the Queen worth?',
      introText:
        'Last one: the **queen**. ⭐ Any direction, any number of squares. How many points is she worth?',
      quizOptions: ['5 points', '7 points', '9 points', '12 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        "Correct. 🎉 The queen is worth **9 points**. That's nine pawns, almost two rooks, or three knights. That's why everyone **guards the queen**.",
      quizExplanationWrong:
        'The queen is worth **9 points**, the most of any piece. Lose her and you **lose 9 points** at once. 🛡️',
      doneText: 'The queen is worth **9 points**, the most of any piece.',
      hintText: '',
    },
    {
      id: 'mixed1-white',
      kind: 'quiz',
      fen: '7k/8/8/3n1n2/8/4B3/4R3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 1: White's material",
      introText:
        'White has a rook and a bishop. Black has two knights. How many points does **white** have?',
      quizOptions: ['6 points', '7 points', '8 points', '9 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Correct. Rook (5) + Bishop (3) = **8 points** for white. ✅ Now black.',
      quizExplanationWrong:
        "Rook = 5, Bishop = 3. Together that's **8 points**. Now black.",
      doneText: 'White has **8 points**: Rook (5) + Bishop (3).',
      hintText: '',
      preStepIntro: {
        title: 'Piece Values: Quick Recap',
        text: 'All values in one place. Next, the real challenge: **add it all up** on the board. 🧮',
        bullets: [
          '♟️ **Pawn**: 1 point',
          '🐴 **Knight**: 3 points',
          '⚡ **Bishop**: 3 points',
          '🏰 **Rook**: 5 points',
          '⭐ **Queen**: 9 points',
          '👑 **King**: ∞ (never traded)',
        ],
        buttonText: 'Ready',
      },
    },
    {
      id: 'mixed1-black',
      kind: 'quiz',
      fen: '7k/8/8/3n1n2/8/4B3/4R3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 1: Black's material",
      introText: "Black has **two knights**. What's the total?",
      quizOptions: ['3 points', '5 points', '6 points', '8 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Correct. Knight (3) + Knight (3) = **6 points** for black. ✅ White 8, black 6.',
      quizExplanationWrong:
        'Knight + knight = 3 + 3 = **6 points** for black. White 8, black 6.',
      doneText: 'Black has **6 points**: Knight (3) + Knight (3).',
      hintText: '',
    },
    {
      id: 'mixed1-verdict',
      kind: 'quiz',
      fen: '7k/8/8/3n1n2/8/4B3/4R3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Mixed Position 1: Who is ahead?',
      introText: 'White has 8, black has 6. **Who is ahead?**',
      quizOptions: ['White is winning', 'Black is winning', "It's equal"],
      quizCorrectIndex: 0,
      quizExplanation:
        'Correct. 🎉 White is **2 points ahead**. That is called a **material advantage**. ♟️',
      quizExplanationWrong:
        'White 8, black 6. White is ahead by **2 points**: a material advantage. 🧮',
      doneText: 'White is ahead by 2 points: a **material advantage**.',
      hintText: '',
    },
    {
      id: 'mixed2-black',
      kind: 'quiz',
      fen: '7k/8/3r4/8/5b2/8/2Q5/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 2: Black's material",
      introText:
        'Next position. 👀 White has a queen. Black has a rook and a bishop. How many points does **black** have?',
      quizOptions: ['6 points', '7 points', '8 points', '10 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Correct. Rook (5) + Bishop (3) = **8 points** for black. ✅ Now white.',
      quizExplanationWrong:
        'Rook (5) + Bishop (3) = **8 points** for black. Now white.',
      doneText: 'Black has **8 points**: Rook (5) + Bishop (3).',
      hintText: '',
    },
    {
      id: 'mixed2-white',
      kind: 'quiz',
      fen: '7k/8/3r4/8/5b2/8/2Q5/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 2: White's material",
      introText: 'White only has a **queen**. How much is that worth?',
      quizOptions: ['5 points', '7 points', '9 points', '12 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Right. Queen = **9 points**. ✅ White 9, black 8. Close.',
      quizExplanationWrong: 'Queen = **9 points**. White 9, black 8. Close.',
      doneText: 'White has **9 points**, all in the queen.',
      hintText: '',
    },
    {
      id: 'mixed2-verdict',
      kind: 'quiz',
      fen: '7k/8/3r4/8/5b2/8/2Q5/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Mixed Position 2: Who is ahead?',
      introText: 'White has 9, black has 8. **Who is ahead?**',
      quizOptions: [
        'White is winning',
        'Black is winning',
        "It's almost equal",
      ],
      quizCorrectIndex: 0,
      quizExplanation:
        'Correct. White is ahead by **1 point**. Small, and real. A queen outweighs a **rook + bishop**. 👑',
      quizExplanationWrong:
        'White 9, black 8. White is ahead, barely. Queen (9) > Rook + Bishop (8). **1 point** is still an advantage.',
      doneText:
        'White is ahead by **1 point**. A queen edges out a rook + bishop.',
      hintText: '',
    },
    {
      id: 'mixed3-white',
      kind: 'quiz',
      fen: '7k/1p6/8/8/4R3/8/2PP4/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 3: White's material",
      introText:
        "Last position, now with pawns. Each pawn is **1 point**. 🎯 White has a rook and two pawns. What's the total?",
      quizOptions: ['5 points', '6 points', '7 points', '8 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Correct. Rook (5) + Pawn (1) + Pawn (1) = **7 points**. ✅ Now black.',
      quizExplanationWrong:
        'Rook (5) + Pawn (1) + Pawn (1) = **7 points** for white. Now black.',
      doneText: 'White has **7 points**: Rook (5) + Pawn (1) + Pawn (1).',
      hintText: '',
    },
    {
      id: 'mixed3-black',
      kind: 'quiz',
      fen: '7k/1p6/8/8/4R3/8/2PP4/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 3: Black's material",
      introText: 'Black only has **one pawn**. How much is that worth?',
      quizOptions: ['0 points', '1 point', '2 points', '3 points'],
      quizCorrectIndex: 1,
      quizExplanation: 'Correct. One pawn = **1 point**. ✅ White 7, black 1.',
      quizExplanationWrong: 'One pawn = **1 point**. White 7, black 1.',
      doneText: 'Black has just **1 point**, a single pawn.',
      hintText: '',
    },
    {
      id: 'mixed3-verdict',
      kind: 'quiz',
      fen: '7k/1p6/8/8/4R3/8/2PP4/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Mixed Position 3: Who is ahead?',
      introText: 'White has 7, black has 1. **Who is ahead?**',
      quizOptions: [
        'White is winning by a lot',
        'Black is winning',
        "It's equal",
      ],
      quizCorrectIndex: 0,
      quizExplanation:
        'Correct. 🏆 White is **6 points** ahead. That is huge. In a real game, white almost always wins from here. The points tell you **who is ahead**, no guessing. 🧮',
      quizExplanationWrong:
        'White 7, black 1. White is winning **by a lot**: 6 points ahead. 🧮',
      doneText:
        "⭐ Piece values, done. Pawn = 1, Knight/Bishop = 3, Rook = 5, Queen = 9, King = ∞. Count both sides: more points means a **material advantage**. Chess isn't only math. **Position matters** too.",
      hintText: '',
      celebrate: true,
    },
  ],
};

const DAY_7_HISTORY: Lesson = {
  id: 'l1-d7-history',
  level: 1,
  day: 7,
  title: 'The History of Chess',
  piece: {
    name: 'history',
    glyph: '📜',
    movement: 'static',
    bannerText: 'Chess History Time',
  },
  intro: {
    title: 'The History of Chess',
    text: 'Meet the game itself. A few **facts from history**, then a quick **board challenge**.',
  },
  steps: [
    {
      id: 'quiz-origin',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 1: Origin of Chess',
      introText: 'Where did chess **originate**?',
      quizOptions: ['China', 'Persia', 'India', 'Egypt'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Chess traces back to **India**, where a game called **Chaturanga** appeared around the 6th century, during the Gupta Empire. From India it spread to Persia, then to the Arab world and Europe.',
      doneText:
        'Chess traces back to **India**, around the 6th century, as a game called Chaturanga.',
      hintText: '',
    },
    {
      id: 'quiz-original-name',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 2: Original Name',
      introText: 'What was chess **originally called**?',
      quizOptions: ['Chaturanga', 'Vizier', 'Sultania', 'Shahinshah'],
      quizCorrectIndex: 0,
      quizExplanation:
        'In Sanskrit, "chaturanga" means **"four divisions of the army"**: infantry, cavalry, elephants and chariots. Those were the first four types of pieces. Through Persia it reached the Arabs as **"shatranj"**, because Arabic has no "ch" or "ng" sounds.',
      doneText:
        '"Chaturanga" means **"four divisions of the army"** in Sanskrit.',
      hintText: '',
    },
    {
      id: 'quiz-checkmate',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 3: What Checkmate Really Means',
      introText: 'What does **"checkmate"** actually mean?',
      quizOptions: [
        '"The king has escaped"',
        '"The king is trapped / has no way out"',
        '"The king is captured"',
        '"The king changes places"',
      ],
      quizCorrectIndex: 1,
      quizExplanation:
        'It comes from the Persian **"Shah Mat"**: "shah" means king, "mat" means helpless, **trapped, with no escape**. People later read it as "the king is dead". The accurate meaning is a king with no way out. That\'s why the king is never actually captured: the game ends the moment there\'s no escape.',
      doneText:
        '"Shah Mat" means the king is **trapped, with no escape**. That\'s checkmate.',
      hintText: '',
    },
    {
      id: 'quiz-squares',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 4: Number of Squares',
      introText: 'How many **squares** does a chessboard have?',
      quizOptions: ['32', '100', '64', '81'],
      quizCorrectIndex: 2,
      quizExplanation:
        'The board has 8 rows and 8 columns: 8×8 = **64 squares**, alternating light and dark.',
      doneText:
        'The board has 8×8 = **64 squares**, alternating light and dark.',
      hintText: '',
    },
    {
      id: 'quiz-pieces',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 5: Number of Pieces',
      introText: 'How many **pieces** does each player start with?',
      quizOptions: ['8', '12', '16', '20'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Each player starts with 8 pawns and 8 other pieces (2 rooks, 2 knights, 2 bishops, a queen and a king): **16 in total**.',
      doneText: 'Each player starts with **16 pieces**: 8 pawns and 8 others.',
      hintText: '',
    },
    {
      id: 'quiz-four-players',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 6: Players in the Earliest Version',
      introText:
        'How many **players** took part when chess was first invented?',
      quizOptions: ['2', '3', '4', '6'],
      quizCorrectIndex: 2,
      quizExplanation:
        'The earliest known version in India, **Chaturaji** ("four kings"), was played by **four people**, each with an army, moves decided by dice. The two-player game came later.',
      doneText:
        'The earliest version, Chaturaji ("four kings"), was played by **four people** at once.',
      hintText: '',
    },
    {
      id: 'quiz-setup',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 7: Correctly Set Up Board',
      introText: 'The board is **set up correctly** when:',
      quizOptions: [
        "There's a light square in the bottom-left corner",
        "There's a dark square in the bottom-left corner",
        "It doesn't matter, any square works",
        'The queen is always on a dark square regardless of the corner',
      ],
      quizCorrectIndex: 1,
      quizExplanation:
        'The rule: **dark corner on the left**. Your bottom-left square must be dark. It stops the most common beginner mistake: a board set up backwards.',
      doneText: 'The rule to remember: **dark corner on the left**.',
      hintText: '',
    },
    {
      id: 'mark-a-row',
      kind: 'teach',
      fen: LINE_TASK_FEN,
      orientation: 'w',
      solution: ['a1h1'],
      revealPath: true,
      prompt: 'Mark one row',
      introText:
        'Drag the Queen straight across the board, **same number** the whole way. From a1 to h1.',
      doneText: "That's a **row**: 8 squares running left to right.",
      hintText:
        'A row runs left to right, all on the **same number**. Follow the arrow.',
      preStepIntro: {
        title: 'Row, File, Diagonal',
        text: 'The board has **three basic lines**. Here they are.',
        bullets: [
          '**Row (rank)**: 8 squares running left to right, numbered 1-8',
          '**File**: 8 squares running bottom to top, labeled a-h',
          '**Diagonal**: same-colored squares running corner to corner',
        ],
        buttonText: "Let's try it",
      },
    },
    {
      id: 'mark-a-file',
      kind: 'teach',
      fen: LINE_TASK_FEN,
      orientation: 'w',
      solution: ['a1a8'],
      revealPath: true,
      prompt: 'Mark one file',
      introText:
        'Now drag the Queen straight up the board, **same letter** the whole way. From a1 to a8.',
      doneText:
        "That's a **file**: 8 squares running bottom to top, same letter.",
      hintText:
        'A file runs up and down, all on the **same letter**. Follow the arrow.',
    },
    {
      id: 'mark-a-diagonal',
      kind: 'teach',
      fen: LINE_TASK_FEN,
      orientation: 'w',
      solution: ['a1h8'],
      revealPath: true,
      prompt: 'Mark one diagonal',
      introText:
        'Last one. Drag the Queen along a diagonal: **corner to corner**, same-colored squares.',
      doneText:
        "That's a **diagonal**: same-colored squares, corner to corner.",
      hintText:
        'A diagonal cuts across the board, **corner to corner**. Follow the arrow.',
      celebrate: true,
    },
  ],
};

// Boje za Day 9 "Checkmate vs Stalemate" board highlight (quizBoardHighlight) -
// isti znacaj svuda u lekciji: roze = napad/pokriveno polje bez bekstva,
// cilibar/amber = blokirano sopstvenom figurom, plava = odbrana (figura brani figuru).
const CVS_ATTACK = '#f2358d';
const CVS_BLOCKED = '#f59e0b';
const CVS_PROTECT = '#11C6D1';

const DAY_9_CHECKMATE_VS_STALEMATE: Lesson = {
  id: 'l1-d9-checkmate-vs-stalemate',
  level: 1,
  day: 9,
  title: 'Checkmate vs Stalemate',
  piece: {
    name: 'checkmate vs stalemate',
    glyph: '♚',
    movement: 'static',
    bannerText: 'Checkmate or Stalemate?',
  },
  intro: {
    title: 'Checkmate vs Stalemate',
    text: 'Two endings confuse beginners most: **Checkmate** and **Stalemate**. They look similar. One is a **win**, the other a **draw**. Real positions below.',
  },
  steps: [
    // ---------- Part A - Learn & Recognize (4 positions) ----------
    {
      id: 'a1-backrank-mate',
      kind: 'quiz',
      fen: '3R2k1/5ppp/8/8/8/8/8/6K1 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Is this Checkmate, Stalemate, or Neither?',
      introText:
        "Look at Black's king on g8. Check **every square** it could move to before you decide.",
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 0,
      quizExplanation:
        "This is **Checkmate**. The rook on d8 checks the king on g8. f8 and h8 are covered by the same rook, and f7, g7, h7 are blocked by **Black's own pawns**. No escape, no block, no capture: game over.",
      extraHintText:
        "Look at the king's **escape squares**. Are they all blocked or covered?",
      quizBoardHighlight: {
        arrows: [{ from: 'd8', to: 'g8', color: CVS_ATTACK }],
        squares: [
          { square: 'f8', color: CVS_ATTACK },
          { square: 'h8', color: CVS_ATTACK },
          { square: 'f7', color: CVS_BLOCKED },
          { square: 'g7', color: CVS_BLOCKED },
          { square: 'h7', color: CVS_BLOCKED },
        ],
      },
      doneText: 'This is **Checkmate**. The king had nowhere to go.',
      hintText: '',
    },
    {
      id: 'a2-kiss-of-death',
      kind: 'quiz',
      fen: '6k1/6Q1/6K1/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Is this Checkmate, Stalemate, or Neither?',
      introText:
        'The white queen just moved right next to the black king. Can the king **capture it, block it, or run**?',
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 0,
      quizExplanation:
        "This is **Checkmate**. The queen on g7, protected by her king, gives check, and every square around the black king is covered. It's called the **Kiss of Death**: the queen sits right next to the king she mates.",
      extraHintText:
        'Check every square around the black king. Is **even one** safe?',
      quizBoardHighlight: {
        arrows: [
          { from: 'g7', to: 'g8', color: CVS_ATTACK },
          { from: 'g6', to: 'g7', color: CVS_PROTECT },
        ],
        squares: [
          { square: 'f8', color: CVS_ATTACK },
          { square: 'h8', color: CVS_ATTACK },
          { square: 'f7', color: CVS_ATTACK },
          { square: 'h7', color: CVS_ATTACK },
        ],
      },
      doneText: 'This is **Checkmate**: the Kiss of Death pattern.',
      hintText: '',
    },
    {
      id: 'a3-queen-stalemate',
      kind: 'quiz',
      fen: '7k/5K2/6Q1/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Is this Checkmate, Stalemate, or Neither?',
      introText:
        "Look carefully. Is Black's king **in check** right now? Always check that first.",
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 1,
      quizExplanation:
        "This is **Stalemate**: a draw, not a win. Black's king is not in check and has no legal move. g8, g7 and h7 are all covered. No legal move and no check means an instant draw. It's the most common way winning players **throw away a win**.",
      extraHintText:
        'First: is the king **in check**? Then: does it have **any legal square**?',
      quizBoardHighlight: {
        arrows: [
          { from: 'g6', to: 'g8', color: CVS_ATTACK },
          { from: 'g6', to: 'h7', color: CVS_ATTACK },
          { from: 'f7', to: 'g7', color: CVS_ATTACK },
        ],
        squares: [
          { square: 'g8', color: CVS_ATTACK },
          { square: 'g7', color: CVS_ATTACK },
          { square: 'h7', color: CVS_ATTACK },
        ],
      },
      doneText: 'This is **Stalemate**: no check, no moves, a draw.',
      hintText: '',
    },
    {
      id: 'a4-pawn-stalemate',
      kind: 'quiz',
      fen: 'k7/p1K5/P7/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Is this Checkmate, Stalemate, or Neither?',
      introText:
        "Check **both** of Black's pieces, not just the king. Does either one have a legal move?",
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 1,
      quizExplanation:
        "Also **Stalemate**. b7 and b8 are covered by White's king. a7 holds Black's own pawn, blocked by the pawn on a6. No check, no legal moves. In real games, **your own pawns** can trap your own king like this.",
      extraHintText:
        'Look at every Black piece. Does the **pawn** have a move? Does the king?',
      quizBoardHighlight: {
        arrows: [
          { from: 'c7', to: 'b7', color: CVS_ATTACK },
          { from: 'c7', to: 'b8', color: CVS_ATTACK },
        ],
        squares: [
          { square: 'b7', color: CVS_ATTACK },
          { square: 'b8', color: CVS_ATTACK },
          { square: 'a7', color: CVS_BLOCKED },
          { square: 'a6', color: CVS_BLOCKED },
        ],
      },
      doneText: 'This is **Stalemate**. The black pawn trapped its own king.',
      hintText: '',
    },
    // ---------- Part B - Play It (2 tasks) ----------
    {
      id: 'b1-find-checkmate',
      kind: 'puzzle',
      fen: 'r5k1/8/8/8/8/8/5PPP/6K1 b - - 0 1',
      orientation: 'b',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'a8a1',
      preStepIntro: {
        title: 'Part B: Play It',
        text: 'Your turn. You get a position and **find the move yourself**.',
      },
      prompt: 'Find the checkmate',
      introText: 'Black to move. Find **checkmate in one**.',
      doneText:
        'Checkmate. The white king is boxed in by its own pawns, and your rook mates on the **back rank**.',
      extraHintText:
        "The pawns on f2, g2 and h2 aren't protection here. **They're a trap.** Which file is open for your rook?",
      hintText: "That's not **checkmate** yet. Try again.",
    },
    {
      id: 'b2-find-stalemate',
      kind: 'puzzle',
      fen: '7k/5K2/Q7/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'stalemate',
      hintMove: 'a6g6',
      prompt: 'Find the stalemate',
      introText:
        'Heads up: stalemate turns a **winning position into a draw**. You learn it here so you can **avoid it**. White to move, way ahead in material. Find the queen move that would stalemate Black.',
      doneText:
        "That's Stalemate. No check, zero legal moves, instant draw. White was winning and this move **throws the win away**. Now you know the move to avoid.",
      extraHintText:
        'Stalemate = no legal moves and **no check**. Find the square where the queen covers **g7, g8 and h7** at once without giving check.',
      hintText: 'Not a **stalemate** yet. Try again.',
    },
    // ---------- Part C - Chat Quiz with the AI Coach (3 positions) ----------
    {
      id: 'c1-neither',
      kind: 'quiz',
      fen: '4k3/8/4K3/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Checkmate, Stalemate, or Neither?',
      introText: 'Black to move. Checkmate, Stalemate, or **Neither**?',
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 2,
      quizExplanation:
        "Exactly. Black's king can go to **d8**. Not stuck, not in check. A normal position.",
      quizExplanationWrong:
        'Look again. Is the black king **in check**? Does it have anywhere to go?',
      extraHintText: 'Check the **d8** square.',
      doneText: "That's **Neither**. A normal, ongoing position.",
      hintText: '',
    },
    {
      id: 'c2-ladder-mate',
      kind: 'quiz',
      fen: '1R5k/R7/8/8/8/8/8/6K1 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Checkmate, Stalemate, or Neither?',
      introText: "Next one. **What's happening** here?",
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 0,
      quizExplanation:
        'Correct. This is a **ladder mate**: two rooks climbing the board, cutting off the king rank by rank.',
      quizExplanationWrong:
        'Look at both rooks. One covers the **7th rank**, the other checks on the 8th. Any square left?',
      extraHintText:
        'Count the squares next to the black king. **Who covers each one?**',
      doneText: "That's **Checkmate**: a ladder mate.",
      hintText: '',
    },
    {
      id: 'c3-rook-stalemate',
      kind: 'quiz',
      fen: '5K1k/R7/8/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Checkmate, Stalemate, or Neither?',
      introText: 'Last one. The **trickiest** of the three.',
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 1,
      quizExplanation:
        "Exactly. Black's king isn't in check, and every square is covered. A **draw**, even though White is clearly stronger.",
      quizExplanationWrong:
        'Check first: is the king **in check**? If not, and it has no moves, what does that mean?',
      extraHintText: 'Is the black king **in check** right now? Look closely.',
      doneText:
        'Checkmate is a **win**. Stalemate is a **draw**, no matter the material. Knowing the difference saves you points. See you next lesson.',
      hintText: '',
      celebrate: true,
    },
  ],
};

// Boje za Day 10 "Checkmate Patterns" board highlight (quizBoardHighlight) -
// isti semantika kao Day 9: roze = napad/pokriveno polje bez bekstva,
// cilibar/amber = blokirano sopstvenom figurom, plava = odbrana.
const CM_ATTACK = '#f2358d';
const CM_BLOCKED = '#f59e0b';
const CM_PROTECT = '#11C6D1';

const DAY_10_CHECKMATE_PATTERNS: Lesson = {
  id: 'l1-d10-checkmate-patterns',
  level: 1,
  day: 10,
  title: 'Checkmate Patterns',
  piece: {
    name: 'checkmate patterns',
    glyph: '♛',
    movement: 'static',
    bannerText: 'Checkmate Patterns',
  },
  intro: {
    title: 'Checkmate Patterns',
    text: "Checkmate **ends the game**: the king is in check and can't escape, block, or capture. Today, **5 different pieces** deliver it, even the smallest one.",
  },
  introSteps: [
    {
      text: "Checkmate **ends the game**: the king is in check and can't escape, block, or capture. Today, **5 different pieces** deliver it, even the smallest one.",
      buttonText: 'Start',
    },
  ],
  // Svih 8 pozicija (Position 1-5 + Bonus 1-3) su tematski razlicite,
  // pojedinacno imenovane vezbe - svaka dobija SVOJ segment na progress
  // traci, da pogresan pokusaj na jednoj ne oboji ostale.
  flatProgressSegments: true,
  steps: [
    // ---------- Part 1 - Watch & Learn (2 static positions) ----------
    {
      id: 't1-queen-rook-mate',
      kind: 'quiz',
      fen: '4Q1k1/5ppp/8/8/8/8/8/4R1K1 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Example 1: Queen & Rook',
      introText:
        "This is what checkmate looks like. The queen on e8 checks along the **back rank**, and the rook behind her means she **can't be captured**. f8 and h8 are covered, and Black's own pawns block the rest. No escape.",
      quizBoardHighlight: {
        arrows: [
          { from: 'e8', to: 'g8', color: CM_ATTACK },
          { from: 'e1', to: 'e8', color: CM_PROTECT },
        ],
        squares: [
          { square: 'f8', color: CM_ATTACK },
          { square: 'h8', color: CM_ATTACK },
          { square: 'f7', color: CM_BLOCKED },
          { square: 'g7', color: CM_BLOCKED },
          { square: 'h7', color: CM_BLOCKED },
        ],
      },
      doneText:
        "That's checkmate: **no escape, no block, no capture**. The king is never actually captured. The game ends right here.",
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 't2-ladder-mate',
      kind: 'quiz',
      fen: '6k1/8/8/8/8/8/r7/1r5K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Example 2: Ladder Mate',
      introText:
        "Now White's king is in trouble. The rook on b1 checks on the back rank, and the rook on a2 **seals off the escape**. Two rooks as a team. Checkmate.",
      quizBoardHighlight: {
        arrows: [
          { from: 'b1', to: 'h1', color: CM_ATTACK },
          { from: 'a2', to: 'h2', color: CM_ATTACK },
        ],
        squares: [
          { square: 'g1', color: CM_ATTACK },
          { square: 'g2', color: CM_ATTACK },
          { square: 'h2', color: CM_ATTACK },
        ],
      },
      doneText: 'Two rooks, **ladder mate**. Textbook.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    // ---------- Part 2 - Find the Checkmate (5 interactive positions) ----------
    {
      id: 'position-1-queen-mate',
      kind: 'puzzle',
      fen: '6k1/1Q6/6K1/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'b7g7',
      prompt: 'Find the checkmate: Queen',
      introText:
        'Your queen and king **team up** to trap the enemy king. Find mate in one.',
      extraHintText:
        'Put your queen right next to the black king, on a square **your king protects**.',
      doneText:
        "Qg7#. Your king on g6 protects the queen, so Black can't take her. Every square is covered. This is the **Kiss of Death**. You'll see it a lot.",
      hintText:
        "That's not checkmate. Give check so the king has **no escape at all**. There's more than one mate here.",
      quizBoardHighlight: {
        arrows: [
          { from: 'b7', to: 'g7', color: CM_ATTACK },
          { from: 'g6', to: 'g7', color: CM_PROTECT },
        ],
        squares: [
          { square: 'f8', color: CM_ATTACK },
          { square: 'g8', color: CM_ATTACK },
          { square: 'h8', color: CM_ATTACK },
          { square: 'h7', color: CM_ATTACK },
        ],
      },
      // Qg7# (hintMove) nije jedini mat ovde - dama moze i pravo na zadnji
      // red (a8/b8/c8), dok kralj na g6 pokriva sva polja oko crnog kralja.
      altSolutions: [
        {
          uci: 'b7a8',
          doneText:
            'Qa8#. Your queen checks along the back rank and your king on g6 covers the rest. A clean **back-rank mate**.',
          quizBoardHighlight: {
            arrows: [{ from: 'a8', to: 'g8', color: CM_ATTACK }],
            squares: [
              { square: 'f8', color: CM_ATTACK },
              { square: 'h8', color: CM_ATTACK },
              { square: 'f7', color: CM_ATTACK },
              { square: 'g7', color: CM_ATTACK },
              { square: 'h7', color: CM_ATTACK },
            ],
          },
        },
        {
          uci: 'b7b8',
          doneText:
            'Qb8#. Same idea, different square. The queen owns the back rank, your king seals the rest. **Back-rank mate**.',
          quizBoardHighlight: {
            arrows: [{ from: 'b8', to: 'g8', color: CM_ATTACK }],
            squares: [
              { square: 'f8', color: CM_ATTACK },
              { square: 'h8', color: CM_ATTACK },
              { square: 'f7', color: CM_ATTACK },
              { square: 'g7', color: CM_ATTACK },
              { square: 'h7', color: CM_ATTACK },
            ],
          },
        },
        {
          uci: 'b7c8',
          doneText:
            'Qc8#. Your queen checks on the back rank, your king on g6 covers every escape. **Back-rank mate**.',
          quizBoardHighlight: {
            arrows: [{ from: 'c8', to: 'g8', color: CM_ATTACK }],
            squares: [
              { square: 'f8', color: CM_ATTACK },
              { square: 'h8', color: CM_ATTACK },
              { square: 'f7', color: CM_ATTACK },
              { square: 'g7', color: CM_ATTACK },
              { square: 'h7', color: CM_ATTACK },
            ],
          },
        },
      ],
    },
    {
      id: 'position-2-rook-mate',
      kind: 'puzzle',
      fen: '1r4k1/8/8/8/8/8/6PP/7K b - - 0 1',
      orientation: 'b',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'b8b1',
      prompt: 'Find the checkmate: Rook',
      introText:
        'A rook alone can mate too, if the king has **nowhere to hide**. Find mate in one.',
      extraHintText:
        "White's pawns on g2 and h2 trap their own king. Which file is **open** for your rook?",
      doneText:
        'Rb1#. The pawns on g2 and h2 look safe and **block their own king**. Your rook owns the back rank. This is a **back-rank mate**, one of the most common in chess.',
      hintText: 'Not **checkmate** yet. Try again.',
      quizBoardHighlight: {
        arrows: [
          { from: 'b8', to: 'b1', color: CM_ATTACK },
          { from: 'b1', to: 'h1', color: CM_ATTACK },
        ],
        squares: [
          { square: 'g2', color: CM_BLOCKED },
          { square: 'h2', color: CM_BLOCKED },
        ],
      },
    },
    {
      id: 'position-3-knight-mate',
      kind: 'puzzle',
      fen: '6RK/6PP/3n4/8/8/8/8/k7 b - - 0 1',
      orientation: 'b',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'd6f7',
      prompt: 'Find the checkmate: Knight',
      introText:
        'Knights move like no other piece. Perfect for a **sneaky checkmate**. Find mate in one.',
      extraHintText:
        "White's own rook and pawns surround the king. Does it have **any square**? Now find a knight check.",
      doneText:
        "Nf7#. This is a **smothered mate**. White's own pieces box the king in, and your knight alone finishes it. Nobody can capture the knight.",
      hintText: "That's not **checkmate**. Try again.",
      quizBoardHighlight: {
        arrows: [{ from: 'd6', to: 'f7', color: CM_ATTACK }],
        squares: [
          { square: 'g8', color: CM_BLOCKED },
          { square: 'g7', color: CM_BLOCKED },
          { square: 'h7', color: CM_BLOCKED },
        ],
      },
    },
    {
      id: 'position-4-bishop-mate',
      kind: 'puzzle',
      fen: '7k/5Kpp/8/8/8/8/1B6/8 w - - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'b2g7',
      prompt: 'Find the checkmate: Bishop',
      introText:
        'Even a bishop, **diagonals only**, can deliver checkmate. Find mate in one.',
      extraHintText:
        'Your bishop can **capture a pawn and check** at the same time. Which pawn sits on its diagonal?',
      doneText:
        "Bxg7#. The bishop captures and checks. Your king on f7 **protects it**, and h7 is blocked by Black's own pawn.",
      hintText: 'Not **checkmate** yet. Try again.',
      quizBoardHighlight: {
        arrows: [
          { from: 'b2', to: 'g7', color: CM_ATTACK },
          { from: 'f7', to: 'g7', color: CM_PROTECT },
        ],
        squares: [
          { square: 'g8', color: CM_ATTACK },
          { square: 'h7', color: CM_BLOCKED },
        ],
      },
    },
    {
      id: 'position-5-pawn-mate',
      kind: 'puzzle',
      fen: 'k1K5/pp6/2P5/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'c6b7',
      prompt: 'Find the checkmate: Pawn',
      introText:
        'This one surprises everyone. Even a **pawn** can deliver checkmate. Find it.',
      extraHintText:
        'Your pawn can **capture next to the black king**. What happens to the king after that?',
      doneText:
        'cxb7#. The pawn captures and checks. Your king on c8 protects it and covers b8, and a7 is blocked. The **smallest piece** just delivered mate.',
      hintText: 'Not **checkmate** yet. Try again.',
      quizBoardHighlight: {
        arrows: [
          { from: 'c6', to: 'b7', color: CM_ATTACK },
          { from: 'c8', to: 'b7', color: CM_PROTECT },
          { from: 'c8', to: 'b8', color: CM_ATTACK },
        ],
        squares: [
          { square: 'a7', color: CM_BLOCKED },
          { square: 'b8', color: CM_ATTACK },
        ],
      },
    },
    // ---------- Bonus Round - Check-mate Puzzles (3 extra, optional) ----------
    {
      id: 'bonus-1-queen-knight-mate',
      kind: 'puzzle',
      fen: '7k/Q6p/4N3/8/8/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'a7g7',
      prompt: 'Bonus 1: Queen & Knight',
      introText:
        'Your queen and knight **combine** for a clean checkmate. Find it.',
      extraHintText:
        'Put your queen next to the black king, on a square **your knight defends**.',
      doneText:
        "Qg7#. Your knight on e6 defends the queen, so the king can't take her. A classic **queen-and-knight** mate.",
      hintText:
        "That's not checkmate. Give check so the king has **no escape at all**. There's more than one mate here.",
      quizBoardHighlight: {
        arrows: [
          { from: 'a7', to: 'g7', color: CM_ATTACK },
          { from: 'e6', to: 'g7', color: CM_PROTECT },
        ],
        squares: [
          { square: 'g8', color: CM_ATTACK },
          { square: 'h7', color: CM_BLOCKED },
        ],
      },
      // Qg7# (hintMove) nije jedini mat ovde - dama moze i pravo na zadnji
      // red (a8/b8), knight na e6 i dalje pokriva g7, a crni pesak na h7
      // blokira poslednje polje.
      altSolutions: [
        {
          uci: 'a7a8',
          doneText:
            'Qa8#. Queen on the back rank, knight covers g7, h7 is blocked. **Back-rank mate**.',
          quizBoardHighlight: {
            arrows: [
              { from: 'a8', to: 'h8', color: CM_ATTACK },
              { from: 'e6', to: 'g7', color: CM_PROTECT },
            ],
            squares: [
              { square: 'g8', color: CM_ATTACK },
              { square: 'g7', color: CM_ATTACK },
              { square: 'h7', color: CM_BLOCKED },
            ],
          },
        },
        {
          uci: 'a7b8',
          doneText:
            'Qb8#. Same idea, different square. Queen on the back rank, knight covers g7. **Back-rank mate**.',
          quizBoardHighlight: {
            arrows: [
              { from: 'b8', to: 'h8', color: CM_ATTACK },
              { from: 'e6', to: 'g7', color: CM_PROTECT },
            ],
            squares: [
              { square: 'g8', color: CM_ATTACK },
              { square: 'g7', color: CM_ATTACK },
              { square: 'h7', color: CM_BLOCKED },
            ],
          },
        },
      ],
    },
    {
      id: 'bonus-2-rook-bishop-mate',
      kind: 'puzzle',
      fen: '7k/7p/7B/8/8/8/8/RK6 w - - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'a1a8',
      prompt: 'Bonus 2: Rook & Bishop',
      introText:
        'This time your rook needs **help from the bishop**. Find the checkmate.',
      extraHintText:
        'Move your rook all the way up its file to the **back rank**.',
      doneText:
        'Ra8#. The rook checks on the back rank and the bishop on h6 **covers g7**. Teamwork.',
      hintText: 'Not **checkmate** yet. Try again.',
      quizBoardHighlight: {
        arrows: [
          { from: 'a1', to: 'a8', color: CM_ATTACK },
          { from: 'a8', to: 'h8', color: CM_ATTACK },
          { from: 'h6', to: 'g7', color: CM_ATTACK },
        ],
        squares: [
          { square: 'g7', color: CM_ATTACK },
          { square: 'h7', color: CM_BLOCKED },
        ],
      },
    },
    {
      id: 'bonus-3-epaulette-mate',
      kind: 'puzzle',
      fen: '3rkr2/8/8/8/8/8/Q7/7K w - - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'a2e6',
      prompt: 'Bonus 3: Epaulette Mate',
      introText:
        "Black's own rooks are about to become **the problem**. Find the checkmate.",
      extraHintText:
        'One queen square checks along the file and covers **both diagonals** next to the king at once.',
      doneText:
        "Qe6#. This is an **epaulette mate**. Black's own rooks block the sides, like epaulettes on a uniform, and your queen covers the rest.",
      hintText: 'Not **checkmate** yet. Try again.',
      celebrate: true,
      quizBoardHighlight: {
        arrows: [{ from: 'a2', to: 'e6', color: CM_ATTACK }],
        squares: [
          { square: 'd8', color: CM_BLOCKED },
          { square: 'f8', color: CM_BLOCKED },
          { square: 'd7', color: CM_ATTACK },
          { square: 'e7', color: CM_ATTACK },
          { square: 'f7', color: CM_ATTACK },
        ],
      },
    },
  ],
};

// Boje za Day 11 "Meet the Chess Board" - cisto informativne (nema
// napad/opasnost semantiku kao Day 9/10): plava = podrazumevana zona/linija/
// Hint-okvir, roze = Queenside (samo da se vizuelno razlikuje od Kingside-a
// kad su oba plava).
const D11_INFO = '#11C6D1';
const D11_QUEENSIDE = '#f2358d';

/** Sva polja na navedenim linijama (npr. ['e','f','g','h'] -> e1..h8, 32 polja). */
function filesZone(
  files: string[],
  color: string = D11_INFO
): { square: string; color: string }[] {
  const squares: { square: string; color: string }[] = [];
  for (const f of files) {
    for (let r = 1; r <= 8; r++) squares.push({ square: `${f}${r}`, color });
  }
  return squares;
}

const DAY_11_MEET_THE_BOARD: Lesson = {
  id: 'l1-d11-meet-the-board',
  level: 1,
  day: 11,
  title: 'Meet the Chess Board',
  piece: {
    name: 'the chess board',
    glyph: '♟',
    movement: 'static',
    bannerText: 'Meet the Board',
  },
  intro: {
    title: 'Meet the Chess Board',
    text: 'Get to know the board itself: the **Kingside**, the **Queenside**, the **center**, and the lines every piece moves along.',
  },
  flatProgressSegments: true,
  steps: [
    // ---------- Section A - Kingside & Queenside (pure demo) ----------
    {
      id: 'a1-kingside',
      kind: 'quiz',
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'The Kingside',
      introText:
        'This half, the e, f, g and h files, is the **Kingside**. Your king usually ends up here after castling.',
      quizBoardHighlight: { squares: filesZone(['e', 'f', 'g', 'h']) },
      doneText: "That's the **Kingside**: e, f, g, h.",
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'a2-queenside',
      kind: 'quiz',
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'The Queenside',
      introText:
        "This half, a, b, c, d, is the **Queenside**. Castling here is a **long castle**: the king travels further. On the Kingside it's a **short castle**.",
      quizBoardHighlight: {
        squares: filesZone(['a', 'b', 'c', 'd'], D11_QUEENSIDE),
      },
      doneText: "That's the **Queenside**: a, b, c, d.",
      hintText: '',
      transitionText: 'Good. **Next one.**',
    },
    // ---------- Section B - Center Basics (interactive, mark squares) ----------
    {
      id: 'b1-the-center',
      kind: 'markSquares',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['d4', 'd5', 'e4', 'e5'],
      prompt: 'Mark the Center',
      introText:
        'Find the heart of the board: the **4 most important squares** in the center. To mark a square, **right-click** it on desktop or tap it on mobile.',
      retryPromptText:
        'The center is **d4, d5, e4 and e5**. Control them and you control the board. Every strong opening fights for them.',
      extraHintText:
        'These four, **d4, d5, e4, e5**, are the center. Control them, control the board.',
      doneText:
        'Exactly: **d4, d5, e4, e5**. Control them and you control the board. Every strong opening fights for them.',
      hintText: '',
      quizBoardHighlight: {
        squares: ['d4', 'd5', 'e4', 'e5'].map((square) => ({
          square,
          color: D11_INFO,
        })),
      },
      nextButtonText: 'Got it',
    },
    {
      id: 'b2-wide-center',
      kind: 'markSquares',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: [
        'c3',
        'c4',
        'c5',
        'c6',
        'd3',
        'd6',
        'e3',
        'e6',
        'f3',
        'f4',
        'f5',
        'f6',
      ],
      prompt: 'Mark the Wide Center',
      introText:
        'The ring around the center matters too: the **wide center**. Same as before: right-click on desktop, tap on mobile. Mark it.',
      retryPromptText:
        'The wide center is this 16-square zone, **c3 to f6**. Pieces here have more room and more targets.',
      extraHintText:
        'This whole zone, **c3 to f6**, is the wide center. More space, more targets.',
      doneText:
        'With the center, that makes a 16-square zone, **c3 to f6**. Pieces here have more room and more targets.',
      hintText: '',
      quizBoardHighlight: {
        squares: [
          'c3',
          'c4',
          'c5',
          'c6',
          'd3',
          'd6',
          'e3',
          'e6',
          'f3',
          'f4',
          'f5',
          'f6',
        ].map((square) => ({ square, color: D11_INFO })),
      },
      transitionText: 'Good. **Next one.**',
    },
    // ---------- Section C - Rows, Diagonals & Files (recognition) ----------
    {
      id: 'c1-row',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'What kind of line is this?',
      introText: "Take a look. **What's drawn** here?",
      quizOptions: ['A Row', 'A File', 'A Diagonal'],
      quizCorrectIndex: 0,
      quizBoardHighlightUpfront: true,
      quizBoardHighlight: {
        arrows: [{ from: 'a4', to: 'h4', color: D11_INFO }],
      },
      quizExplanation:
        'This is a **Row**, also called a rank: 8 squares side to side. The **back row** matters most: castling happens there, and so do the checkmates from Day 10.',
      doneText: "That's a **Row** (rank): 8 squares side to side.",
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'c2-diagonal',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'What kind of line is this?',
      introText: 'And **this one**?',
      quizOptions: ['A Row', 'A File', 'A Diagonal'],
      quizCorrectIndex: 2,
      quizBoardHighlightUpfront: true,
      quizBoardHighlight: {
        arrows: [{ from: 'a1', to: 'h8', color: D11_INFO }],
      },
      quizExplanation:
        "This is a **Diagonal**. Bishops live here, it's the only line they move on. The queen uses diagonals too.",
      doneText: "That's a **Diagonal**.",
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'c3-file',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'What kind of line is this?',
      introText: "Last one. **What's this?**",
      quizOptions: ['A Row', 'A File', 'A Diagonal'],
      quizCorrectIndex: 1,
      quizBoardHighlightUpfront: true,
      quizBoardHighlight: {
        arrows: [{ from: 'd1', to: 'd8', color: D11_INFO }],
      },
      quizExplanation:
        'This is a **File**. Rooks love files, especially **open files** with no pawns in the way. An open file for your rook is a big advantage.',
      doneText:
        "You've met the **whole board**: Kingside, Queenside, the center, and every line on it.",
      hintText: '',
      celebrate: true,
    },
  ],
};

// Boje za Day 12 "Checkmate with Queen" - ista semantika kao Day 9/10:
// roze = napad/pokriveno polje bez bekstva, zelena = jedino slobodno
// (legalno) polje - namerno kontrast sa roze, da se vidi da kralj JOS UVEK
// ima gde da ide (nije pat).
const CWQ_ATTACK = '#f2358d';
const CWQ_SAFE = '#07DA63';

const DAY_12_CHECKMATE_WITH_QUEEN: Lesson = {
  id: 'l1-d12-checkmate-with-queen',
  level: 1,
  day: 12,
  title: 'Checkmate with Queen',
  piece: {
    name: 'checkmate with queen',
    glyph: '♛',
    movement: 'static',
    bannerText: 'King + Queen Checkmate',
  },
  intro: {
    title: 'Checkmate with Queen',
    text: "Your queen is the strongest piece on the board. She still **can't mate alone**: she needs **her own king's help**. Today you learn how they work together.",
  },
  introSteps: [
    {
      text: "Your queen is the strongest piece on the board. She still **can't mate alone**: she needs **her own king's help**. Today you learn how they work together.",
      buttonText: 'Got it',
    },
  ],
  steps: [
    // ---------- Part 1 - How It's Done (no interaction) ----------
    {
      id: 't2-stalemate-reminder',
      kind: 'quiz',
      fen: '7k/5K2/6Q1/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Watch Out for Stalemate',
      introText:
        "Remember this one? **Stalemate**, not checkmate. It's the most common way players ruin this ending. Rule: the king must **always have a legal move**, until the very last one.",
      // Isti highlight kao Day 9 A3 (ista pozicija) - pokazuje zasto je kralj
      // u patu: g8/g7/h7 su sva pokrivena damom/kraljem, bez obzira sto
      // kralj nije u sahu.
      quizBoardHighlight: {
        arrows: [
          { from: 'g6', to: 'g8', color: CVS_ATTACK },
          { from: 'g6', to: 'h7', color: CVS_ATTACK },
          { from: 'f7', to: 'g7', color: CVS_ATTACK },
        ],
        squares: [
          { square: 'g8', color: CVS_ATTACK },
          { square: 'g7', color: CVS_ATTACK },
          { square: 'h7', color: CVS_ATTACK },
        ],
      },
      doneText: 'That is **stalemate**: no legal move, no check.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 't3-the-plan',
      kind: 'quiz',
      fen: '6k1/8/4K3/8/8/8/8/Q7 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'The Plan',
      introText:
        "The plan: **box the king in** with your queen, a knight's move away so she's safe. Then **walk your king in** and finish together.",
      doneText: 'The plan: **box the king in**, then bring your king up.',
      hintText: '',
      nextButtonText: 'Ready',
    },
    // ---------- Part 2 - Bring It On! (guided practice, real checkmate) ----------
    {
      id: 'move1-qf6',
      kind: 'puzzle',
      fen: '6k1/8/4K3/8/8/8/8/Q7 w - - 0 1',
      orientation: 'w',
      solution: ['a1f6', 'g8h7'],
      showSolutionArrowUpfront: true,
      preStepIntro: {
        title: 'Bring It On',
        text: "Practice time. I'll **guide every move**. Follow along.",
        buttonText: 'Start',
      },
      prompt: 'Move 1: Box the King In',
      introText:
        "The queen doesn't need to give check. She's **fencing in squares** around the king, not attacking him.",
      doneText:
        'The king has **one square** left. Always leave at least one legal square. **Zero means stalemate**, not checkmate.',
      hintText: "That's not the move. **Follow the arrow.**",
      // Ova pozicija je pedagoski bitna (vidi noAutoAdvance ispod) - roze
      // polja su pokrivena (kralj NE SME tu), zeleno (h7) je jedino
      // preostalo slobodno polje - kontrast pokazuje da kralj JOS UVEK ima
      // kuda, nije pat.
      quizBoardHighlight: {
        arrows: [
          { from: 'f6', to: 'h8', color: CWQ_ATTACK },
          { from: 'f6', to: 'h6', color: CWQ_ATTACK },
        ],
        squares: [
          { square: 'g6', color: CWQ_ATTACK },
          { square: 'g7', color: CWQ_ATTACK },
          { square: 'h6', color: CWQ_ATTACK },
          { square: 'h8', color: CWQ_ATTACK },
          { square: 'h7', color: CWQ_SAFE },
        ],
      },
      // Ova pozicija je pedagoski presudna (kralj ostaje sa TACNO jednim
      // poljem, ne nula) - ostaje potpuno vidljiva/svetla, bez countdown-a
      // ili zatamnjenja, dok korisnik sam ne klikne Got it.
      noAutoAdvance: true,
      nextButtonText: 'Got it',
    },
    {
      id: 'move2-qg5',
      kind: 'puzzle',
      fen: '8/7k/4KQ2/8/8/8/8/8 w - - 2 2',
      orientation: 'w',
      solution: ['f6g5', 'h7h8'],
      showSolutionArrowUpfront: true,
      prompt: 'Move 2: Pack Him Into the Corner',
      introText:
        'Qg5. Pack the king into the corner so he has **only one square**.',
      doneText:
        'Remember this position. **This is your goal.** From here, bring up your king and help the queen deliver the **Kiss of Death**.',
      hintText: "That's not the move. **Follow the arrow.**",
      // Dama na g5 drzi g7 i g8 (g-file) - kralj na h8 nema kud tamo. h7 je
      // jedino polje koje mu ostaje slobodno, dok mu ga beli kralj ne zatvori u Move 3.
      quizBoardHighlight: {
        squares: [
          { square: 'g7', color: CWQ_ATTACK },
          { square: 'g8', color: CWQ_ATTACK },
          { square: 'h7', color: CWQ_SAFE },
        ],
      },
      // Ovo JESTE ciljna slika korisnik treba da zapamti ("Remember this
      // position well") - ostaje potpuno vidljiva/svetla, bez countdown-a
      // ili zatamnjenja, dok korisnik sam ne klikne Got it.
      noAutoAdvance: true,
      nextButtonText: 'Got it',
    },
    {
      id: 'move3-kf7',
      kind: 'puzzle',
      fen: '7k/8/4K3/6Q1/8/8/8/8 w - - 4 3',
      orientation: 'w',
      solution: ['e6f7', 'h8h7'],
      revealArrowOnWrongMove: true,
      prompt: 'Move 3: Bring the King In',
      introText:
        'Your turn. The only piece that can help the queen now is **your king**.',
      doneText: 'Exactly. **King in place.**',
      hintText: 'Look where **your king** needs to go.',
    },
    {
      id: 'move4-checkmate',
      kind: 'puzzle',
      fen: '8/5K1k/8/6Q1/8/8/8/8 w - - 6 4',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'g5g7',
      prompt: 'Find the Checkmate',
      introText: 'Deliver the **Kiss of Death**.',
      extraHintText:
        'The **Kiss of Death**: the queen goes right in front of the king, protected by your king.',
      doneText:
        "The **Kiss of Death**. The queen sits in front of the king, protected by yours. Checkmate. King and queen mate is a skill you'll use **in almost every game**.",
      hintText: 'Not **checkmate** yet. Try again.',
      celebrate: true,
      // Qh5#/Qh4# JESU sah-mat (goalCondition je tehnicki zadovoljen), ali ova
      // lekcija uci bas Kiss of Death (dama ispred kralja) - requireRetry ih
      // vraca na ponovni pokusaj umesto da zavrse korak.
      altSolutions: [
        {
          uci: 'g5h5',
          requireRetry: true,
          retryMessage:
            "That's checkmate. It's not the **Kiss of Death**, and that's the mate we're learning. Try again.",
          doneText:
            "Qh5#. Different square, same idea: the queen checks, your king protects. King and queen mate, a skill you'll use **in almost every game**.",
        },
        {
          uci: 'g5h4',
          requireRetry: true,
          retryMessage:
            "That's checkmate. It's not the **Kiss of Death**, and that's the mate we're learning. Try again.",
          doneText:
            "Qh4#. The queen checks on the h-file, your king backs her up. King and queen mate, a skill you'll use **in almost every game**.",
        },
      ],
    },
  ],
};

// Openings - cisto informativni highlight (nema "napad/opasnost" dihotomiju
// kao kod mat lekcija), jedna boja za sve - sve 5 principa su isti registar.
const D13_INFO = '#11C6D1';

const DAY_13_OPENINGS: Lesson = {
  id: 'l1-d13-openings',
  level: 1,
  day: 13,
  title: 'Openings: The Basics',
  piece: {
    name: 'opening',
    glyph: '♟',
    movement: 'static',
    bannerText: 'Opening Basics',
  },
  intro: {
    title: 'Openings: The Basics',
    text: 'The opening is the **first few moves** of a game, where both players set up their pieces. A good opening gets your pieces **ready to attack and defend** before the real fight.',
  },
  // JEDINI punoekranski pop-up u celoj lekciji - svih 5 principa posle ovoga
  // ide kroz AI chat (watch-style 'quiz' koraci), ne kroz dodatne pop-up prozore.
  introSteps: [
    {
      text: 'The opening is the **first few moves** of a game, where both players set up their pieces. A good opening gets your pieces **ready to attack and defend** before the real fight.',
      buttonText: 'Next',
    },
  ],
  steps: [
    {
      id: 'p1-control-center',
      kind: 'quiz',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Principle 1 of 5: Control the Center',
      introText:
        'The middle of the board, **d4, d5, e4, e5**, is the most valuable real estate. Both sides are already **fighting for it** after move 1.',
      quizBoardHighlight: {
        arrows: [
          { from: 'e2', to: 'e4', color: D13_INFO },
          { from: 'e7', to: 'e5', color: D13_INFO },
        ],
        squares: [
          { square: 'd4', color: D13_INFO },
          { square: 'd5', color: D13_INFO },
          { square: 'e4', color: D13_INFO },
          { square: 'e5', color: D13_INFO },
        ],
      },
      doneText: 'Control the center: the fight for **d4, d5, e4, e5**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p2-develop-pieces',
      kind: 'quiz',
      fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Principle 2 of 5: Develop Your Pieces',
      introText:
        'Bring your **knights and bishops out** before anything else. Both knights are already in the game here.',
      // Konji su vec razvijeni; lovac na f1 je obelezen kao sledeci na redu.
      quizBoardHighlight: {
        squares: [
          { square: 'f3', color: D13_INFO },
          { square: 'c6', color: D13_INFO },
          { square: 'f1', color: D13_INFO },
        ],
      },
      doneText: 'Knights out first, **bishops next**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p3-dont-repeat',
      kind: 'quiz',
      fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Principle 3 of 5: Don't Move the Same Piece Twice",
      introText:
        "Every knight and bishop here moved **exactly once**. That's why development is this far ahead.",
      quizBoardHighlight: {
        squares: [
          { square: 'f3', color: D13_INFO },
          { square: 'c6', color: D13_INFO },
          { square: 'c4', color: D13_INFO },
          { square: 'c5', color: D13_INFO },
        ],
      },
      doneText: 'Four pieces developed, each moved **only once**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p4-castle-early',
      kind: 'quiz',
      fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Principle 4 of 5: Castle Early',
      introText:
        'Get your **king to safety** as soon as you can. White just did: the king is tucked in the corner.',
      quizBoardHighlight: {
        arrows: [{ from: 'e1', to: 'g1', color: D13_INFO }],
        squares: [
          { square: 'g1', color: D13_INFO },
          { square: 'f1', color: D13_INFO },
        ],
      },
      doneText: 'Castled. King **safe in the corner**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p5-queen-home',
      kind: 'quiz',
      // Ista pozicija kao Principle 4 - lepo ilustruje oba pravila odjednom (Dev Notes).
      fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Principle 5 of 5: Keep Your Queen Home for Now',
      introText:
        "Bring the queen out too early and your opponent **attacks her and gains time**. White's queen hasn't moved yet. That's fine this early.",
      quizBoardHighlight: {
        squares: [
          { square: 'd1', color: D13_INFO },
          { square: 'd8', color: D13_INFO },
        ],
      },
      doneText: 'Both queens still home. **No rush.**',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'ready-london',
      kind: 'quiz',
      fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Ready for Your First Opening?',
      introText:
        'Next: the **London System**, one of the simplest and most popular openings for White.',
      doneText: 'Time to see it **in action**.',
      hintText: '',
      nextButtonText: 'London System',
      nextButtonTextMobile: 'London S.',
    },
    {
      id: 'guided-london',
      kind: 'puzzle',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      // 1.d4 d5 2.Bf4 Nf6 3.e3 e6 4.Nf3 Bd6 5.Bg3 - verifikovano chess.js,
      // svaki potez legalan, redosled tacan po PGN-u iz tiketa.
      solution: [
        'd2d4',
        'd7d5',
        'c1f4',
        'g8f6',
        'e2e3',
        'e7e6',
        'g1f3',
        'f8d6',
        'f4g3',
      ],
      showSolutionArrowUpfront: true,
      revealArrowOnWrongMove: true,
      prompt: 'Your First Opening: The London System',
      introText:
        'Play it together. **Follow the arrow** for each move. I play Black.',
      hintText: "Follow the **London System's plan**.",
      doneText: 'You just played the **first 5 moves** of the London System.',
    },
  ],
};

const DAY_14_FIRST_GAME: Lesson = {
  id: 'l1-d14-first-game',
  level: 1,
  day: 14,
  title: 'Game 1.0',
  endScreenTitle: 'Your first game is complete! 🎉',
  piece: {
    name: 'first game',
    glyph: '♟',
    movement: 'mascot',
    bannerText: 'Meet Pawny',
    subBannerText: 'Rated 100–300',
  },
  intro: {
    title: 'Time for your First game',
    text: 'All the lessons led here. Meet **Pawny**, your first opponent. Rated 100 to 300, still figuring out how bishops move. **Loses pieces for fun.** Perfect for a real first game.',
  },
  // JEDINI pop-up ove lekcije - "Meet Pawny", pre nego sto partija pocne.
  introSteps: [
    {
      text: 'All the lessons led here. Meet **Pawny**, your first opponent. Rated 100 to 300, still figuring out how bishops move. **Loses pieces for fun.** Perfect for a real first game.',
      buttonText: 'Start Play',
    },
  ],
  steps: [
    {
      id: 'vs-pawny',
      kind: 'freePlay',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      // freePlay ne koristi solution - svaki legalan potez je dozvoljen,
      // Pawny (Stockfish, najslabije podesavanje) odgovara kao crni.
      solution: [],
      prompt: 'Your First Game',
      introText: "Make your first move **whenever you're ready**.",
      hintText: '',
      doneText:
        "Interesting game. Your **first real match**, no puzzles, no hints. That's chess now.",
      freePlayMessages: [
        "I only just learned how bishops move. Don't tell anyone.",
        'This is the first game where nobody yells at me for hanging my queen.',
        "My last training partner resigned on move 3. You're already ahead of him.",
        "I'm still counting squares in my head. Don't rush me.",
        "Neither of us fully knows what we're doing. That's the fun part.",
        "I'd castle now if I remembered which side.",
        "This is the longest I've survived all week.",
        "Every move you make, I'm taking notes.",
        'Grandmasters probably started exactly like this. Probably.',
        'Still here. Still confused. Still fun.',
        "You've got more of a plan than I do.",
        "This board's seen worse games. Mine, mostly.",
        'I respect a player who thinks before moving. Unlike me.',
        'Real chess feels different than the puzzles.',
        'Whatever happens next, this counts as your first real game.',
      ],
      // Trener (Outposty), ne Pawny - kratke, tople recenice posle
      // korisnikovog poteza. Bez uzvicnika (Outpost tone of voice).
      motivationMessages: [
        'Nice and steady.',
        "You're reading the position well.",
        'That was a thoughtful choice.',
        'Keep that rhythm going.',
        'Smart move.',
        "You're finding your footing fast.",
        "That's real progress.",
        'Patient play like that pays off.',
        "You're playing with real focus.",
        'Nice instincts there.',
        'Every move like that adds up.',
        "You're getting the hang of this.",
        'Good sense on that one.',
        "You're settling in nicely.",
        'That kind of focus wins games.',
      ],
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Play again', action: 'repeat' },
    { label: 'Game Review', action: 'review' },
    { label: 'Done', action: 'done' },
  ],
};

// Day 15 - cisto informativni registar (isti kao Day13 Openings): plava =
// "pogledaj ovo", roze = "izgubljeno pravo/problem", zelena = "jos uvek
// vazi/sigurno", cilibar = "napadnuto ali NEBITNO" (Pozicija 6 trik).
const D15_SPOTLIGHT = '#11C6D1';
const D15_MOVED = '#f2358d';
const D15_AVAILABLE = '#07DA63';
const D15_IRRELEVANT = '#f59e0b';

const DAY_15_CASTLING_RULES: Lesson = {
  id: 'l1-d15-castling-rules',
  level: 1,
  day: 15,
  title: 'Castling Rules: When You Can’t Castle',
  piece: {
    name: 'castling',
    glyph: '♚',
    movement: 'static',
    bannerText: 'Castling Rules',
  },
  intro: {
    title: 'Castling Rules: When You Can’t Castle',
    text: "Castling isn't always allowed. First you'll learn **when you can't castle**. Then you'll use those rules to **stop your opponent from castling**.",
  },
  // Position 2/3/5/6 grupa (kratke "pronadji rokadu" vezbe) ima svoju temu
  // po poziciji - svaka zasluzuje SOPSTVEN segment, ne grupisanje. Isto za
  // Part 2 puzzle-e (bishop/queen/knight su tri razlicite teme).
  flatProgressSegments: true,
  steps: [
    // ---------- Part 1 ----------
    {
      id: 'p1-king-moved',
      kind: 'quiz',
      fen: 'r2qk2r/ppp2ppp/5n2/2b5/2B5/5N2/PPP1KPPP/R2Q3R w kq - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Position 1: The King Has Already Moved',
      introText:
        "White's king is on e2, not e1. Rule #1: once your king moves, even one square, **you lose the right to castle** for the rest of the game, even if it comes back to e1. No castling for White, either side.\n\nFor now, we're **just learning**. You'll try it yourself soon.",
      quizBoardHighlight: {
        squares: [{ square: 'e2', color: D15_SPOTLIGHT }],
      },
      doneText: 'The king moved. Castling rights are **gone for good**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p2a-queenside-rook-moved',
      kind: 'quiz',
      fen: '3rk2r/pp1qbppp/2p1bn2/3p2B1/3P4/2NQ1N2/PPP2PPP/1R2K2R w Kk - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Position 2: One Rook Has Moved',
      introText:
        "White's queenside rook already stepped from a1 to b1. A rook move only costs castling **on that rook's side**. Queenside (O-O-O) is gone for both sides. Kingside (O-O) is still legal: the h1 rook and the king never moved.\n\nFor now, we're **just learning**. You'll try it yourself soon.",
      quizBoardHighlight: {
        squares: [
          { square: 'b1', color: D15_MOVED },
          { square: 'd8', color: D15_MOVED },
        ],
      },
      doneText: 'Queenside rook moved. O-O-O is gone, **O-O is still fine**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p2b-castle-kingside',
      kind: 'puzzle',
      fen: '3rk2r/pp1qbppp/2p1bn2/3p2B1/3P4/2NQ1N2/PPP2PPP/1R2K2R w Kk - 0 1',
      orientation: 'w',
      solution: ['e1g1'],
      prompt: 'Castle on the Side You Still Can',
      introText: 'Castle on the side where castling is **still legal**.',
      doneText: 'O-O. Castled **kingside**, the side you still had.',
      hintText:
        "We want **the castle** here. Other moves aren't the point right now.",
    },
    {
      id: 'p3a-kingside-rook-moved',
      kind: 'quiz',
      fen: 'r3k2r/pppp1ppp/8/4p3/4P1PP/8/PPPP1P2/R3K1R1 w Qkq - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Position 3: The Other Rook Has Moved',
      introText:
        "Now the other rook: White moved it from h1 to g1 to support the pawn storm. Same rule, mirrored. O-O is gone because **that rook moved**. O-O-O is still fine: the a1 rook and the king haven't moved.\n\nFor now, we're **just learning**. You'll try it yourself soon.",
      quizBoardHighlight: {
        arrows: [{ from: 'e1', to: 'c1', color: D15_AVAILABLE }],
        squares: [
          { square: 'g1', color: D15_MOVED },
          { square: 'a1', color: D15_AVAILABLE },
          { square: 'e1', color: D15_AVAILABLE },
        ],
      },
      doneText: 'Kingside rook moved. O-O is gone, **O-O-O is still fine**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p3b-castle-queenside',
      kind: 'puzzle',
      fen: 'r3k2r/pppp1ppp/8/4p3/4P1PP/8/PPPP1P2/R3K1R1 w Qkq - 0 1',
      orientation: 'w',
      solution: ['e1c1'],
      prompt: "So, What's the Move?",
      introText: 'Castle on the side where castling is **still legal**.',
      doneText: 'O-O-O. Castled **queenside**, the only side left.',
      hintText:
        "We want **a castle** here. Other moves aren't the point right now.",
    },
    {
      id: 'p4-bishop-attacks-crossing-square',
      kind: 'quiz',
      fen: '4k3/8/b7/8/8/8/8/R3K2R w KQ - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Position 4: A Bishop Attacks the Crossing Square',
      introText:
        "Having the right to castle isn't enough. The move must also be legal **right now**. The king can never cross a square that's **under attack**. Black's bishop covers f1, the square the king crosses to reach g1, so O-O is illegal this turn.\n\nFor now, we're **just learning**. You'll try it yourself soon.",
      quizBoardHighlight: {
        arrows: [{ from: 'a6', to: 'f1', color: D15_MOVED }],
        squares: [{ square: 'f1', color: D15_MOVED }],
      },
      doneText: "f1 is attacked. The king **can't cross it**, so O-O is out.",
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p5a-queen-attacks-landing-square',
      kind: 'quiz',
      fen: '4k3/8/6q1/8/8/8/8/R3K2R w KQ - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Position 5: A Queen Attacks the Landing Square',
      introText:
        "Same idea, different square. Now g1 itself, where the king would land, is covered by the black queen on the g-file. **Landing square attacked** means no castling to that side, even with no check and no king move.\n\nFor now, we're **just learning**. You'll try it yourself soon.",
      quizBoardHighlight: {
        arrows: [{ from: 'g6', to: 'g1', color: D15_MOVED }],
        squares: [
          { square: 'g1', color: D15_MOVED },
          { square: 'd1', color: D15_AVAILABLE },
          { square: 'c1', color: D15_AVAILABLE },
        ],
      },
      doneText: 'g1 is attacked. O-O is out, **O-O-O is still open**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p5b-castle-queenside',
      kind: 'puzzle',
      fen: '4k3/8/6q1/8/8/8/8/R3K2R w KQ - 0 1',
      orientation: 'w',
      solution: ['e1c1'],
      prompt: 'One Castle Is Still Possible Here',
      introText: 'Find the castle that is **still legal**.',
      doneText: 'O-O-O. The **queenside castle** was still legal.',
      hintText:
        "We want **a castle** here. Other moves aren't the point right now.",
    },
    {
      id: 'p6a-irrelevant-square',
      kind: 'quiz',
      fen: 'r3k3/8/8/8/8/8/8/1Q2K3 b q - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Position 6: The Trick, an Attacked Square That Doesn't Matter",
      introText:
        "The part almost nobody knows. Castling is only blocked by **squares the king itself touches**: where it starts, every square it crosses, and where it lands. For Black's queenside castle that's e8, d8 and c8 only. b8 doesn't count: the rook passes it, the king never does.\n\nFor now, we're **just learning**. You'll try it yourself soon.",
      quizBoardHighlight: {
        arrows: [{ from: 'b1', to: 'b8', color: D15_IRRELEVANT }],
        squares: [
          { square: 'b8', color: D15_IRRELEVANT },
          { square: 'e8', color: D15_AVAILABLE },
          { square: 'd8', color: D15_AVAILABLE },
          { square: 'c8', color: D15_AVAILABLE },
        ],
      },
      doneText: 'Only squares **the king itself touches** matter.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p6b-yes-or-no',
      kind: 'quiz',
      fen: 'r3k3/8/8/8/8/8/8/1Q2K3 b q - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt:
        'So: Is Black’s Queenside Castle Still Legal Here, Even With White’s Queen Attacking b8?',
      introText:
        'Is Black’s queenside castle **still legal** here, with White’s queen on b1 attacking b8?',
      quizOptions: ['Yes', 'No'],
      quizCorrectIndex: 0,
      quizRetryOnWrong: true,
      quizExplanationWrong:
        'Check which squares **the king** actually touches.',
      quizExplanation:
        "Yes, it's legal. It doesn't look it. The queen attacks b8, a square the king **never crosses or lands on**, so it changes nothing. Only e8, d8 and c8 matter.",
      quizAutoPlayMove: 'e8c8',
      quizBoardHighlight: {
        arrows: [{ from: 'b1', to: 'b8', color: D15_IRRELEVANT }],
        squares: [
          { square: 'b8', color: D15_IRRELEVANT },
          { square: 'e8', color: D15_AVAILABLE },
          { square: 'd8', color: D15_AVAILABLE },
          { square: 'c8', color: D15_AVAILABLE },
        ],
      },
      quizBoardHighlightUpfront: true,
      doneText:
        "Yes, it's legal. It doesn't look it. The queen attacks b8, a square the king **never crosses or lands on**, so it changes nothing. Only e8, d8 and c8 matter.",
      hintText: '',
      // Bez ovoga, "Got it!" dobija pun auto-advance tretman (pulsira i sam
      // se napuni/klikne) cim se otkljuci - cak i posle NETACNOG odgovora
      // (quizRetryOnWrong ga otkljucava namerno, vidi DailyLessonActivity).
      // To bi odgurnulo korisnika dalje pre nego sto stigne da odluci da li
      // zeli da proba ponovo - retry inace nema poentu.
      noAutoAdvance: true,
      nextButtonText: 'Got it',
    },
    {
      id: 'ps-reminder',
      kind: 'quiz',
      fen: '2kr4/8/8/8/8/8/8/1Q2K3 w - - 1 2',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'One More Thing to Remember',
      introText:
        "One more thing: castling is **a king move**. Over the board or online, you move the king two squares toward the rook. Never touch the rook first. That's the habit to build.\n\nFor now, we're **just learning**. You'll try it yourself soon.",
      doneText:
        'Castling is always **a king move**, two squares toward the rook.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    // ---------- Part 2 ----------
    {
      id: 'part2-intro',
      kind: 'quiz',
      fen: 'r3k3/8/8/8/8/3B4/8/6K1 w q - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Stop the Castle!',
      introText:
        "Now flip it around: you're the one trying to **stop your opponent** from castling. Find the move.",
      doneText: 'Time to **take that option away** from your opponent.',
      hintText: '',
      // "Got it!" ne odgovara ovde - korisnik jos nije nista "shvatio", tek
      // kreće u akciju. "Let's Go" je prirodniji poziv na pocetak vezbe.
      nextButtonText: "Let's Go",
    },
    {
      id: 'puzzle1-bishop',
      kind: 'puzzle',
      fen: 'r3k3/8/8/8/8/3B4/8/6K1 w q - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'denyCastleQueenside',
      hintMove: 'd3f5',
      prompt: 'Puzzle 1: Cut It Off With a Bishop',
      introText:
        'White to move. Black is ready to castle queenside. **Find the move** that stops it.',
      extraHintText:
        "Which diagonal from your bishop reaches **Black's back rank**?",
      wrongMoveHighlight: {
        arrows: [{ from: 'f5', to: 'c8', color: D15_MOVED }],
        squares: [{ square: 'c8', color: D15_MOVED }],
      },
      doneText:
        "Exactly. Bf5 **covers c8**, the king's landing square. No legal O-O-O for Black now.",
      hintText: "That doesn't **stop the castle**. Try again.",
      // Ba6 TAKODJE pokriva c8 (druga dijagonala) - radi, ali je lovac
      // zakopan u uglu bez razloga, pa trazimo bolje polje (requireRetry).
      // Bb5/Bg6 ne pokrivaju c8 uopste - deny-uju rokadu DAVANJEM SAHA
      // (chess.js: kralj mora da se pomeri, nema cime da blokira/uzme), sto
      // je potpuno drugaciji (i ispravan) mehanizam - sopstven doneText, ne
      // generican "Bf5 covers c8" tekst koji bi bio netacan za njih.
      altSolutions: [
        {
          uci: 'd3a6',
          requireRetry: true,
          retryMessage:
            'That stops the castle. It also leaves your bishop **stuck in the corner** for nothing. Find a square that does the same job.',
          doneText:
            'Ba6 also covers c8, same as Bf5, from a **much less useful square**.',
        },
        {
          uci: 'd3b5',
          doneText:
            "Check. Black can't block or capture, so the king must move, and then queenside castling is **gone for good** (remember Position 1).",
        },
        {
          uci: 'd3g6',
          doneText:
            "Check. Black can't block or capture, so the king must move, and then queenside castling is **gone for good** (remember Position 1).",
        },
      ],
    },
    {
      id: 'puzzle2-queen',
      kind: 'puzzle',
      fen: 'r3k3/1p6/2p5/8/8/8/8/6KQ w q - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'denyCastleQueenside',
      hintMove: 'h1h4',
      // Qh3 TAKODJE radi, ali napada DRUGO polje (c8 - polje sletanja, ne
      // d8 - polje prelaska) - sopstven doneText da objasnjenje odgovara
      // stvarno odigranom potezu, ne uvek istom hardkodovanom Qh4 tekstu.
      altSolutions: [
        {
          uci: 'h1h3',
          doneText:
            "Got it, Qh3 **covers c8**, the king's landing square. Same result, different square.",
        },
        // sah gde crni MORA kraljem (chess.js) - rokada nestaje zauvek
        {
          uci: 'h1h5',
          doneText:
            "That works too. It's **check**, so the king has to move. And once the king moves, castling is **gone for good**.",
        },
        {
          uci: 'h1e4',
          doneText:
            "That works too. It's **check**, so the king has to move. And once the king moves, castling is **gone for good**.",
        },
        {
          uci: 'h1h8',
          doneText:
            "That works too. It's **check**, so the king has to move. And once the king moves, castling is **gone for good**.",
        },
        // sah, ali crni moze da uzme damu (bxc6) i zadrzi rokadu
        {
          uci: 'h1c6',
          doneText:
            "It's **check**, so no castling this turn. Your queen is **hanging**, though: Black takes it with bxc6.",
        },
      ],
      prompt: 'Puzzle 2: Cut It Off With a Queen',
      introText:
        'Same idea, bigger piece. **Find the queen move** that stops Black’s castle.',
      extraHintText:
        'Look at the diagonal from h4 or h3. Which back-rank square does it reach, and does **the king pass through it**?',
      wrongMoveHighlight: {
        arrows: [
          { from: 'h4', to: 'd8', color: D15_MOVED },
          { from: 'h3', to: 'c8', color: D15_MOVED },
        ],
        squares: [
          { square: 'h3', color: D15_SPOTLIGHT },
          { square: 'h4', color: D15_SPOTLIGHT },
        ],
      },
      doneText:
        "Got it, Qh4 **hits d8**, the square the king has to pass through. Doesn't matter that c8 itself is totally safe.",
      hintText: "That doesn't **stop the castle**. Try again.",
    },
    {
      id: 'puzzle3-knight',
      kind: 'puzzle',
      fen: '4k2r/8/8/8/3N4/8/8/6K1 w k - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'denyCastleKingside',
      hintMove: 'd4e6',
      prompt: 'Puzzle 3: Cut It Off With a Knight',
      introText:
        'One more, with a knight. **Find the move** that stops Black’s kingside castle.',
      extraHintText:
        "Which knight move attacks a **dark square** right next to Black's king?",
      wrongMoveHighlight: {
        arrows: [
          { from: 'd4', to: 'e6', color: D15_SPOTLIGHT },
          { from: 'e6', to: 'f8', color: D15_MOVED },
        ],
        squares: [{ square: 'd4', color: D15_SPOTLIGHT }],
      },
      doneText:
        "Ne6! It **attacks f8**, right in the king's path. No legal O-O for Black now.",
      hintText: "That doesn't **stop the castle**. Try again.",
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Repeat Lesson', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

const DAY_16_PUZZLE_TIME: Lesson = {
  id: 'l1-d16-puzzle-time',
  level: 1,
  day: 16,
  title: 'Puzzle time!',
  endScreenTitle: '5 for 5.',
  // 5 tematski odvojenih puzli (razlicita figura/ideja svaki put), ne
  // ponovljena vezba istog tipa - jedna greska na puzzli 2 ne sme da oboji
  // i puzzle 1/3/4/5. Svaki dobija SVOJ segment na traci (vidi
  // Lesson.flatProgressSegments), obojen zeleno/roze nezavisno.
  flatProgressSegments: true,
  piece: {
    name: 'puzzle solving',
    glyph: '🧩',
    movement: 'static',
    bannerText: 'Puzzle Time!',
  },
  intro: {
    title: 'Puzzle time!',
    text: 'A puzzle is a chess position where you find the **best move** to win an advantage. This one is simple: one position, one move. Find the piece you can **take for free**. Tap it, then tap where it lands.',
  },
  introSteps: [
    {
      text: 'A puzzle is a chess position where you find the **best move** to win an advantage. This one is simple: one position, one move. Find the piece you can **take for free**. Tap it, then tap where it lands.',
      buttonText: 'Start Puzzling!',
    },
  ],
  steps: [
    {
      id: 'p1-queen-takes-queen',
      kind: 'puzzle',
      fen: '4k3/ppp2ppp/8/3q4/8/8/PPPQ1PPP/4K3 w - - 0 1',
      orientation: 'w',
      solution: ['d2d5'],
      prompt: 'White to play: take the free piece',
      introText: 'First one. Scan the board for anything **undefended**.',
      doneText: 'Queen captured. **Nothing traded back.**',
      hintText: 'Not that one. Something here is **hanging**. Look again.',
      extraHintText: 'Someone left their **queen** out in the open.',
    },
    {
      id: 'p2-rook-takes-bishop',
      kind: 'puzzle',
      fen: '8/1pp2k1p/6p1/p4p2/2Pb4/1P6/P2R1PPP/4K3 w - - 0 1',
      orientation: 'w',
      solution: ['d2d4'],
      prompt: 'White to play: take the free piece',
      introText: "Same idea. Check what your **rook's file** actually covers.",
      doneText: 'Rook takes **bishop**. On to the next.',
      hintText: 'Not quite. Look at the **file** your rook sits on.',
      extraHintText: "A **bishop** wandered onto your rook's line.",
    },
    {
      id: 'p3-bishop-takes-knight',
      kind: 'puzzle',
      fen: 'k6n/pppppp1p/8/8/8/8/PBPPPPPP/4K3 w - - 0 1',
      orientation: 'w',
      solution: ['b2h8'],
      prompt: 'White to play: take the free piece',
      introText: 'Longer reach this time. Follow the **diagonal** all the way.',
      doneText: 'All the way **across the board**.',
      hintText: 'Try again. Your bishop sees **further** than it looks.',
      extraHintText: 'Check the **far corner** of that diagonal.',
    },
    {
      id: 'p4-knight-takes-queen',
      kind: 'puzzle',
      fen: '1k6/p1pp1ppp/1pb5/4q3/1PP5/PQ1P1N2/4PPPP/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['f3e5'],
      prompt: 'White to play: take the free piece',
      introText: "Different piece, same question: **what's hanging?**",
      doneText: "Knight takes the **queen**. That's the whole move.",
      hintText:
        "Not that move. Knights jump in an **L**. Check what's in range.",
      extraHintText:
        "Knights jump in an L. **Queens** don't always see it coming.",
    },
    {
      id: 'p5-pawn-takes-bishop',
      kind: 'puzzle',
      fen: '1k1r3r/1pp2ppp/pn6/4b3/3P4/4P2N/PPP2PPP/2KR3R w - - 0 1',
      orientation: 'w',
      solution: ['d4e5'],
      prompt: 'White to play: take the free piece',
      introText: 'Last one. Find the **free piece** and close it out.',
      doneText:
        'Pawn does the work this time. Five puzzles, five pieces. Every one was **there for the taking**.',
      hintText: 'Not this time. Pawns only capture **to the side**.',
      extraHintText:
        "Pawns capture **sideways**, not straight. This one's ready.",
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
  ],
};

// Day 17 - CEO red svakog topa se boji automatski (vidi
// LessonStep.highlightRookRanks), ova boja ostaje samo za strelicu koja
// pokazuje liniju saha (top koji upravo sahira -> kraljevo polje).
const D17_CHECK = '#07DA63';

const DAY_17_TWO_ROOKS_CHECKMATE: Lesson = {
  id: 'l1-d17-two-rooks-checkmate',
  level: 1,
  day: 17,
  title: 'Two Rooks Checkmate',
  piece: {
    name: 'two rooks',
    glyph: '♜',
    movement: 'static',
  },
  intro: {
    title: 'Two Rooks Checkmate',
    text: 'Two rooks and a lone king. **No king support needed.** Two rooks, working together, force the king to the **edge of the board**.',
  },
  steps: [
    {
      id: 'step1-spread-out',
      kind: 'teach',
      fen: '8/8/8/4k3/8/R7/1R6/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['b2b4'],
      suggestedMove: { uci: 'b2b4', label: 'Rb4' },
      prompt: 'Spread your rooks out',
      introText:
        "The goal: **cut off** the opponent's king. Move the rook to shrink the king's space by **one more line**.",
      doneText:
        'Line your rooks up **side by side**, not on the same file. Stacked, they block each other. Spread out, they cover the whole board.',
      hintText:
        'Not that one. **Spread the rooks out**, not on top of each other.',
      // Ceo red svakog topa se oboji automatski posle poteza - vidi
      // LessonStep.highlightRookRanks (DailyLessonActivity.tsx onMove).
      highlightRookRanks: true,
      // Korisnik mora da STIGNE da pogleda obojene redove pre nego sto
      // predje dalje - bez ovoga tabla se zatamni i Got it! sam puca posle
      // par sekundi (standardno "Next spreman" ponasanje), tacno dok je
      // highlight najbitniji.
      noAutoAdvance: true,
      nextButtonText: 'Got it!',
    },
    {
      id: 'step2-cutoff-and-check',
      kind: 'teach',
      // Beli kralj na g1 dodat da FEN bude validan (svaka pozicija mora da
      // ima oba kralja) - isti neutralni ugao kao u sva ostala 3 FEN-a ove
      // lekcije, bezbedno van svih linija koje tura kontrolise.
      fen: '8/8/4k3/R7/1R6/8/8/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['b4b6'],
      suggestedMove: { uci: 'b4b6', label: 'Rb6+' },
      prompt: 'Cut off, then check',
      introText:
        'Now the king is cut off. One rook holds it there, **the other delivers check**. Make the move.',
      doneText:
        "One rook **cuts off a rank** so the king can't cross it. The other checks and **pushes the king back**.",
      hintText: 'Not that one. **The other rook** delivers the check.',
      quizBoardHighlight: {
        arrows: [{ from: 'b6', to: 'e6', color: D17_CHECK }],
      },
      highlightRookRanks: true,
      noAutoAdvance: true,
      transitionText:
        'After every check, **the jobs swap**. The rook that just checked becomes the new cutoff. The other lines up the next check.',
      nextButtonText: 'Got it!',
    },
    {
      id: 'step3-keep-your-distance',
      kind: 'teach',
      fen: '8/8/8/2k5/R7/1R6/8/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['b3h3'],
      suggestedMove: { uci: 'b3h3', label: 'Rh3' },
      prompt: 'Keep your distance',
      introText:
        'The king is closing in on your rook. Slide that rook **as far from the king as possible**, along the same rank.',
      doneText:
        "Check too close and the king **captures your rook**. Keep the cutoff rook on the same rank, slid all the way across, **out of the king's reach**. Then you push it down another rank.",
      hintText:
        'Not that one. Slide it all the way across the rank, **away from the king**.',
      // Zasto NE Rb5+ - top bi dao sah, ali kralj na c5 stoji odmah pored i
      // prosto bi ga pojeo. Vidljivo ODMAH, pre bilo kog pokusaja.
      wrongPathPreview: {
        arrows: [{ from: 'b3', to: 'b5' }],
        squares: ['b5'],
      },
      highlightRookRanks: true,
      noAutoAdvance: true,
      transitionText:
        'Now finish it yourself. Same idea, **five moves to mate**.',
      nextButtonText: 'Got it!',
    },
    {
      id: 'main-exercise',
      kind: 'puzzle',
      fen: '8/8/7k/8/R7/R7/8/6K1 w - - 0 1',
      orientation: 'w',
      // Belo (korisnik) / crno (fiksno, UVEK isti potez - nema engine/random
      // logike za protivnika, vidi resolveOpponentReply u lessonEngine.ts).
      solution: [
        'a4a5', // 1. Ra5
        'h6g6', // 1... Kg6 (fiksno)
        'a3b3', // 2. Rb3
        'g6f6', // 2... Kf6 (fiksno)
        'b3b6', // 3. Rb6+
        'f6e7', // 3... Ke7 (fiksno)
        'a5a7', // 4. Ra7+
        'e7d8', // 4... Kd8 (fiksno)
        'b6b8', // 5. Rb8#
      ],
      prompt: 'Mate in 5: finish it yourself',
      introText:
        'First, **cut off the king** when you can. Then split your rooks and **take turns checking**, all the way to mate.',
      hintText:
        'That could work too. Learn the method that **always gets you there** first.',
      // Isti fiksan tekst na SVAKI promasaj, bez variranja/eskalacije - tacno
      // kako tiket trazi ("Same flow every time").
      hintTextAlways: true,
      // Strelica do TACNO JEDNOG resenja se otkriva odmah na prvi promasaj,
      // ne tek posle Hint klika - "hint koji nikad ne nudi vise opcija".
      revealArrowOnWrongMove: true,
      highlightRookRanks: true,
      moveExplanations: {
        0: "Ra5 cuts off rank 5. The king can't cross it. Fewer squares, no way back.",
        2: "Rooks need room to move. Keep them off the same file, or they get in each other's way.",
        4: 'One rook holds the rank. The other checks. Same two jobs, every time.',
        6: "Same idea, roles swapped. This rook checks now, that one holds the line. The king's running out of board.",
      },
      moveHighlights: {
        4: { arrows: [{ from: 'b6', to: 'f6', color: D17_CHECK }] },
        6: { arrows: [{ from: 'a7', to: 'e7', color: D17_CHECK }] },
      },
      doneText: 'You can checkmate with **two rooks** now. Every time.',
      celebrate: true,
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Repeat lesson', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

const DAY_18_SECOND_GAME: Lesson = {
  id: 'l1-d18-second-game',
  level: 1,
  day: 18,
  title: 'Game 2.0',
  endScreenTitle: 'Second game complete.',
  // Pawny slika i dalje vidljiva (movement:'mascot', Pawny 2.0 - vidi
  // pawnyAvatar ispod) ali bez "Meet Pawny" re-intro teksta - samo ime i
  // snaga kao labela ispod slike, bot je vec predstavljen u Day 14.
  piece: {
    name: 'second game',
    glyph: '♟',
    movement: 'mascot',
    bannerText: 'Pawny 2.0',
    subBannerText: 'Rated 150–350',
  },
  intro: {
    title: 'Time for Game 2',
    text: "You've covered a lot since your first game. Time to test it. Same Pawny, a little sharper this time. Rated **150 to 350**, and paying more attention. Let's see what stuck.",
  },
  introSteps: [
    {
      text: "You've covered a lot since your first game. Time to test it. Same Pawny, a little sharper this time. Rated **150 to 350**, and paying more attention. Let's see what stuck.",
      buttonText: 'Ready',
    },
  ],
  // Day 18 "Pawny 2.0" - novi avatar kroz ceo chat (Pawny-jeve poruke I END
  // screen ostaju COACH poruke, ne diraju ovo - samo Pawny-jev lik u balonu).
  pawnyAvatar: '/pawny/pawny2.webp',
  steps: [
    {
      id: 'vs-pawny-2',
      kind: 'freePlay',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      solution: [],
      prompt: 'Your Second Game',
      introText: "Make your first move **whenever you're ready**.",
      hintText: '',
      doneText:
        "Second **real game** down. Still no puzzles, still no hints. That's the part that counts.",
      // Nema motivationMessages (Outposty) za ovu partiju - tiket trazi SAMO
      // Pawny-jeve poruke na svakih 5 poteza, isto kao Day 14, ali nov pool;
      // ne izmisljam dodatan trenerov sloj koji tiket ne trazi.
      freePlayMessages: [
        "I've been practicing since our last game. Don't get used to easy wins.",
        "Still can't tell you why the knight moves like that. Works though.",
        "This one's tighter than our first game. I think.",
        'I remember losing a piece right about here last time. Not today.',
        'Somebody taught me what a fork is. Watch out.',
        'I used to hang my queen every game. Down to every other game now.',
        "You've gotten better since Game 1. Rude, honestly.",
        'This is the part where I usually panic. Not yet.',
        "I looked up 'good chess moves' before this game. Didn't help much.",
        "Two games in and I still don't trust my own rooks.",
        "If I win this one, I'm retiring undefeated.",
        "You're playing like you've actually done the lessons.",
        'I upgraded from clueless to slightly less clueless.',
        "This board's seen one loss of mine already. Might see two.",
        'Whatever happens, this one counts more than the first.',
      ],
      // Malo manje nasumicnosti nego Day 14 default (0.8) - "malo ostriji"
      // Pawny. Relativno podesavanje, NE verifikovana 150-350 rtg kalibracija
      // (nema formule koja to povezuje).
      pawnyRandomMoveChance: 0.65,
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Play again', action: 'repeat' },
    { label: 'Done', action: 'done' },
    { label: 'Game Review', action: 'review' },
  ],
};

const DAY_19_PAWN_PROMOTION: Lesson = {
  id: 'l1-d19-pawn-promotion',
  level: 1,
  day: 19,
  title: 'Pawn Promotion',
  // 4 tematski odvojena primera (dve trke, dve odbrane) - jedna greska na
  // bilo kom od njih ne sme da oboji i ostala tri (vidi
  // Lesson.flatProgressSegments).
  flatProgressSegments: true,
  piece: {
    name: 'pawn promotion',
    glyph: '♟',
    movement: 'static',
    bannerText: 'Pawn Promotion',
  },
  // Tiket nema poseban onboarding popup za ovu lekciju (za razliku od Day16/18) -
  // ovaj uvodni tekst sam napisala, standardan jedan ekran, "Let's start".
  intro: {
    title: 'Pawn Promotion',
    text: 'A pawn that reaches the last rank **becomes a queen**. Racing to promote, or **stopping the other side** from doing it, decides plenty of endgames. Two racing drills, two defending.',
  },
  steps: [
    {
      id: 'example1-white-races',
      kind: 'puzzle',
      fen: '8/6kp/8/8/P7/8/K7/8 b - - 0 1',
      orientation: 'w',
      // 1...h5 (crno, auto) pa naizmenicno belo(user)/crno(auto) - crni UVEK
      // gura h-pesaka, nema engine/random logike za protivnika.
      solution: [
        'h7h5', // 1...h5 (auto)
        'a4a5', // 2.a5
        'h5h4', // 2...h4 (auto)
        'a5a6', // 3.a6
        'h4h3', // 3...h3 (auto)
        'a6a7', // 4.a7
        'h3h2', // 4...h2 (auto)
        'a7a8q', // 5.a8=Q
        'h2h1q', // 5...h1=Q (auto)
        'a8h1', // 6.Qxh1
      ],
      prompt: 'White to move: win the race',
      introText:
        'This looks like a real race. Who gets a queen first? **Move fast**.',
      doneText: 'You got there first. **Queen takes queen**, race won.',
      hintText:
        "You have to be **fast** with your pawn. That's the only real way through.",
      // Samo dama je tacna ovde - top/lovac/skakac bi usporili/promenili
      // ishod trke, ne samo "drugi ukus" kao kod Pawn lekcije.
      requireExactPromotion: true,
    },
    {
      id: 'example2-black-races',
      kind: 'puzzle',
      fen: '8/k7/p7/8/8/7P/7K/8 b - - 0 1',
      orientation: 'b',
      // Crno (user) na potezu prvo - belo UVEK gura h-pesaka, auto.
      solution: [
        'a6a5', // 1...a5
        'h3h4', // 2.h4
        'a5a4', // 2...a4
        'h4h5', // 3.h5
        'a4a3', // 3...a3
        'h5h6', // 4.h6
        'a3a2', // 4...a2
        'h6h7', // 5.h7
        'a2a1q', // 5...a1=Q
        'h7h8q', // 6.h8=Q
        'a1h8', // 6...Qxh8+
      ],
      prompt: 'Black to move: win the race',
      introText: 'Your turn to race. **Push and promote** before White does.',
      doneText: 'Queen takes queen. You **won the race**.',
      hintText: 'This is a pawn race. **Whoever queens first wins**.',
      requireExactPromotion: true,
    },
    {
      id: 'example3-catch-the-pawn-black',
      kind: 'puzzle',
      fen: '8/8/p7/3k4/7P/8/8/3K4 b - - 0 1',
      orientation: 'b',
      // Crno (user) na potezu prvo, NE autoplay belog poteza - FEN se
      // koristi tacno kakav je. Belo UVEK gura h-pesaka (auto), dok ga
      // crni kralj ne uhvati.
      //
      // Tiket je dao VISE "ispravnih" polja po koraku (npr. Ke4/Ke5/Ke6 na
      // 1. potezu) - chess.js provera je pokazala da te tabele nisu
      // medjusobno konzistentne (npr. f7 sa table za 2. korak NIJE legalan
      // potez sa e5, polja iz 1. koraka na kom ta tabela za 2. korak
      // ocigledno racuna). Glavna linija ide preko Ke5-Kf6-Kg6-Kxh7; sve
      // dodatne grane su chess.js-verifikovane i takodje hvataju pesaka:
      // Ke6 (1. potez, umesto Ke5), i sa oba (Ke5 ILI Ke6) kao 2. potez -
      // Kf6 (glavni), Kf7 ili Kg8 (samo posle Ke6) ili Kf5 (samo posle Ke5,
      // ali OBAVEZNO nastavlja f5-g6 direktno, NE f5-f6 - ta putanja kasni
      // tacno jedan tempo i NE hvata pesaka, provereno). Kf6/Kf5/Kf7 grane se
      // spajaju na g6 i hvataju na h7 (g6h7); Kg8 grana ide direktno na h7
      // SVOJIM putem (posle 4.h7+ sah, Kxh7 sa g8 - vidi altMoves[6]), ne
      // prolazi kroz g6. Ke4 namerno NIJE dodat (tiket to eksplicitno
      // ostavlja "your call", nisam nezavisno proverila tu granu) - javi ako
      // i njega treba.
      solution: [
        'd5e5', // 1...Ke5 (ili Ke6, vidi altMoves[0])
        'h4h5', // 2.h5
        'e5f6', // 2...Kf6 (ili e6f6/e5f5/e6f7, vidi altMoves[2])
        'h5h6', // 3.h6
        'f6g6', // 3...Kg6 (ili f5g6/f7g6/f7g8, vidi altMoves[4])
        'h6h7', // 4.h7
        'g6h7', // 4...Kxh7 (ili g8h7 ako je 3...Kg8, vidi altMoves[6])
      ],
      altMoves: {
        0: ['d5e6'],
        2: ['e6f6', 'e5f5', 'e6f7'],
        4: ['f5g6', 'f7g6', 'f7g8'],
        6: ['g8h7'],
      },
      prompt: 'Black to move: catch the pawn',
      introText:
        "Stop. Don't just push blindly. Check if your king can **catch the pawn** first. Time to practice stopping a promotion.",
      doneText:
        "You caught it. **That's a draw**. Your own pawn can't queen either, for the same reason.",
      hintText:
        "That doesn't keep you in the race. Try a square **closer to the pawn's path**.",
    },
    {
      id: 'example4-catch-the-pawn-white',
      kind: 'puzzle',
      fen: '8/k7/8/p7/8/4K3/8/8 w - - 0 1',
      orientation: 'w',
      // Belo (user) na potezu prvo. Crno UVEK gura a-pesaka (auto, nikad
      // nista drugo). Za razliku od Example 3 (gde su grane dodavane rucno,
      // jedna po jedna), ovde je ceo niz POTPUNO resen unapred - pomocni
      // node skript (ne engine eval, nego tacna retrogradna pretraga svih
      // belih kraljevih poteza na svakom dosegljivom cvoru, do kraja - king+
      // pawn vs king je dovoljno mala pozicija da se potpuno resi, pouzdanije
      // od oslanjanja na engine-ovu "0.00" procenu) ispisao SVAKI beli potez
      // na SVAKOM dosegljivom cvoru koji i dalje garantuje hvatanje pesaka.
      // Glavna linija ide preko Kd3-c3-b3xa2; sve grane dole su deo tog istog
      // potpunog resenja, ne naknadno dodavane.
      solution: [
        'e3d3', // 1.Kd3 (ili Kd4/Kd2, vidi altMoves[0])
        'a5a4', // 1...a4
        'd3c3', // 2.Kc3 (ili Kc4/Kc2/Kc1 u zavisnosti od 1. poteza, altMoves[2])
        'a4a3', // 2...a3
        'c3b3', // 3.Kb3 (ili Kb1 u zavisnosti od 2. poteza, altMoves[4])
        'a3a2', // 3...a2
        'b3a2', // 4.Kxa2 (ili Kb1xa2, altMoves[6])
      ],
      altMoves: {
        0: ['e3d4', 'e3d2'],
        2: [
          // iz Kd4 grane
          'd4c3',
          'd4c4',
          // iz Kd2 grane
          'd2c3',
          'd2c1',
          'd2c2',
          // iz Kd3 (glavne) grane, dodatne opcije pored vec glavnog d3c3
          'd3c4',
          'd3c2',
        ],
        4: [
          'c4b3', // iz Kc4 (bilo koja grana koja tu stigne)
          'c1b1', // iz Kc1 (samo preko Kd2)
          'c2b3', // iz Kc2
          'c2b1', // iz Kc2, druga opcija
        ],
        6: ['b1a2'], // hvatanje sa b1 umesto b3
      },
      prompt: 'White to move: catch the pawn',
      introText:
        'Same idea, your turn to defend. **Catch the pawn** before it queens.',
      doneText: 'Pawn caught. You **stopped the promotion**.',
      hintText: "That doesn't get you **closer to the pawn**. Think again.",
      celebrate: true,
    },
  ],
  endScreenTitle: 'You are Pawn Promotion Master!',
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Repeat lesson', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

// Day 20 Phase 2 - linije dame koje drze "kutiju" oko kralja
const D20_BOX = 'rgba(17, 198, 209, 0.45)';
const D20_FREE = 'rgba(7, 218, 99, 0.55)';
const d20Box = (squares: string[], free: string[] = []) => ({
  squares: [
    ...squares.map((square) => ({ square, color: D20_BOX, fill: true })),
    ...free.map((square) => ({
      square,
      color: D20_FREE,
      fill: true,
      dot: true,
    })),
  ],
});
const D20_FINAL_BOX = d20Box(
  ['b5', 'b6', 'b7', 'b8', 'a6', 'a5'],
  ['a7', 'a8']
);

const DAY_20_DELIVER_MATE: Lesson = {
  id: 'l1-d20-deliver-mate',
  level: 1,
  day: 20,
  title: 'Promote & Checkmate',
  piece: {
    name: 'checkmate',
    glyph: '♛',
    movement: 'static',
    bannerText: 'Deliver Mate',
  },
  intro: {
    title: 'Time to deliver mate',
    text: "You know how to promote a pawn. Now finish the game. Race to a **queen** first, then **checkmate** the lone king with it. Stuck? Hint's got you.",
  },
  introSteps: [
    {
      text: "You know how to promote a pawn. Now finish the game. Race to a **queen** first, then **checkmate** the lone king with it. Stuck? Hint's got you.",
      buttonText: "Let's Start",
    },
  ],
  steps: [
    {
      id: 'phase1-pawn-race',
      kind: 'puzzle',
      fen: '8/p7/1k6/6K1/8/8/7P/8 w - - 0 1',
      orientation: 'w',
      // Isti princip kao Day 19 trke - samo guranje pesaka je tacno, crni
      // UVEK gura a-pesaka (auto). Samo dama je tacna promocija (isti razlog
      // kao Day 19 - u trci je bilo koja druga figura stvarno pogresan izbor).
      solution: [
        'h2h4', // 1.h4
        'a7a5', // 1...a5 (auto)
        'h4h5', // 2.h5
        'a5a4', // 2...a4 (auto)
        'h5h6', // 3.h6
        'a4a3', // 3...a3 (auto)
        'h6h7', // 4.h7
        'a3a2', // 4...a2 (auto)
        'h7h8q', // 5.h8=Q
        'a2a1q', // 5...a1=Q (auto)
        'h8a1', // 6.Qxa1
        'b6c5', // 6...Kc5 (auto) - Phase 2 krece tacno odavde
      ],
      requireExactPromotion: true,
      moveExplanations: {
        8: "Take it. **Queen for queen**, and you're up a whole board.",
      },
      prompt: 'White to move: win the race',
      introText: 'Same idea as before. First queen wins the tempo. **Push**.',
      doneText:
        "Now finish it. **Corner the king**. Hint's there if you want it.",
      hintText: 'The only way to win this race: **push the pawn**.',
      // Korisnik treba vremena da pročita prelaznu poruku pre nego sto
      // klikne dalje u Phase 2 - vazna prekretnica, ne rutinski kraj koraka.
      noAutoAdvance: true,
      // Dugme koje prelazi u Phase 2 doslovno kaze "Start" (tiket: "U chatu
      // se pojavljuje dugme Start") - ovde je to isto dugme koje ucitava
      // sledeci korak (Phase 2 FEN se NASTAVLJA tacno odavde), ne posebna
      // in-chat komponenta - identican efekat (klik POKRECE Phase 2 i
      // TRENUTNO aktivira engine, jer je crni odmah na potezu).
      nextButtonText: 'Start',
    },
    {
      id: 'phase2-box-mate',
      kind: 'puzzle',
      // Nastavak posle 6...Kc5 (Phase 1). Ceo niz verifikovan u chess.js:
      // nijedan beli potez nije sah do mata, nigde pat.
      fen: '8/8/8/2k3K1/8/8/8/Q7 w - - 1 7',
      orientation: 'w',
      solution: [
        'a1a4', // 7.Qa4
        'c5d6', // 7...Kd6
        'a4e4', // 8.Qe4
        'd6c5', // 8...Kc5
        'e4d3', // 9.Qd3
        'c5b4', // 9...Kb4
        'd3c2', // 10.Qc2
        'b4b5', // 10...Kb5
        'c2c3', // 11.Qc3
        'b5a6', // 11...Ka6
        'c3b4', // 12.Qb4
        'a6a7', // 12...Ka7
        'b4b5', // 13.Qb5
        'a7a8', // 13...Ka8
        // Kralj ka c7 bilo kojim putem (uvek 4 koraka); crni ima samo a8/a7
        `${KING_APPROACH}c7`, // 14.Kf6 (npr.)
        ANY_LEGAL_REPLY, // 14...Ka7
        `${KING_APPROACH}c7`, // 15.Ke7
        ANY_LEGAL_REPLY, // 15...Ka8
        `${KING_APPROACH}c7`, // 16.Kd7
        ANY_LEGAL_REPLY, // 16...Ka7
        `${KING_APPROACH}c7`, // 17.Kc7
        ANY_LEGAL_REPLY, // 17...Ka8
        'b5b7', // 18.Qb7#
      ],
      kingApproachWrongText:
        'Bring your **king closer** to the enemy king. Any route works, as long as each step gets nearer.',
      stalemateText:
        "Careful, that's **stalemate**. The king has no move and isn't in check. Leave him a square.",
      // Qb8# je takodje kiss of death (dama do kralja, cuva je Kc7)
      altMoves: { 22: ['b5b8'] },
      otherTypeMoves: {
        22: [
          ...['b5a4', 'b5a5', 'b5a6'].map((uci) => ({
            uci,
            message:
              "Super, that's checkmate too. Today we're learning the **kiss of death**, though: queen right next to the king, guarded by yours.",
          })),
          ...['b5b6', 'b5c5'].map((uci) => ({
            uci,
            message:
              "Careful, that's **stalemate**. The king has no move and isn't in check. Leave him a square until the mate.",
          })),
        ],
      },
      keepMoveHighlights: true,
      moveExplanations: {
        0: "No check, just a wall. Rank 4 is closed. The king **can't come down**.",
        2: "The queen sits a **knight's jump** from the king. He's boxed in, a5 to d8.",
        4: 'Same trick, smaller box. Only **files a to c** left.',
        6: 'Two files left. Keep **shadowing** him.',
        8: "He steps, you follow at a **knight's jump**.",
        10: "One file left. He's **on the edge**.",
        12: "**REMEMBER THIS, IT MATTERS!** This is the picture you want for every queen mate. The king has just **2 squares**, a7 and a8. Always leave him at least one, or it's **stalemate**. Now it's your king's turn. **King up!**",
        14: 'The queen holds the box alone. Keep walking toward **c7**.',
        16: 'Closer.',
        18: 'One more step.',
        20: 'Now the queen goes **right next to the king**, guarded by yours.',
      },
      moveHighlights: {
        0: d20Box([
          'a4',
          'b4',
          'c4',
          'd4',
          'e4',
          'f4',
          'g4',
          'h4',
          'a5',
          'a6',
          'a7',
          'a8',
        ]),
        2: d20Box(['e4', 'a4', 'b4', 'c4', 'd4', 'e5', 'e6', 'e7', 'e8']),
        4: d20Box(['d3', 'a3', 'b3', 'c3', 'd4', 'd5', 'd6', 'd7', 'd8']),
        6: d20Box(['c2', 'a2', 'b2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8']),
        8: d20Box(['c3', 'a3', 'b3', 'c4', 'c5', 'c6', 'c7', 'c8']),
        10: d20Box(['b4', 'a4', 'b5', 'b6', 'b7', 'b8']),
        12: D20_FINAL_BOX,
        14: D20_FINAL_BOX,
        16: D20_FINAL_BOX,
        18: D20_FINAL_BOX,
        20: D20_FINAL_BOX,
      },
      prompt: 'Checkmate with Queen + King',
      introText:
        'No checks. The queen **boxes the king in**, step by step. Then your king comes up.',
      hintText:
        "Not that one. Follow the plan: **box first, no checks**, then bring your king. Hint's there.",
      hintTextAlways: true,
      doneText:
        'Checkmate. The **kiss of death**: queen next to the king, guarded by yours.',
    },
  ],
  endScreenTitle: 'Congrats! You just delivered a checkmate!',
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Repeat lesson', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

/**
 * Day 21 "Opposition" - svi FEN-ovi/potezi nizu E/F verifikovani i preko
 * chess.js i preko Lichess tablebase API-ja (ne samo chess.js legalnost -
 * STVARAN ishod dobija/remi), ne samo prepisani iz tiketa. Otkriveno pri
 * verifikaciji: u E (i njenom zrcalu F), POSTOJI drugi pobednicki potez osim
 * ciste opozicije (Kd6/Ke3 - kralj ide direktno ispred sopstvenog pesaka) -
 * tiket bi ga generickom "to pusta kralja nazad" porukom pogresno opisao kao
 * gubitak partije, pa ima sopstvenu, iskrenu poruku (otherTypeMoves ispod).
 */
const DAY_21_OPPOSITION: Lesson = {
  id: 'l1-d21-opposition',
  level: 1,
  day: 21,
  title: 'King Opposition',
  piece: {
    name: 'opposition',
    glyph: '♚',
    movement: 'static',
    bannerText: 'Opposition',
  },
  intro: {
    title: 'Opposition',
    text: "Two kings, **one empty square** between them. Whoever has to move first **gives ground**. That's what decides who promotes a pawn, or who's shut out for good.",
  },
  flatProgressSegments: true,
  steps: [
    {
      id: 'a-parallel-concept',
      kind: 'quiz',
      fen: '8/8/4k3/8/4K3/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Opposition',
      introText:
        'This is **opposition**. Kings facing off, one empty square between them, **same file or rank**. Whoever has to move gives ground. That lost ground is what lets a pawn slip through, or keeps one shut out for good.',
      doneText: 'Opposition: **one square** between, same file or rank.',
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'b-parallel-practice',
      kind: 'teach',
      fen: '8/8/4k3/8/8/4K3/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['e3e4'],
      prompt: 'Take the Opposition',
      introText: 'Play the move that takes the **opposition**.',
      doneText:
        "That's it. Same file, **one square gap**, black has to move next.",
      hintText:
        'Not lined up yet. Same file or rank, **one square** between the kings.',
      nextButtonText: 'Got it!',
    },
    {
      id: 'c-diagonal-concept',
      kind: 'quiz',
      fen: '8/8/5k2/8/3K4/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Diagonal Opposition',
      introText:
        "Opposition doesn't need to be in a straight line. **Same diagonal**, one square between them, works exactly the same way.",
      doneText: 'Opposition works on the **diagonal** too.',
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'd-diagonal-practice',
      kind: 'teach',
      fen: '8/8/5k2/8/8/3K4/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['d3d4'],
      prompt: 'Find the Diagonal',
      introText: 'Now find the **diagonal opposition**.',
      doneText:
        "Same idea, different angle. The gap's **on the diagonal** now. Black still has to give way.",
      hintText:
        'Not on the diagonal yet. Same distance from the corner square, **one gap** between the kings.',
      nextButtonText: 'Got it!',
    },
    {
      id: 'e-pawn-white',
      kind: 'puzzle',
      fen: '2k5/8/8/2PK4/8/8/8/8 w - - 0 7',
      orientation: 'w',
      // d5c6 (user, paralelna opozicija - dobija, provereno tablebase),
      // c8b8 (crni, skriptovano - tiket bira bas ovu granu, ne adaptivno),
      // c6d7 (user - dostize key square, provereno tablebase kao najbrzi mat).
      solution: ['d5c6', 'c8b8', 'c6d7'],
      otherTypeMoves: {
        0: [
          {
            uci: 'd5e6',
            message:
              "Good, that's the other kind of opposition. We need **the parallel one** here to keep the king out.",
          },
          {
            uci: 'd5d6',
            message:
              "That still keeps the win, just not the opposition trick we're drilling. Try the move that **takes the opposition**.",
          },
        ],
      },
      prompt: 'Opposition Earns the Win',
      introText:
        "Here's why opposition actually matters! You've got the technique. Now use it: an extra pawn, and **opposition gets it home**.",
      moveExplanations: {
        0: "The king can't get back in front of the pawn now. **Attack c8** next. That's the square your pawn needs to promote. **Play Kd7**.",
      },
      quizBoardHighlight: {
        arrows: [{ from: 'c5', to: 'c8', color: CM_PROTECT }],
      },
      doneText:
        "Now there's a **clear path to promotion**. That's why opposition matters.",
      hintText:
        'That lets the king back in front of the pawn. Look for the move that **takes the opposition** instead.',
      nextButtonText: 'Got it!',
    },
    {
      id: 'f-pawn-black',
      kind: 'puzzle',
      fen: '8/8/8/8/3pk3/8/8/3K4 b - - 0 7',
      orientation: 'b',
      // e4d3 (user, paralelna opozicija - dobija, provereno tablebase),
      // d1e1 (belo, skriptovano), d3c2 (user - key square, provereno tablebase).
      solution: ['e4d3', 'd1e1', 'd3c2'],
      otherTypeMoves: {
        0: [
          {
            uci: 'e4f3',
            message:
              "Good, that's the other kind of opposition. We need **the parallel one** here.",
          },
          {
            uci: 'e4e3',
            message:
              "That still keeps the win, just not the opposition trick we're drilling. Try the move that **takes the opposition**.",
          },
        ],
      },
      prompt: 'Opposition Works Both Ways',
      introText:
        'Same idea, other side. Find the move that boots the white king **off d1**.',
      moveExplanations: {
        0: "Opposition doesn't care about color. Whoever takes it wins the tempo. **Attack d1** next. That's the square your pawn needs to promote. **Play Kc2**.",
      },
      quizBoardHighlight: {
        arrows: [{ from: 'd4', to: 'd1', color: CM_PROTECT }],
      },
      doneText:
        "Now there's a **clear path to promotion**. That's why opposition matters.",
      hintText:
        'That lets the white king slip back. Look for the move that **takes the opposition** instead.',
      nextButtonText: 'Got it!',
      celebrate: true,
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Repeat lesson', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

/**
 * Day 22 "Material" - 9 FEN-ova verifikovani preko chess.js (sabran zbir
 * vrednosti figura, p1/n3/b3/r5/q9, poredjen sa tiketovim "tacan odgovor" za
 * svaki primer) - svi se poklapaju, bez korekcija.
 *
 * Dva uvodna popup-a (razlicit title) - umesto novog mehanizma, kombinacija
 * DVA VEC POSTOJECA: `intro`+`introSteps` (JEDNOclan niz, samo da dugme bude
 * "Next" umesto default "Let's start") za popup 1, pa `steps[0].preStepIntro`
 * (sopstveni title + `bullets` za vrednosti figura) za popup 2 - lanac je
 * automatski (loadStep nakon showIntro odmah provери preStepIntro na prvom
 * koraku). "Dizajn asset" za King=infinity nije dat (nema Figma linka) -
 * ovde je to prost Unicode "∞" karakter uz tekst, ne custom icon.
 *
 * Faza 1 (4 primera) je fiksnim redosledom; Faza 2 (5 primera, tacno jednom,
 * random redosled) koristi novo `Lesson.shuffleStepsFrom: 4`. Zato SVAKI od
 * tih 5 nosi IDENTICAN `doneText` (= tekst sa End Screen-a) - koji god od
 * njih slucajno ispadne poslednji (shuffle), to je tekst koji ce se prikazati
 * (DialogContainer cita `step.doneText` sa POSLEDNJEG koraka za End Screen
 * telo, ne poseban Lesson-level tekst).
 */
const MATERIAL_PROMPT = 'Who has the material advantage?';
const MATERIAL_HINT =
  "Pawn: 1. Knight: 3. Bishop: 3. Rook: 5. Queen: 9. King: can't be traded. Now do the math. Simple math for you.";
const MATERIAL_END_TEXT =
  "That's the first read in every position, before a single move gets played. More material, you press it. Less material, you find another plan. This is where strategy starts.";

function materialStep(
  id: string,
  fen: string,
  introText: string,
  correct: 'White' | 'Black'
): LessonStep {
  const correctIndex = correct === 'White' ? 0 : 1;
  const wrongColor = correct === 'White' ? 'Black' : 'White';
  return {
    id,
    kind: 'quiz',
    fen,
    orientation: 'w',
    solution: ['quiz'],
    prompt: MATERIAL_PROMPT,
    introText,
    quizOptions: ['White', 'Black'],
    quizCorrectIndex: correctIndex,
    // quizRetryOnWrong (isto kao Day 15 "Yes/No") - netacan odgovor NE
    // zavrsava primer, dugmad se otkljucaju, korisnik proba ponovo, bez
    // ogranicenja broja pokusaja (tiketov zahtev).
    quizRetryOnWrong: true,
    quizExplanationWrong: `Count again. I'm not convinced ${wrongColor}'s ahead there. **Pawn 1, knight 3, bishop 3, rook 5, queen 9.**`,
    extraHintText: MATERIAL_HINT,
    unlimitedQuizHint: true,
    // Vidi komentar iznad DAY_22 - End Screen telo cita doneText sa
    // POSLEDNJEG koraka, a koji je poslednji zavisi od shuffle-a.
    doneText: MATERIAL_END_TEXT,
    hintText: '',
  };
}

const DAY_22_MATERIAL: Lesson = {
  id: 'l1-d22-material',
  level: 1,
  day: 22,
  title: 'Material',
  piece: {
    name: 'material',
    glyph: '⚖',
    movement: 'static',
    bannerText: 'Material',
  },
  intro: {
    title: "What's a position evaluation?",
    text: "Every position has a score. Part of that score is **material**: who's holding more piece value. Today you learn to count it. Get it right and **you'll know what to play for** before you make a move.",
  },
  introSteps: [
    {
      text: "Every position has a score. Part of that score is **material**: who's holding more piece value. Today you learn to count it. Get it right and **you'll know what to play for** before you make a move.",
      buttonText: 'Next',
    },
  ],
  shuffleStepsFrom: 4,
  steps: [
    {
      ...materialStep(
        'warmup-1-pawns',
        '6k1/pp6/8/8/8/8/PPPP4/6K1 w - - 0 1',
        'Just pawns here. Count them.',
        'White'
      ),
      // Popup 2 ("Quick refresher") - prikazuje se PRE ovog, prvog koraka,
      // posle popup 1. Bullets = sam reminder vrednosti figura, bez custom
      // asset-a (vidi komentar iznad DAY_22).
      preStepIntro: {
        title: 'Quick refresher',
        text: "Here's what each piece is **worth**:",
        bullets: [
          '♙ Pawn: 1',
          '♘ Knight: 3',
          '♗ Bishop: 3',
          '♖ Rook: 5',
          '♕ Queen: 9',
          "♔ King: ∞ (can't be traded)",
        ],
        buttonText: "Let's Start",
      },
    },
    materialStep(
      'warmup-2-knight',
      '6k1/4p3/2n5/8/8/8/4P3/6K1 w - - 0 1',
      'One knight makes the difference. Spot it?',
      'Black'
    ),
    materialStep(
      'warmup-3-rook',
      '8/4pk2/3p1p2/2p5/5P2/1P3KP1/P7/3R4 w - - 0 1',
      'One rook says it all.',
      'White'
    ),
    materialStep(
      'warmup-4-bishop',
      '8/4p3/3pk3/2p5/1bP2P2/3P1K2/4P3/8 w - - 0 1',
      'One bishop tips the scale.',
      'Black'
    ),
    materialStep(
      'main-1-rooks',
      '1nb2rk1/pp3ppp/8/8/8/8/PP3PPP/1NBR1RK1 w - - 0 1',
      "Count the **rooks** first, this one's not close.",
      'White'
    ),
    materialStep(
      'main-2-hidden-bishop',
      'r1bq1rk1/ppp1bppp/2np1n2/4p3/4P3/2NP1N1P/PPP1BPP1/R2Q1RK1 w - - 0 1',
      "Don't just scan the center, check **every square**.",
      'Black'
    ),
    materialStep(
      'main-3-queen-vs-rooks',
      '3q2k1/ppp2ppp/8/8/8/8/PPP2PPP/R4RK1 w - - 0 1',
      'A queen against two rooks. **Numbers over feelings**.',
      'White'
    ),
    materialStep(
      'main-4-pawn',
      'r2q1rk1/pppb1ppp/2np1n2/8/1b1PP3/2N2NP1/PPP2PBP/R1BQR1K1 w - - 0 1',
      'Just **one extra pawn** can be the whole story.',
      'White'
    ),
    materialStep(
      'main-5-bishops-vs-rook',
      '3r2k1/pp4pp/8/8/8/8/PP4PP/2B2BK1 w - - 0 1',
      'Two bishops against one rook. **Add it up**.',
      'White'
    ),
  ],
  endScreenTitle: 'You count material now.',
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Repeat lesson', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

/**
 * Day 23 "Bridge" - cista informativna lekcija, BEZ sahovske table
 * (Lesson.boardless - vidi DailyLessonActivity.tsx za novi layout). Samo 3
 * Learn kartice: trading = `introSteps`, vrednosti figura i rokada =
 * `preStepIntro` ispred pitanja 3 i 8, 10 kviz pitanja = `steps` (kind:'quiz', bez quizRetryOnWrong - svaki klik, tacan
 * ili ne, ide dalje, standardan Next klik izmedju). `fen`/`orientation` na
 * svakom koraku su placeholderi (tip ih zahteva), nikad se ne prikazuju.
 *
 * Nekoliko tiketovih rečenica je imalo "but" usred kontrastne misli (Corner
 * rule - bez jastucnih reci) - zamenjeno sa "yet", bez promene smisla:
 * kartica 7 (en passant) i 2 od 10 score-tier poruka (4/10, 3/10, 5/10) -
 * ostalo preneto verbatim iz tiketa.
 */
const BRIDGE_PIECE_VALUES_BULLETS = [
  '♙ Pawn: 1',
  '♘ Knight: 3',
  '♗ Bishop: 3',
  '♖ Rook: 5',
  '♕ Queen: 9',
  "♔ King: ∞ (can't be traded)",
];
const BRIDGE_CORRECT_POOL = ["That's it.", 'Right.', "That's the one."];

function bridgeQuizStep(
  id: string,
  prompt: string,
  question: string,
  options: [string, string, string],
  correctIndex: 0 | 1 | 2,
  preStepIntro?: LessonStep['preStepIntro']
): LessonStep {
  return {
    id,
    kind: 'quiz',
    preStepIntro,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    orientation: 'w',
    solution: ['quiz'],
    prompt,
    introText: question,
    quizOptions: options,
    quizCorrectIndex: correctIndex,
    quizCorrectFeedbackPool: BRIDGE_CORRECT_POOL,
    quizShowCorrectAnswerOnWrong: true,
    doneText: "Here's **how you did**.",
    hintText: '',
  };
}

const BRIDGE_CARD_VALUES: LessonStep['preStepIntro'] = {
  title: 'Quick refresher',
  text: "Here's what each piece is **worth**:",
  bullets: BRIDGE_PIECE_VALUES_BULLETS,
  buttonText: 'Got it',
};
const BRIDGE_CARD_CASTLING: LessonStep['preStepIntro'] = {
  title: 'Castling: yes or no',
  text: "You can castle if **neither the king nor that rook has moved**, nothing sits between them, and the king isn't in check, doesn't pass through check, and doesn't land in check. Break any of those, it's off the table.",
  buttonText: 'Got it',
};

const DAY_23_BRIDGE: Lesson = {
  id: 'l1-d23-bridge',
  level: 1,
  day: 23,
  title: 'Learn & Quiz Time',
  boardless: true,
  piece: {
    name: 'chess essentials',
    glyph: '♟',
    movement: 'static',
    bannerText: 'Chess Essentials',
  },
  intro: {
    title: 'Rule number 1: "Up material? Start trading."',
    text: "Fewer pieces on the board favors the side that's already ahead. Trade knights, bishops, rooks, queens. **Keep your pawns**, they're your endgame plan.",
  },
  introSteps: [
    {
      title: 'Rule number 1: "Up material? Start trading."',
      text: "Fewer pieces on the board favors the side that's already ahead. Trade knights, bishops, rooks, queens. **Keep your pawns**, they're your endgame plan.",
      buttonText: 'Start quiz',
    },
  ],
  steps: [
    bridgeQuizStep(
      'quiz-1-material',
      'Question 1 of 10',
      "You're **ahead in material**. What's usually the smart plan?",
      [
        'Trade pieces, keep your pawns',
        'Trade pawns, keep your pieces',
        'Avoid every trade',
      ],
      0
    ),
    bridgeQuizStep(
      'quiz-2-king-endgame',
      'Question 2 of 10',
      'When does the king become a **fighting piece**?',
      ['The opening', 'The middlegame', 'The endgame'],
      2
    ),
    bridgeQuizStep(
      'quiz-3-piece-value',
      'Question 3 of 10',
      'Which piece is **worth the most**?',
      ['Rook', 'Queen', 'Bishop'],
      1,
      BRIDGE_CARD_VALUES
    ),
    bridgeQuizStep(
      'quiz-4-origin',
      'Question 4 of 10',
      'Where did chess **originally come from**?',
      ['India', 'Italy', 'China'],
      0
    ),
    bridgeQuizStep(
      'quiz-5-ranks',
      'Question 5 of 10',
      'What do we call the rows that go **from 1 to 8** on the board?',
      ['Files', 'Ranks', 'Diagonals'],
      1
    ),
    bridgeQuizStep(
      'quiz-6-middlegame',
      'Question 6 of 10',
      'Which phase comes **right after the opening**?',
      ['Endgame', 'Middlegame', 'Checkmate'],
      1
    ),
    bridgeQuizStep(
      'quiz-7-promotion',
      'Question 7 of 10',
      "What's it called when your pawn **reaches the last rank** and becomes a queen?",
      ['En passant', 'Castling', 'Promotion'],
      2
    ),
    bridgeQuizStep(
      'quiz-8-castling',
      'Question 8 of 10',
      "You **can't castle** if...",
      [
        'Your king has already moved',
        'Your bishop already moved.',
        'You have more pawns than your opponent',
      ],
      0,
      BRIDGE_CARD_CASTLING
    ),
    bridgeQuizStep(
      'quiz-9-squares',
      'Question 9 of 10',
      'How many **squares** are on a chessboard?',
      ['32', '64', '100'],
      1
    ),
    bridgeQuizStep(
      'quiz-10-pawns',
      'Question 10 of 10',
      'How many **pawns** does each player start with?',
      ['6', '10', '8'],
      2
    ),
  ],
  scoreSummary: {
    stepIds: [
      'quiz-1-material',
      'quiz-2-king-endgame',
      'quiz-3-piece-value',
      'quiz-4-origin',
      'quiz-5-ranks',
      'quiz-6-middlegame',
      'quiz-7-promotion',
      'quiz-8-castling',
      'quiz-9-squares',
      'quiz-10-pawns',
    ],
    tiers: [
      {
        min: 10,
        title: 'Absolute genius',
        text: 'Absolute genius! Total chess mastery, **not a single wrong answer**!',
      },
      {
        min: 9,
        title: 'So close',
        text: 'So close! Just **one wrong answer** kept you from ultimate chess glory.',
      },
      {
        min: 8,
        title: 'Sharp mind',
        text: "Sharp mind! That's a **serious display** of chess knowledge.",
      },
      {
        min: 7,
        title: 'Solid score',
        text: 'Solid score! You clearly **know your chess stuff**, almost impressed!',
      },
      {
        min: 6,
        title: 'Not bad',
        text: 'Not bad! Your chess brain is definitely **starting to kick in**.',
      },
      {
        min: 5,
        title: 'Halfway there',
        text: 'Halfway there! Average score, yet we both know you can **push higher**.',
      },
      {
        min: 4,
        title: 'Ouch',
        text: 'Not a total disaster, yet your chess IQ is taking a hit. **Try again!**',
      },
      {
        min: 3,
        title: 'Keep practicing',
        text: 'Chess trivia is tough, yet you can definitely **do better** than this!',
      },
      {
        min: 2,
        title: 'Needs work',
        text: "Well, at least it's not a 1/10... barely! **Hit retry** and test your brain again.",
      },
      {
        min: 0,
        title: 'Back to the books',
        text: 'Ouch! Did you guess every answer with your eyes closed? Time to **open the books**!',
      },
    ],
  },
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Repeat Quiz', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

/**
 * Day 24 "Game 3" - treca prava Pawny partija, isti obrazac kao Day 14/18
 * (kind:'freePlay'). Pawny 3.0 avatar (slika koju je korisnica poslala,
 * sacuvana kao public/pawny/pawny3.webp).
 *
 * NAMERNO izostavljen "dinamicki opener" (prva poruka na osnovu STVARNOG
 * ishoda Game 2 za tog korisnika) - tiket sam predvidja ovaj fallback ako
 * podatak nije lako dostupan: "Ako to nije lako dostupno na backend-u...
 * fallback je da se prva poruka i dalje bira nasumicno iz pool-a". Provereno
 * citanjem koda (ne pogadjam): apps/chessroulette-web/prisma/schema.prisma
 * nema NIJEDAN model za ishod partije/lekcije po korisniku (samo
 * Account/Session/User/Chapter/Lesson/LessonTag - Lesson/LessonTag su za
 * drugaciju "Learn" opening funkciju, ne DailyLesson), a cela DailyLesson
 * progres/stanje je vec ustanovljeno kao session-only (Movex room state, ne
 * perzistira kroz lekcije - svaka lekcija je zaseban room/URL). Nema
 * backend endpoint-a niti bilo kakve postojece perzistencije da se ovo
 * precita pre starta Game 3 - ne izmisljam lazan/fake ishod. Pool od 15
 * poruka (dole) radi nepromenjeno, standardno nasumicno biranje bez
 * ponavljanja iste dva puta zaredom - ISTI generican mehanizam kao Day
 * 14/18, ne treba nista novo.
 *
 * Tiket pominje (ne kao Acceptance Criteria) da "treba razmisliti" o
 * 10-minutnom satu - korisnica je eksplicitno odlucila da ga NE zeli (ni
 * probni dodatak nije zadrzan) - partija ostaje netajmovana, isto kao Day
 * 14/18.
 */
const DAY_24_THIRD_GAME: Lesson = {
  id: 'l1-d24-third-game',
  level: 1,
  day: 24,
  title: 'Game 3.0',
  endScreenTitle: 'Third game complete.',
  piece: {
    name: 'third game',
    glyph: '♟',
    movement: 'mascot',
    bannerText: 'Pawny 3.0',
    subBannerText: 'Rated 200–400',
  },
  intro: {
    title: 'Time for Game 3',
    text: "Two games down against Pawny. This is the third, and **the sharpest yet**. Rated **200 to 400**. Let's see how close this one really is.",
  },
  introSteps: [
    {
      text: "Two games down against Pawny. This is the third, and **the sharpest yet**. Rated **200 to 400**. Let's see how close this one really is.",
      buttonText: 'Ready',
    },
  ],
  // Day 24 "Pawny 3.0" - novi avatar kroz ceo chat (isti princip kao Day 18
  // pawny2.webp).
  pawnyAvatar: '/pawny/pawny3.webp',
  steps: [
    {
      id: 'vs-pawny-3',
      kind: 'freePlay',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      solution: [],
      prompt: 'Game 3',
      introText: "Make your first move **whenever you're ready**.",
      hintText: '',
      doneText:
        "Third real game down. Still no puzzles, still no hints. **Three in a row** now, that's the part that counts.",
      // Nov, poseban pool - ne mesa se sa Day 14/18 pool-om (tiketov zahtev).
      freePlayMessages: [
        "Third game. I'm basically a veteran now.",
        'I actually knew that opening had a name this time.',
        "Two games taught me a few things. Let's see if I actually learned them.",
        "I still count on my fingers sometimes. Don't judge.",
        'This one I actually prepared for. Barely.',
        "Whatever the score is between us, today's the one that matters.",
        'Someone told me castling early is good. I did it. Feels weird.',
        "I've stopped hanging my queen in move ten. Progress.",
        "I've watched two of my own games back. Learned more than I expected.",
        "This board doesn't scare me anymore. The position still does.",
        "I know what a fork is now. Doesn't mean I can dodge one.",
        'Third game, same nerves, slightly better math.',
        "If this one goes sideways, I'm blaming the opening.",
        "I've read about the endgame. Reading and playing are different things.",
        "Two games made me stubborn, not smart. Let's go.",
      ],
      // Dalji korak u istom pravcu kao Day 14 (0.8) -> Day 18 (0.65) - "jos
      // ostriji" Pawny za Game 3 (tiket: +50 rtg na obe granice). Relativno
      // podesavanje, ISTA napomena kao Day 18 - nije verifikovana tacna rtg
      // kalibracija (nema formule koja ovaj broj povezuje sa rtg brojem).
      pawnyRandomMoveChance: 0.5,
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Play again', action: 'repeat' },
    { label: 'Done', action: 'done' },
    { label: 'Game Review', action: 'review' },
  ],
};

/**
 * Day 25 "Mate in One" - 5 jednopoteznih mat-zadataka, isti obrazac kao Day
 * 16 "Puzzle time!" (kind:'puzzle', jednoclan `solution`, `extraHintText` =
 * tiketov "Secret hint", standardni dvostepeni Hint - tier1 oznaci figuru
 * sa solution[0].from, tier2 doda strelicu - ne treba nista novo, isti
 * generican mehanizam kao svuda). Sve 5 pozicija nezavisno provereno preko
 * chess.js: legalne, nijedna nije vec u sahu, odigran potez je mat, I
 * (bitno, tiket to tvrdi) svaki je JEDINI legalan potez koji daje mat u toj
 * poziciji - potvrdjeno, bez korekcija.
 *
 * Tiket daje DVA razlicita teksta za trenutak zavrsetka 5. zagonetke - svoj
 * "On correct" red PO zagonetki ("Pawn holds the queen...") I poseban
 * "Completion screen" body ("Five mates, five patterns..."). Mehanizam ima
 * mesta za SAMO JEDAN (End Screen telo cita doneText POSLEDNJEG koraka, isti
 * princip kao Day 16/22/23) - zadrzala sam Completion screen tekst (on se
 * stvarno vidi u End Screen popup-u), ne obe verzije.
 */
const DAY_25_MATE_IN_ONE: Lesson = {
  id: 'l1-d25-mate-in-one',
  level: 1,
  day: 25,
  title: 'Checkmate in One with the Queen',
  endScreenTitle: '5 for 5.',
  flatProgressSegments: true,
  piece: {
    name: 'mate in one',
    glyph: '♕',
    movement: 'static',
    bannerText: 'Mate in One',
  },
  intro: {
    title: 'Mate in one',
    text: "Five positions, **one move each**. Your job: **find checkmate**. Tap the piece, then tap the square it mates from. Stuck? The hint's always there.",
  },
  introSteps: [
    {
      text: "Five positions, **one move each**. Your job: **find checkmate**. Tap the piece, then tap the square it mates from. Stuck? The hint's always there.",
      buttonText: 'Deliver Mate!',
    },
  ],
  steps: [
    {
      id: 'p1-back-rank',
      kind: 'puzzle',
      fen: '6k1/5ppp/8/8/8/8/4Q3/K7 w - - 0 1',
      orientation: 'w',
      solution: ['e2e8'],
      prompt: 'Queen mates on the back rank',
      introText:
        'Find the move that ends it. **His own pawns** are in the way.',
      doneText: "King's **out of moves**. Mate.",
      hintText: "Not yet. Look at what's **blocking his own escape**.",
      extraHintText:
        "His pawns never left home. Now they're the trap. Check the **back rank**.",
    },
    {
      id: 'p2-knight-support',
      kind: 'puzzle',
      fen: 'k7/8/8/N7/8/1Q6/8/4K3 w - - 0 1',
      orientation: 'w',
      solution: ['b3b7'],
      prompt: 'Queen mates with knight support',
      introText: "One move. Your knight's **already helping**.",
      doneText: "Not one square left. **That's mate.**",
      hintText: 'Not that square. The **knight** already covers one side.',
      extraHintText:
        'The knight already covers his escape. Find the **queen move** that finishes it.',
    },
    {
      id: 'p3-bishop-mate',
      kind: 'puzzle',
      fen: '7k/Q7/8/8/8/8/8/KB6 w - - 0 1',
      orientation: 'w',
      solution: ['a7h7'],
      prompt: 'Queen and bishop mate',
      introText: "One move finishes this. Your bishop's **lined up**.",
      doneText: 'Queen and bishop **close the door**. Mate.',
      hintText: 'Not quite. Your **bishop** already does half the work.',
      extraHintText:
        "Your bishop's already lined up. Bring the **queen in behind it**.",
    },
    {
      id: 'p4-rook-mate',
      kind: 'puzzle',
      fen: '7k/8/8/8/Q7/8/8/K5R1 w - - 0 1',
      orientation: 'w',
      solution: ['a4h4'],
      prompt: 'Queen and rook mate',
      introText: 'One move. Your rook already **cuts off an escape**.',
      doneText: 'Rook cuts, **queen finishes**. Mate.',
      hintText: 'Not that one. The **rook** already holds one side.',
      extraHintText:
        'The rook already cut off one side. **Queen takes the other.**',
    },
    {
      id: 'p5-pawn-mate',
      kind: 'puzzle',
      fen: 'k7/8/P7/8/8/8/8/1Q2K3 w - - 0 1',
      orientation: 'w',
      solution: ['b1b7'],
      prompt: 'Queen and pawn mate',
      introText: "One move. That pawn's doing **more than you think**.",
      doneText:
        'Five mates, five patterns, **one queen**. You found the move each time.',
      hintText: 'Not yet. One **pawn** already does half the job.',
      extraHintText: 'One pawn, one queen, **nowhere for the king** to go.',
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
  ],
};

/**
 * Day 26 "Perpetual Check" - tiket je oznacen kao "Day 25" (isti broj kao
 * prethodna lekcija) - ocigledna greska u numeraciji, nastavljam redosled
 * kao Day 26.
 *
 * Svo troje FEN-ova + skriptovane linije nezavisno provereno preko chess.js
 * (legalnost, sah na svakom potezu korisnika, nijedan korak slucajno mat/pat,
 * stvarna threefold repeticija na Primeru 2 - chess.js.isThreefoldRepetition()
 * === true). Primeri 1 i 3 (7 sahova) nisu provereni kroz DOSLOVNU
 * ponovljenu liniju (tiket daje samo delimican obrazac), nego kroz pravi
 * minimax: POSTOJI damin niz poteza koji garantuje 7 ciklusa saha BEZ MATA,
 * bez obzira KOJE legalno bekstvo kralj odabere u svakom koraku - jaca
 * garancija od "ova tacna linija radi", jer korisnik sme da odigra BILO KOJI
 * legalan sah (tiketov zahtev), ne samo kanonski.
 *
 * `requireLegalCheck` + ANY_LEGAL_CHECK/ANY_LEGAL_REPLY (vidi definicije) -
 * genericki mehanizam izgradjen za ovu lekciju: BILO KOJI legalan sah je
 * tacan potez (ne fiksno polje), protivnik (kralj) odgovara BILO KOJIM
 * legalnim potezom (uvek jedini legalan je bekstvo kraljem - provereno,
 * nijedna druga crna figura nikad nema legalan potez dok je kralj u sahu u
 * ovim pozicijama), a Hint strelica se racuna UZIVO (findSafeCheckMove,
 * lokalan minimax) jer fiksna "kanonska" linija prestaje da vazi cim kralj
 * (ili user) jednom odstupi od nje.
 *
 * "Highlight 6th rank" iz tiketovog opisa Primera 3 (vizuelno isticanje
 * celog 6. reda) NIJE dodato - nema postojeceg "highlight odmah pri
 * ucitavanju" mehanizma za puzzle korake van wrongPathPreview (semanticki
 * pogresna boja/svrha za ovo) - tekst vec kaze "along the 6th rank", nije u
 * Acceptance Criteria, pa nisam gradila nov mehanizam za to.
 */
function perpetualCheckSolution(checks: number): string[] {
  const arr: string[] = [];
  for (let i = 0; i < checks; i++) {
    arr.push(ANY_LEGAL_CHECK);
    if (i < checks - 1) arr.push(ANY_LEGAL_REPLY);
  }
  return arr;
}

const DAY_26_PERPETUAL_CHECK: Lesson = {
  id: 'l1-d26-perpetual-check',
  level: 1,
  day: 26,
  title: 'Perpetual Check',
  endScreenTitle: "That's perpetual check.",
  piece: {
    name: 'perpetual check',
    glyph: '♛',
    movement: 'static',
    bannerText: 'Perpetual Check',
  },
  intro: {
    title: 'Perpetual check',
    text: 'Check the king again and again. If it can never get away, **neither side can make progress**. That forces a draw. This is a **perpetual check**.',
  },
  introSteps: [
    {
      text: 'Check the king again and again. If it can never get away, **neither side can make progress**. That forces a draw. This is a **perpetual check**.',
      buttonText: "Let's go",
    },
  ],
  steps: [
    {
      id: 'example1-lone-king',
      kind: 'puzzle',
      fen: '6k1/8/8/8/4Q3/8/8/K7 w - - 0 1',
      orientation: 'w',
      solution: perpetualCheckSolution(7),
      requireLegalCheck: true,
      prompt: 'The queen alone chases a king with nowhere to hide',
      introText:
        "The queen alone chases this king, and **any check works**. Give check, over and over - that's the whole idea.",
      doneText:
        "Why perpetual check? When you're **down on material**, a draw is a good result. Now see it in real positions.",
      hintText:
        "The point: **check the king again and again**. Press Hint if you're stuck.",
      hintTextAlways: true,
      unsafeCheckText:
        "That's a check, just not the safe one. Find the check that keeps the king running forever.",
      extraHintText: 'Any legal check works here. **Keep the king running.**',
      nextButtonText: "Let's go!",
    },
    {
      id: 'example2-down-material',
      kind: 'puzzle',
      fen: '6k1/1pp3p1/p1n5/4b2Q/8/8/1r1r4/6K1 w - - 0 1',
      orientation: 'w',
      solution: perpetualCheckSolution(4),
      requireLegalCheck: true,
      prompt: 'Down material, saving half a point with a perpetual',
      introText:
        "Black is up in material. You're not winning this one. **The draw is sitting right here**. Don't let the king breathe.",
      doneText:
        "Same two squares, over and over. Black can't stop it. **Draw by repetition.**",
      hintText:
        "That's not check. Down this much material, **check is all you've got**. Try again, or use Hint.",
      hintTextAlways: true,
      unsafeCheckText:
        "That's a check, just not the one that holds the draw. Stick to the safe square.",
      extraHintText:
        'One of **two squares** keeps this going. Hint shows you which.',
    },
    {
      id: 'example3-sixth-rank',
      kind: 'puzzle',
      fen: '1k4rr/8/7b/7p/3Q1p2/7P/6P1/7K w - - 0 1',
      orientation: 'w',
      solution: perpetualCheckSolution(7),
      requireLegalCheck: true,
      prompt: 'A perpetual check along the 6th rank',
      introText:
        'Find the perpetual check along **the 6th rank**. Black is stronger on material here, and a draw would suit you. Just dance along the 6th rank.',
      doneText:
        'Check, check, check. The king **never gets a say**. Three examples, one pattern.',
      hintText:
        'Not check. Black is ahead on material. Stay on the **6th rank** and keep checking.',
      hintTextAlways: true,
      unsafeCheckText:
        "That's a check, just not the one that keeps the dance going. Find the safe square on the 6th rank.",
      extraHintText:
        'Stay on the **6th rank**. Hint shows you the exact square.',
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
  ],
};

/**
 * Day 27 "Chess Notation" - tiket je oznacen kao "Day 26" (isti broj kao
 * prethodna lekcija) - ocigledna greska u numeraciji, nastavljam kao Day 27.
 *
 * Sva 3 dela (A/B/C, 16 primera ukupno) NEMAJU auto-advance (`noAutoAdvance`
 * na svakom koraku) - korisnica eksplicitno trazila rucni Next klik svuda,
 * da stigne da pročita objasnjenje (prvobitno je bio auto-advance na tacan
 * odgovor, ukinut na njen zahtev). 4 kratke prelazne poruke (pocetna +
 * izmedju B/C + dve unutar C-ovog uvoda) NISU racunate u "16/16" traci
 * (vidi LessonStep.excludeFromProgress - nov, generican mehanizam).
 *
 * Deo B (markSquares) i netacan odgovor u Delu A/C - obelezavaju POGRESNO
 * izabrano polje na tabli (plavi okvir + crvena tackica - vidi
 * wrongMarkedSquare u DailyLessonActivity.tsx), uz TACNO polje istovremeno
 * (zeleno/zuto fill + plava tackica, `quizBoardHighlight`). Jedan pokusaj -
 * korak se odmah zavrsava i na netacan odgovor, korisnik bira kad ide dalje.
 */
// Puna (fill, ne outline) zuta pozadina za "koje je ovo polje" oznake -
// korisnica trazila, tanak 3px okvir se slabo video na praznoj tabli.
const NOTATION_SQUARE_FILL_COLOR = 'rgba(255, 199, 0, 0.55)';

function notationSquareQuiz(
  id: string,
  highlightSquare: string,
  options: [string, string],
  correctIndex: 0 | 1
): LessonStep {
  return {
    id,
    kind: 'quiz',
    fen: '8/8/8/8/8/8/8/8 w - - 0 1',
    orientation: 'w',
    solution: ['quiz'],
    prompt: 'Name the square',
    introText: "What's this square **called**?",
    quizOptions: options,
    quizCorrectIndex: correctIndex,
    // BEZ quizRetryOnWrong - jedan pokusaj, kao Deo B (korisnica eksplicitno
    // trazila da pogresan odgovor ne dozvoljava dalje pogadjanje, samo
    // oznacavanje pogresnog/tacnog polja na tabli pa rucni Next).
    quizExplanation: `Right. That's ${options[correctIndex]}.`,
    quizExplanationWrong:
      "Read it in **two steps**: find the letter below the square, then the number beside it. That's your square.",
    // Puna zuta pozadina (fill, ne outline) - korisnica trazila, tanak okvir
    // se slabo video na praznoj tabli. Zuta i ne plava/zelena - ovo je sam
    // PREDMET pitanja (prikazano UNAPRED, pre bilo kog odgovora), ne potvrda
    // tacnog odgovora.
    quizBoardHighlight: {
      squares: [
        {
          square: highlightSquare,
          color: NOTATION_SQUARE_FILL_COLOR,
          fill: true,
          dot: true,
        },
      ],
    },
    quizBoardHighlightUpfront: true,
    // Bez auto-advance-a - korisnica eksplicitno trazila rucni Next klik
    // kroz celu lekciju, da stigne da pročita objasnjenje.
    noAutoAdvance: true,
    // Slovo+broj animacija (vidi LessonStep.revealSquareAnimation) - i na
    // tacan i na netacan odgovor, korisnicin eksplicitan zahtev.
    revealSquareAnimation: true,
    doneText: 'Square named.',
    hintText: '',
  };
}

function notationFindSquare(
  id: string,
  targetSquare: string,
  introText: string,
  overrides: Partial<LessonStep> = {}
): LessonStep {
  return {
    id,
    kind: 'markSquares',
    fen: '8/8/8/8/8/8/8/8 w - - 0 1',
    orientation: 'w',
    solution: [targetSquare],
    prompt: 'Find the square',
    introText,
    // Bez strelica (korisnicin eksplicitan zahtev) - pogresno obelezeno
    // polje se vec vidi samo po sebi (plavi okvir + crvena tackica, vidi
    // wrongMarkedSquare u DailyLessonActivity.tsx), ovaj tekst samo
    // objasnjava METODU citanja koordinata. Korak se ODMAH zavrsava i na
    // netacan pokusaj (korisnik mora moci da klikne Next, ne ceka se drugi
    // pokusaj) - vidi finalizeMarkAttempt u DailyLessonActivity.tsx.
    firstMissText:
      "Let's read this one together. Follow the rank across, and the file up. Where they cross, that's your square.",
    retryPromptText: "Here's **the square**. Take a look, then we move on.",
    // Fill, ne outline - isti razlog kao gore (Part A) - bolje se vidi.
    quizBoardHighlight: {
      squares: [
        { square: targetSquare, color: '#07DA63', fill: true, dot: true },
      ],
    },
    // Slovo+broj animacija (vidi LessonStep.revealSquareAnimation) - i na
    // tacan i na netacan odgovor, korisnicin eksplicitan zahtev.
    revealSquareAnimation: true,
    doneText: "That's it. **Next square.**",
    hintText: '',
    ...overrides,
  };
}

function notationWriteMove(
  id: string,
  fen: string,
  moveUci: string,
  introText: string,
  options: [string, string],
  overrides: Partial<LessonStep> = {}
): LessonStep {
  return {
    id,
    kind: 'quiz',
    // `fen` je POLAZNA pozicija (figura na polazno polje, NE na odrediste) -
    // tabla stvarno odigra `moveUci` cim se korak ucita, korisnica trazila
    // da vidi PRAVI potez (npr. konj Ng1-f3), ne gotovu poziciju.
    fen,
    orientation: 'w',
    solution: ['quiz'],
    prompt: 'Write the move',
    introText,
    // LessonStep.playMoveOnLoad - odigraj potez CIM se korak ucita, pre bilo
    // kog odgovora (vidi beginStep u DailyLessonActivity.tsx).
    playMoveOnLoad: moveUci,
    quizOptions: options,
    quizCorrectIndex: 0,
    // BEZ quizRetryOnWrong - jedan pokusaj (vidi notationSquareQuiz iznad).
    quizExplanation: 'Right.',
    quizExplanationWrong:
      'Read it again: **letter below, number beside**. Where they cross is your square. Only one option matches.',
    // Bez auto-advance-a - korisnica eksplicitno trazila rucni Next klik
    // kroz celu lekciju, da stigne da pročita objasnjenje.
    noAutoAdvance: true,
    // Slovo+broj animacija na POLJU iz tacne notacije (npr. "Nf3" -> f3) -
    // vidi LessonStep.revealSquareAnimation.
    revealSquareAnimation: true,
    doneText: 'Move written.',
    hintText: '',
    ...overrides,
  };
}

const DAY_27_CHESS_NOTATION: Lesson = {
  id: 'l1-d27-chess-notation',
  level: 1,
  day: 27,
  title: 'Chess Notation',
  endScreenTitle: 'You can read the board now.',
  flatProgressSegments: true,
  piece: {
    name: 'chess notation',
    glyph: '♟',
    movement: 'static',
    bannerText: 'Chess Notation',
  },
  intro: {
    title: 'Chess notation',
    text: 'The board is built from files, A to H, and ranks, 1 to 8. Put them together and every square gets its own name: **a first name** (the letter) and **a last name** (the number).',
  },
  introSteps: [
    {
      text: 'The board is built from files, A to H, and ranks, 1 to 8. Put them together and every square gets its own name: **a first name** (the letter) and **a last name** (the number).',
      buttonText: "Let's learn!",
    },
  ],
  steps: [
    // ---------- Opening chat message (not counted in 16/16) ----------
    {
      id: 'intro-why-notation',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Chess notation',
      introText:
        "Notation isn't just for writing moves down. It's how you **see the whole board in your head**, and count moves ahead before you touch a piece.",
      doneText: "Let's get started.",
      hintText: '',
      nextButtonText: "Let's go!",
      excludeFromProgress: true,
    },
    // ---------- Part A - name the highlighted square (5) ----------
    notationSquareQuiz('a1-name-e4', 'e4', ['e5', 'e4'], 1),
    notationSquareQuiz('a2-name-a1', 'a1', ['a1', 'a8'], 0),
    notationSquareQuiz('a3-name-h8', 'h8', ['a8', 'h8'], 1),
    notationSquareQuiz('a4-name-c6', 'c6', ['c6', 'c5'], 0),
    notationSquareQuiz('a5-name-f2', 'f2', ['f7', 'f2'], 1),
    // ---------- Part B - find and mark the named square (5) ----------
    notationFindSquare(
      'b1-find-d5',
      'd5',
      "Now I'll give you the square. Find it on the board and mark it for me, right-click it on desktop, or tap it if you're on mobile. Find **d5**."
    ),
    notationFindSquare('b2-find-b3', 'b3', 'Find **b3**.'),
    notationFindSquare('b3-find-g7', 'g7', 'Find **g7**.'),
    notationFindSquare('b4-find-a4', 'a4', 'Find **a4**.'),
    notationFindSquare('b5-find-h1', 'h1', 'Find **h1**.', {
      transitionText: 'Now you learn how to **write moves**.',
      nextButtonText: 'Yeah!',
    }),
    // ---------- Part C intro (not counted in 16/16) ----------
    {
      id: 'c-intro-letters',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Writing moves',
      introText:
        'In notation: King is **K**, Queen **Q**, Rook **R**, Bishop **B**, Knight **N**. Pawns get **no letter**, just the square they land on. Clear?',
      doneText: 'Clear.',
      hintText: '',
      nextButtonText: 'Got it!',
      excludeFromProgress: true,
    },
    {
      id: 'c-intro-order',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Writing moves',
      introText:
        "Now that's clear, let's learn the order: first write the piece letter, then the file letter, then the rank number. An example is **Qd2**. Ready?",
      doneText: 'Ready.',
      hintText: '',
      nextButtonText: 'Yeap!',
      excludeFromProgress: true,
    },
    // ---------- Part C - write the move (6, one per piece) ----------
    // FEN je polazna pozicija (figura na polaznom polju) - svaka od ovih
    // odigra pravi potez (g1-f3, e6-h3, f1-g2, a2-a4, b1-d1, f1-g1) cim se
    // korak ucita. BAG otkriven uzivo (korisnica prijavila da NIJEDNA figura
    // nije vidljiva ni u jednom primeru) - koren je u deljenoj biblioteci
    // (ChessFENBoard.validateFenString, util-kit): SVAKA pozicija koja ima
    // bar jednu figuru (nije cisto prazna tabla) prolazi kroz chess.js
    // .load(), koji BACA gresku "missing king" bez oba kralja, pa
    // 'loadedChapter:import' tiho odbija FEN i tabla ostaje na STAROJ
    // (praznoj) poziciji. Popravka OVDE, u lekciji, ne u deljenoj biblioteci
    // (ta izmena bi trazila Dragutinovo odobrenje) - svaki primer sad ima
    // oba kralja, zbijena u uglove van puta demonstrirane figure, sto
    // zadovoljava chess.js validaciju bez diranja zajednickog koda. Svih 6
    // poteza ponovo verifikovano kao legalni (chess.js) SA kraljevima.
    notationWriteMove(
      'c1-knight-f3',
      'k7/8/8/8/8/8/8/K5N1 w - - 0 1',
      'g1f3',
      'The knight just landed on f3. How would you write this move?',
      ['Nc7', 'Nf3'],
      { quizCorrectIndex: 1 }
    ),
    notationWriteMove(
      'c2-queen-h3',
      'k7/8/4Q3/8/8/8/8/K7 w - - 0 1',
      'e6h3',
      'The queen just landed on h3. How would you write this move?',
      ['Qh3', 'Qe6']
    ),
    notationWriteMove(
      'c3-bishop-g2',
      'k7/8/8/8/8/8/8/K4B2 w - - 0 1',
      'f1g2',
      'The bishop just landed on g2. How would you write this move?',
      ['Bb7', 'Bg2'],
      { quizCorrectIndex: 1 }
    ),
    notationWriteMove(
      'c4-pawn-a4',
      '7k/8/8/8/8/8/P7/7K w - - 0 1',
      'a2a4',
      'With pawns, remember: you never write a letter first, just the square it lands on. How would you write this move?',
      ['a4', 'Pa4'],
      {
        quizExplanationWrong:
          'Pawns **never get a letter** in notation, just their square.',
      }
    ),
    notationWriteMove(
      'c5-rook-d1',
      // top na b1, ne a1 - sa a1 bi vec davao sah kralju na a8
      'k7/8/8/8/8/8/8/1R5K w - - 0 1',
      'b1d1',
      'The rook just landed on d1. How would you write this move?',
      ['Rd8', 'Rd1'],
      { quizCorrectIndex: 1 }
    ),
    notationWriteMove(
      'c6-king-g1',
      'k7/8/8/8/8/8/8/5K2 w - - 0 1',
      'f1g1',
      'The king just landed on g1. How would you write this move?',
      ['Kg1', 'Kg8'],
      {
        celebrate: true,
        doneText:
          "Every square has a name. Every move has a notation. That's **the whole language**.",
      }
    ),
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

/**
 * Day 28 "My First Opening with White - London" - tiket eksplicitno trazi
 * ponasanje istovetno postojecem London System ucenju u LearnAi aktivnosti
 * (openingDatabase.ts), samo uklopljeno u DailyLesson format (popup na
 * pocetku, zavrsni ekran sa Test Opening/Done/Play umesto standardnog).
 * Potezi se CITAJU odavde (ne prekucavaju), jedini izvor istine za liniju -
 * ponovo verifikovano chess.js da je svih 17 poteza legalno. Prozni opisi su
 * ipak nasi (vidi napomenu uz import iznad).
 */
const LONDON_MAIN_LINE: string[] =
  OPENING_DATABASE.find((f) => f.name === 'London System')?.variants.find(
    (v) => v.variantName === 'Main Line'
  )?.moves ?? [];

const DAY_28_FIRST_OPENING: Lesson = {
  id: 'l1-d28-first-opening-london',
  level: 1,
  day: 28,
  title: 'My First Opening with White - London',
  endScreenTitle: 'You played your first opening! 🎉',
  piece: {
    name: 'the London System',
    glyph: '♗',
    movement: 'static',
    bannerText: 'Your First Opening',
  },
  intro: {
    title: 'Your First Opening',
    text: "Now you're a real Player. It's time to learn the first moves of **an opening**. Let's start with a simple one and learn step by step!",
  },
  introSteps: [
    {
      text: "Now you're a real Player. It's time to learn the first moves of **an opening**. Let's start with a simple one and learn step by step!",
      buttonText: 'Start',
    },
  ],
  steps: [
    {
      id: 'guided-london',
      kind: 'puzzle',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      solution: LONDON_MAIN_LINE,
      showSolutionArrowUpfront: true,
      revealArrowOnWrongMove: true,
      prompt: 'Your First Opening: The London System',
      introText:
        "Let's play it together, **one move at a time**. Follow the arrow, I'll take care of Black.",
      hintText: "Not quite. Follow **the London System's** plan.",
      illegalMoveText:
        "That's an **illegal move**. Follow the London System line. Stuck? Tap **Hint**.",
      // Pise se posle KORISNIKOVOG (belog) poteza, kad je crni auto-odgovor
      // vec odigran - indeks prati solution[] (parni = beli potezi).
      moveExplanations: {
        0: '**The London System** starts in the center. Both sides grab a central pawn right away.',
        2: 'Knights **develop** first, nothing fancy yet.',
        4: "The bishop leaves home for **f4** before the e-pawn can box it in. That's the whole point of the London. Black opens a path for the other bishop.",
        6: 'White **supports the center**. Black develops, eyeing the bishop on f4.',
        8: 'Rather than trade it off, the bishop steps back to **g3**. Black castles into safety.',
        10: 'The last knight joins in. Black strikes back at the center with **c5**.',
        12: 'White **reinforces d4**. Black finishes developing.',
        14: 'The other bishop joins the game. Black **trades off** the one on g3.',
      },
      doneText:
        "You just played a complete London System, from the first pawn move to a safe, developed position. **Castled king, solid center, every piece in play.** That's a real opening.",
      transitionText:
        "Now let's see if it stuck. Same opening, this time **from memory**.",
    },
    {
      id: 'test-london',
      kind: 'puzzle',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      solution: LONDON_MAIN_LINE,
      // BEZ strelice unapred - ovo je test, ne vodjenje. Hint dugme (standardni
      // dvostepeni sistem) ostaje dostupno ako zatreba.
      prompt: 'Test Yourself: The London System',
      introText:
        "Let's see if it stuck. Play the same opening again, this time **from memory**. I'll take care of Black.",
      hintText: 'Think back to the **pattern** you just played.',
      illegalMoveText:
        "That's an **illegal move**. Follow the London System line. Stuck? Tap **Hint**.",
      doneText: 'You know **the London System** now. That line is yours.',
    },
  ],
  testStepId: 'test-london',
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Test Opening', action: 'testOpening' },
    { label: 'Done', action: 'done' },
  ],
};

/**
 * Day 29 "My First Opening with Black - Caro-Kann" - isti princip kao Day
 * 28 (vidi napomene tamo), samo orijentacija 'b' (korisnik igra crnog,
 * belo prvi potez automatski odigra engine - isti generican mehanizam kao
 * puzzle koraci gde prvi potez pripada protivniku, vidi beginStep). Nema
 * "Main Line" varijante u bazi za Caro-Kann, pa je izabrana 'Classical
 * Variation' (B18) - najpoznatija/udzbenicka linija koja pokazuje PRAVU
 * ideju otvaranja (lovac izlazi na f5 PRE e6, izbegavajuci francusku manu).
 * 19 poteza, ponovo verifikovano chess.js.
 */
const CARO_KANN_CLASSICAL_LINE: string[] =
  OPENING_DATABASE.find((f) => f.name === 'Caro-Kann Defense')?.variants.find(
    (v) => v.variantName === 'Classical Variation'
  )?.moves ?? [];

const DAY_29_FIRST_OPENING_BLACK: Lesson = {
  id: 'l1-d29-first-opening-caro-kann',
  level: 1,
  day: 29,
  title: 'My First Opening with Black - Caro-Kann',
  endScreenTitle: 'You played your first opening as Black! 🎉',
  piece: {
    name: 'the Caro-Kann Defense',
    glyph: '♝',
    movement: 'static',
    bannerText: 'Your First Opening (Black)',
  },
  intro: {
    title: 'Your First Opening with Black',
    text: "You've learned your first moves with White, but now let's do **Black**. Easy and simple, as always!",
  },
  introSteps: [
    {
      text: "You've learned your first moves with White, but now let's do **Black**. Easy and simple, as always!",
      buttonText: 'Start',
    },
  ],
  steps: [
    {
      id: 'guided-caro-kann',
      kind: 'puzzle',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'b',
      solution: CARO_KANN_CLASSICAL_LINE,
      showSolutionArrowUpfront: true,
      revealArrowOnWrongMove: true,
      prompt: 'Your First Opening: The Caro-Kann Defense',
      introText:
        "Let's play it together, **one move at a time**. Follow the arrow, I'll take care of White.",
      hintText: "Not quite. Follow **the Caro-Kann's** plan.",
      illegalMoveText:
        "That's an **illegal move**. Follow the Caro-Kann line. Stuck? Tap **Hint**.",
      // Pise se posle KORISNIKOVOG (crnog) poteza, kad je beli auto-odgovor
      // vec odigran - indeks prati solution[] (neparni = crni potezi, prvi
      // potez 0 je belog i vec je auto-odigran pre nego sto korisnik i
      // pocne).
      moveExplanations: {
        1: '**The Caro-Kann** starts with c6, preparing ...d5 without blocking the light-squared bishop, the usual problem in the French. White claims more center with d4.',
        3: 'Black strikes the center with **d5**. White develops a knight, adding pressure on that pawn.',
        5: 'Black trades on e4. White recaptures with the knight, **centralizing** it.',
        7: "The whole point of the Caro-Kann: the bishop gets out to **f5** before e6 locks it in. White's knight hops to g3, eyeing the bishop.",
        9: 'The bishop tucks back to g6, out of reach. White starts **pushing the h-pawn**, gaining space and eyeing the bishop.',
        11: "Black plays h6, a useful little move that keeps White's pieces out of g5. White develops the other knight.",
        13: 'Black brings out a knight. White pushes the h-pawn again, **attacking the bishop**.',
        15: 'The bishop retreats once more, to h7. White develops the last bishop, eyeing it right back.',
      },
      doneText:
        "You just played a complete Caro-Kann Defense as Black, trading when it helped and keeping your position solid the whole way. **That's a real opening, from the other side of the board.**",
      transitionText:
        "Now let's see if it stuck. Same opening, this time **from memory**.",
    },
    {
      id: 'test-caro-kann',
      kind: 'puzzle',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'b',
      solution: CARO_KANN_CLASSICAL_LINE,
      // BEZ strelice unapred - ovo je test, ne vodjenje. Hint dugme (standardni
      // dvostepeni sistem) ostaje dostupno ako zatreba.
      prompt: 'Test Yourself: The Caro-Kann Defense',
      introText:
        "Let's see if it stuck. Play the same opening again, this time **from memory**. I'll take care of White.",
      hintText: 'Think back to the **pattern** you just played.',
      illegalMoveText:
        "That's an **illegal move**. Follow the Caro-Kann line. Stuck? Tap **Hint**.",
      doneText: 'You know **the Caro-Kann** now. That line is yours.',
    },
  ],
  testStepId: 'test-caro-kann',
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Test Opening', action: 'testOpening' },
    { label: 'Done', action: 'done' },
  ],
};

/**
 * Day 30 "Graduation Checkpoint 1" - prvi od dva ocenjena testa (16 pitanja,
 * Part A 1-8 zivo na tabli, Part B 9-16 klasican kviz), prag za prolaz 60%
 * (9.6/16). Vidi Lesson.graduationTest i LessonStep.anyLegalMoveStreak/
 * exactMoveUci/raceSolution (lessonDatabase.ts, DailyLessonActivity.tsx) -
 * novi, generican mehanizam izgradjen bas za ovu lekciju.
 *
 * Part A FEN-ovi (Q1,2,4,5,6,7,8) NEMAJU kralja u originalnom tiketu
 * ("izolovane vezbe, ne partije") - DODAO SAM oba kralja (daleko u uglu,
 * h1/a8 ili h1/h8/a8 zavisno od pozicije figure koja se testira) jer
 * deljena biblioteka (ChessFENBoard.validateFenString, util-kit) odbija
 * SVAKU poziciju koja nije cisto prazna tabla bez provere kralja preko
 * chess.js - isti bag kao Day 27 Part C, popravljeno OVDE (lekcija), ne u
 * deljenom kodu. Q3 (kralj) vec ima belog kralja kao samu testiranu
 * figuru, dodat je samo crni. Svih 8 pozicija + potezi (Q6 a2a4, Q7 b4xc5,
 * Q8 5-potezna linija) ponovo verifikovani chess.js NAKON dodavanja
 * kraljeva - obilje legalnih poteza za svaku figuru, kraljevi ne smetaju.
 * Q15/Q16 (checkmate/stalemate) vec imaju oba kralja (prave pozicije),
 * takodje nezavisno verifikovano (chess.js .isCheckmate()/.isStalemate()).
 */
function drillStreakStep(
  id: string,
  pieceSquare: string,
  fen: string,
  introText: string,
  wrongText: string,
  doneText: string
): LessonStep {
  return {
    id,
    kind: 'teach',
    fen,
    orientation: 'w',
    // Placeholder duzine 3 (anyLegalMoveStreak) - sadrzaj se nikad ne cita,
    // samo .length za progress traku/isStepComplete.
    solution: ['*', '*', '*'],
    prompt: 'Piece Moves',
    introText,
    anyLegalMoveStreak: 3,
    drillPieceSquare: pieceSquare,
    hintText: wrongText,
    doneText,
  };
}

const DAY_30_GRADUATION_TEST_1: Lesson = {
  id: 'l1-d30-graduation-test-1',
  level: 1,
  day: 30,
  title: 'Graduation Checkpoint 1',
  flatProgressSegments: true,
  piece: {
    name: 'everything so far',
    glyph: '🎓',
    movement: 'static',
    bannerText: 'Graduation Test 1',
  },
  intro: {
    title: 'Graduation Test 1 of 2',
    text: "**Sixteen questions**, everything you've learned so far. First eight are on **a real board**. Play the actual move. Last eight are **quick-fire**. Get **60%** and you move on.",
  },
  introSteps: [
    {
      text: "**Sixteen questions**, everything you've learned so far. First eight are on **a real board**. Play the actual move. Last eight are **quick-fire**. Get **60%** and you move on.",
      buttonText: 'Start test',
    },
  ],
  steps: [
    // ---------- Part A (Q1-8) - interactive board ----------
    drillStreakStep(
      'q1-rook',
      'e1',
      'k7/8/8/8/8/8/8/4R2K w - - 0 1',
      'Show me how the rook moves. Play **any 3 legal rook moves** in a row.',
      "Hold on. The rook only moves straight, along a rank or a file. It doesn't jump like the knight, and it doesn't move diagonally like the bishop.",
      "That's the rook. **Straight lines, any distance.**"
    ),
    drillStreakStep(
      'q2-bishop',
      'e1',
      'k7/8/8/8/8/8/8/4B2K w - - 0 1',
      'Now the bishop. Play **any 3 legal bishop moves** in a row.',
      'Hold on. The bishop only moves diagonally. Never straight up a file, never across a rank.',
      "That's the bishop. **Diagonals only, any distance.**"
    ),
    drillStreakStep(
      'q3-king',
      'e1',
      'k7/8/8/8/8/8/8/4K3 w - - 0 1',
      'Now the king. Play **any 3 legal king moves** in a row.',
      'Hold on. The king moves one square at a time, in any direction. Never two, never a jump.',
      "That's the king. **One square, any direction.**"
    ),
    drillStreakStep(
      'q4-knight',
      'e1',
      'k7/8/8/8/8/8/8/4N2K w - - 0 1',
      'Now the knight. Play **any 3 legal knight moves** in a row.',
      "Hold on. The knight moves in an L: two squares one way, one square the other. It's the only piece that jumps over anything in its path.",
      "That's the knight. **The only piece that jumps.**"
    ),
    drillStreakStep(
      'q5-queen',
      'e1',
      'k7/8/8/8/8/8/8/4Q2K w - - 0 1',
      'Now the queen. Play **any 3 legal queen moves** in a row.',
      'Hold on. The queen moves any direction, any distance. Ranks, files, or diagonals. But always in a straight line.',
      "That's the queen. **Every direction, every distance.**"
    ),
    {
      id: 'q6-pawn-double-step',
      kind: 'teach',
      fen: '7k/8/8/8/8/8/P7/7K w - - 0 1',
      orientation: 'w',
      solution: ['*'],
      prompt: 'Pawn Double Step',
      introText:
        'Pawns get one special move: **two squares forward**, but only from their starting square. Play it.',
      exactMoveUci: 'a2a4',
      drillPieceSquare: 'a2',
      hintText:
        'A pawn moves two squares only from its **starting square**. Push it: a2 to a4.',
      doneText:
        "That's the pawn's double step. **One-time offer, starting square only.**",
    },
    {
      id: 'q7-pawn-capture',
      kind: 'teach',
      fen: '7k/8/8/2p5/1P6/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['*'],
      prompt: 'Pawn Capture',
      introText:
        "Pawns don't capture the way they move. Find **the diagonal capture**.",
      exactMoveUci: 'b4c5',
      drillPieceSquare: 'b4',
      hintText:
        'A pawn moves straight but **captures diagonally**. Look one square diagonally ahead.',
      doneText:
        "That's how a pawn eats. **Straight to move, diagonal to capture.**",
    },
    {
      id: 'q8-pawn-promotion-race',
      kind: 'teach',
      fen: '7k/8/8/8/8/8/4P3/7K w - - 0 1',
      orientation: 'w',
      // Placeholder duzine 5 (raceSolution) - samo za progress traku, stvaran
      // broj odigranih poteza moze biti veci (sporiji put, penal se racuna
      // odvojeno, vidi raceSolution u DailyLessonActivity.tsx).
      solution: ['*', '*', '*', '*', '*'],
      prompt: 'Pawn Promotion Race',
      introText:
        'Play as many moves as you need, but get this pawn to **a queen** as fast as possible.',
      raceSolution: ['e2e4', 'e4e5', 'e5e6', 'e6e7', 'e7e8q'],
      drillPieceSquare: 'e2',
      hintText:
        "That's not how a pawn moves. Straight ahead, one square, or **two only on its first move**.",
      doneText:
        "That's a queen. The fastest path used the **double-step**. Did you catch it?",
    },
    // ---------- Part B (Q9-16) - knowledge quiz ----------
    {
      id: 'q9-chess-origin',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Quick one',
      introText: 'Where did **chess** come from?',
      quizOptions: ['China', 'Persia', 'India', 'Egypt'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Right. **India**, around the 6th century. It spread from there.',
      quizExplanationWrong:
        'It started in **India**, around the 6th century, then spread through Persia and beyond.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    {
      id: 'q10-board-makeup',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'The Board',
      introText: 'What does the **chessboard** consist of?',
      quizOptions: ['Ranks and files', 'Ranks, files, and diagonals'],
      quizCorrectIndex: 1,
      quizExplanation:
        'Right. Every line on the board is **one of those three**.',
      quizExplanationWrong:
        'Ranks, files and diagonals. **Diagonals** are the one people forget.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    {
      id: 'q11-queen-value',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Piece Values',
      introText: 'How many points is the **queen** worth?',
      quizOptions: ['7', '9', '12'],
      quizCorrectIndex: 1,
      quizExplanation: 'Right. The **most powerful piece** on the board.',
      quizExplanationWrong: 'The queen is worth **9 points**.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    {
      id: 'q12-knight-value',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Piece Values',
      introText: 'How many points is the **knight** worth?',
      quizOptions: ['2', '5', '3'],
      quizCorrectIndex: 2,
      quizExplanation: 'Right. Same as the **bishop**.',
      quizExplanationWrong: 'The knight is worth **3 points**.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    {
      id: 'q13-rook-value',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Piece Values',
      introText: 'How many points is the **rook** worth?',
      quizOptions: ['5', '3', '7'],
      quizCorrectIndex: 0,
      quizExplanation:
        'Right. Worth more than a **minor piece**, less than the queen.',
      quizExplanationWrong: 'The rook is worth **5 points**.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    {
      id: 'q14-pawn-value',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Piece Values',
      introText: 'How many points is a **pawn** worth?',
      quizOptions: ['0.5', '2', '1'],
      quizCorrectIndex: 2,
      quizExplanation: 'Right. The smallest value, **never worthless**.',
      quizExplanationWrong: 'A pawn is worth **1 point**.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    {
      id: 'q15-checkmate-check',
      kind: 'quiz',
      fen: '7k/6Q1/6K1/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Checkmate or Stalemate?',
      introText:
        'Look at this position. **Black to move.** Checkmate, or stalemate?',
      quizOptions: ['Checkmate', 'Stalemate'],
      quizCorrectIndex: 0,
      quizExplanation:
        "Right. The king's in check, and there's **no way out**.",
      quizExplanationWrong:
        'This is **checkmate**. The king is in check, with nowhere to go and nothing to block or capture with.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    {
      id: 'q16-stalemate-check',
      kind: 'quiz',
      fen: 'k7/8/1Q6/8/8/8/8/K7 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Checkmate or Stalemate?',
      introText:
        'Same question, different position. **Black to move.** Checkmate, or stalemate?',
      quizOptions: ['Checkmate', 'Stalemate'],
      quizCorrectIndex: 1,
      quizExplanation:
        "Right. No legal moves, but no check either. **That's a draw.**",
      quizExplanationWrong:
        "This is **stalemate**. The king has no legal moves and isn't in check. That makes it a **draw**, not a loss.",
      autoAdvanceOnCorrect: true,
      celebrate: true,
      doneText: '',
      hintText: '',
    },
  ],
  graduationTest: {
    maxScore: 16,
    passThreshold: 0.6,
    passTitle: 'Test 1 passed',
    passBody:
      'Every piece, every rule, right on the board. **One more test between you and graduation.**',
    passButtons: [
      { label: 'Done', action: 'done' },
      { label: 'Start Test 2', action: 'nextLesson' },
    ],
    failTitle: 'Not quite there',
    failBody:
      'You need **60%** to move on. Go back through whatever tripped you up and try again.',
    failButtons: [{ label: 'Repeat', action: 'repeat' }],
  },
};

/**
 * Day 31 "Graduation Test 2" (Final) - poslednji lesson celog 100-600
 * starter kursa. Za razliku od Day 30, pitanja su POMESANA (nema Part A/B
 * split) - redosled ispod je tacno onaj iz tiketa. Novi mehanizmi izgradjeni
 * BAS za ovu lekciju (svi generican, ne Day31-specificni):
 * - `quizMultiSelect`/`quizCorrectIndices` (Q2/Q3) - "biraju se 2", sve-ili-
 *   nista, dugmad se toggle-uju umesto zakljucavanja na prvi klik.
 * - `exactMoveUci` sad prihvata VISE prihvatljivih poteza (Q5 - Qa8# ILI
 *   Qg7#, oba verifikovana chess.js kao jedini mogući matovi iz te pozicije)
 *   i uvek poredi promociju TACNO (Q6 - samo dama, underpromocija odbijena).
 * - `scoredMarkSquares` (Q13) i `quizScoredRetry` (Q14) - retry dozvoljen,
 *   -0.25 po pogresnom pokusaju (floor 0.25), automatske "crosshair"
 *   strelice (fajl+red do tacnog polja) na SVAKI pogresan pokusaj.
 * - `Lesson.graduationTest.finalScreen` - "Level 1 Graduate" ekran SAMO ako
 *   se na ovu lekciju stiglo preko "Start Test 2" dugmeta sa vec polozenog
 *   Day 30 (URL `?fromLessonId=`, vidi napomena uz finalScreen - LAGANA
 *   provera, nema backend cross-session cuvanje napretka u ovom repou).
 *
 * Q4 - tiket ima protivrecnost: naslov kaze "multi-select, pick 1" i AI
 * chat tekst kaze "Pick the two that are true", ALI je samo JEDNA opcija
 * oznacena "(correct)". Sa samo jednim tacnim odgovorom, "biraj dva" bi bilo
 * nemoguce resiti tacno - ovo je ocigledna tipfeler/copy-paste iz Q2/Q3,
 * popravljeno ovde na standardan single-select kviz (kao Q1/Q7/itd), sa
 * ispravljenim tekstom "Pick the one that's true."
 *
 * Q5 (mat u 1), Q6 (promocija), Q8-Q11 (materijalna prednost) nezavisno
 * verifikovani chess.js (checkmate/legalnost/tacno prebrojavanje poena).
 */
const DAY_31_GRADUATION_TEST_2: Lesson = {
  id: 'l1-d31-graduation-test-2',
  level: 1,
  day: 31,
  title: 'Graduation Test 2 (Final)',
  flatProgressSegments: true,
  piece: {
    name: 'everything so far',
    glyph: '🎓',
    movement: 'static',
    bannerText: 'Graduation Test 2',
  },
  intro: {
    title: 'Graduation Test 2',
    text: '**Last one.** Sixteen more questions, mixed board play and quick-fire quiz. Get **60%** and you graduate.',
  },
  introSteps: [
    {
      text: '**Last one.** Sixteen more questions, mixed board play and quick-fire quiz. Get **60%** and you graduate.',
      buttonText: 'Start test',
    },
  ],
  steps: [
    // ---------- Q1 ----------
    {
      id: 'q1-queen-king-mate',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Queen + King vs King',
      introText:
        'In a king and queen versus king endgame, which piece do you need on the board with your **queen** to deliver checkmate?',
      quizOptions: ['Queen alone', 'Your king'],
      quizCorrectIndex: 1,
      quizExplanation:
        'Right. The queen can trap the enemy king. She always needs **her own king close by** to finish the mate.',
      quizExplanationWrong:
        'The queen alone can never force checkmate. She needs **support from her own king**.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q2 - multi-select, pick 2 ----------
    {
      id: 'q2-opening-principles',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Opening Principles',
      introText:
        'The opening is the start of the game. Which **two** of these actually matter? Pick both.',
      quizOptions: [
        'Put your pieces in the corner',
        'Control the center',
        'Bring your queen out early',
        'Develop your pieces',
      ],
      quizMultiSelect: true,
      quizCorrectIndices: [1, 3],
      quizExplanation:
        'Right. **Center and development.** Everything else in the opening serves those two.',
      quizExplanationWrong:
        'The two that matter: **control the center** and **develop your pieces**.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q3 - multi-select, pick 2, with diagram ----------
    {
      id: 'q3-castling-rights',
      kind: 'quiz',
      fen: '4k3/8/8/8/8/8/8/1R3K1R w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Castling Rights',
      introText:
        "Look at this position. White's king has already moved once. Which **two** of these make you lose castling rights? Pick both.",
      quizOptions: [
        'Your bishop has moved',
        'Your king has moved',
        'You traded your knights',
        "That side's rook has moved",
      ],
      quizMultiSelect: true,
      quizCorrectIndices: [1, 3],
      quizExplanation:
        'Right. Move your king and castling is **gone for good**. Move a rook and you lose it **only on that side**.',
      quizExplanationWrong:
        'You lose castling when **your king moves**, or when that specific rook moves.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q4 - tiket protivrecnost ispravljena na single-select (vidi napomena iznad) ----------
    {
      id: 'q4-what-is-a-puzzle',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'What Is a Puzzle?',
      introText: "What is a **puzzle** in chess? Pick the one that's true.",
      quizOptions: [
        'A type of chess opening',
        'A position where you have to find the best move or sequence of moves',
        'A position where any legal move works fine',
      ],
      quizCorrectIndex: 1,
      quizExplanation:
        "Right. A puzzle gives you a position and asks for the **best move**. It's practice, not a live game.",
      quizExplanationWrong:
        "A puzzle is a position where you find the **best move**. It's practice, not a real game.",
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q5 - interactive board, mate in 1 ----------
    {
      id: 'q5-mate-in-one',
      kind: 'teach',
      fen: '6k1/8/6K1/8/8/8/8/Q7 w - - 0 1',
      orientation: 'w',
      solution: ['*'],
      prompt: 'One Move to Mate',
      introText: 'One move to **checkmate**. Find it.',
      exactMoveUci: ['a1a8', 'a1g7'],
      drillPieceSquare: 'a1',
      hintText:
        'Not mate yet. Look at the **back rank**. Your king already covers the squares next to it.',
      doneText:
        "That's mate. The queen controls the **whole back rank**, and your king cuts off every escape.",
    },
    // ---------- Q6 - interactive board, promotion piece ----------
    {
      id: 'q6-promotion-piece',
      kind: 'teach',
      fen: '7k/P7/8/8/8/8/8/1K6 w - - 0 1',
      orientation: 'w',
      solution: ['*'],
      prompt: 'Promote the Pawn',
      introText: 'Promote this pawn. Which piece should it **become**?',
      exactMoveUci: 'a7a8q',
      drillPieceSquare: 'a7',
      hintText: 'Remember the piece values. Which one is **strongest**?',
      doneText:
        'Right. The queen is the strongest piece, almost always your **best promotion**.',
    },
    // ---------- Q7 ----------
    {
      id: 'q7-opposition',
      kind: 'quiz',
      fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'King Standoff',
      introText: 'What does this **standoff between the two kings** show?',
      quizOptions: ['Castling', 'Opposition', 'Zugzwang'],
      quizCorrectIndex: 1,
      quizExplanation:
        'Right. This is **opposition**. Whoever is forced to move first has to give ground.',
      quizExplanationWrong:
        'This is **opposition**. The kings face off, and whoever has to move first is at a disadvantage.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q8 - material, position 1 ----------
    {
      id: 'q8-material-1-who',
      kind: 'quiz',
      fen: '8/4k3/3p1n2/4p3/4P3/3P1B2/2P2K2/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Material Count',
      introText: 'Who has the **material advantage** here?',
      quizOptions: ['White', 'Black', 'Equal'],
      quizCorrectIndex: 0,
      quizExplanation: 'Right. **White** is ahead.',
      quizExplanationWrong:
        'White is ahead here. Count again: **bishop and three pawns** against knight and two pawns.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q9 - material, position 1, by how much ----------
    {
      id: 'q9-material-1-amount',
      kind: 'quiz',
      fen: '8/4k3/3p1n2/4p3/4P3/3P1B2/2P2K2/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Material Count',
      introText: 'By **how many points** is White ahead?',
      quizOptions: ['2', '3', '1'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Right. **One point.** The bishop and extra pawn edge out the knight.',
      quizExplanationWrong:
        'White is ahead by exactly **1 point**. Bishop plus three pawns is 6, knight plus two pawns is 5.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q10 - material, position 2 ----------
    {
      id: 'q10-material-2-who',
      kind: 'quiz',
      fen: '8/3qkpp1/3p3p/2p1p3/4P3/3P3P/2P2PP1/5RK1 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Material Count',
      introText:
        'New position. Who has the **material advantage** here, White or Black?',
      quizOptions: ['White', 'Black', 'Equal'],
      quizCorrectIndex: 1,
      quizExplanation:
        "Right. Black is ahead. The **queen** is worth more than White's rook.",
      quizExplanationWrong:
        'Black is ahead here. Compare **the queen to the rook**.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q11 - material, position 2, by how much ----------
    {
      id: 'q11-material-2-amount',
      kind: 'quiz',
      fen: '8/3qkpp1/3p3p/2p1p3/4P3/3P3P/2P2PP1/5RK1 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Material Count',
      introText: 'By **how many points**?',
      quizOptions: ['2', '6', '4'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Right. **4 points.** A queen is worth 9, a rook 5, and the pawns are even.',
      quizExplanationWrong:
        'Black is ahead by **4 points**. Queen plus six pawns is 15, rook plus six pawns is 11.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q12 ----------
    {
      id: 'q12-perpetual-check',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Perpetual Check',
      introText: 'What is **perpetual check**?',
      quizOptions: [
        'When a king is checkmated multiple times in the same game',
        'When one side keeps checking the king over and over, and the game ends in a draw by repetition',
      ],
      quizCorrectIndex: 1,
      quizExplanation:
        'Right. Neither side can escape it, so the game ends in a **draw**.',
      quizExplanationWrong:
        'Perpetual check is one side **giving check over and over**. It never stops, so the game ends in a draw by repetition.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q13 - interactive board click ----------
    {
      id: 'q13-find-e4',
      kind: 'markSquares',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['e4'],
      prompt: 'Find the Square',
      introText: 'Find and click on **e4**.',
      scoredMarkSquares: true,
      quizBoardHighlight: {
        squares: [{ square: 'e4', color: '#07DA63', fill: true, dot: true }],
      },
      firstMissText:
        'Not e4. Count the files from the left (a-h) and the ranks from the bottom (1-8). See where they cross.',
      doneText: "That's **e4**.",
      hintText: '',
    },
    // ---------- Q14 - name the highlighted square ----------
    {
      id: 'q14-name-highlighted-square',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Name the Square',
      introText: 'Which square is **highlighted**?',
      quizOptions: ['f5', 'g4', 'g5'],
      quizCorrectIndex: 2,
      quizBoardHighlightUpfront: true,
      quizBoardHighlight: {
        squares: [
          {
            square: 'g5',
            color: 'rgba(255, 199, 0, 0.55)',
            fill: true,
            dot: true,
          },
        ],
      },
      quizExplanation: 'Right. **g5.**',
      quizExplanationWrong:
        "It's **g5**. Letter below, number beside. Where they cross is your square.",
      doneText: '',
      hintText: '',
    },
    // ---------- Q15 ----------
    {
      id: 'q15-opening-white',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Your Opening (White)',
      introText:
        'Which opening have you started learning to play with **White**, just the first few moves so far?',
      quizOptions: ['Italian Game', 'London System', "Queen's Gambit"],
      quizCorrectIndex: 1,
      quizExplanation:
        "Right. The **London System**. Just the opening moves so far. That's the start.",
      quizExplanationWrong:
        "You've been learning the **London System** with White, just the first few moves so far.",
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q16 ----------
    {
      id: 'q16-opening-black',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Your Opening (Black)',
      introText:
        'And which opening have you started learning to play with **Black**, again, just the first few moves?',
      quizOptions: ['Sicilian Defense', 'French Defense', 'Caro-Kann'],
      quizCorrectIndex: 2,
      quizExplanation: 'Right. The **Caro-Kann**. A solid start for Black.',
      quizExplanationWrong:
        "You've been learning the **Caro-Kann** with Black, just the first few moves so far.",
      celebrate: true,
      doneText: '',
      hintText: '',
    },
  ],
  graduationTest: {
    maxScore: 16,
    passThreshold: 0.6,
    passTitle: 'Test 2 passed',
    passBody:
      'Score locked in. **Make sure Test 1 is done too.** Both are needed to graduate.',
    passButtons: [{ label: 'Done', action: 'done' }],
    failTitle: 'Not quite there',
    failBody:
      'You need **60%** to move on. Go back through whatever tripped you up and try again.',
    failButtons: [{ label: 'Repeat', action: 'repeat' }],
    finalScreen: {
      requiresPriorPassLessonId: 'l1-d30-graduation-test-1',
      title: 'Level 1 Graduate',
      body: "Every piece, every rule, both tests. **You're not a beginner anymore.**",
      buttons: [
        { label: 'Repeat', action: 'repeat' },
        { label: 'Play', action: 'play' },
        { label: 'Done', action: 'done' },
      ],
    },
  },
};

export const LESSON_DATABASE: Lesson[] = [
  DAY_1_ROOK,
  DAY_2_BISHOP,
  DAY_3_KING,
  DAY_4_KNIGHT,
  DAY_5_QUEEN,
  DAY_6_PAWN,
  DAY_7_HISTORY,
  DAY_8_PIECE_VALUES,
  DAY_9_CHECKMATE_VS_STALEMATE,
  DAY_10_CHECKMATE_PATTERNS,
  DAY_11_MEET_THE_BOARD,
  DAY_12_CHECKMATE_WITH_QUEEN,
  DAY_13_OPENINGS,
  DAY_14_FIRST_GAME,
  DAY_15_CASTLING_RULES,
  DAY_16_PUZZLE_TIME,
  DAY_17_TWO_ROOKS_CHECKMATE,
  DAY_18_SECOND_GAME,
  DAY_19_PAWN_PROMOTION,
  DAY_20_DELIVER_MATE,
  DAY_21_OPPOSITION,
  DAY_22_MATERIAL,
  DAY_23_BRIDGE,
  DAY_24_THIRD_GAME,
  DAY_25_MATE_IN_ONE,
  DAY_26_PERPETUAL_CHECK,
  DAY_27_CHESS_NOTATION,
  DAY_28_FIRST_OPENING,
  DAY_29_FIRST_OPENING_BLACK,
  DAY_30_GRADUATION_TEST_1,
  DAY_31_GRADUATION_TEST_2,
];

// Lessons 2 tura (600-1200) - sve pozicije provereno u chess.js: legalno, bez saha, jedini potez koji vezuje.
const L2_LINE = 'rgba(17, 198, 209, 0.45)';
const l2Line = (squares: string[]) =>
  squares.map((square) => ({ square, color: L2_LINE, fill: true }));

const L2_DAY_1_PIN: Lesson = {
  id: 'l2-d1-pin',
  level: 2,
  day: 1,
  title: 'Pin',
  endScreenTitle: "That's the pin.",
  endScreenText:
    "A piece that can't move, or shouldn't, is a piece you can **build an attack around**. You'll be finding these every game from now on.",
  flatProgressSegments: true,
  piece: {
    name: 'pin',
    glyph: '♗',
    movement: 'static',
    bannerText: 'Pin',
  },
  intro: {
    title: 'Pin',
    text: "A pinned piece **can't move without exposing something bigger** behind it. Sometimes that something is the king. Then it's **illegal to move at all**.",
  },
  introSteps: [
    {
      text: "A pinned piece **can't move without exposing something bigger** behind it. Sometimes that something is the king. Then it's **illegal to move at all**.",
      buttonText: 'Find the pin!',
    },
  ],
  steps: [
    {
      id: 'intro-what-is-pin',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Pin',
      introText:
        "A pin happens when your piece attacks along a line: a file, rank, or diagonal. An enemy piece stands in front of a **more valuable one** behind it. If the piece behind is the **king**, the pinned piece can't legally move at all. If it's anything else, it can move. It **shouldn't**. Five positions. Find the move that pins.",
      doneText: "Let's go.",
      hintText: '',
      nextButtonText: "Let's go!",
      excludeFromProgress: true,
    },
    {
      id: 'p1-bishop-knight-king',
      kind: 'puzzle',
      fen: '4k3/3n4/8/8/8/8/2B5/4K3 w - - 0 1',
      orientation: 'w',
      solution: ['c2a4'],
      prompt: 'Bishop pins knight to king',
      introText: 'Play the move that **pins the knight to the king**.',
      doneText:
        "That knight isn't going anywhere. It's **pinned to the king**. Moving it would be illegal.",
      hintText:
        'Hold on. Line your bishop up with the **knight and the king**, all on the same diagonal.',
      hintTextAlways: true,
      wrongMoveHighlight: { squares: l2Line(['a4', 'b5', 'c6', 'd7', 'e8']) },
    },
    {
      id: 'p2-rook-knight-king',
      kind: 'puzzle',
      fen: '4k3/8/8/4n3/8/8/3K4/R7 w - - 0 1',
      orientation: 'w',
      solution: ['a1e1'],
      prompt: 'Rook pins knight to king',
      introText: 'Now with the rook. **Find the pin.**',
      doneText:
        'Same idea, different piece. The rook pins in **straight lines**: files and ranks.',
      hintText:
        'Hold on. Find the file with the **knight and the king** on it. Put your rook there.',
      hintTextAlways: true,
      wrongMoveHighlight: {
        squares: l2Line(['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8']),
      },
    },
    {
      id: 'p3-bishop-knight-queen',
      kind: 'puzzle',
      fen: '3qk3/2n5/8/8/8/8/8/2K1B3 w - - 0 1',
      orientation: 'w',
      solution: ['e1a5'],
      prompt: 'Bishop pins knight to queen',
      introText:
        "This one's different. The knight isn't pinned to the king this time. **Find the pin anyway.**",
      doneText:
        "This knight **could** legally move. If it does, the **queen behind it falls**. That's a relative pin. Still very good for you.",
      hintText:
        "Hold on. The king isn't on this diagonal. **Something else valuable** is. Find it.",
      hintTextAlways: true,
    },
    {
      id: 'p4-queen-knight-king',
      kind: 'puzzle',
      fen: '4k3/8/6n1/8/8/8/8/3QKR2 w - - 0 1',
      orientation: 'w',
      solution: ['d1h5'],
      prompt: 'Queen pins knight to king',
      introText:
        'The queen pins too. She can do **everything the rook and bishop can**.',
      doneText:
        "Pinned. The knight can't leave this diagonal without **walking the king into check**.",
      hintText:
        'Hold on. Find the diagonal with the **knight and the king** both on it.',
      hintTextAlways: true,
    },
    {
      id: 'p5-queen-rook-king',
      kind: 'puzzle',
      fen: '6k1/8/8/3r4/8/8/5K2/Q7 w - - 0 1',
      orientation: 'w',
      solution: ['a1a2'],
      prompt: 'Queen pins rook to king',
      introText: "Last one. This time it's a **rook** in the way.",
      doneText:
        'Pinned along the diagonal. Five pins, three pieces. Now you **see them before your opponent does**.',
      hintText:
        'Hold on. Find the diagonal with both the **rook and the king** on it.',
      hintTextAlways: true,
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Svaki potez je jedini mat u poziciji; P6 posle Rxd1+ beli ima samo Rxd1 (chess.js).
const L2_DAY_2_BACK_RANK_MATE: Lesson = {
  id: 'l2-d2-back-rank-mate',
  level: 2,
  day: 2,
  title: 'Back Rank Mate',
  endScreenTitle: "That's the back rank mate.",
  endScreenText:
    'One of the most common ways games end, for you or against you. Give your own king **a little room to breathe**, and this never happens to you.',
  flatProgressSegments: true,
  piece: {
    name: 'back rank mate',
    glyph: '♖',
    movement: 'static',
    bannerText: 'Back Rank Mate',
  },
  intro: {
    title: 'Back rank mate',
    text: "A king **trapped behind its own pawns**, with nowhere to run on its own back rank. One rook or queen sliding all the way in, and **it's over**.",
  },
  introSteps: [
    {
      text: "A king **trapped behind its own pawns**, with nowhere to run on its own back rank. One rook or queen sliding all the way in, and **it's over**.",
      buttonText: 'Find the mate!',
    },
  ],
  steps: [
    {
      id: 'intro-back-rank',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Back rank mate',
      introText:
        "Look at the **king's own row**. If its escape squares are blocked by its own pawns and nothing's watching that row, one piece sliding all the way down it is **checkmate**. Six positions. Find the mating move each time.",
      doneText: "Let's go.",
      hintText: '',
      nextButtonText: "Let's go!",
      excludeFromProgress: true,
    },
    {
      id: 'p1-rook-center',
      kind: 'puzzle',
      fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
      orientation: 'w',
      solution: ['a1a8'],
      prompt: 'Rook mates on the back rank',
      introText: '**Find the mate.**',
      doneText: "Nowhere to go. **That's the back rank mate.**",
      hintText:
        'Hold on. **His own pawns** are his problem. Put your rook all the way down his row.',
      hintTextAlways: true,
    },
    {
      id: 'p2-rook-h-corner',
      kind: 'puzzle',
      fen: '7k/6pp/8/8/8/8/8/1R2K3 w - - 0 1',
      orientation: 'w',
      solution: ['b1b8'],
      prompt: 'Rook mates in the corner',
      introText: 'Same idea, **corner** this time. Find it.',
      doneText: "Corner or center, doesn't matter. **Same trap.**",
      hintText:
        "Hold on. Check which row his king **can't leave**. Get your rook all the way onto it.",
      hintTextAlways: true,
    },
    {
      id: 'p3-rook-a-corner',
      kind: 'puzzle',
      fen: 'k7/pp6/8/8/8/8/8/4K2R w - - 0 1',
      orientation: 'w',
      solution: ['h1h8'],
      prompt: 'Rook mates in the other corner',
      introText: 'One more corner.',
      doneText:
        "Right again. You're starting to **see it before you look for it**.",
      hintText:
        'Hold on. Same pattern as before. **Find the row**, get all the way across it.',
      hintTextAlways: true,
    },
    {
      id: 'p4-rook-capture-mate',
      kind: 'puzzle',
      fen: 'r5k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
      orientation: 'w',
      solution: ['a1a8'],
      prompt: 'Rook mates with a capture',
      introText:
        "This time there's a rook in the way. See what happens if you **just take it**.",
      doneText:
        "You didn't just win his rook. You **mated him with the same move**.",
      hintText:
        "Hold on. Don't work around the piece on a8. **Go straight through it.**",
      hintTextAlways: true,
    },
    {
      id: 'p5-black-queen-mate',
      kind: 'puzzle',
      fen: '3q2k1/8/8/8/8/8/5PPP/6K1 b - - 0 1',
      orientation: 'b',
      solution: ['d8d1'],
      prompt: "You're Black: queen mates on the back rank",
      introText:
        "Switch sides. White's king has **the exact same problem**. Finish it.",
      doneText:
        "Same pattern, either color. That's the point. **It'll happen to you too** if you're not careful.",
      hintText:
        "Hold on. Look at **White's back rank**. Slide your queen all the way down.",
      hintTextAlways: true,
    },
    {
      id: 'p6-black-capture-defended-rook',
      kind: 'puzzle',
      fen: '3r2k1/3r4/8/8/8/8/5PPP/2RR2K1 b - - 0 1',
      orientation: 'b',
      solution: ['d7d1', 'c1d1', 'd8d1'],
      prompt: "You're Black: take the defended rook",
      introText:
        "Looks complex. It isn't. White's king has **the same problem**. Capture and finish it!",
      successText: 'He has to take back. **Now finish it.**',
      successTextAlways: true,
      doneText:
        "Two rooks on one file beat one defender. **It'll happen to you too** if you're not careful.",
      hintText:
        'Hold on. Your rooks are **stacked on the d-file**. Start by taking on d1.',
      hintTextAlways: true,
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Kvadrat belog pesaka ka strani kralja; nepomeren pesak se broji od 3. reda.
const L2_SQUARE_CORNER = 'rgba(7, 218, 99, 0.55)';
function l2PawnSquare(pawn: string, towardFile: string) {
  const f = pawn.charCodeAt(0) - 97;
  const r = Math.max(+pawn[1], 3);
  const side = 8 - r;
  const dir = towardFile.charCodeAt(0) - 97 < f ? -1 : 1;
  const edge = Math.min(7, Math.max(0, f + dir * side));
  const [lo, hi] = [Math.min(f, edge), Math.max(f, edge)];
  const corners = [`${pawn[0]}${r}`, `${pawn[0]}8`];
  const squares: {
    square: string;
    color: string;
    fill: boolean;
    dot?: boolean;
  }[] = [];
  for (let x = lo; x <= hi; x++)
    for (let y = r; y <= 8; y++) {
      const square = `${String.fromCharCode(97 + x)}${y}`;
      const corner = corners.includes(square);
      squares.push({
        square,
        color: corner ? L2_SQUARE_CORNER : L2_LINE,
        fill: true,
        ...(corner && { dot: true }),
      });
    }
  return { squares };
}

// Odgovori provereni potpunom pretragom trke kralj-pesak u chess.js (ne samo pravilom kvadrata).
const L2_DAY_3_RULE_OF_SQUARE: Lesson = {
  id: 'l2-d3-rule-of-the-square',
  level: 2,
  day: 3,
  title: 'Rule of the Square',
  endScreenTitle: "That's the rule of the square.",
  endScreenText:
    'No calculating required. Just **the box, and whose move it is**. Especially that last part.',
  flatProgressSegments: true,
  piece: {
    name: 'rule of the square',
    glyph: '♙',
    movement: 'static',
    bannerText: 'Rule of the Square',
  },
  intro: {
    title: 'Rule of the Square',
    text: "**Don't calculate every move.** Draw a diagonal from the pawn to the edge, drop a line to the pawn's rank, and form a square. If the king's inside it (or can step in), **it catches the pawn**. If not, **the pawn queens**.",
  },
  introSteps: [
    {
      text: "**Don't calculate every move.** Draw a diagonal from the pawn to the edge, drop a line to the pawn's rank, and form a square. If the king's inside it (or can step in), **it catches the pawn**. If not, **the pawn queens**.",
      buttonText: 'Show me!',
    },
  ],
  steps: [
    {
      id: 'demo-square',
      kind: 'quiz',
      fen: '8/8/8/7k/3P4/8/8/K7 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'The square',
      introText:
        "Here's the square. A diagonal from the pawn to the edge, a line down to the pawn's rank: **d4, d8, h8, h4**. The black king is on h5, **inside the box**. If it's his move, he walks in and catches it. Remember what inside the box looks like. Next, you judge it yourself.",
      quizBoardHighlight: l2PawnSquare('d4', 'h'),
      doneText: 'Your turn.',
      hintText: '',
      nextButtonText: 'Got it, quiz me',
      excludeFromProgress: true,
    },
    {
      id: 'q1-pawn-queens',
      kind: 'quiz',
      fen: 'k7/8/8/7P/8/8/8/K7 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Black to move',
      introText:
        'Black to move. Does the king **catch this pawn**, or does it **queen**?',
      quizOptions: ['King catches it', 'Pawn queens'],
      quizCorrectIndex: 1,
      quizExplanation:
        "Right. That king's **nowhere close**. The pawn walks home.",
      quizExplanationWrong:
        "Draw the square from **h5 to h8** (e8 and e5). The king on a8 isn't anywhere near it, even moving first. **The pawn queens.**",
      quizBoardHighlight: l2PawnSquare('h5', 'a'),
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q2-king-catches',
      kind: 'quiz',
      fen: '5k2/8/8/8/2P5/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'White to move',
      introText:
        "**White to move** this time. Does Black's king catch the pawn?",
      quizOptions: ['King catches it', 'Pawn queens'],
      quizCorrectIndex: 0,
      quizExplanation:
        "Right. Even with White pushing first, that king's **close enough** to walk into the square and catch it.",
      quizExplanationWrong:
        'The king on f8 is **well inside the square** from c4 to c8. It catches the pawn even though White moves first.',
      quizBoardHighlight: l2PawnSquare('c4', 'h'),
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q3-unmoved-pawn',
      kind: 'quiz',
      fen: 'k7/8/8/8/8/8/4P3/7K b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Unmoved pawn',
      introText:
        "This pawn hasn't moved yet. It can **push two squares** on its first move. That changes where you draw the square from. Does the king catch it?",
      quizOptions: ['King catches it', 'Pawn queens'],
      quizCorrectIndex: 0,
      quizExplanation: 'Right. The king is **close enough**.',
      quizExplanationWrong:
        'An unmoved pawn can push two squares at once, so its square starts **one rank ahead**. Count from **e3, not e2**. This king is close enough to reach it.',
      quizBoardHighlight: l2PawnSquare('e2', 'a'),
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q4-black-moves-first',
      kind: 'quiz',
      fen: '8/8/5k2/P7/8/8/8/7K b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Black to move',
      introText:
        'Black to move. Same rule as last time. **Is the king in the square?**',
      quizOptions: ['King catches it', 'Pawn queens'],
      quizCorrectIndex: 1,
      quizExplanation:
        "Right. This king **can't make it in time**. He's not inside the square.",
      quizExplanationWrong:
        "Remember: if the king **isn't in the square** and can't step in, there's no way to catch it.",
      quizBoardHighlight: l2PawnSquare('a5', 'h'),
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q5-white-moves',
      kind: 'quiz',
      fen: '8/8/5k2/8/8/8/P7/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'White to move',
      introText: 'Look closely. **How about now?**',
      quizOptions: ['King catches it', 'Pawn queens'],
      quizCorrectIndex: 0,
      quizExplanation:
        "It does. One **two-square jump** isn't enough. The king gets into the square.",
      quizExplanationWrong:
        "The pawn isn't fast enough. Count from **a3**: the king is **already inside** the square.",
      quizBoardHighlight: l2PawnSquare('a2', 'h'),
      doneText:
        'No calculating required. Just **the box, and whose move it is**.',
      hintText: '',
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Odgovor dugmetom ili potezom na tabli (quizMoveOptions); kontrola centra se racuna u chess.js (quizCenterControl).
const L2_CENTER = ['d4', 'd5', 'e4', 'e5'].map((square) => ({
  square,
  color: 'rgba(7, 218, 99, 0.55)',
  fill: true,
}));
const L2_START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const L2_DAY_4_CENTER_CONTROL: Lesson = {
  id: 'l2-d4-center-control',
  level: 2,
  day: 4,
  title: 'Center Control',
  endScreenTitle: "That's center control.",
  endScreenText:
    'Occupy it, or attack it from the side. Either counts. From now on, ask **what a move does for the center** before you play it.',
  flatProgressSegments: true,
  piece: {
    name: 'center',
    glyph: '♘',
    movement: 'static',
    bannerText: 'Center Control',
  },
  intro: {
    title: 'Center control',
    text: 'Four squares matter more than the rest of the board combined: **d4, d5, e4, e5**. Every good opening move is fighting for **at least one of them**.',
  },
  introSteps: [
    {
      text: 'Four squares matter more than the rest of the board combined: **d4, d5, e4, e5**. Every good opening move is fighting for **at least one of them**.',
      buttonText: 'Show me the center',
    },
  ],
  steps: [
    {
      id: 'demo-center',
      kind: 'quiz',
      fen: L2_START_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'The center',
      introText:
        "**These four squares.** Whoever controls them gets more space, faster development, and pieces that reach further. Every move you're about to look at either fights for one of these squares, or it doesn't.",
      quizBoardHighlight: { squares: L2_CENTER },
      doneText: 'Your turn.',
      hintText: '',
      nextButtonText: 'Quiz me',
      excludeFromProgress: true,
    },
    {
      id: 'q1-e4-d4-vs-a3',
      kind: 'quiz',
      fen: L2_START_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Fight for the center',
      introText:
        'Which of these **fights for the center**? Tap it, or play it on the board.',
      quizOptions: ['1. e4 / 1. d4', '1. a3'],
      quizCorrectIndex: 0,
      quizMoveOptions: [['e2e4', 'd2d4'], ['a2a3']],
      quizAutoPlayMove: 'e2e4',
      quizCenterControl: true,
      quizExplanation:
        'Right. e4 or d4 **plants a pawn on a central square** and opens lines for your bishop and queen. a3 does nothing for the center at all.',
      quizExplanationWrong:
        "e4 or d4 puts a pawn **directly on a central square**. a3 doesn't touch the center in any way.",
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q2-d4-vs-h4',
      kind: 'quiz',
      fen: 'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Fight for the center',
      introText: 'Same idea, **next pawn**.',
      quizOptions: ['2. h4', '2. d4'],
      quizCorrectIndex: 1,
      quizMoveOptions: [['h2h4'], ['d2d4']],
      quizAutoPlayMove: 'd2d4',
      quizCenterControl: true,
      quizExplanation:
        "Right. d4 **takes a central square**. h4 grabs space on the edge of the board. Doesn't fight for the center.",
      quizExplanationWrong:
        "d4 **occupies a central square** directly. h4 is all the way on the edge. It isn't part of this fight.",
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q3-nf3-vs-nh3',
      kind: 'quiz',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Knights fight from the side',
      introText:
        "Knights don't have to land **on** a center square to fight for it. They just need to **attack one**. Which knight move does that?",
      quizOptions: ['2. Nf3', '2. Nh3'],
      quizCorrectIndex: 0,
      quizMoveOptions: [['g1f3'], ['g1h3']],
      quizAutoPlayMove: 'g1f3',
      quizCenterControl: true,
      quizExplanation:
        'Right. Nf3 **eyes d4 and e5** from the side. Nh3 stares at the edge of the board.',
      quizExplanationWrong:
        "Nf3 **attacks d4 and e5** without even moving there. Nh3 doesn't touch the center, and it's usually just a bad square for the knight.",
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q4-nc3-vs-na3',
      kind: 'quiz',
      fen: 'rnbqkbnr/ppp2ppp/3p4/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Knights fight from the side',
      introText: 'One more **knight pair**.',
      quizOptions: ['3. Na3', '3. Nc3'],
      quizCorrectIndex: 1,
      quizMoveOptions: [['b1a3'], ['b1c3']],
      quizAutoPlayMove: 'b1c3',
      quizCenterControl: true,
      quizExplanation:
        'Right. Nc3 **covers d5 and e4**. Real central pressure. Na3 does nothing useful and sits stuck on the edge.',
      quizExplanationWrong:
        'Nc3 **covers d5 and e4** from a good square. Na3 is a textbook example of a knight going nowhere.',
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q5-bc4-vs-be2',
      kind: 'quiz',
      fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Bishops fight from afar',
      introText: 'Last one. This pair **looks similar** at first glance.',
      quizOptions: ['3. Bc4', '3. Be2'],
      quizCorrectIndex: 0,
      quizMoveOptions: [['f1c4'], ['f1e2']],
      quizAutoPlayMove: 'f1c4',
      quizCenterControl: true,
      quizExplanation:
        "Right. Bc4 **hits d5** from afar. That's why it's a real opening: **the Italian**. Be2 doesn't touch a single central square.",
      quizExplanationWrong:
        'Bc4 **hits the center** through d5. This bishop is the active one.',
      doneText: 'Occupy it, or attack it from the side. Either counts.',
      hintText: '',
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Provereno u chess.js: Nf6/Bf5/Nf6 napadaju damu, b6/c6/Be6 ne; posle 4.Qf3 beli preti Qxf7#.
const L2_DAY_5_OPENING_MISTAKES: Lesson = {
  id: 'l2-d5-opening-mistakes',
  level: 2,
  day: 5,
  title: 'Common Opening Mistakes',
  endScreenTitle: "That's how you punish a slow opening.",
  endScreenText:
    "A move that doesn't develop, defend, or attack something real is a move **you get to use against your opponent**. Now you know what to look for, from both sides of the board.",
  flatProgressSegments: true,
  piece: {
    name: 'opening mistakes',
    glyph: '♕',
    movement: 'static',
    bannerText: 'Opening Mistakes',
  },
  intro: {
    title: 'Common opening mistakes',
    text: "Two habits quietly lose more opening games than any trap does: **bringing the queen out too soon**, and **spending moves on a piece you've already developed** instead of a new one. Learn to spot them. Then punish them.",
  },
  introSteps: [
    {
      text: "Two habits quietly lose more opening games than any trap does: **bringing the queen out too soon**, and **spending moves on a piece you've already developed** instead of a new one. Learn to spot them. Then punish them.",
      buttonText: 'Show me',
    },
  ],
  steps: [
    {
      id: 'demo-early-queen',
      kind: 'quiz',
      fen: L2_START_FEN,
      orientation: 'b',
      solution: ['quiz'],
      prompt: 'The early queen',
      playMoveOnLoad: ['e2e4', 'e7e5', 'd1h5', 'b8c6', 'f1c4'],
      introText:
        "1.e4 e5 2.Qh5. White's queen looks aggressive, **attacking e5** along the rank. 2...Nc6 defends it. 3.Bc4, going for **a quick attack on f7**. Black has one move that does two jobs. Play it.",
      quizOptions: ['3...g6'],
      quizCorrectIndex: 0,
      quizMoveOptions: [['g7g6']],
      quizAutoPlayMove: 'g7g6',
      quizAutoPlayReply: 'h5f3',
      quizExplanation:
        "3...g6! **Attacks the queen** AND blocks the diagonal she was using to eye f7. 4.Qf3, and she's on f7 again: Qxf7 would be mate. So Black plays Nf6, **developing and blocking** in one move. White's queen keeps moving. Black keeps developing. **That's the tempo** you're about to learn to take.",
      doneText: 'Your turn.',
      hintText: '',
      nextButtonText: 'Quiz me',
      noAutoAdvance: true,
      excludeFromProgress: true,
    },
    {
      id: 'q1-punish-qg4',
      kind: 'quiz',
      fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P1Q1/2N5/PPPP1PPP/R1B1KBNR b KQkq - 3 3',
      orientation: 'b',
      solution: ['quiz'],
      prompt: 'Punish the early queen',
      introText:
        "White's queen came out early and **isn't doing much**. What's Black's best response? Tap it, or play it on the board.",
      quizOptions: ['3...Nf6', '3...b6'],
      quizCorrectIndex: 0,
      quizMoveOptions: [['g8f6'], ['b7b6']],
      quizAutoPlayMove: 'g8f6',
      quizExplanation:
        "Right. Nf6 **attacks the queen** directly. She has to move again next turn, and you didn't spend a single extra move to make that happen.",
      quizExplanationWrong:
        "b6 is a fine move in general. It ignores **a free shot at the queen**. Nf6 attacks her and forces her to move again. That's a tempo (extra move) you get for nothing.",
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q2-punish-qd3',
      kind: 'quiz',
      fen: 'rnbqkb1r/ppp1pp1p/5np1/3p4/3P4/2NQ3P/PPP1PPP1/R1B1KBNR b KQkq - 3 3',
      orientation: 'b',
      solution: ['quiz'],
      prompt: 'Punish the early queen',
      introText:
        "Same idea, different setup. Which move **punishes White's queen**?",
      quizOptions: ['3...c6', '3...Bf5'],
      quizCorrectIndex: 1,
      quizMoveOptions: [['c7c6'], ['c8f5']],
      quizAutoPlayMove: 'c8f5',
      quizExplanation:
        'Right. Bf5 **develops a piece AND attacks the queen** on d3 at the same time. The g6 pawn guards the bishop, so Qxf5 just loses her. She has to move again.',
      quizExplanationWrong:
        "c6 doesn't do anything about the queen on d3. Bf5 **develops and attacks** in one move. Always look for that combination first.",
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q3-why-early-queen',
      kind: 'quiz',
      fen: 'rnbqkb1r/ppp1pp1p/5np1/3p4/3P4/2NQ3P/PPP1PPP1/R1B1KBNR b KQkq - 3 3',
      orientation: 'b',
      solution: ['quiz'],
      prompt: 'Theory check',
      introText:
        'Quick theory check before the last two. Why is bringing the queen out early **usually a mistake**, even when nothing gets captured?',
      quizOptions: [
        'Moving the queen before move 10 is illegal',
        'The opponent develops a piece while attacking it, gaining a free move',
        'The queen is too weak to move safely in the opening',
      ],
      quizCorrectIndex: 1,
      quizDimBoard: true,
      quizExplanation:
        "Exactly. It's not about danger to the queen itself. It's about **handing your opponent a free developing move**, like you just did twice.",
      quizExplanationWrong:
        'The real problem is **tempo** (a free move): your opponent develops a piece AND attacks your queen in the same move, so you fall behind in development for nothing.',
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q4-knight-back-to-g1',
      kind: 'quiz',
      fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      orientation: 'b',
      solution: ['quiz'],
      prompt: "White's last move",
      playMoveOnLoad: 'f3g1',
      introText:
        "Look at White's last move: the knight went **from f3 back to g1**. Good move or bad move?",
      quizOptions: ['Bad move', 'Good move'],
      quizCorrectIndex: 0,
      quizBoardHighlightUpfront: true,
      quizBoardHighlight: {
        arrows: [{ from: 'f3', to: 'g1', color: '#f2358d' }],
        squares: [
          { square: 'f3', color: 'rgba(242, 53, 141, 0.35)', fill: true },
          { square: 'g1', color: 'rgba(242, 53, 141, 0.35)', fill: true },
        ],
      },
      quizExplanation:
        'Bad, for three reasons at once: it **wastes a whole move**, it breaks the "don\'t move the same piece twice early" rule, and it **undoes the one piece of progress** White had made. The knight is back exactly where it started.',
      quizExplanationWrong:
        'This is as bad as opening moves get. The knight already reached a good square on f3, and this move **throws that away**. No capture, no threat, no development. Just backwards.',
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q5-punish-qh5',
      kind: 'quiz',
      fen: 'r1bqkbnr/ppp1pppp/2n5/3p3Q/3P4/4P3/PPP2PPP/RNB1KBNR b KQkq - 4 4',
      orientation: 'b',
      solution: ['quiz'],
      prompt: 'Develop and attack',
      introText:
        'Qh5, **attacking the central pawn** on d5. Which move for Black completely neutralizes this queen move?',
      quizOptions: ['3...Be6', '3...Nf6'],
      quizCorrectIndex: 1,
      quizMoveOptions: [['c8e6'], ['g8f6']],
      quizAutoPlayMove: 'g8f6',
      quizExplanation:
        'Right. You **attacked the queen while defending the pawn**. Her move now makes no sense.',
      quizExplanationWrong:
        'Be6 defends d5. It also blocks your e-pawn and **ignores the queen**. Nf6 defends the pawn AND attacks her.',
      doneText: 'Develop, defend, attack. One move, three jobs.',
      hintText: '',
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Provereno u chess.js: svako resenje napada tacno 2 figure; P1-P4 nemaju drugu viljusku, P5 Nxf7 brani Bb3.
const L2_DAY_6_FORK: Lesson = {
  id: 'l2-d6-fork',
  level: 2,
  day: 6,
  title: 'Fork',
  endScreenTitle: "That's the fork.",
  endScreenText:
    "Two targets, one move, **opponent picks which one to lose**. You'll be looking for this every single game now.",
  flatProgressSegments: true,
  piece: {
    name: 'fork',
    glyph: '♘',
    movement: 'static',
    bannerText: 'Fork',
  },
  intro: {
    title: 'Fork',
    text: "**One piece, two targets, one move.** If a single piece attacks two things at once and the opponent can only save one, that's a fork.",
  },
  introSteps: [
    {
      text: "**One piece, two targets, one move.** If a single piece attacks two things at once and the opponent can only save one, that's a fork.",
      buttonText: "Let's fork!",
    },
  ],
  steps: [
    {
      id: 'intro-fork',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Fork',
      introText:
        "A fork doesn't need to be flashy. It just needs to **hit two things your opponent can't both protect**. Knights are famous for it because of their weird shape. Any piece can fork. Five positions. Find the move that forks.",
      doneText: "Let's go.",
      hintText: '',
      nextButtonText: "Let's go!",
      excludeFromProgress: true,
    },
    {
      id: 'p1-knight-two-rooks',
      kind: 'puzzle',
      fen: '4k3/8/1r3r2/8/8/N3N2B/7P/7K w - - 0 1',
      orientation: 'w',
      solution: ['e3d5'],
      prompt: 'Knight forks two rooks',
      introText: 'Find the move that **hits both rooks** at once.',
      doneText:
        "**Both rooks, one knight.** Black saves one, loses the other. That's the fork.",
      hintText:
        'Hold on. A fork is **one piece attacking two targets** at the same time. This move hits one thing, or nothing. Find the knight jump that lands on a square attacking both rooks.',
      hintTextAlways: true,
    },
    {
      id: 'p2-pawn-fork',
      kind: 'puzzle',
      fen: '4k3/8/1n1b4/8/2PP4/8/4K3/8 w - - 0 1',
      orientation: 'w',
      solution: ['c4c5'],
      prompt: 'Pawn forks two pieces',
      introText:
        'Even a pawn can fork. Find the push that **attacks both pieces**.',
      doneText:
        'A pawn just forked **a knight and a bishop**. Small piece, same idea: two targets, one move.',
      hintText:
        'Hold on. A fork is **one piece hitting two targets** at once. A pawn attacks diagonally. Find the square where both of its diagonal attacks land on an enemy piece.',
      hintTextAlways: true,
    },
    {
      id: 'p3-royal-fork',
      kind: 'puzzle',
      fen: 'r3k3/8/N7/8/8/8/8/4K3 w - - 0 1',
      orientation: 'w',
      solution: ['a6c7'],
      prompt: 'Knight forks king and rook',
      introText: 'This one **gives check** too. Find the fork.',
      doneText:
        'Check, and **the rook on a8** is hanging too. When a fork includes **the king**, the other piece is basically already lost. The king has to move first.',
      hintText:
        "Hold on. A fork hits **two targets at once**. Find a knight move that gives check AND attacks something else valuable. That's what makes it a fork, not just a check.",
      hintTextAlways: true,
    },
    {
      id: 'p4-bishop-fork',
      kind: 'puzzle',
      fen: '8/1n6/8/6p1/7k/8/BP4r1/1KR5 w - - 0 1',
      orientation: 'w',
      solution: ['a2d5'],
      prompt: 'Bishop forks rook and knight',
      introText:
        'Bishops fork too. Along diagonals instead of knight jumps. **Find it.**',
      doneText:
        'One bishop, two diagonals: **the knight on b7 and the rook on g2**. Same fork, different shape.',
      hintText:
        'Hold on. A fork is **one piece, two targets**. Find the square where your bishop sits on one diagonal to an enemy piece AND on a different diagonal to another.',
      hintTextAlways: true,
    },
    {
      id: 'p5-knight-queen-rook',
      kind: 'puzzle',
      fen: '2rqk2r/1p3ppp/pb3n2/4p1N1/8/PB5Q/1P3PPP/R4RK1 w - - 0 1',
      orientation: 'w',
      solution: ['g5f7'],
      prompt: 'Knight forks queen and rook',
      introText: 'Last one. This fork **wins the most material** of the set.',
      doneText:
        "**The queen on d8 and the rook on h8**, both hit by one knight. The king can't take it: your bishop on b3 guards f7. Black saves the queen, the rook's gone. White wins big.",
      hintText:
        "Hold on. A fork is **one piece attacking two targets** the opponent can't both save. Find the knight move that hits two pieces, and one of them is worth going out of your way for.",
      hintTextAlways: true,
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Ladder mate: red koji cuva top koji NE sahira (hint + pogresan potez).
const l2GuardRank = (rank: number) => ({
  highlight: {
    squares: 'abcdefgh'
      .split('')
      .map((f) => ({ square: `${f}${rank}`, color: L2_LINE, fill: true })),
  },
});
const L2_LADDER_WRONG =
  "Hold on. Check with the rook that's **already lined up** with the king's row. The other rook's job right now is just to **guard the row behind him**.";

// Sve 4 linije provereno u chess.js: legalni potezi, svaki beli potez sah (osim Rb5), kraj je mat.
const L2_DAY_8_LADDER_MATE: Lesson = {
  id: 'l2-d7-ladder-mate',
  level: 2,
  day: 8,
  title: 'Ladder Mate',
  endScreenTitle: "That's the ladder mate.",
  endScreenText:
    'Two rooks, no other pieces needed, no calculation required. **Just the pattern**, repeated until the king runs out of board.',
  flatProgressSegments: true,
  piece: {
    name: 'ladder mate',
    glyph: '♖',
    movement: 'static',
    bannerText: 'Ladder Mate',
  },
  intro: {
    title: 'Ladder mate',
    text: "Two rooks, taking turns. One **checks along the king's row** while the other **guards the row behind**, so the king only has one direction to go. Walk him to the edge, and the last check is mate.",
  },
  introSteps: [
    {
      text: "Two rooks, taking turns. One **checks along the king's row** while the other **guards the row behind**, so the king only has one direction to go. Walk him to the edge, and the last check is mate.",
      buttonText: "Let's go",
    },
  ],
  steps: [
    {
      id: 'intro-ladder',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Ladder mate',
      introText:
        "Watch the pattern: one rook checks, the king is forced up a row because **the OTHER rook already covers the row behind him**. Then the rooks swap jobs. Same idea, every time, until there's no board left for the king to walk into.",
      doneText: "Let's go.",
      hintText: '',
      nextButtonText: 'Start',
      excludeFromProgress: true,
    },
    {
      id: 'e1-ladder-short',
      kind: 'puzzle',
      fen: '8/8/4k3/R7/7R/8/8/3K4 w - - 0 1',
      orientation: 'w',
      solution: ['h4h6', 'e6e7', 'a5a7', 'e7e8', 'h6h8'],
      prompt: 'Ladder mate: 2 checks, then mate',
      introText:
        "White to move. Check with the rook that's **aligned with the king's row**.",
      moveExplanations: {
        0: 'One row closer to the edge. Same idea again: **the other rook takes its turn**.',
        2: "He's **out of rows**. One more check and there's nowhere left.",
      },
      moveGuides: { 0: l2GuardRank(5), 2: l2GuardRank(6), 4: l2GuardRank(7) },
      doneText:
        "**That's the ladder.** Two rooks, taking turns, and the king runs out of board.",
      hintText: L2_LADDER_WRONG,
      hintTextAlways: true,
    },
    {
      id: 'e2-ladder-medium',
      kind: 'puzzle',
      fen: '8/8/8/4k3/R7/7R/8/3K4 w - - 0 1',
      orientation: 'w',
      solution: ['h3h5', 'e5e6', 'a4a6', 'e6e7', 'h5h7', 'e7e8', 'a6a8'],
      prompt: 'Ladder mate: 3 checks, then mate',
      introText:
        'One row further this time. Same pattern. **Find the checking rook.**',
      successText: "Up one row. **Other rook's turn.**",
      successTextAlways: true,
      moveGuides: {
        0: l2GuardRank(4),
        2: l2GuardRank(5),
        4: l2GuardRank(6),
        6: l2GuardRank(7),
      },
      doneText:
        "Same ladder, **one extra rung**. You'll barely need the hints by the next one.",
      hintText:
        "Hold on. Same rule as before: **the rook that's already on the king's row** is the one that checks. The other one just watches the row behind.",
      hintTextAlways: true,
    },
    {
      id: 'e3-ladder-full',
      kind: 'puzzle',
      fen: '8/8/8/8/4k3/R7/7R/3K4 w - - 0 1',
      orientation: 'w',
      solution: [
        'h2h4',
        'e4e5',
        'a3a5',
        'e5e6',
        'h4h6',
        'e6e7',
        'a5a7',
        'e7e8',
        'h6h8',
      ],
      prompt: 'Ladder mate: 4 checks, then mate',
      introText:
        'Longest version. Same two-rook pattern, just **more rungs** on the ladder.',
      successText: "Up one row. **Other rook's turn.**",
      successTextAlways: true,
      moveGuides: {
        0: l2GuardRank(3),
        2: l2GuardRank(4),
        4: l2GuardRank(5),
        6: l2GuardRank(6),
        8: l2GuardRank(7),
      },
      doneText:
        "Four checks, one pattern, repeated. **That's the whole technique.** You can do this with any two rooks, anywhere on the board.",
      hintText:
        "Hold on. Find the rook that's **lined up with the king's current row** and check with it. The other rook stays put, guarding the row behind.",
      hintTextAlways: true,
    },
    {
      id: 'e4-ladder-tricky',
      kind: 'puzzle',
      fen: '8/8/8/4k3/R7/7R/8/3K4 w - - 0 1',
      orientation: 'w',
      solution: [
        'h3h5',
        'e5f6',
        'a4a6',
        'f6g7',
        'h5b5',
        'g7f7',
        'b5b7',
        'f7e8',
        'a6a8',
      ],
      prompt: 'What if Black plays tricky?',
      introText:
        'Same position as before. This time **Black defends better**. Start the ladder.',
      moveExplanations: {
        0: 'The king steps **toward your rook**. Keep going.',
        2: 'Aha! The king **guards h7** now. Check there and he takes your rook. What now?',
        4: "Now the rook is **far enough**. The king is slow, it can't catch it. Back to the ladder.",
        6: 'One more.',
      },
      moveGuides: {
        0: l2GuardRank(4),
        2: l2GuardRank(5),
        4: {
          hintText:
            "Move the rook **along the same rank, as far as possible**, without sharing a file with the other rook. That's the solution!",
          wrongText:
            'Hold on. A check on h7 just hangs the rook. Move it **along its rank, as far away as possible**, without sharing a file with the other rook.',
        },
        6: l2GuardRank(6),
        8: l2GuardRank(7),
      },
      doneText:
        "Well done! You made it even though **Black played the best defense possible**. When the king blocks your check, move the rook **as far away as possible**. Just don't bump into your other rook!",
      hintText: L2_LADDER_WRONG,
      hintTextAlways: true,
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Kralj na 7. redu stiti polje promocije - strelica + zeleno polje.
const l2GuardPromo = (king: string, promo: string) => ({
  arrows: [{ from: king, to: promo, color: 'rgba(7, 218, 99, 0.8)' }],
  squares: [{ square: promo, color: 'rgba(7, 218, 99, 0.55)', fill: true }],
});
const L2_WINS_DRAW = ['White wins', 'Draw'];
const L2_DRAW_WINS = ['Draw', 'White wins'];

// Odgovori i linije provereni tacnim KPK resavacem + chess.js; linije idu do bezbedne dame, crni bira najduzu odbranu.
const L2_DAY_9_OPPOSITION_2: Lesson = {
  id: 'l2-d8-opposition-2',
  level: 2,
  day: 9,
  title: 'Opposition 2.0: Winning',
  endScreenTitle: "That's applied opposition.",
  endScreenText:
    'King in front of the pawn, **take the opposition**, and the defender has to step aside. Get your king to the 6th rank and **the win is yours**.',
  flatProgressSegments: true,
  piece: {
    name: 'opposition',
    glyph: '♔',
    movement: 'static',
    bannerText: 'Opposition 2.0: Winning',
  },
  intro: {
    title: 'Opposition 2.0: Winning',
    text: "You already know what opposition is. Now let's **use it to win** a king and pawn endgame: push the defending king aside and walk your pawn home.",
  },
  introSteps: [
    {
      text: "You already know what opposition is. Now let's **use it to win** a king and pawn endgame: push the defending king aside and walk your pawn home.",
      buttonText: 'Apply it',
    },
  ],
  steps: [
    {
      id: 'demo-opposition',
      kind: 'quiz',
      fen: '4k3/8/8/4K3/4P3/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Opposition',
      introText:
        "Kings on e5 and e8, pawn right behind on e4. White to move plays **Ke6 and takes the opposition**: kings facing off with **one square between them**, and Black has to move. His king is forced to step aside, and yours walks through. In a position like this, **that's the whole game**.",
      quizBoardHighlight: {
        arrows: [{ from: 'e5', to: 'e6', color: 'rgba(7, 218, 99, 0.8)' }],
      },
      doneText: 'Your turn.',
      hintText: '',
      nextButtonText: 'Quiz me',
      excludeFromProgress: true,
    },
    {
      id: 'q1-easy-win',
      kind: 'quiz',
      fen: '6k1/8/4K3/4P3/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'White to move',
      introText:
        "White to move. White's king **controls the pawn's path** to the promotion square. Black's king isn't anywhere near the action. Winning or drawing?",
      quizOptions: L2_WINS_DRAW,
      quizCorrectIndex: 0,
      quizExplanation:
        "Right. When the defending king is this far away, **it doesn't matter who has the move**. White walks the pawn home.",
      quizExplanationWrong:
        "Black's king is **completely out of the picture**. This one wins itself. The real skill comes in the next few questions.",
      quizDemoLine: [
        {
          uci: 'e6d7',
          text: '**Kd7.** Your king **guards e8**, the promotion square. He can never get in front of the pawn now.',
          highlight: l2GuardPromo('d7', 'e8'),
        },
        { uci: 'g8f8' },
        { uci: 'e5e6' },
        { uci: 'f8g8' },
        { uci: 'e6e7', text: 'The pawn walks. **Nothing can stop it now.**' },
        { uci: 'g8h8' },
        {
          uci: 'e7e8q',
          text: '**Queen.** Your king covered every square the pawn needed.',
        },
      ],
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q2-c-pawn-win',
      kind: 'quiz',
      fen: '2k5/8/1K6/2P5/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'White to move',
      preStepIntro: {
        title: 'The 6th rank',
        text: "**Look at the diagram.** Whenever your king reaches **the 6th rank in front of your pawn** (the 3rd if you're Black), **you win**. Doesn't matter who's to move. Works for every pawn except the a- and h-pawns.",
        diagramFen: '2k5/8/2K5/8/8/8/2P5/8 w - - 0 1',
        diagramHighlightRank: 6,
        buttonText: 'Got it',
      },
      introText:
        "Black's king **sits on the promotion square**. Use the opposition to kick it off, then take that square with your own king. Winning or drawing?",
      quizOptions: L2_DRAW_WINS,
      quizCorrectIndex: 1,
      quizExplanation:
        'Right. Kc6 takes the opposition, the king **has to step off c8**, and Kb7 takes the square for good. Game over.',
      quizExplanationWrong:
        'Use the opposition to **force the king off the promotion square**. Kc6, the king steps aside, Kb7. The pawn walks in.',
      quizDemoLine: [
        {
          uci: 'b6c6',
          text: '**Kc6. Opposition.** Black has to move his king.',
        },
        { uci: 'c8d8', text: 'He steps off the promotion square.' },
        {
          uci: 'c6b7',
          text: '**Kb7.** Your king **guards c8**, the promotion square. It belongs to you now. The pawn runs.',
          highlight: l2GuardPromo('b7', 'c8'),
        },
        { uci: 'd8e8' },
        { uci: 'c5c6' },
        { uci: 'e8f8' },
        { uci: 'c6c7' },
        { uci: 'f8g8' },
        { uci: 'c7c8q', text: '**Queen.** Opposition first, then the square.' },
      ],
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q3-opposition-white-to-move',
      kind: 'quiz',
      fen: '4k3/8/8/4K3/4P3/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'White to move',
      introText:
        'Same position as the demo. **White to move.** Can your king get to the 6th rank? Winning or drawing?',
      quizOptions: L2_WINS_DRAW,
      quizCorrectIndex: 0,
      quizExplanation:
        'Right. **Ke6 takes the opposition**, the black king steps aside, and White fights for the promotion square. Just as we learned.',
      quizExplanationWrong:
        'White moving first is **good news** here. Ke6 takes the opposition. A king on the 6th rank in front of its pawn wins.',
      quizDemoLine: [
        {
          uci: 'e5e6',
          text: '**Ke6. Opposition.** And your king is on the 6th rank. This is already won.',
        },
        { uci: 'e8f8', text: 'Black has to step aside.' },
        {
          uci: 'e6d7',
          text: '**Kd7.** Your king **guards e8**, the promotion square, and the whole road ahead.',
          highlight: l2GuardPromo('d7', 'e8'),
        },
        { uci: 'f8g7' },
        {
          uci: 'e4e5',
          text: 'Now the pawn moves. **The king leads, the pawn follows.**',
        },
        { uci: 'g7f8' },
        { uci: 'e5e6' },
        { uci: 'f8g8' },
        { uci: 'e6e7' },
        { uci: 'g8h8' },
        {
          uci: 'e7e8q',
          text: '**Queen.** One opposition move decided all of it.',
        },
      ],
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q5-from-the-side',
      kind: 'quiz',
      fen: '4k3/8/3K4/4P3/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'White to move',
      introText:
        "Last one. The king isn't coming straight down the file this time. **It's coming from the side.** Winning or drawing?",
      quizOptions: L2_DRAW_WINS,
      quizCorrectIndex: 1,
      quizExplanation:
        "That's right! Just as we learned: **use the opposition to push the king away** and support your pawn to promotion.",
      quizExplanationWrong:
        "Take the opposition whenever you can. That's how you **force the king away** from the pawn's promotion square.",
      quizDemoLine: [
        { uci: 'd6e6', text: '**Ke6. Opposition**, from the side this time.' },
        { uci: 'e8d8', text: 'He steps aside.' },
        {
          uci: 'e6f7',
          text: '**Kf7.** Your king **guards e8**, the promotion square. Now the path is clear. **The pawn just keeps marching forward!**',
          highlight: l2GuardPromo('f7', 'e8'),
        },
        { uci: 'd8c7' },
        { uci: 'e5e6' },
        { uci: 'c7b8' },
        { uci: 'e6e7' },
        { uci: 'b8c8' },
        { uci: 'e7e8q', text: '**Queen.** Same idea, different direction.' },
      ],
      doneText: 'King in front, **opposition taken**, pawn walks home.',
      hintText: '',
    },
    // Part 2 - slobodna igra protiv punog Stockfish-a; KPK resavac: dobijeno, pobedjuju samo Ke4/Kd4/Kf4.
    {
      id: 'part2-win-it',
      kind: 'freePlay',
      fen: '8/8/4k3/8/8/4K3/4P3/8 w - - 0 1',
      orientation: 'w',
      solution: [],
      prompt: 'Win it',
      preStepIntro: {
        title: 'Part 2: Win it',
        text: "Now you play. **Win this endgame** against a defender that doesn't make mistakes. Queen the pawn and he can't take it: that's the win.",
        bullets: [
          'King **in front** of the pawn.',
          '**Take the opposition** whenever you can.',
          'Stuck? **Hint** shows the move and why.',
        ],
        buttonText: 'Play',
      },
      introText:
        'White to move. The defender plays **the best defense there is**. Lead with the king, not the pawn.',
      strongOpponent: true,
      liveHint: true,
      hintTechnique: 'kpkOpposition',
      freePlayGoal: 'promote',
      oppositionCoachTexts: [
        '**Opposition.** His king has to step aside now.',
        "**You've got the opposition.** Now he's the one who has to give way.",
        "**Kings face to face, his move.** That's exactly where you want them.",
      ],
      freePlayFailText:
        "That's a draw. **The opposition slipped away.** Back to the start. Lead with the king this time.",
      doneText:
        "**Queen.** You won it against the best defense. That's applied opposition.",
      hintText: '',
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Provereno u chess.js: sve pozicije legalne; I6 e-linija jedina bez pesaka, Re1 jedini potez topa na nju.
const L2_DEV_ARROW = 'rgba(7, 218, 99, 0.8)';

const L2_DAY_10_DEVELOPMENT: Lesson = {
  id: 'l2-d9-development',
  level: 2,
  day: 10,
  title: 'Piece Development',
  endScreenTitle: "That's the development order.",
  endScreenText:
    "Knights toward the center, bishops where they're aimed, **king safe**, then rooks and queen join **a game that's already set up in your favor**.",
  flatProgressSegments: true,
  piece: {
    name: 'development',
    glyph: '♘',
    movement: 'static',
    bannerText: 'Piece Development',
  },
  intro: {
    title: 'Piece development',
    text: "Five habits that decide **who's ready to fight first**: knights toward the center, light pieces (bishops/knights) before heavy (rooks/queen) ones, the queen staying home a little longer, and rooks that end up **exactly where they're most useful**.",
  },
  introSteps: [
    {
      text: "Five habits that decide **who's ready to fight first**: knights toward the center, light pieces (bishops/knights) before heavy (rooks/queen) ones, the queen staying home a little longer, and rooks that end up **exactly where they're most useful**.",
      buttonText: "Let's go",
    },
  ],
  steps: [
    {
      id: 'intro-checklist',
      kind: 'quiz',
      fen: L2_START_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Development',
      introText:
        "Quick mental checklist for every opening: **knights out first**, usually toward the center. **Bishops next**, once you know where they're aimed. **Castle.** Then rooks and queen join in: rooks onto open files, queen only when there's a real reason. Let's go through it piece by piece.",
      doneText: "Let's go.",
      hintText: '',
      nextButtonText: 'Start',
      noAutoAdvance: true,
      excludeFromProgress: true,
    },
    {
      id: 'i1-knight-to-center',
      kind: 'puzzle',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      orientation: 'w',
      solution: ['g1f3'],
      prompt: 'Develop the knight',
      introText: 'Develop the knight: **toward the center, not the edge**.',
      // Nc3 je takodje centralno polje - ne kaznjavamo ga kao Nh3, samo vodimo ka f3.
      otherTypeMoves: {
        0: [
          {
            uci: 'b1c3',
            message:
              "**c3 is a central square too.** Start with the other knight this time. You'll see why in a second.",
          },
        ],
      },
      doneText:
        "Right. **f3 hits e5 and d4**, and it's one step closer to castling. A knight on the rim is dim: h3 or a3 barely do anything.",
      hintText:
        'Hold on. **Knights want central squares**: f3 and c3 for White, f6 and c6 for Black. The edge of the board is the last place a knight wants to be.',
      hintTextAlways: true,
    },
    {
      id: 'i2-why-kingside-knight',
      kind: 'quiz',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Quick check',
      introText:
        'Quick check. Why do most players develop their **KINGSIDE knight** (f3 for White, f6 for Black) before almost anything else?',
      quizOptions: [
        "Because it's usually the strongest piece on the board",
        'Because it clears the way to castle quickly',
        'Because the rules require it to move first',
      ],
      quizCorrectIndex: 1,
      quizExplanation:
        "Exactly. Once that knight's off g1 (or g8), **only the bishop stands between your king and castling**. Getting your king safe early is one of the biggest priorities in the opening.",
      quizExplanationWrong:
        "The real reason is **castling**. With the knight off its home square, you're one bishop move away from getting your king safe.",
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'i3-bishops-intro',
      kind: 'quiz',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Bishops',
      introText:
        "Bishops are different from knights. There's **no single \"best square\"**, because it depends on your pawn structure and what opening you're playing. What's usually true: **the KING'S bishop tends to come out first**, because, like the knight, it's also standing between your king and castling.",
      quizBoardHighlight: {
        squares: [{ square: 'f1', color: L2_LINE, fill: true }],
      },
      doneText: 'See an example.',
      hintText: '',
      nextButtonText: 'See example',
      noAutoAdvance: true,
      excludeFromProgress: true,
    },
    {
      id: 'i3-bishops-italian',
      kind: 'quiz',
      fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'The Italian Game',
      introText:
        '**The Italian Game**, 1.e4 e5 2.Nf3 Nc6 3.Bc4: the bishop **aims straight at f7**, and castling is one move away.',
      quizBoardHighlight: {
        arrows: [{ from: 'c4', to: 'f7', color: L2_DEV_ARROW }],
      },
      doneText: 'Next example.',
      hintText: '',
      nextButtonText: 'Next example',
      noAutoAdvance: true,
      excludeFromProgress: true,
    },
    {
      id: 'i3-bishops-ruy-lopez',
      kind: 'quiz',
      fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'The Ruy Lopez',
      introText:
        "**The Ruy Lopez.** White plays 3.Bb5 instead, **pinning the knight on c6**. Different diagonal, same idea: the king's bishop leads, and it goes **where it does the most damage in THAT specific position**, not a fixed square you memorize. Both are fine.",
      quizBoardHighlight: {
        arrows: [{ from: 'b5', to: 'e8', color: L2_DEV_ARROW }],
      },
      doneText: 'Next one.',
      hintText: '',
      nextButtonText: 'Got it',
      noAutoAdvance: true,
    },
    {
      id: 'i4-castle-first',
      kind: 'quiz',
      fen: 'r1bqk2r/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'White to move',
      introText:
        "Almost everything is developed. Castling or the bishop first? Let's stick with **what we know is solid for sure**, and we can choose the best square for the bishop later!",
      quizOptions: ['6.O-O', '6.Rb1'],
      quizCorrectIndex: 0,
      quizMoveOptions: [['e1g1'], ['a1b1']],
      quizAutoPlayMove: 'e1g1',
      quizExplanation:
        'Right. Castling is a move **we know is bound to happen**. A safe king is what matters most! We can pick a square for the bishop later.',
      quizExplanationWrong:
        "Rb1 doesn't accomplish anything here. **Think about the safety of your king.**",
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'i5-queen-stays-home',
      kind: 'quiz',
      fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R b KQkq - 3 3',
      orientation: 'b',
      solution: ['quiz'],
      prompt: 'Black to move',
      introText: 'Black to move. Which is **the better move** here?',
      quizOptions: ['3...Qe7', '3...Nf6'],
      quizCorrectIndex: 1,
      quizMoveOptions: [['d8e7'], ['g8f6']],
      quizAutoPlayMove: 'g8f6',
      quizExplanation:
        "Right. Nf6 **develops a piece toward the center**. Qe7 gets the queen out for no reason, and it **blocks Black's own bishop on f8** from getting out through e7.",
      quizExplanationWrong:
        "Qe7 doesn't threaten anything and **blocks your own bishop's diagonal**. Nf6 is a normal developing move that does real work.",
      doneText: 'Last one.',
      hintText: '',
    },
    {
      id: 'i6-rook-open-file',
      kind: 'puzzle',
      fen: 'r1bq1rk1/ppp2ppp/2n2n2/3p4/1b1P4/2N2N2/PPP2PPP/R1BQ1RK1 w - - 0 8',
      orientation: 'w',
      solution: ['f1e1'],
      prompt: 'Rook to the open file',
      introText:
        'Both sides are castled. **One file on the board has no pawns left on it at all.** Put a rook there.',
      doneText:
        "Right. **The e-file is completely open**: no pawns, either side. That's exactly where a rook belongs, **doing something**, not sitting in the corner.",
      hintText:
        "Hold on. Check every file for pawns. **One of them is completely empty.** That's the file your rook wants.",
      hintTextAlways: true,
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Svaki FEN proveren u chess.js protiv navedenog redosleda poteza.
const L2_OPENINGS = {
  italian: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
  ruy: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
  scotch: 'r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3',
  fourKnights:
    'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4',
  kingsGambit: 'rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq - 0 2',
};
const L2_OPENING_NAMES = [
  'Italian Game',
  'Ruy Lopez',
  'Scotch Game',
  'Four Knights Game',
  "King's Gambit",
];
const l2Mark = (squares: string[]) => ({ squares: l2Line(squares) });

const L2_DAY_11_OPENING_NAMES: Lesson = {
  id: 'l2-d10-opening-names',
  level: 2,
  day: 11,
  title: 'Basic Openings & Names',
  endScreenTitle: 'Five openings, five names.',
  endScreenText:
    "You'll see these constantly once you start looking: **the bishop's square, the extra pawn move, the knight count**. Small details, instant recognition.",
  flatProgressSegments: true,
  piece: {
    name: 'openings',
    glyph: '♗',
    movement: 'static',
    bannerText: 'Basic Openings & Names',
  },
  intro: {
    title: 'Basic openings & names',
    text: 'Five setups **every serious player recognizes on sight**. Learn to name them first. Then we test you.',
  },
  introSteps: [
    {
      text: 'Five setups **every serious player recognizes on sight**. Learn to name them first. Then we test you.',
      buttonText: 'Show me',
    },
  ],
  steps: [
    // ---------- Deo 1 - ucenje, ne broji se u napredak ----------
    {
      id: 'intro-openings',
      kind: 'quiz',
      fen: L2_START_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Openings',
      introText:
        "Same starting moves (e4, e5, knight to f3, knight to c6) lead to **very different games** depending on where the bishop goes next, or what White plays instead. **Five setups, five names.** Let's go.",
      doneText: "Let's go.",
      hintText: '',
      nextButtonText: "Let's go",
      noAutoAdvance: true,
      excludeFromProgress: true,
    },
    {
      id: 'learn-italian',
      kind: 'quiz',
      fen: L2_OPENINGS.italian,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Italian Game',
      introText:
        "This is **the Italian Game**. The bishop goes to **c4**, aiming straight at f7, the weakest square in Black's camp. Every serious player knows this setup on sight.",
      quizBoardHighlight: l2Mark(['c4']),
      doneText: '',
      hintText: '',
      nextButtonText: 'Got it',
      noAutoAdvance: true,
      excludeFromProgress: true,
    },
    {
      id: 'learn-ruy-lopez',
      kind: 'quiz',
      fen: L2_OPENINGS.ruy,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Ruy Lopez',
      introText:
        "This is **the Ruy Lopez**, or the Spanish. Same first moves. This time the bishop goes to **b5**, attacking the knight that's defending e5. Quieter-looking than the Italian, and **the most respected e4 opening there is**.",
      quizBoardHighlight: l2Mark(['b5']),
      doneText: '',
      hintText: '',
      nextButtonText: 'Got it',
      noAutoAdvance: true,
      excludeFromProgress: true,
    },
    {
      id: 'learn-scotch',
      kind: 'quiz',
      fen: L2_OPENINGS.scotch,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Scotch Game',
      introText:
        'This is **the Scotch Game**. Instead of developing a bishop, White **strikes the center immediately with d4**, usually trading pawns right away and opening the position fast.',
      quizBoardHighlight: l2Mark(['d4']),
      doneText: '',
      hintText: '',
      nextButtonText: 'Got it',
      noAutoAdvance: true,
      excludeFromProgress: true,
    },
    {
      id: 'learn-four-knights',
      kind: 'quiz',
      fen: L2_OPENINGS.fourKnights,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Four Knights Game',
      introText:
        "This is **the Four Knights Game**, named for exactly what you'd guess. Both sides develop **both knights** before either bishop comes out. Simple, solid, symmetrical.",
      quizBoardHighlight: l2Mark(['c3', 'f3', 'c6', 'f6']),
      doneText: '',
      hintText: '',
      nextButtonText: 'Got it',
      noAutoAdvance: true,
      excludeFromProgress: true,
    },
    {
      id: 'learn-kings-gambit',
      kind: 'quiz',
      fen: L2_OPENINGS.kingsGambit,
      orientation: 'w',
      solution: ['quiz'],
      prompt: "King's Gambit",
      introText:
        "This is **the King's Gambit**. White **offers a pawn on move two** for faster development and an early attack. The boldest of the five. Rare at the top level now. Every player should still recognize it.",
      quizBoardHighlight: l2Mark(['f4']),
      doneText: '',
      hintText: '',
      nextButtonText: 'Got it',
      noAutoAdvance: true,
      excludeFromProgress: true,
    },
    {
      id: 'quiz-transition',
      kind: 'quiz',
      fen: L2_START_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Quiz',
      introText:
        "Five openings, five names, five setups. **Now let's see if they stuck.**",
      doneText: '',
      hintText: '',
      nextButtonText: 'Quiz me',
      noAutoAdvance: true,
      excludeFromProgress: true,
    },
    // ---------- Deo 2 - kviz, jedan pokusaj ----------
    {
      id: 'q1-ruy-lopez',
      kind: 'quiz',
      fen: L2_OPENINGS.ruy,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Name the opening',
      introText: "What's this opening called?",
      quizOptions: L2_OPENING_NAMES,
      quizCorrectIndex: 1,
      quizBoardHighlight: l2Mark(['b5']),
      quizExplanation:
        'Right, **the Ruy Lopez**. Bishop to b5, attacking the defender of e5.',
      quizExplanationWrong:
        "This is **the Ruy Lopez**. The giveaway is **the bishop on b5**, not c4. It's attacking Black's knight, not aiming at f7.",
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q2-italian',
      kind: 'quiz',
      fen: L2_OPENINGS.italian,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Name the opening',
      introText: 'And this one?',
      quizOptions: L2_OPENING_NAMES,
      quizCorrectIndex: 0,
      quizBoardHighlight: l2Mark(['c4']),
      quizExplanation: 'Right, **the Italian Game**. Bishop on c4, eyeing f7.',
      quizExplanationWrong:
        "This is **the Italian Game**. **The bishop on c4** aiming at f7 is the signature. Compare it to the Ruy Lopez's bishop on b5.",
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q3-kings-gambit',
      kind: 'quiz',
      fen: L2_OPENINGS.kingsGambit,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Name the opening',
      introText: 'This one looks different from the rest. What is it?',
      quizOptions: L2_OPENING_NAMES,
      quizCorrectIndex: 4,
      quizBoardHighlight: l2Mark(['f4']),
      quizExplanation:
        "Right, **the King's Gambit**. A pawn offered on move two for speed and attack.",
      quizExplanationWrong:
        "This is **the King's Gambit**. No knight has even moved yet. White's second move is **f4, offering a pawn**.",
      doneText: 'Next one.',
      hintText: '',
    },
    {
      id: 'q4-four-knights',
      kind: 'quiz',
      fen: L2_OPENINGS.fourKnights,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Name the opening',
      introText: "What's this setup called?",
      quizOptions: L2_OPENING_NAMES,
      quizCorrectIndex: 3,
      quizBoardHighlight: l2Mark(['c3', 'f3', 'c6', 'f6']),
      quizExplanation:
        'Right, **the Four Knights Game**. Count them: all four are already out.',
      quizExplanationWrong:
        'This is **the Four Knights Game**. The name is literal: **count the knights** on the board.',
      doneText: 'Last one.',
      hintText: '',
    },
    {
      id: 'q5-scotch',
      kind: 'quiz',
      fen: L2_OPENINGS.scotch,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Name the opening',
      introText: 'Last one. What is this?',
      quizOptions: L2_OPENING_NAMES,
      quizCorrectIndex: 2,
      quizBoardHighlight: l2Mark(['d4']),
      quizExplanation:
        'Right, **the Scotch Game**. White strikes the center with d4 instead of developing a bishop first.',
      quizExplanationWrong:
        'This is **the Scotch Game**. No bishop has moved. White goes **straight for the center with d4**.',
      doneText: 'Five for five on the names.',
      hintText: '',
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Provereno u chess.js + minimax sa uzimanjima: svako resenje je jedini potez koji dobija materijal.
const L2_DAY_12_SKEWER: Lesson = {
  id: 'l2-d11-skewer',
  level: 2,
  day: 12,
  title: 'Skewer',
  endScreenTitle: "That's the skewer.",
  endScreenText:
    "**Force the big piece to move, take what's behind it.** Same family as the pin, just pointed the other way.",
  flatProgressSegments: true,
  piece: {
    name: 'skewer',
    glyph: '♗',
    movement: 'static',
    bannerText: 'Skewer',
  },
  intro: {
    title: 'Skewer',
    text: "**The opposite of a pin.** A pin traps the weaker piece in front. A skewer forces **the stronger piece in front to move**. Whatever's standing behind it is next.",
  },
  introSteps: [
    {
      text: "**The opposite of a pin.** A pin traps the weaker piece in front. A skewer forces **the stronger piece in front to move**. Whatever's standing behind it is next.",
      buttonText: "Let's skewer!",
    },
  ],
  steps: [
    {
      id: 'intro-skewer',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Skewer',
      introText:
        "You already know the pin: weak piece stuck in front, can't move. A skewer flips it: **something valuable** (sometimes the king itself) is attacked and **HAS to move out of the way**, and there's something less valuable sitting right behind it on the same line. Five positions. Find the move that skewers.",
      doneText: "Let's go.",
      hintText: '',
      nextButtonText: "Let's go!",
      excludeFromProgress: true,
    },
    {
      id: 'p1-rook-king-rook',
      kind: 'puzzle',
      fen: 'r7/8/8/k7/8/8/8/1R2K3 w - - 0 1',
      orientation: 'w',
      solution: ['b1a1'],
      prompt: 'Rook skewers king and rook',
      introText: "Check the king. Then see **what's standing behind it**.",
      doneText:
        "Check. The king has to move off the a-file, and **his rook on a8** is sitting right behind him, undefended. **That's a skewer.**",
      hintText:
        "Hold on. A skewer starts with **a threat the opponent CAN'T ignore**, usually a check, or an attack on something too valuable to lose. Find the move that lines your rook up with his king, with something else of his behind it on the same line.",
      hintTextAlways: true,
    },
    {
      id: 'p2-rook-king-queen',
      kind: 'puzzle',
      fen: 'q3k3/8/8/8/8/8/8/4K2R w - - 0 1',
      orientation: 'w',
      solution: ['h1h8'],
      prompt: 'Rook skewers king and queen',
      introText: "Check again. Look **what's behind the king** this time.",
      doneText:
        "Check. His king moves off the rank, and **his queen, his QUEEN**, is sitting right behind it. **That's about as good as a skewer gets.**",
      hintText:
        "Hold on. Same idea as Puzzle 1. Look carefully at **what's lined up behind his king** this time before you decide where to check from.",
      hintTextAlways: true,
    },
    {
      id: 'p3-bishop-queen-rook',
      kind: 'puzzle',
      fen: 'r6k/5pp1/6bp/8/4q3/6P1/1Q3P1P/2R2BK1 w - - 0 1',
      orientation: 'w',
      solution: ['f1g2'],
      prompt: 'Bishop skewers queen and rook',
      introText:
        "Skewers don't only happen in straight lines. Find this one **on the diagonal**.",
      doneText:
        'Same principle, **different geometry**. His queen is attacked on the diagonal, has to move, and **his rook on a8** is sitting right behind her on that same diagonal.',
      hintText:
        "Hold on. This one's **on a diagonal**, not a file or rank. A bishop skewer works exactly the same way, just along the bishop's own lines. Find the square that **lines up his queen and his rook**.",
      hintTextAlways: true,
    },
    {
      id: 'p4-bishop-queen-rook-2',
      kind: 'puzzle',
      fen: 'rnbr2k1/ppp2pbp/5qp1/3p4/2PPp3/1P4PN/P3PPBP/R1BQ1RK1 w - - 0 1',
      orientation: 'w',
      solution: ['c1g5'],
      prompt: 'Bishop skewer, once again',
      introText:
        'It looks complicated. **The bishop can land an awesome skewer** on the queen and rook. Try to find it!',
      doneText:
        'Bravo! The bishop **attacks the queen** on the diagonal with **the rook right behind her**. The queen has to run, leaving a juicy target behind!',
      hintText:
        "Wait. Look at the whole board and **the c1 bishop's diagonal**. Can it attack something valuable?",
      hintTextAlways: true,
    },
    {
      id: 'p5-queen-king-rook',
      kind: 'puzzle',
      fen: '3k2r1/5p1p/6p1/1r6/8/P7/1P6/1K5Q w - - 0 1',
      orientation: 'w',
      solution: ['h1a8'],
      prompt: 'Queen skewer',
      introText: 'The queen can also be **powerful in a skewer**!',
      doneText:
        "That's it! The queen made **a long journey**, and it's going to yield **a huge reward**!",
      hintText:
        "Not quite. I know it's a long way. Try to spot **the queen's longest diagonal**.",
      hintTextAlways: true,
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Provereno u chess.js: svako resenje je jedini mat (u 1, odnosno u 2), crni odgovor u P3/P4 jedini legalan.
const L2_DAY_13_SMOTHERED_MATE: Lesson = {
  id: 'l2-d12-smothered-mate',
  level: 2,
  day: 13,
  title: 'Smothered Mate',
  endScreenTitle: 'You smothered him.',
  endScreenText:
    "Two mates you just had to spot, **five you had to build yourself**. Same knight, same idea: **box the king in with its own pieces**, then strike from the one square it can't touch.",
  flatProgressSegments: true,
  piece: {
    name: 'smothered mate',
    glyph: '♘',
    movement: 'static',
    bannerText: 'Smothered Mate',
  },
  intro: {
    title: 'Smothered mate',
    text: "The king is **trapped by its own pieces**: no square to run to. A knight delivers the final blow from a square the king can't touch. Watch **how the pattern gets set up**, not just how it ends.",
  },
  introSteps: [
    {
      text: "The king is **trapped by its own pieces**: no square to run to. A knight delivers the final blow from a square the king can't touch. Watch **how the pattern gets set up**, not just how it ends.",
      buttonText: 'Find the Mate!',
    },
  ],
  steps: [
    {
      id: 'p1-smothered-h8',
      kind: 'puzzle',
      fen: '6rk/6pp/7N/8/8/8/8/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['h6f7'],
      prompt: 'Smothered mate in one',
      introText:
        'His king is **boxed in by his own pieces**. Find the knight move that mates.',
      doneText: 'Rook and pawns box him in. **Knight closes it.** Mate.',
      hintText:
        "Not that one. **Only a knight check** works here: he can't block it and has nowhere to run.",
      hintTextAlways: true,
      extraHintText:
        'Rook, both pawns, **no escape square left**. Your knight just needs the right square.',
    },
    {
      id: 'p2-smothered-a8',
      kind: 'puzzle',
      fen: 'kn6/pp6/N7/8/8/8/8/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['a6c7'],
      prompt: 'Smothered mate in one',
      introText: 'Other corner. **Same trap.** Find the mate.',
      doneText: '**No square in the corner.** Mate.',
      hintText:
        "Not that one. Look for **the knight check** from a square he can't take.",
      hintTextAlways: true,
      extraHintText:
        'Same trap, other corner. **His knight and pawns** already did the work.',
    },
    {
      id: 'p3-philidors-legacy',
      kind: 'puzzle',
      fen: '5r1k/6pp/7N/8/8/1Q6/8/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['b3g8', 'f8g8', 'h6f7'],
      prompt: "Philidor's Legacy",
      introText:
        "**Philidor's Legacy.** His king isn't smothered yet. **Make it happen**, then mate.",
      moveExplanations: {
        0: '**His own rook just sealed the exit.**',
      },
      moveGuides: {
        0: {
          hintText:
            "The queen walks into the rook's capture **on purpose**. Look for a check the king can't take because **your knight's watching that square**.",
          wrongText:
            "Not yet. A quiet move gives him time. **Start with a check** he can't answer by taking with the king.",
        },
        2: {
          hintText:
            'The rook you forced there is **now in the way**. Same knight move as before.',
          wrongText:
            'Not that one. **His rook now blocks g8.** Finish it with the knight.',
        },
      },
      doneText: "The queen sac wasn't a blunder. **It was the setup.** Mate.",
      hintText: '',
      hintTextAlways: true,
    },
    {
      id: 'p4-philidors-legacy-mirrored',
      kind: 'puzzle',
      fen: 'k1r5/pp6/N7/8/8/6Q1/8/1K6 w - - 0 1',
      orientation: 'w',
      solution: ['g3b8', 'c8b8', 'a6c7'],
      prompt: "Philidor's Legacy, mirrored",
      introText:
        'Same combination, **other side of the board**. Build the smother, then mate.',
      moveExplanations: {
        0: 'Same trick, same result: **his rook boxed him in.**',
      },
      moveGuides: {
        0: {
          hintText:
            'Same idea as last time, other side of the board. **Which check can the king not take?**',
          wrongText:
            "Not yet. **Start with a check** he can't answer by taking with the king.",
        },
        2: {
          hintText:
            'The knight that **guarded the queen** now delivers the mate.',
          wrongText:
            'Not that one. **His rook now blocks b8.** Finish it with the knight.',
        },
      },
      doneText:
        "Twice in a row. **That's the pattern, not a coincidence.** Mate.",
      hintText: '',
      hintTextAlways: true,
    },
    // Part 2 - provereno u chess.js: jedini mat u 2, odgovor protivnika jedini legalan potez.
    {
      id: 'p5-queen-sac-h7',
      kind: 'puzzle',
      fen: '6rk/1pp3pp/p5q1/6N1/7Q/P6P/1PP2PP1/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['h4h7', 'g6h7', 'g5f7'],
      prompt: 'Smothered mate in two',
      preStepIntro: {
        title: 'Part 2: Real games',
        text: 'Now for **positions from real games**. Find the mate. **Play like a real chess player.**',
        buttonText: "Let's go",
      },
      introText:
        "White to move. His king's **almost smothered already**. Find the sacrifice that finishes the job.",
      moveExplanations: {
        0: '**His queen took the bait** and now blocks h7. His own pieces fill every square around him.',
      },
      moveGuides: {
        0: {
          hintText:
            "Your knight on g5 **guards h7**. A check there can't be answered by the king.",
          wrongText:
            "Not yet. **Start with a check.** Look at h7: who's guarding it?",
        },
        2: {
          hintText: 'Same target square as **the very first example**.',
          wrongText:
            'Not that one. **Every square around his king is full.** One knight check finishes it.',
        },
      },
      doneText: 'Queen sac, queen recapture, **smothered**. Mate.',
      hintText: '',
      hintTextAlways: true,
    },
    {
      id: 'p6-black-queen-sac-g1',
      kind: 'puzzle',
      fen: '3r1rk1/ppp2pp1/1q6/7p/Q7/2N2P1n/PPP3PP/R3R2K b - - 0 1',
      orientation: 'b',
      solution: ['b6g1', 'e1g1', 'h3f2'],
      prompt: 'Smothered mate in two, as Black',
      introText:
        "This time **you're Black**. White's king is tucked in the corner behind his own pawns. Find the mate.",
      moveExplanations: {
        0: '**His rook had to take.** Now it blocks g1.',
      },
      moveGuides: {
        0: {
          hintText:
            'Your knight on h3 covers a key square next to his king. **Check him there with the queen.**',
          wrongText:
            "Not yet. **Start with a check** his king can't answer by taking.",
        },
        2: {
          hintText: 'Rook, pawns, no exits left. **One knight check.**',
          wrongText:
            'Not that one. **Every square around his king is full.** Check with the knight.',
        },
      },
      doneText: "Philidor's Legacy, **from Black's side**. Mate.",
      hintText: '',
      hintTextAlways: true,
    },
    {
      id: 'p7-rook-sac-h2',
      kind: 'puzzle',
      fen: '1b5k/1p5p/2p4r/3p4/3Pn3/2P1B3/1P4PP/5NRK b - - 0 1',
      orientation: 'b',
      solution: ['h6h2', 'f1h2', 'e4g3'],
      prompt: 'Smothered mate with a rook sac',
      introText:
        'Black to move. No queen this time. **A rook does the sacrificing.**',
      moveExplanations: {
        0: "**His knight had to take.** Now it's plugging h2, his king's last exit.",
      },
      moveGuides: {
        0: {
          hintText:
            "Your bishop on b8 **covers h2** from across the board. Check there, and the king can't take.",
          wrongText:
            'Not yet. Look at h2. **Your bishop on b8 is watching it.**',
        },
        2: {
          hintText:
            'Rook on g1, pawn on g2, knight on h2. **Find the knight check.**',
          wrongText:
            "Not that one. **Find the knight check** he can't capture.",
        },
      },
      // Nf2+ je sah, ali ga Be3 uzima.
      otherTypeMoves: {
        2: [
          {
            uci: 'e4f2',
            message:
              "That's check, and his bishop on e3 takes it. **Find the knight check he can't capture.**",
          },
        ],
      },
      doneText:
        '**A rook sac and a long bishop** set it up. Knight finishes. Mate.',
      hintText: '',
      hintTextAlways: true,
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Decoy oznake: zelena strelica = tvoj plan, roza = crni kralj juri mamca; mamac plavo, plen roza.
const L2_PLAN = 'rgba(7, 218, 99, 0.9)';
const L2_CHASE = '#f2358d';
const L2_PRIZE = 'rgba(242, 53, 141, 0.45)';
function l2DecoyPlan(
  decoy: string[],
  prize: string[],
  plan: [string, string][],
  chase: [string, string][] = []
) {
  return {
    arrows: [
      ...plan.map(([from, to]) => ({ from, to, color: L2_PLAN })),
      ...chase.map(([from, to]) => ({ from, to, color: L2_CHASE })),
    ],
    squares: [
      ...decoy.map((square) => ({ square, color: L2_LINE, fill: true })),
      ...prize.map((square) => ({ square, color: L2_PRIZE, fill: true })),
    ],
  };
}
type L2DecoyHighlight = ReturnType<typeof l2DecoyPlan>;

// Zavrsna animacija primera: linija do dame (Stockfish), na kraju konfete.
function l2DecoyFinish(
  moves: string,
  pawnFrom: string,
  promo: string,
  endText: string
): NonNullable<LessonStep['quizDemoLine']> {
  const path = {
    arrows: [{ from: pawnFrom, to: promo, color: L2_PLAN }],
    squares: [{ square: promo, color: 'rgba(7, 218, 99, 0.55)', fill: true }],
  };
  const ucis = moves.split(' ');
  return ucis.map((uci, i) =>
    i === 0
      ? {
          uci,
          text: "Let's play it out **all the way to the queen**.",
          highlight: path,
          focus: true,
        }
      : i === ucis.length - 1
      ? { uci, text: endText, highlight: path, celebrate: true }
      : { uci }
  );
}

// Jedan skriptovan potez kao kviz sa jednim dugmetom: korisnik klikne ili odigra potez, app odigra odgovor i nacrta novi plan.
function l2DecoyMove(
  id: string,
  fen: string,
  label: string,
  uci: string,
  reply: string,
  introText: string,
  text: string,
  plan: L2DecoyHighlight,
  after: L2DecoyHighlight,
  finish: NonNullable<LessonStep['quizDemoLine']> = []
): LessonStep {
  return {
    id,
    kind: 'quiz',
    fen,
    orientation: 'w',
    solution: ['quiz'],
    prompt: 'Your move',
    introText,
    quizOptions: [label],
    quizCorrectIndex: 0,
    quizMoveOptions: [[uci]],
    quizAutoPlayMove: uci,
    quizBoardHighlight: plan,
    quizBoardHighlightUpfront: true,
    quizDemoLine: [{ uci: reply, text, highlight: after }, ...finish],
    doneText: '',
    hintText: '',
    noAutoAdvance: true,
    excludeFromProgress: true,
  };
}

// Procene i svaki beli potez u linijama provereni Stockfish-om (d24, Primer 5 d32: +13); FEN-ovi iz chess.js.
const L2_DAY_15_DECOY: Lesson = {
  id: 'l2-d13-decoy',
  level: 2,
  day: 15,
  title: 'Decoy: The Outside Passed Pawn',
  endScreenTitle: "You don't need a bigger army.",
  endScreenText:
    'Five positions, same idea every time: **a pawn far from home is a job for the enemy king**, not yours. Send it, and **go get what it leaves behind**.',
  flatProgressSegments: true,
  piece: {
    name: 'decoy',
    glyph: '♙',
    movement: 'static',
    bannerText: 'Decoy!',
  },
  intro: {
    title: 'Decoy!',
    text: "A pawn far from the action, with nothing left to stop it, is **worth more than it looks**. It doesn't win by promoting. **It wins by pulling the enemy king away** from everything else. Watch what happens while he's gone.",
  },
  introSteps: [
    {
      text: "A pawn far from the action, with nothing left to stop it, is **worth more than it looks**. It doesn't win by promoting. **It wins by pulling the enemy king away** from everything else. Watch what happens while he's gone.",
      buttonText: 'Start',
    },
  ],
  steps: [
    // ---------- Primer 1 - Win ----------
    {
      id: 'e1-classify',
      kind: 'quiz',
      fen: '8/8/4k3/P5p1/6P1/4K3/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Win or draw?',
      introText: 'Black to move. What do you think? **Win or draw?**',
      quizOptions: ['Win', 'Draw'],
      quizCorrectIndex: 0,
      extraHintText:
        'Look at **the a-pawn**. Nobody can stop it except the black king.',
      quizBoardHighlight: l2DecoyPlan(
        ['a5'],
        ['g5'],
        [['e3', 'g5']],
        [['e6', 'a6']]
      ),
      quizExplanation:
        "True. The black king can catch it. Here we're learning what **a decoy** really means: even after he catches it, **we still have a prize on the other side** that secures the win!",
      quizExplanationWrong:
        "Even if he catches the pawn, it's not a draw. **That's the magic of a decoy!** It acts as bait, sacrificed for a much bigger win!",
      doneText: '',
      hintText: '',
      noAutoAdvance: true,
    },
    {
      ...l2DecoyMove(
        'e1-a6',
        '8/8/4k3/P5p1/6P1/4K3/8/8 b - - 0 1',
        '2.a6',
        'a5a6',
        'd6c6',
        '1...Kd6. **The king has to chase the pawn**, or it will promote to a queen. Your move.',
        '**Decoy!** It lures the king in and acts like a magnet, giving your king **a clear and easy path**.',
        l2DecoyPlan(['a5'], ['g5'], [['e3', 'g5']], [['d6', 'a6']]),
        l2DecoyPlan(['a6'], ['g5'], [['e3', 'g5']], [['c6', 'a6']])
      ),
      playMoveOnLoad: 'e6d6',
    },
    l2DecoyMove(
      'e1-ke4',
      '8/8/P1k5/6p1/6P1/4K3/8/8 w - - 1 3',
      '3.Ke4',
      'e3e4',
      'c6b6',
      'His king is busy on the queenside. **Yours heads the other way.**',
      'Every step he takes toward the a-pawn is **a step away from g5**.',
      l2DecoyPlan(['a6'], ['g5'], [['e3', 'g5']], [['c6', 'a6']]),
      l2DecoyPlan(['a6'], ['g5'], [['e4', 'f5']], [['b6', 'a6']])
    ),
    l2DecoyMove(
      'e1-kf5',
      '8/8/Pk6/6p1/4K1P1/8/8/8 w - - 3 4',
      '4.Kf5',
      'e4f5',
      'b6a6',
      'Go get the prize.',
      "The decoy pawn **sacrificed itself** for the greater good! Now the pawn on the kingside falls, and with the king's support, **it's smooth sailing toward promotion**.",
      l2DecoyPlan(['a6'], ['g5'], [['e4', 'f5']], [['b6', 'a6']]),
      l2DecoyPlan(
        [],
        ['g5'],
        [
          ['f5', 'g5'],
          ['g4', 'g8'],
        ]
      ),
      l2DecoyFinish(
        'f5g5 a6b5 g5f6 b5c5 g4g5 c5d6 g5g6 d6c5 g6g7 c5d4 g7g8q',
        'g4',
        'g8',
        '**Queen.** The decoy pawn did its job.'
      )
    ),
    // ---------- Primer 2 - Draw ----------
    {
      id: 'e2-classify',
      kind: 'quiz',
      fen: '8/8/4k3/6p1/6P1/4K3/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Win or draw?',
      introText:
        'Do you see **a decoy pawn** anywhere now? It looks like everything on the kingside is completely locked up. What do you think about this position?',
      quizOptions: ['Win', 'Draw'],
      quizCorrectIndex: 1,
      extraHintText:
        'Look for a pawn **far from everything else**. Is there one?',
      quizBoardHighlight: l2DecoyPlan([], ['g4', 'g5'], []),
      quizExplanation:
        "That's right! You can try various tricks. Even if you lose the pawn, **you'll hold the draw using the opposition**.",
      quizExplanationWrong:
        "No, nobody can break through here, and **we don't have a decoy pawn** to drag the king to the other side so we can capture this pawn.",
      doneText: '',
      hintText: '',
      noAutoAdvance: true,
    },
    // ---------- Primer 3 - Win ----------
    {
      id: 'e3-classify',
      kind: 'quiz',
      fen: '8/8/4k3/2p5/2P4P/5K2/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Who wins?',
      introText: 'Who do you think wins? **White, or is it a draw?**',
      quizOptions: ['Draw', 'White wins'],
      quizCorrectIndex: 1,
      extraHintText: 'Which pawn is **far from everything else**?',
      quizBoardHighlight: l2DecoyPlan(
        ['h4'],
        ['c5'],
        [['f3', 'c5']],
        [['e6', 'h5']]
      ),
      quizExplanation:
        "Yes, **there's a decoy**, and White will win the game! Just like we saw earlier.",
      quizExplanationWrong:
        "Nope, this is a winning position! It's won by **luring the Black king toward the decoy pawn**, allowing us to pick up the prize on the other side.",
      doneText: '',
      hintText: '',
      noAutoAdvance: true,
    },
    l2DecoyMove(
      'e3-ke4',
      '8/8/4k3/2p5/2P4P/5K2/8/8 w - - 0 1',
      '1.Ke4',
      'f3e4',
      'e6f6',
      "Let's prove it.",
      "**Opposition** and control of key central squares! Black's king must keep an eye on the h-pawn, otherwise it will promote to a queen.",
      l2DecoyPlan(['h4'], ['c5'], [['f3', 'c5']], [['e6', 'h5']]),
      l2DecoyPlan(['h4'], ['c5'], [['e4', 'd5']], [['f6', 'h5']])
    ),
    l2DecoyMove(
      'e3-kd5',
      '8/8/5k2/2p5/2P1K2P/8/8/8 w - - 2 2',
      '2.Kd5',
      'e4d5',
      'f6g6',
      'Head for the prize.',
      'White gets closer to the prize while **Black stays stretched thin**.',
      l2DecoyPlan(['h4'], ['c5'], [['e4', 'd5']], [['f6', 'h5']]),
      l2DecoyPlan(['h4'], ['c5'], [['d5', 'c5']], [['g6', 'h5']])
    ),
    l2DecoyMove(
      'e3-kxc5',
      '8/8/6k1/2pK4/2P4P/8/8/8 w - - 4 3',
      '3.Kxc5',
      'd5c5',
      'g6h5',
      'Take it.',
      "...and from here, **it's a smooth path to promoting a queen**!",
      l2DecoyPlan(['h4'], ['c5'], [['d5', 'c5']], [['g6', 'h5']]),
      l2DecoyPlan(['h4'], [], [['c4', 'c8']], [['h5', 'h4']]),
      l2DecoyFinish(
        'c5d6 h5h4 c4c5 h4g5 c5c6 g5f6 c6c7 f6f7 c7c8q',
        'c4',
        'c8',
        '**Queen.** He ate the bait. You got the queen.'
      )
    ),
    // ---------- Primer 4 - Win ----------
    {
      id: 'e4-classify',
      kind: 'quiz',
      fen: '8/8/4k3/3p2p1/3P2P1/P3K3/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Win or draw?',
      introText: 'What kind of position is this?',
      quizOptions: ['White wins', 'Draw'],
      quizCorrectIndex: 0,
      extraHintText: '**The a-pawn** has no black pawn anywhere near it.',
      quizBoardHighlight: l2DecoyPlan(['a3'], ['d5', 'g5'], [['a3', 'a8']]),
      quizExplanation:
        "That's right! You've already mastered the decoy: **you spot the bait and know you're winning**. Bravo!",
      quizExplanationWrong:
        "You have a decoy. **Use it to win the game**, just like in the previous examples. It's the exact same principle!",
      doneText: '',
      hintText: '',
      noAutoAdvance: true,
    },
    l2DecoyMove(
      'e4-kd3',
      '8/8/4k3/3p2p1/3P2P1/P3K3/8/8 w - - 0 1',
      '1.Kd3!',
      'e3d3',
      'e6d6',
      "Let's prove it. King first.",
      "Don't forget: it's crucial to **put your king on the best possible square first**! You can always push the decoy pawn later.",
      l2DecoyPlan(['a3'], ['d5'], [['e3', 'b4']]),
      l2DecoyPlan(['a3'], ['d5'], [['d3', 'b4']])
    ),
    l2DecoyMove(
      'e4-kc3',
      '8/8/3k4/3p2p1/3P2P1/P2K4/8/8 w - - 2 2',
      '2.Kc3',
      'd3c3',
      'd6c6',
      'Keep walking.',
      'Your king **stays one step ahead** of his.',
      l2DecoyPlan(['a3'], ['d5'], [['d3', 'b4']]),
      l2DecoyPlan(['a3'], ['d5'], [['c3', 'b4']])
    ),
    l2DecoyMove(
      'e4-kb4',
      '8/8/2k5/3p2p1/3P2P1/P1K5/8/8 w - - 4 3',
      '3.Kb4!',
      'c3b4',
      'c6b6',
      'One more king move.',
      "Now that the king is on the ideal square, **it's time to think about the decoy!**",
      l2DecoyPlan(['a3'], ['d5'], [['c3', 'b4']]),
      l2DecoyPlan(['a3'], ['d5'], [['a3', 'a5']])
    ),
    l2DecoyMove(
      'e4-a4',
      '8/8/1k6/3p2p1/1K1P2P1/P7/8/8 w - - 6 4',
      '4.a4',
      'a3a4',
      'b6c6',
      'Now the pawn.',
      'The decoy **starts its march**.',
      l2DecoyPlan(['a3'], ['d5'], [['a3', 'a5']]),
      l2DecoyPlan(['a4'], ['d5'], [['a4', 'a5']])
    ),
    l2DecoyMove(
      'e4-a5',
      '8/8/2k5/3p2p1/PK1P2P1/8/8/8 w - - 1 5',
      '5.a5',
      'a4a5',
      'c6b7',
      'Keep pushing.',
      '**And here it is: the decoy in action!**',
      l2DecoyPlan(['a4'], ['d5'], [['a4', 'a5']]),
      l2DecoyPlan(['a5'], ['d5'], [['b4', 'c5']], [['b7', 'a6']])
    ),
    l2DecoyMove(
      'e4-kc5',
      '8/1k6/8/P2p2p1/1K1P2P1/8/8/8 w - - 1 6',
      '6.Kc5!!',
      'b4c5',
      'b7a6',
      'His king went after the pawn. **Your king goes after everything else.**',
      'Thanks to the decoy pawn, **we gained crucial space**. Now we capture the key pawns, promote to a queen, and secure the victory!',
      l2DecoyPlan(['a5'], ['d5'], [['b4', 'c5']], [['b7', 'a6']]),
      l2DecoyPlan(['a5'], ['d5', 'g5'], [['c5', 'd5']], [['a6', 'a5']]),
      l2DecoyFinish(
        'c5d5 a6a5 d5c6 a5b4 d4d5 b4c3 d5d6 c3d4 d6d7 d4e3 d7d8q',
        'd4',
        'd8',
        '**Queen.** One pawn sacrificed, one queen made.'
      )
    ),
    // ---------- Primer 5 - Win, samo procena ----------
    {
      id: 'e5-classify',
      kind: 'quiz',
      fen: '8/5ppp/4k3/8/P3K3/5PPP/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'White to play',
      introText:
        "One final example. You've got the hang of this. White to play: **draw, or White wins?**",
      quizOptions: ['Draw', 'White wins'],
      quizCorrectIndex: 1,
      extraHintText:
        'Four pawns against three. **Which pawn has no opponent on its side of the board?**',
      quizBoardHighlight: l2DecoyPlan(
        ['a4'],
        ['f7', 'g7', 'h7'],
        [
          ['a4', 'a8'],
          ['e4', 'f5'],
        ],
        [['e6', 'b6']]
      ),
      quizExplanation:
        "That's right! White wins, and **it's all thanks to the decoy pawn**. The Black king is forced to chase it, leaving **all the kingside pawns wide open** for taking!",
      quizExplanationWrong:
        'Remember, the decoy is the one that gets sacrificed to decide the game, leaving **your king completely free** to sweep up all the pawns on the kingside!',
      doneText: '',
      hintText: '',
      noAutoAdvance: true,
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Hangs/Safe strelice: bela = figura koja je otisla, roza = napadac.
const L2_MOVED_AWAY = 'rgba(255, 255, 255, 0.6)';
const L2_ATTACKER = 'rgba(242, 53, 141, 0.85)';

// Hangs/Safe pitanje: potez kandidat se odigra na tabli, pa korisnik bira.
function l2Candidate(
  id: string,
  fen: string,
  orientation: 'w' | 'b',
  uci: string,
  san: string,
  options: string[],
  correctIndex: number,
  extraHintText: string,
  quizExplanation: string,
  quizExplanationWrong: string
): LessonStep {
  return {
    id,
    kind: 'quiz',
    fen,
    orientation,
    solution: ['quiz'],
    prompt: `Candidate move: ${san}`,
    introText: `**${san}.** Before you play it: **does it hang anything?**`,
    playMoveOnLoad: uci,
    quizOptions: options,
    quizCorrectIndex: correctIndex,
    extraHintText,
    quizExplanation,
    quizExplanationWrong,
    doneText: '',
    hintText: '',
  };
}

// "Oznaci figuru koja visi" - standardni markSquares, tabla posle poteza kandidata.
function l2Locate(
  id: string,
  fen: string,
  orientation: 'w' | 'b',
  square: string,
  extraHintText: string,
  doneText: string,
  retryPromptText: string,
  arrows: { from: string; to: string; color: string }[]
): LessonStep {
  return {
    id,
    kind: 'markSquares',
    fen,
    orientation,
    solution: [square],
    prompt: 'Find what hangs',
    introText:
      "**Mark the piece** that's left hanging. **Right-click** it on desktop or tap it on mobile.",
    extraHintText,
    doneText,
    retryPromptText,
    hintText: '',
    quizBoardHighlight: {
      arrows,
      squares: [{ square, color: L2_PRIZE, fill: true }],
    },
    excludeFromProgress: true,
  };
}

// Provereno u chess.js: kandidat ostavlja metu bez branioca (E1/E2/E5), Rd1# (E4), E3 jedan napadac/jedan branilac.
const L2_DAY_16_HANGS: Lesson = {
  id: 'l2-d14-hangs',
  level: 2,
  day: 16,
  title: 'Hangs or Safe?',
  endScreenTitle: 'The habit is the win.',
  endScreenText:
    'Five moves, one question every time: **what does this actually leave behind?** Ask it before you play, not after.',
  flatProgressSegments: true,
  piece: {
    name: 'hang check',
    glyph: '♞',
    movement: 'static',
    bannerText: 'Hangs / Safe',
  },
  intro: {
    title: "Does this move hang anything? Let's play Hangs / Safe!",
    text: "Before you play a move, ask one question: **what am I attacking, and what am I leaving behind?** Five positions, five candidate moves. Some are fine, some aren't. **Find out which is which** before your opponent does.",
  },
  introSteps: [
    {
      text: "Before you play a move, ask one question: **what am I attacking, and what am I leaving behind?** Five positions, five candidate moves. Some are fine, some aren't. **Find out which is which** before your opponent does.",
      buttonText: 'Start',
    },
  ],
  steps: [
    // ---------- Primer 1 - Hangs, pesak ----------
    l2Candidate(
      'e1-classify',
      'r5k1/p5pp/1p3n2/8/4P3/2N4P/PP4P1/5RK1 w - - 0 1',
      'w',
      'c3d5',
      'Nd5',
      ['Hangs', 'Safe'],
      0,
      'What was the knight on c3 **doing before it moved**?',
      'Right. **Hangs.** The knight on c3 was **the only thing defending e4**. Now Black just takes it: Nxe4.',
      "It's not safe. That knight was **the only defender of the pawn on e4**. Try to spot it on the board and **mark the undefended piece**. Everything gets much clearer once you see it."
    ),
    l2Locate(
      'e1-locate',
      'r5k1/p5pp/1p3n2/3N4/4P3/7P/PP4P1/5RK1 b - - 1 1',
      'w',
      'e4',
      'Which of your pieces did the knight **stop protecting**?',
      "That's it. **One pawn, gone for nothing.**",
      "When we move the knight, **the pawn is left undefended**. That's the whole philosophy!",
      [
        { from: 'c3', to: 'd5', color: L2_MOVED_AWAY },
        { from: 'f6', to: 'e4', color: L2_ATTACKER },
      ]
    ),
    // ---------- Primer 2 - Hangs, lovac ----------
    l2Candidate(
      'e2-classify',
      '1n2k1b1/pp6/8/8/2B5/8/PP1N4/4K3 w - - 0 1',
      'w',
      'd2e4',
      'Ne4',
      ['Safe', 'Hangs'],
      1,
      'The knight on d2 was covering **one square that matters a lot** right now. Which one?',
      "Right. **Hangs.** That knight was **the only defender of your bishop on c4**. Bxc4 next and it's just gone.",
      'Nope! Try to locate the hanging piece and mark it. P.S. **The knight is the only defender of your bishop!**'
    ),
    l2Locate(
      'e2-locate',
      '1n2k1b1/pp6/8/8/2B1N3/8/PP6/4K3 b - - 1 1',
      'w',
      'c4',
      'Which piece **lost its only defender**?',
      "**A whole bishop**, for a knight hop that didn't even threaten anything.",
      "Moving the knight leaves **the bishop totally undefended**. That's the whole story!",
      [
        { from: 'd2', to: 'e4', color: L2_MOVED_AWAY },
        { from: 'g8', to: 'c4', color: L2_ATTACKER },
      ]
    ),
    // ---------- Primer 3 - Safe ----------
    {
      ...l2Candidate(
        'e3-classify',
        '4k3/8/1n6/8/8/1P6/8/4KB2 w - - 0 1',
        'w',
        'f1c4',
        'Bc4',
        ['Safe', 'Hangs'],
        0,
        '**Count.** How many black pieces attack c4? How many white pieces defend it?',
        "Right. **Safe.** One attacker (the knight), one defender (your b3 pawn). If he takes, you recapture and **it's an even trade**. That's not a blunder, that's just chess.",
        "No, the piece isn't hanging. **Look at what's defending it!** It's right next to it, so it's practically a trade."
      ),
      quizBoardHighlight: {
        squares: [{ square: 'b3', color: L2_LINE, fill: true }],
      },
    },
    {
      id: 'e3-recapture',
      kind: 'puzzle',
      fen: '4k3/8/1n6/8/2B5/1P6/8/4K3 b - - 1 1',
      orientation: 'w',
      solution: ['b6c4', 'b3c4'],
      prompt: 'Your move!',
      introText: 'He takes on c4. **Take back.**',
      doneText: '**Bravo!** Even trade, nothing hangs.',
      hintText: 'Not that one. **Recapture on c4.** That keeps the trade even.',
      hintTextAlways: true,
      excludeFromProgress: true,
    },
    // ---------- Primer 4 - Hangs, mat ----------
    l2Candidate(
      'e4-classify',
      '3r2k1/5ppp/1b6/8/8/3Q4/5PPP/6K1 w - - 0 1',
      'w',
      'd3h3',
      'Qh3',
      ['Safe', 'Hangs'],
      1,
      "Your queen was **the only thing covering the back rank**. What's sitting on the d-file, aimed right at your king?",
      "Right. **Hangs**, and it's the worst kind: **Rd1 is mate.** Your own pawns on f2, g2 and h2 box your king in, and nothing's left to block or capture on the back rank.",
      "Oh, not safe at all. In fact, **you're done in one move!** That's a back-rank mate."
    ),
    l2Locate(
      'e4-locate',
      '3r2k1/5ppp/1b6/8/8/7Q/5PPP/6K1 b - - 1 1',
      'w',
      'g1',
      "It's not a pawn or a piece this time. **What's the most valuable thing on the board?**",
      "That's the one habit that matters more than any other: **check the back rank before every quiet move.**",
      "Nope. **Your king** is the one in danger. Rd1 and it's mate.",
      [{ from: 'd8', to: 'd1', color: L2_ATTACKER }]
    ),
    // ---------- Primer 5 - Hangs, pesak (crni) ----------
    l2Candidate(
      'e5-classify',
      '1r3rk1/1p3pp1/1P4qp/2p5/3p4/3P1Q1P/2P2PP1/4RRK1 b - - 0 1',
      'b',
      'b8e8',
      'Rbe8',
      ['Hangs', 'Safe'],
      0,
      "**Never leave your pieces undefended**, just like that key pawn that's about to be left alone.",
      'Right. If Black moves the rook, **that important b7 pawn is lost**. Always stay alert to threats!',
      "Not safe. The rook on b8 was **the only defender of b7**, and White's queen is already looking at it."
    ),
    l2Locate(
      'e5-locate',
      '4rrk1/1p3pp1/1P4qp/2p5/3p4/3P1Q1P/2P2PP1/4RRK1 w - - 1 2',
      'b',
      'b7',
      "Follow **White's queen** along the diagonal.",
      '**Free pawns** are the ones worth checking twice. You got this!',
      "Take a look at what **White's queen** is attacking diagonally, and it'll be much easier to see. Try again.",
      [{ from: 'f3', to: 'b7', color: L2_ATTACKER }]
    ),
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Partija pre mata: svaki potez je watch korak (prvo potez, pa komentar).
type L2GameMove = [fen: string, uci: string, label: string, text: string];
const l2WatchGame = (game: string, moves: L2GameMove[]): LessonStep[] =>
  moves.map(([fen, uci, label, text], i) => ({
    id: `${game}-m${i + 1}`,
    kind: 'quiz',
    fen,
    orientation: 'w',
    solution: ['quiz'],
    prompt: label,
    introText: text,
    playMoveOnLoad: uci,
    doneText: '',
    hintText: '',
    nextButtonText: i === moves.length - 1 ? 'Your move' : 'Next move',
    noAutoAdvance: true,
    excludeFromProgress: true,
    continuesGame: i > 0,
  }));
const l2FindMate = (
  id: string,
  fen: string,
  uci: string,
  title: string,
  doneText: string,
  missTexts: [string, string],
  doneTextAfterMiss: string
): LessonStep => ({
  id,
  kind: 'puzzle',
  fen,
  orientation: 'w',
  solution: [uci],
  prompt: title,
  introText: '**Can you find the mate?**',
  doneText,
  doneTextAfterMiss,
  missTexts,
  hintText: missTexts[0],
  hintTextAlways: true,
  continuesGame: true,
});

// Provereno u chess.js: sve tri partije legalne od pocetne pozicije, zavrsni potez je jedini mat.
const L2_DAY_17_OPENING_TRAPS: Lesson = {
  id: 'l2-d15-opening-traps',
  level: 2,
  day: 17,
  title: 'Opening Trap Checkmates',
  endScreenTitle: 'Now you know the trap.',
  endScreenText:
    "Three games, three quick mates, and every one came from **a move that looked completely normal**. That's the lesson: **normal isn't always safe.**",
  flatProgressSegments: true,
  piece: {
    name: 'opening traps',
    glyph: '♘',
    movement: 'static',
    bannerText: 'Opening Trap Checkmates',
  },
  intro: {
    title: 'Opening Trap Checkmates',
    text: "Three famous games, three quick checkmates. Each one grew out of **a trap in the opening**. Watch how it happens, move by move. Then, right before the finish, **it's your move**.",
  },
  introSteps: [
    {
      text: "Three famous games, three quick checkmates. Each one grew out of **a trap in the opening**. Watch how it happens, move by move. Then, right before the finish, **it's your move**.",
      buttonText: 'Watch & Solve',
    },
  ],
  steps: [
    // ---------- Primer 1 - Caro-Kann smothered mate ----------
    ...l2WatchGame('g1-caro', [
      [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'e2e4',
        '1. e4',
        '**Game 1 of 3: the Caro-Kann trap.** Center pawn. It opens lines for the bishop and queen. A standard, strong start.',
      ],
      [
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
        'c7c6',
        '1... c6',
        '**The Caro-Kann.** Solid. It prepares ...d5 without boxing in the light-squared bishop.',
      ],
      [
        'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        'd2d4',
        '2. d4',
        'White claims **the full center**.',
      ],
      [
        'rnbqkbnr/pp1ppppp/2p5/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2',
        'd7d5',
        '2... d5',
        'Black challenges it right away. **Main line.**',
      ],
      [
        'rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3',
        'b1c3',
        '3. Nc3',
        'Defends e4 and develops a piece. Natural.',
      ],
      [
        'rnbqkbnr/pp2pppp/2p5/3p4/3PP3/2N5/PPP2PPP/R1BQKBNR b KQkq - 1 3',
        'd5e4',
        '3... dxe4',
        'A trade in the center. **Completely normal** Caro-Kann.',
      ],
      [
        'rnbqkbnr/pp2pppp/2p5/8/3Pp3/2N5/PPP2PPP/R1BQKBNR w KQkq - 0 4',
        'c3e4',
        '4. Nxe4',
        'Recaptures. The knight lands **in the middle of the board**.',
      ],
      [
        'rnbqkbnr/pp2pppp/2p5/8/3PN3/8/PPP2PPP/R1BQKBNR b KQkq - 0 4',
        'b8d7',
        '4... Nd7',
        'Looks like ordinary development. It quietly takes **d7, a square the king will need later**.',
      ],
      [
        'r1bqkbnr/pp1npppp/2p5/8/3PN3/8/PPP2PPP/R1BQKBNR w KQkq - 1 5',
        'd1e2',
        '5. Qe2',
        "Quiet-looking. This is the real threat: once the knight leaves e4, **the queen stares straight down the e-file** at Black's king. Black won't see it coming.",
      ],
      [
        'r1bqkbnr/pp1npppp/2p5/8/3PN3/8/PPP1QPPP/R1B1KBNR b KQkq - 2 5',
        'g8f6',
        '5... Ngf6??',
        '**The blunder.** Developing the other knight looks completely natural. It does nothing about the threat: **d7 is still blocked**, so the king has no square to run to.',
      ],
    ]),
    l2FindMate(
      'g1-caro-mate',
      'r1bqkb1r/pp1npppp/2p2n2/8/3PN3/8/PPP1QPPP/R1B1KBNR w KQkq - 3 6',
      'e4d6',
      'Caro-Kann Smothered Mate Trap',
      "**Smothered.** The king can't move, the e7 pawn can't take because **your queen pins it**, nothing can block. That's the whole trap: two normal-looking knight moves and Black boxed in his own king.",
      [
        "Not mate yet. Look for **the move that doesn't let his king move at all**.",
        'Still looking? **Same knight, different square.**',
      ],
      'There it is. **Nd6#.** Smothered mate.'
    ),
    // ---------- Primer 2 - Legal's Mate ----------
    ...l2WatchGame('g2-legal', [
      [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'e2e4',
        '1. e4',
        "**Game 2 of 3: Légal's Mate.** Center pawn.",
      ],
      [
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
        'e7e5',
        '1... e5',
        'Mirrors it. **An open game.**',
      ],
      [
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        'g1f3',
        '2. Nf3',
        'Attacks e5 and develops.',
      ],
      [
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
        'd7d6',
        '2... d6',
        'Defends e5 passively. Playable, and already **a small concession**.',
      ],
      [
        'rnbqkbnr/ppp2ppp/3p4/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3',
        'f1c4',
        '3. Bc4',
        "Eyes **f7, the weakest square** in Black's camp from the very first moves.",
      ],
      [
        'rnbqkbnr/ppp2ppp/3p4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 1 3',
        'c8g4',
        '3... Bg4',
        "Pins the knight to the queen. Looks strong. **It's about to backfire.**",
      ],
      [
        'rn1qkbnr/ppp2ppp/3p4/4p3/2B1P1b1/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 4',
        'b1c3',
        '4. Nc3',
        "Develops and ignores the pin. **The king isn't behind that knight**, only the queen. So the knight is still free to move.",
      ],
      [
        'rn1qkbnr/ppp2ppp/3p4/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R b KQkq - 3 4',
        'g7g6',
        '4... g6??',
        "A slow move that does nothing about what's coming. **This is the losing move.**",
      ],
      [
        'rn1qkbnr/ppp2p1p/3p2p1/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5',
        'f3e5',
        '5. Nxe5!!',
        'The point. **White gives up the queen** for a pawn, because that "pinned" knight was never really pinned.',
      ],
      [
        'rn1qkbnr/ppp2p1p/3p2p1/4N3/2B1P1b1/2N5/PPPP1PPP/R1BQK2R b KQkq - 0 5',
        'g4d1',
        '5... Bxd1',
        'Black grabs the queen and **walks straight into it**.',
      ],
      [
        'rn1qkbnr/ppp2p1p/3p2p1/4N3/2B1P3/2N5/PPPP1PPP/R1BbK2R w KQkq - 0 6',
        'c4f7',
        '6. Bxf7+',
        'Check. It **drags the king into the open**.',
      ],
      [
        'rn1qkbnr/ppp2B1p/3p2p1/4N3/4P3/2N5/PPPP1PPP/R1BbK2R b KQkq - 0 6',
        'e8e7',
        '6... Ke7',
        'Forced. **The only legal move.**',
      ],
    ]),
    l2FindMate(
      'g2-legal-mate',
      'rn1q1bnr/ppp1kB1p/3p2p1/4N3/4P3/2N5/PPPP1PPP/R1BbK2R w KQ - 1 7',
      'c3d5',
      "Légal's Mate",
      "Two knights and a bishop finish it with the king stuck in the middle of the board. **The queen sac wasn't a blunder. It was the whole plan.**",
      [
        'You need **the move that leaves him with nowhere to go at all**.',
        'That knight has **exactly one square** that ends this.',
      ],
      '**Nd5#.** Checkmate. Everything since move 5 led here.'
    ),
    // ---------- Primer 3 - Scholar's Mate ----------
    ...l2WatchGame('g3-scholar', [
      [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'e2e4',
        '1. e4',
        "**Game 3 of 3: Scholar's Mate.** Center pawn.",
      ],
      [
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
        'e7e5',
        '1... e5',
        'Symmetric reply.',
      ],
      [
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        'd1h5',
        '2. Qh5',
        "An early queen move. Not textbook development. It's **a direct threat on f7 and e5**, and Black has to notice.",
      ],
      [
        'rnbqkbnr/pppp1ppp/8/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 1 2',
        'b8c6',
        '2... Nc6',
        'A natural developing move. It defends e5 and **ignores what the queen is actually doing**.',
      ],
      [
        'r1bqkbnr/pppp1ppp/2n5/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR w KQkq - 2 3',
        'f1c4',
        '3. Bc4',
        '**Second attacker on f7.** Two pieces now aim at a square only the king defends.',
      ],
      [
        'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1KBNR b KQkq - 3 3',
        'g8f6',
        '3... Nf6??',
        "Develops and even attacks the queen. Looks active. **It doesn't defend f7, and it's already too late.**",
      ],
    ]),
    l2FindMate(
      'g3-scholar-mate',
      'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
      'h5f7',
      "Scholar's Mate",
      'f7 was only ever defended once, by the king. **Two attackers beat one defender**, and the king has nowhere to run. The most famous quick mate in chess, and now you know exactly why it works.',
      [
        'Nope. **Find the piece that actually ends it.**',
        "She's been sitting there the whole game, **waiting for this**.",
      ],
      '**Qxf7#.** Checkmate.'
    ),
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    {
      label: 'Next',
      action: 'placeholder',
      tooltip: 'Come back tomorrow for the next one. One lesson at a time.',
    },
  ],
};

// Zajednicke Pawny poruke za partije u drugoj turi (svaka verzija dodaje svoje dve).
const L2_PAWNY_LINES = [
  "I've stopped giving pieces away for free. Most of the time.",
  "You've gotten sharper. So have I.",
  'I actually look at what you attack now. New habit.',
  "This is the part where I'd usually blunder. Watching myself.",
  'I learned what a pin is. I plan to use it on you.',
  "You're making me think. I don't love it.",
  'Every game you play, I get one update. Keep up.',
  'I counted the material twice this time. Still close.',
  "That move made sense. I'm almost annoyed.",
  "Rated higher, same nerves. Let's go.",
  "I've read about endgames. Let's not find out if it helped.",
  "Whatever happens, you're playing a stronger me today.",
  'Good game so far. I mean that. Mostly.',
];
const L2_PAWNY_END_BUTTONS: Lesson['endScreenButtons'] = [
  { label: 'Play again', action: 'repeat' },
  { label: 'Game Review', action: 'review' },
  { label: 'Done', action: 'done' },
];

// Prva od 3 nove Pawny partije u drugoj turi. Rejting se bira po partiji, vidi Lesson.pawnyRating.
const L2_DAY_7_PAWNY_4: Lesson = {
  id: 'l2-pawny-4-game',
  level: 2,
  day: 7,
  title: 'Game vs Pawny 4.0',
  endScreenTitle: 'Game over vs. Pawny 4.0 ({rating})',
  piece: {
    name: 'pawny 4.0',
    glyph: '♟',
    movement: 'mascot',
    bannerText: 'Pawny 4.0 ({rating})',
    subBannerText: 'Rated 700–950',
  },
  intro: {
    title: 'Time for a real game',
    text: "**Pawny's a bit stronger this time.** Today's rating: **{rating}**. Full game, no hints. Show what stuck.",
  },
  introSteps: [
    {
      text: "**Pawny's a bit stronger this time.** Today's rating: **{rating}**. Full game, no hints. Show what stuck.",
      buttonText: 'Ready',
    },
  ],
  pawnyAvatar: '/pawny/pawny4.webp',
  pawnyAvatarFramed: true,
  pawnyRating: {
    min: 700,
    max: 950,
    jitter: 40,
    clampMin: 650,
    clampMax: 1000,
    randomAtMin: 0.35,
    randomAtMax: 0.15,
  },
  steps: [
    {
      id: 'vs-pawny-4',
      kind: 'freePlay',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      solution: [],
      prompt: 'Game vs Pawny 4.0',
      introText: "Make your first move **whenever you're ready**.",
      hintText: '',
      doneText:
        "Another real game down. **No puzzles, no hints, just you.** That's the part that counts.",
      // Na svakih 5 poteza, nasumicno, bez ponavljanja (vidi freePlayMessages).
      freePlayMessages: [
        "Version 4.0. I've been studying. Mostly.",
        "Four versions in and I still don't trust my own king.",
        ...L2_PAWNY_LINES,
      ],
    },
  ],
  endScreenButtons: L2_PAWNY_END_BUTTONS,
};

// Druga od 3 nove Pawny partije u drugoj turi, isti mehanizam kao Pawny 4.0.
const L2_DAY_14_PAWNY_5: Lesson = {
  id: 'l2-pawny-5-game',
  level: 2,
  day: 14,
  title: 'Game vs Pawny 5.0',
  endScreenTitle: 'Game over vs. Pawny 5.0 ({rating})',
  piece: {
    name: 'pawny 5.0',
    glyph: '♟',
    movement: 'mascot',
    bannerText: 'Pawny 5.0 ({rating})',
    subBannerText: 'Rated 950–1150',
  },
  intro: {
    title: 'Pawny got stronger again',
    text: "**Another step up from Pawny 4.0.** Today's rating: **{rating}**. Full game, no hints. Everything you've learned since, use it.",
  },
  introSteps: [
    {
      text: "**Another step up from Pawny 4.0.** Today's rating: **{rating}**. Full game, no hints. Everything you've learned since, use it.",
      buttonText: 'Ready',
    },
  ],
  pawnyAvatar: '/pawny/pawny5.webp',
  pawnyAvatarFramed: true,
  // Nastavak iste (neizmerene) skale kao Pawny 4.0: manje nasumicnih poteza.
  pawnyRating: {
    min: 950,
    max: 1150,
    jitter: 40,
    clampMin: 900,
    clampMax: 1200,
    randomAtMin: 0.2,
    randomAtMax: 0.05,
  },
  steps: [
    {
      id: 'vs-pawny-5',
      kind: 'freePlay',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      solution: [],
      prompt: 'Game vs Pawny 5.0',
      introText: "Make your first move **whenever you're ready**.",
      hintText: '',
      doneText:
        "Another real game down. **No puzzles, no hints, just you.** That's the part that counts.",
      freePlayMessages: [
        'Version 5.0. Same face, better habits.',
        "Five versions in. I've started trusting my king. A little.",
        ...L2_PAWNY_LINES,
      ],
    },
  ],
  endScreenButtons: L2_PAWNY_END_BUTTONS,
};

// Provereno u chess.js + minimax: prvi potez u svakom primeru jedini dobija materijal, linije legalne.
const L2_DAY_18_DISCOVERED_ATTACK: Lesson = {
  id: 'l2-d16-discovered-attack',
  level: 2,
  day: 18,
  title: 'Discovered Attack',
  endScreenTitle: 'The real threat was never the piece that moved.',
  endScreenText:
    'Every time, the trick was the same: **something was hiding behind a piece of your own**. Move it, and the ambush was already loaded.',
  flatProgressSegments: true,
  piece: {
    name: 'discovered attack',
    glyph: '♗',
    movement: 'static',
    bannerText: 'Discovered Attack',
  },
  intro: {
    title: 'Discovered attack',
    text: "Move one piece, and **a completely different piece suddenly opens fire**. That's the trick: the danger was never the piece that moved. **It's the one hiding behind it.**",
  },
  introSteps: [
    {
      text: "Move one piece, and **a completely different piece suddenly opens fire**. That's the trick: the danger was never the piece that moved. **It's the one hiding behind it.**",
      buttonText: 'Start Discovering',
    },
  ],
  steps: [
    // ---------- Primer 1 - mehanizam ----------
    {
      id: 'p1-knight-unblocks-bishop',
      kind: 'puzzle',
      fen: '6k1/r4ppp/2p5/4r3/3N4/1P5P/PB3PP1/R5K1 w - - 0 1',
      orientation: 'w',
      solution: ['d4c6', 'e5e8', 'c6a7'],
      prompt: 'The mechanism',
      introText:
        'Something of yours is **hiding behind your own piece**. Find the move that lets it out.',
      extraHintText:
        "Your knight is standing **right in your own bishop's way**. What happens the moment it steps aside?",
      missTexts: [
        'Not that one. **What is your knight blocking?**',
        "**Knight takes on c6.** That clears the bishop's line.",
      ],
      moveGuides: {
        0: {
          replyText:
            "He had to run. **Now look at your knight on c6.** What's it hitting that nothing defends?",
        },
        2: {
          hintText:
            'Your knight on c6 is **hitting something nothing defends**.',
          missTexts: [
            'Not that. **What is your knight on c6 attacking?**',
            '**Knight takes on a7.**',
          ],
        },
      },
      moveExplanations: {
        0: "Right. The knight didn't attack anything itself. **It just got out of the bishop's way**, and the bishop was already aimed at something undefended. Free pawn, and now look what your bishop's staring at.",
      },
      doneText:
        "**A whole rook, for free.** The knight opened the bishop's line, then cashed in on its own.",
      hintText: 'Not that one. **What is your knight blocking?**',
    },
    // ---------- Primer 2 - sah pa dama ----------
    {
      id: 'p2-check-then-queen',
      kind: 'puzzle',
      fen: '1n6/1P4p1/4Q3/p6k/4N3/P7/K6p/4q3 w - - 2 2',
      orientation: 'w',
      solution: ['e4f6', 'h5h6', 'e6e1'],
      prompt: 'Check first, then the queen',
      introText: '**Win the queen.** One move does two jobs here.',
      moveGuides: {
        0: {
          hintText:
            'Your own knight is standing **between your queen and his**. What happens if you move it, with check?',
          missTexts: [
            "That's not check, so he doesn't have to deal with anything first. **Find the check that also opens the e-file.**",
            "**Knight check.** The one that gets out of your queen's way.",
          ],
        },
        2: {
          hintText: 'Your queen is **staring straight down the e-file**.',
          missTexts: [
            'Not that. **Look down the e-file.**',
            '**Take his queen.**',
          ],
        },
      },
      moveExplanations: {
        0: 'Right. **Nf6+ is check**, and it clears your own knight out of the way at the same time. Whatever he plays now has to deal with the king first.',
      },
      doneText:
        "Didn't matter which one he picked. **Your queen was already staring straight down the e-file** the second your knight got out of the way.",
      hintText:
        "That's not check. **Find the check that also opens the e-file.**",
    },
    // ---------- Primer 3 - skakac skace, dama puca ----------
    {
      id: 'p3-knight-jumps-queen-fires',
      kind: 'puzzle',
      fen: '3q2k1/5pp1/p1R2n2/3p1PQp/8/P4R1P/6PK/4r3 b - - 2 2',
      orientation: 'b',
      solution: ['f6g4', 'h3g4', 'd8g5'],
      prompt: 'The knight jumps, the queen opens fire',
      introText: "You're Black. **Win the queen.**",
      moveGuides: {
        0: {
          hintText:
            'Again, your own knight is sitting **right on the diagonal between your queen and his**. What happens if you move it, with check?',
          missTexts: [
            "That's not check, so he gets a free move to save his queen. You're giving up the one thing that would've forced him. **Look at what your knight is blocking.**",
            '**Knight check** from the square that clears the d8 to g5 diagonal.',
          ],
        },
        2: {
          hintText: 'Your queen and his are **on the same diagonal now**.',
          missTexts: [
            'Not that. **His queen is right there.**',
            '**Queen takes queen.**',
          ],
        },
      },
      moveExplanations: {
        0: 'Right. **Ng4+ is check**, and it clears your own knight off the d8 to g5 diagonal at the same moment. Whatever he plays now, your queen is already staring straight at his.',
      },
      doneText:
        'However he took the knight, your queen was already lined up on his. **A full queen for a knight.**',
      hintText: "That's not check. **Look at what your knight is blocking.**",
    },
    // ---------- Primer 4 - pravi skakac ----------
    {
      id: 'p4-the-other-knight',
      kind: 'puzzle',
      fen: '5bk1/5pp1/p1p1n1qp/1p5N/3P3Q/1P5P/PPn2PP1/1RB3K1 b - - 2 2',
      orientation: 'b',
      solution: ['c2d4', 'b1a1'],
      prompt: 'The knight that was in the way',
      introText:
        "You're Black. **Two knights can take on d4.** Pick the right one.",
      extraHintText:
        "Two of your knights can take on d4. **Only one of them is standing on your queen's diagonal.**",
      otherTypeMoves: {
        0: [
          {
            uci: 'e6d4',
            message:
              "Wrong one. **That piece wasn't blocking anything.** The rook's still safe.",
          },
        ],
      },
      missTexts: [
        'Not that one. **Which of your pieces is blocking your queen?**',
        "**The c2 knight takes on d4.** That opens your queen's diagonal.",
      ],
      moveExplanations: {
        0: "Right. **That knight was sitting on your queen's diagonal** the whole time. Rook's hanging now.",
      },
      doneText:
        'Rook had to run. **Free pawn**, and your knight on d4 is untouchable: e6 backs it up.',
      hintText:
        'Not that one. **Which of your pieces is blocking your queen?**',
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Provereno u chess.js: svaka linija legalna, prvi potez jedini forsira mat u 2.
const L2_DAY_19_ANASTASIA_MATE: Lesson = {
  id: 'l2-d17-anastasia-mate',
  level: 2,
  day: 19,
  title: "Anastasia's Mate",
  endScreenTitle: 'Shut the doors. Then knock.',
  endScreenText:
    'Every mate today started the same way: **his escape squares were already gone**. After that, one check was enough.',
  flatProgressSegments: true,
  piece: {
    name: "Anastasia's mate",
    glyph: '♞',
    movement: 'static',
    bannerText: "Anastasia's Mate",
  },
  intro: {
    title: "Anastasia's Mate",
    text: "A knight and a rook, working as a pair. The knight parks right beside a cornered king and **shuts down both of his escape squares**. Then the rook checks him along the file or rank he can never leave. Once the knight's in place, the king is already dead. **He just doesn't know it yet.**",
  },
  introSteps: [
    {
      text: "A knight and a rook, working as a pair. The knight parks right beside a cornered king and **shuts down both of his escape squares**. Then the rook checks him along the file or rank he can never leave. Once the knight's in place, the king is already dead. **He just doesn't know it yet.**",
      buttonText: 'Deliver mate',
    },
  ],
  steps: [
    // ---------- Primer 1 - obrazac ----------
    {
      id: 'p1-spot-the-pattern',
      kind: 'puzzle',
      fen: '1r6/pbp1kpp1/6p1/8/P1Bp4/3P4/P3nPPK/R1B2R2 b - - 0 4',
      orientation: 'b',
      solution: ['b8h8', 'c1h6', 'h8h6'],
      prompt: 'Spot the pattern',
      introText:
        "You're Black. **Your knight on e2 is already doing its job.** It covers **g1 and g3**, the only squares his king could run to. He's stuck on the **h-file**. Finish it.",
      // Instruktivan primer: skakac, polja koja bije i cela h-linija vidljivi od starta.
      quizBoardHighlightUpfront: true,
      moveGuides: {
        0: {
          hintText:
            "Your knight already took **g1 and g3**. His king can't leave the **h-file**. Which of your pieces can check him there?",
          highlight: {
            squares: [
              ...['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8'].map(
                (square) => ({
                  square,
                  color: 'rgba(255, 199, 0, 0.35)',
                  fill: true,
                })
              ),
              { square: 'e2', color: '#07DA63' },
              { square: 'g1', color: 'rgba(242, 53, 141, 0.45)', fill: true },
              { square: 'g3', color: 'rgba(242, 53, 141, 0.45)', fill: true },
            ],
          },
          missTexts: [
            "That doesn't force anything. His king's stuck on an open file with nowhere to go. **Is there a check that uses that?**",
          ],
          replyText: 'Only one piece could even get in the way.',
        },
        2: {
          missTexts: [
            'Not that. **His bishop just stepped onto your file.**',
            '**Take the bishop.**',
          ],
        },
      },
      moveExplanations: {
        0: "Right. **Rh8+.** Open file, and your knight already owns g1 and g3. He's got exactly one way to survive this check.",
      },
      doneText:
        'He had to block with the bishop, and taking it is mate. **Your knight never let him near g1 or g3.**',
      hintText: "That doesn't force anything. **Look at the h-file.**",
    },
    // ---------- Primer 2 - mat u jednom ----------
    {
      id: 'p2-straight-to-mate',
      kind: 'puzzle',
      fen: '5rk1/ppp2pbp/3p2p1/7P/4r3/1NP1B3/PP2nPP1/R2QR2K b - - 0 2',
      orientation: 'b',
      solution: ['e4h4'],
      prompt: 'Same pattern, straight to mate',
      introText: "You're Black. **Mate in one.**",
      moveGuides: {
        0: {
          hintText:
            "Your knight's already locking down g1 again. **What check lands on his king right now?**",
          hintSquare: 'e2',
          missTexts: [
            "Not that. It doesn't need to be complicated. **Look at the h-file.**",
          ],
        },
      },
      doneText:
        'Right. **Rh4#.** No second move needed this time. Your knight owns g1, his own pawn blocks g2, and the rook takes care of the rest.',
      hintText: 'Not that. **Look at the h-file.**',
    },
    // ---------- Primer 3 - zrtva topa, pa dama ----------
    {
      id: 'p3-force-the-recapture',
      kind: 'puzzle',
      fen: '2b2r1k/4Nppn/4p3/1n1p4/2pP4/2P1P1P1/5PP1/qN1QK2R w K - 2 3',
      orientation: 'w',
      solution: ['h1h7', 'h8h7', 'd1h5'],
      prompt: 'Mate in two: force the recapture first',
      introText: '**Mate in two.** Make him take first.',
      moveGuides: {
        0: {
          hintText:
            "There's a capture that gives check and leaves him **only one legal reply**. Find it, and the mate is already set up.",
          missTexts: [
            "That doesn't force his hand. He's got options. **You need a move that gives check AND takes away his choices.**",
          ],
          replyText:
            "He had to take. **Now his king's standing right where you want it.**",
        },
        2: {
          hintText:
            'Your knight on e7 already covers g8 and g6. **Bring the queen.**',
          missTexts: [
            'Not that. **Your queen has a straight road to his king.**',
            '**Queen to h5.**',
          ],
        },
      },
      moveExplanations: {
        0: '**Right. Rxh7+.** He has to recapture with the king. Nothing else is legal.',
      },
      doneText:
        "That's why the rook sac worked. **His king had nowhere else to be.**",
      hintText:
        "That doesn't force his hand. **Find the check that takes away his choices.**",
    },
    // ---------- Primer 4 - pesak namesta mat ----------
    {
      id: 'p4-pawn-sets-it-up',
      kind: 'puzzle',
      fen: 'r4r2/5p2/4NRp1/3b3k/qPn5/2pR2P1/P4N2/K7 w - - 0 2',
      orientation: 'w',
      // Crni bira Kh4 ili Kh6 nasumicno, Rh3# mat je u oba slucaja.
      solution: ['g3g4', ANY_LEGAL_REPLY, 'd3h3'],
      prompt: 'The pawn sets it up this time',
      introText: '**Mate in two.** Forget the pieces for a second.',
      moveGuides: {
        0: {
          hintText:
            'Forget the pieces for a second. **What can your g-pawn do to his king right now?**',
          missTexts: [
            "Not yet. There's a much more direct way to shove his king toward the rim first. **Move the pawn and open the rank for your rook.**",
          ],
          replyText:
            "He picked one. **Doesn't matter which.** Watch what your rook does now.",
        },
        2: {
          missTexts: [
            'Not that. **The third rank is open now.**',
            '**Rook to h3.**',
          ],
        },
      },
      moveExplanations: {
        0: "Right. **g4+.** Doesn't matter which way he goes, you've got him either way. **The rank is open for the rook.**",
      },
      doneText:
        "Same mate either way. **The pawn just decided which square he'd die on.**",
      hintText: 'Not yet. **Move the pawn and open the rank for your rook.**',
    },
    // ---------- Primer 5 - dama mami kralja ----------
    {
      id: 'p5-queen-decoy',
      kind: 'puzzle',
      fen: '6k1/5p2/1p5p/p4Np1/5q2/Q6P/PPr5/3R3K w - - 2 4',
      orientation: 'w',
      solution: ['a3f8', 'g8f8', 'd1d8'],
      prompt: 'Hardest: the queen decoys the king',
      introText: "**Mate in two.** It's going to cost you something.",
      moveGuides: {
        0: {
          hintText:
            'Your queen has a check that **sacrifices itself**. However he answers, you mate next move. Find it.',
          missTexts: [
            "That doesn't force anything yet. You need a check he can't just ignore. **One that costs you material but decides the game.**",
            "**Find a square where your queen can sacrifice itself** and drag the king into an Anastasia's mate.",
          ],
        },
        2: {
          missTexts: [
            'Not that. **Your knight already covers e7 and g7.**',
            '**Rook to d8.**',
          ],
        },
      },
      moveExplanations: {
        0: "Right. **Qf8+.** He's got two ways to answer, and both of them lose.",
      },
      doneText: "That's the move. **Queen for a checkmate.**",
      hintText:
        "That doesn't force anything yet. **Find a check he can't ignore.**",
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

const L2_PASSED = 'rgba(7, 218, 99, 0.55)';
// "Klikni slobodnog pesaka" - markSquares sa ponovnim pokusajem, hint oznaci pesaka i put do promocije.
const l2SpotPassed = (
  id: string,
  fen: string,
  pawns: [string, string][],
  introText: string,
  wrongText: string,
  doneText: string,
  transitionText: string
): LessonStep => ({
  id,
  kind: 'markSquares',
  fen,
  orientation: 'w',
  solution: pawns.map(([square]) => square),
  prompt: 'Spot the passed pawn',
  introText,
  markRetryOnWrong: true,
  firstMissText: wrongText,
  doneText,
  hintText: wrongText,
  quizBoardHighlight: {
    squares: pawns.map(([square]) => ({
      square,
      color: L2_PASSED,
      fill: true,
    })),
    arrows: pawns.map(([from, to]) => ({ from, to, color: '#07DA63' })),
  },
  transitionText,
});

// Provereno u chess.js: u svakoj poziciji slobodni su TACNO navedeni pesaci; linije 7 i 8 legalne, Rb1+ i Bb2 jedini dobijaju materijal.
const L2_DAY_20_PASSED_PAWN: Lesson = {
  id: 'l2-d18-passed-pawn',
  level: 2,
  day: 20,
  title: 'Passed Pawn',
  endScreenTitle: 'Nothing in front. Nothing stopping it.',
  endScreenText:
    'You now know **what makes a pawn passed**, how to spot one at a glance, and two ways to push one home: **a check for tempo**, or **a decoy to clear its path**.',
  flatProgressSegments: true,
  piece: {
    name: 'passed pawn',
    glyph: '♙',
    movement: 'static',
    bannerText: 'Passed Pawn',
  },
  intro: {
    title: 'Passed pawn',
    text: "A passed pawn has **no enemy pawn in front of it**, on its own file or on either neighboring file. No enemy pawn can block it or capture it on the way. That makes it one of the most dangerous pieces on the board: **if it can't be stopped, it becomes a queen.**",
  },
  introSteps: [
    {
      text: "A passed pawn has **no enemy pawn in front of it**, on its own file or on either neighboring file. No enemy pawn can block it or capture it on the way. That makes it one of the most dangerous pieces on the board: **if it can't be stopped, it becomes a queen.**",
      buttonText: 'Start now',
    },
  ],
  steps: [
    // ---------- Primer 1 - primer sa objasnjenjem ----------
    {
      id: 'p1-what-passed-looks-like',
      kind: 'quiz',
      fen: 'k7/8/p7/pp1pPp2/3P1P2/1P2K3/P7/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'What a passed pawn looks like',
      introText:
        "Look at the **e5-pawn**. Check the d, e and f files: **no black pawn ahead of it** that could block or capture it. That's what makes it passed. Every other pawn on this board still has an enemy pawn in its way. **This one doesn't.**",
      quizBoardHighlight: {
        squares: [{ square: 'e5', color: L2_PASSED, fill: true }],
        arrows: [{ from: 'e5', to: 'e8', color: '#07DA63' }],
      },
      doneText: '',
      hintText: '',
      nextButtonText: 'Got it',
    },
    // ---------- Primeri 2-6 - prepoznavanje ----------
    l2SpotPassed(
      'p2-spot-d6',
      '6k1/8/3P4/2p1p3/2P1P3/2K5/8/8 w - - 0 1',
      [['d6', 'd7']],
      '**Click the passed pawn.**',
      "Not that one. **Check its file and the files next to it** for enemy pawns. If one's still ahead of it, it isn't passed.",
      'Exactly. **d6.** Nothing on the c, d or e files stands in its way anymore. One step from the 7th rank.',
      'Good start. **Four more to go.**'
    ),
    l2SpotPassed(
      'p3-spot-h7',
      '5b2/6kP/2p1p3/p3PpB1/3P1P2/4K3/P7/8 w - - 0 1',
      [['h7', 'h8']],
      '**Click the passed pawn.**',
      "Not quite. **Check that file and the two next to it** for enemy pawns. If any of them can still block or capture it, it isn't passed yet.",
      'Exactly. **h7.** No black pawns on the g or h files to stop it.',
      'Nice. **Over halfway.**'
    ),
    l2SpotPassed(
      'p4-spot-a2',
      '8/1r3kp1/3p1p1p/3P4/4P2P/R4P2/p5P1/5K2 b - - 0 1',
      [['a2', 'a1']],
      '**Click the passed pawn.**',
      "Look again. Most of these pawns have an enemy pawn **on their file or a neighboring file**, ready to block or trade. One doesn't.",
      "That's it. **a2.** Nothing on the a or b files can stop it. This one's dangerous, and **you'll get to push it home in a minute.**",
      "Two left, and **the next one's got a trick to it.**"
    ),
    l2SpotPassed(
      'p5-spot-c2',
      '5k2/p4pp1/5b2/8/5PP1/3NP3/P1p5/5K2 b - - 0 1',
      [['c2', 'c1']],
      '**Click the passed pawn.**',
      "Not that one. **Trace its file and both neighbors** for enemy pawns. If you find one ahead of it, it's not passed.",
      "Correct. **c2.** The White knight can annoy it. **No pawn can block or take it.** This one comes back later, and you'll push it all the way.",
      "One left. **It's the tricky one.**"
    ),
    {
      ...l2SpotPassed(
        'p6-spot-both',
        '2r5/2P1k2p/1p4p1/pP2Bp2/7P/4P1P1/r4PK1/3R4 w - - 0 1',
        [
          ['c7', 'c8'],
          ['a5', 'a1'],
        ],
        'This one has **two passed pawns, one for each side.** Click both.',
        'Not that one. **Passed pawns can belong to either player.** Check both sides of the board.',
        "Both. White's c7-pawn is one square from queening, and Black's a5-pawn is just as free: **no enemy pawn ahead of either one.** When both sides have a passed pawn, **the race is on.**",
        "Recognition done. **Now let's actually push one of these home.**"
      ),
      markPartialText:
        "You've found one. **There's a second.** Check the other side of the board too.",
    },
    // ---------- Primer 7 - guranje uz sah ----------
    {
      id: 'p7-push-with-tempo',
      kind: 'puzzle',
      fen: '8/1r3kp1/3p1p1p/3P4/4P2P/R4P2/p5P1/5K2 b - - 0 1',
      orientation: 'b',
      // Beli kralj bira Ke2 ili Kf2 nasumicno, nastavak je isti.
      solution: ['b7b1', ANY_LEGAL_REPLY, 'a2a1q', 'a3a1', 'b1a1'],
      prompt: 'Push with tempo',
      introText:
        'You already spotted this pawn: **a2**. Now push it home. Tip: **look for a move that gives check first.** That way your rook backs up the promotion.',
      moveGuides: {
        0: {
          hintText:
            '**Check first.** A move that forces the king to react buys the pawn the time it needs to queen safely.',
          missTexts: [
            "That doesn't give check. White's king or rook gets time to deal with the a-pawn. **Check first**, so the king has to react.",
            '**Rook to b1, with check.**',
          ],
        },
        2: {
          hintText: 'Your rook covers a1 now. **Push the pawn.**',
          missTexts: [
            'Not that. **Your rook already covers a1.** Push the pawn.',
            '**Pawn to a1, make a queen.**',
          ],
        },
        4: {
          missTexts: [
            'Not that. **His rook just took your queen.**',
            '**Rook takes on a1.**',
          ],
        },
      },
      moveExplanations: {
        0: '**Check.** The king has to move.',
        2: 'He had to take the queen. **Now take back.**',
      },
      doneText: "And the rook takes back. **You're up a full rook.**",
      hintText: "That doesn't give check. **Check first.**",
      transitionText: '**One more push to go.**',
    },
    // ---------- Primer 8 - mamac ----------
    {
      id: 'p8-push-with-decoy',
      kind: 'puzzle',
      fen: '5k2/p4pp1/5b2/8/5PP1/3NP3/P1p5/5K2 b - - 0 1',
      orientation: 'b',
      solution: ['f6b2', 'd3b2', 'c2c1q'],
      prompt: 'Push with a decoy',
      introText:
        "This one's trickier. **The White knight is guarding the queening square.** Find a bishop move that covers c1 too.",
      moveGuides: {
        0: {
          hintText:
            '**Put your bishop where it covers c1** and the knight can take it. Force the knight to make a decision.',
          missTexts: [
            "The knight's still covering c1. **This lets White keep control of the queening square.**",
            '**Bishop to b2.** It covers c1 and dares the knight to take it.',
          ],
          replyText: 'It took the bait. **Now queen, with check.**',
        },
        2: {
          missTexts: [
            'Not that. **Nothing guards c1 anymore.**',
            '**Pawn to c1, make a queen.**',
          ],
        },
      },
      moveExplanations: {
        0: 'Great idea. **The knight had to choose**: take the bishop, or watch the c-pawn become a queen.',
      },
      doneText:
        'You won material by **forcing the piece that guarded your pawn to give it up.**',
      hintText:
        "The knight's still covering c1. **Give it something to take.**",
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Svako ostrvo svojom bojom: cela linija svetlo, pesaci jace.
const L2_ISLAND_COLORS = [
  [7, 218, 99],
  [17, 198, 209],
  [255, 199, 0],
  [242, 53, 141],
];
const l2IslandHighlight = (islands: string[][]) => {
  const pawns = islands.flatMap((group, i) =>
    group.map((square) => ({
      square,
      color: `rgba(${L2_ISLAND_COLORS[i].join(',')}, 0.6)`,
      fill: true,
    }))
  );
  const files = islands.flatMap((group, i) =>
    Array.from(new Set(group.map((sq) => sq[0]))).flatMap((file) =>
      [1, 2, 3, 4, 5, 6, 7, 8].map((rank) => ({
        square: `${file}${rank}`,
        color: `rgba(${L2_ISLAND_COLORS[i].join(',')}, 0.2)`,
        fill: true,
      }))
    )
  );
  return { squares: [...pawns, ...files] };
};
const l2IslandExample = (
  id: string,
  fen: string,
  prompt: string,
  islands: string[][],
  text: string,
  last = false
): LessonStep => ({
  id,
  kind: 'quiz',
  fen,
  orientation: 'w',
  solution: ['quiz'],
  prompt,
  introText: text,
  quizBoardHighlight: l2IslandHighlight(islands),
  doneText: '',
  hintText: '',
  nextButtonText: last ? 'Got it' : 'Next',
});
const l2IslandQuestion = (
  id: string,
  fen: string,
  side: 'White' | 'Black',
  options: number[],
  correct: number,
  wrongText: string,
  rightText: string,
  prompt: string
): LessonStep => ({
  id,
  kind: 'quiz',
  fen,
  orientation: 'w',
  solution: ['quiz'],
  prompt,
  introText: `How many pawn islands does **${side}** have?`,
  quizOptions: options.map(String),
  quizCorrectIndex: options.indexOf(correct),
  quizRetryOnWrong: true,
  quizExplanationWrong: wrongText,
  quizExplanation: rightText,
  doneText: rightText,
  hintText: '',
  ...(side === 'White'
    ? { autoAdvanceOnCorrect: true, excludeFromProgress: true }
    : {}),
});

// Provereno u chess.js: broj ostrva (grupisanje po linijama) se poklapa sa tiketom u svih 10 pozicija.
const L2_DAY_21_PAWN_ISLANDS: Lesson = {
  id: 'l2-d19-pawn-islands',
  level: 2,
  day: 21,
  title: 'Pawn Islands',
  endScreenTitle: 'Count files. Not pawns.',
  endScreenText:
    'Pawn islands are counted by **files**, not by touching pawns. **The fewer islands you have, the stronger and easier to defend your structure is.** Keep it in mind every time you push a pawn or make a trade.',
  flatProgressSegments: true,
  piece: {
    name: 'pawn islands',
    glyph: '♙',
    movement: 'static',
    bannerText: 'Pawn Islands',
  },
  intro: {
    title: 'Pawn islands',
    text: "A pawn island is a group of your pawns on **consecutive files**, not consecutive squares. No completely empty file between two pawns, same island, no matter what rank they're on. **Fewer islands, stronger structure**: your pawns defend each other and your pieces have fewer weak points to babysit. **More islands, weaker structure**: every island is a separate target, and one-pawn islands are the easiest things to pick off in the endgame.",
  },
  introSteps: [
    {
      text: "A pawn island is a group of your pawns on **consecutive files**, not consecutive squares. No completely empty file between two pawns, same island, no matter what rank they're on. **Fewer islands, stronger structure**: your pawns defend each other and your pieces have fewer weak points to babysit. **More islands, weaker structure**: every island is a separate target, and one-pawn islands are the easiest things to pick off in the endgame.",
      buttonText: 'Start counting',
    },
  ],
  steps: [
    // ---------- Part 1 - primeri ----------
    l2IslandExample(
      'p1-one-island',
      'k7/8/8/8/8/8/1PPPP3/6K1 w - - 0 1',
      'One island',
      [['b2', 'c2', 'd2', 'e2']],
      "Look at White's pawns: b2, c2, d2, e2. **Four files in a row, no gap.** That's one pawn island. Doesn't matter that there are four of them. As long as the files are unbroken, **they count as a single group.**"
    ),
    l2IslandExample(
      'p2-two-islands',
      'k7/8/8/8/8/8/PP3PPP/6K1 w - - 0 1',
      'Two islands',
      [
        ['a2', 'b2'],
        ['f2', 'g2', 'h2'],
      ],
      'Pawns on a2, b2, f2, g2, h2. The a and b pawns are neighbors: one island. Then a gap, **no pawns on c, d or e.** Then f, g, h pick back up as a second group. **Two islands.** Count the gaps in the files, not the pawns.'
    ),
    l2IslandExample(
      'p3-files-not-squares',
      'k7/8/2P5/8/8/8/1P6/6K1 w - - 0 1',
      'Files, not squares',
      [['b2', 'c6']],
      "**This is the part people get wrong.** White has two pawns, b2 and c6, nowhere near each other on the board. Look at the files: **b and c are neighbors.** One pawn way up, one way down, doesn't matter. Islands are about unbroken files, not pawns touching. **Still one island.**"
    ),
    l2IslandExample(
      'p4-three-islands',
      'k7/8/8/8/8/8/P1PP1P2/6K1 w - - 0 1',
      'Three islands',
      [['a2'], ['c2', 'd2'], ['f2']],
      'Pawns on a2, c2, d2, f2. **a2 is alone**, no pawn on b, so it is its own island. **c2 and d2 are neighbors**, one island together. **f2 is alone again**, with a gap on e. Three groups, **three islands.**'
    ),
    l2IslandExample(
      'p5-four-islands',
      'k7/8/8/8/8/8/P1P1P1P1/6K1 w - - 0 1',
      'Four islands',
      [['a2'], ['c2'], ['e2'], ['g2']],
      'Every other file has a pawn, and every pawn is cut off by an empty file. a2, c2, e2, g2: **four pawns, four islands.** About as weak as a pawn structure gets. **Four separate targets, none of them able to protect each other.**',
      true
    ),
    // ---------- Part 2 - prebroj sam ----------
    l2IslandQuestion(
      'p6-white',
      '6k1/p1p1pp1p/8/8/8/8/PP2PPP1/6K1 w - - 0 1',
      'White',
      [1, 2, 3, 4],
      2,
      'Recount the files with at least one White pawn, and look for the gaps. **There are two separate groups here.**',
      'Right. **Two.** a2 and b2 are connected, then a gap on c and d, then e2, f2, g2. **Two islands.**',
      'Count the islands'
    ),
    l2IslandQuestion(
      'p6-black',
      '6k1/p1p1pp1p/8/8/8/8/PP2PPP1/6K1 w - - 0 1',
      'Black',
      [2, 3, 4, 5],
      4,
      "Look for **every gap** in Black's files. There are more breaks here than it looks like at first glance.",
      "Exactly. **Four.** a7 alone, c7 alone, e7 and f7 together, h7 alone. **Black's structure is a lot more scattered than White's.**",
      'Count the islands'
    ),
    l2IslandQuestion(
      'p7-white',
      '6k1/1ppp1pp1/8/8/8/8/P1P1P3/6K1 w - - 0 1',
      'White',
      [2, 3, 4, 5],
      3,
      'Every White pawn here is separated from the others by an empty file. **Check each one on its own.**',
      'Correct. **Three.** a2, c2 and e2 are all cut off from each other. **Three separate islands.**',
      'Count the islands'
    ),
    l2IslandQuestion(
      'p7-black',
      '6k1/1ppp1pp1/8/8/8/8/P1P1P3/6K1 w - - 0 1',
      'Black',
      [1, 2, 3, 4],
      2,
      "Black's pawns bunch up more than White's. **Find the one gap.**",
      'Right. **Two.** b7, c7, d7 are one block, f7 and g7 a second, **split by the gap on e.**',
      'Count the islands'
    ),
    l2IslandQuestion(
      'p8-white',
      '6k1/1p4pp/1p6/8/2P5/1P1P4/8/6K1 w - - 0 1',
      'White',
      [1, 2, 3],
      1,
      "Don't be fooled by the pawn on c4 sitting one rank ahead. **Check the files, not the ranks.**",
      "Exactly. **One.** b3, c4 and d3 cover three unbroken files. **c4 being a rank further up doesn't split the island.**",
      'Files, not ranks'
    ),
    l2IslandQuestion(
      'p8-black',
      '6k1/1p4pp/1p6/8/2P5/1P1P4/8/6K1 w - - 0 1',
      'Black',
      [1, 2, 3],
      2,
      "Two of Black's pawns share a file. **That doesn't make an extra island**, it just means the file is doubled. Count files, not pawns.",
      'Right. **Two.** The b-file, with two pawns on it, is one island. g7 and h7 are the second, **with a gap in between.**',
      'Files, not ranks'
    ),
    l2IslandQuestion(
      'p9-white',
      '6k1/pp1pp2p/8/8/8/8/PPP2PPP/6K1 w - - 0 1',
      'White',
      [1, 2, 3],
      2,
      'White has two solid blocks with **one big gap in the middle.** How many blocks do you count?',
      'Correct. **Two.** a2, b2, c2 is one island, f2, g2, h2 the other, **split by the empty d and e files.**',
      'Count the islands'
    ),
    l2IslandQuestion(
      'p9-black',
      '6k1/pp1pp2p/8/8/8/8/PPP2PPP/6K1 w - - 0 1',
      'Black',
      [2, 3, 4],
      3,
      "Find **every empty file** between Black's pawns. There's more than one gap.",
      'Right. **Three.** a7 and b7 together, d7 and e7 together, h7 on its own. **Three islands.**',
      'Count the islands'
    ),
    l2IslandQuestion(
      'p10-white',
      '6k1/1p1p1p1p/8/8/8/8/P1P1P1P1/6K1 w - - 0 1',
      'White',
      [2, 3, 4, 5],
      4,
      'Check every single White pawn. **Is there a neighbor on the very next file** for any of them?',
      'Right. **Four.** Every White pawn is cut off from every other one. **Worst-case structure: four one-pawn islands.**',
      'Worst case, both sides'
    ),
    l2IslandQuestion(
      'p10-black',
      '6k1/1p1p1p1p/8/8/8/8/P1P1P1P1/6K1 w - - 0 1',
      'Black',
      [2, 3, 4, 5],
      4,
      "Same idea for Black. **Check each pawn's neighboring files.**",
      "Exactly. **Four.** Black's pawns are just as scattered. **Whoever has to defend all four of these in an endgame is in serious trouble.**",
      'Worst case, both sides'
    ),
    // Najteze: pesaci se ne dodiruju, ali linije su neprekinute (a-b-c, e-f-g / f-g-h).
    l2IslandQuestion(
      'p11-white',
      '8/1kp2p1p/p5p1/1p4P1/2P2P2/1P6/P3PK2/8 w - - 0 1',
      'White',
      [1, 2, 3, 4],
      2,
      "Look at e2 and f4. **They're not directly connected, the fact that they can connect makes them one island.** Count the files, not the gaps between pawns.",
      "Right. **Two.** a2, b3, c4 on a, b, c, and e2, f4, g5 on e, f, g. e2 doesn't touch f4. **Unbroken files mean they can connect, and that makes them one island.** The empty d-file splits the two.",
      'The hardest one'
    ),
    l2IslandQuestion(
      'p11-black',
      '8/1kp2p1p/p5p1/1p4P1/2P2P2/1P6/P3PK2/8 w - - 0 1',
      'Black',
      [1, 2, 3, 4],
      2,
      "Same trick for Black. Look at c7, far from b5. **They're not directly connected, the fact that they can connect makes them one island.** Check the files.",
      'Exactly. **Two.** a6, b5, c7 on a, b, c, and f7, g6, h7 on f, g, h. c7 is nowhere near b5. **Scattered across the ranks, still two islands.** The empty d and e files split them.',
      'The hardest one'
    ),
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Treca i poslednja nova Pawny partija u drugoj turi, poslednja pre Graduation testova.
const L2_DAY_22_PAWNY_6: Lesson = {
  id: 'l2-pawny-6-game',
  level: 2,
  day: 22,
  title: 'Game vs Pawny 6.0',
  endScreenTitle: 'Game over vs. Pawny 6.0 ({rating})',
  piece: {
    name: 'pawny 6.0',
    glyph: '♟',
    movement: 'mascot',
    bannerText: 'Pawny 6.0 ({rating})',
    subBannerText: 'Rated 1100–1300',
  },
  intro: {
    title: 'One more game',
    text: "**One more game before your two graduation tests.** Pawny 6.0, today's rating: **{rating}**. Strongest yet. Full game, no hints.",
  },
  introSteps: [
    {
      text: "**One more game before your two graduation tests.** Pawny 6.0, today's rating: **{rating}**. Strongest yet. Full game, no hints.",
      buttonText: 'Ready',
    },
  ],
  pawnyAvatar: '/pawny/pawny6.webp',
  pawnyAvatarFramed: true,
  // Nastavak iste (neizmerene) skale kao Pawny 4.0/5.0.
  pawnyRating: {
    min: 1100,
    max: 1300,
    jitter: 40,
    clampMin: 1050,
    clampMax: 1350,
    randomAtMin: 0.1,
    randomAtMax: 0,
  },
  steps: [
    {
      id: 'vs-pawny-6',
      kind: 'freePlay',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      solution: [],
      prompt: 'Game vs Pawny 6.0',
      introText: "Make your first move **whenever you're ready**.",
      hintText: '',
      doneText:
        'Last game before Graduation, done. **No puzzles, no hints, just you.** Next up: the tests.',
      freePlayMessages: [
        'Version 6.0. Last stop before your graduation. No pressure.',
        "Six versions in. I've got a cape now. Didn't help my endgames.",
        ...L2_PAWNY_LINES,
      ],
    },
  ],
  endScreenButtons: L2_PAWNY_END_BUTTONS,
};

const L2_CHECKER = 'rgba(242, 53, 141, 0.45)';

// Provereno u chess.js: tip saha (broj i identitet sahova) i svi legalni odgovori.
const L2_DAY_23_DISCOVERED_CHECK: Lesson = {
  id: 'l2-d23-discovered-check',
  level: 2,
  day: 23,
  title: 'Discovered Check + Double Check',
  endScreenTitle: 'No blocks. No captures. The king moves.',
  endScreenText:
    'A discovered check lets **one piece move freely while another gives the check**. A double check does both on the same move, and **the only way out is a king move**. Every time.',
  flatProgressSegments: true,
  piece: {
    name: 'discovered check',
    glyph: '♖',
    movement: 'static',
    bannerText: 'Discovered Check',
  },
  intro: {
    title: 'Discovered check',
    text: "One piece moves, and **the piece behind it gives check**. That's a discovered check. If the moving piece checks too, it's a **double check**. **Then the king has to move.**",
  },
  introSteps: [
    {
      text: "One piece moves, and **the piece behind it gives check**. That's a discovered check. If the moving piece checks too, it's a **double check**. **Then the king has to move.**",
      buttonText: 'Next',
    },
    {
      title: "Why it's the most dangerous check",
      text: 'The piece that moved is **free to grab something**, while another piece gives the check. With a double check, **no block and no capture saves him**. Only a king move.',
      buttonText: 'Start',
    },
  ],
  steps: [
    // ---------- Primer 1 - otkriveni sah ----------
    {
      id: 'p1-knight-opens-file',
      kind: 'puzzle',
      fen: 'r3k3/1p6/2b5/4N3/8/8/6P1/4R1K1 w - - 0 1',
      orientation: 'w',
      solution: ['e5c6'],
      prompt: 'Discovered check',
      introText: "**Find White's best move.**",
      moveGuides: {
        0: {
          hintText:
            'Your knight on e5 is **standing between your rook and his king**. What happens to the e-file if it moves?',
          highlight: {
            squares: [
              { square: 'e5', color: '#07DA63' },
              { square: 'e1', color: '#07DA63' },
            ],
            arrows: [{ from: 'e1', to: 'e8', color: L2_LINE }],
          },
          missTexts: [
            "Not that. **Look at your knight on e5.** It's standing between your rook and his king.",
            '**Knight takes on c6.** That opens the e-file.',
          ],
        },
      },
      doneText:
        "**Nxc6+.** The knight grabs the bishop, and leaving e5 opens the e-file. **Your rook was aimed at his king the whole time.** That's a discovered check, and you're a whole piece up.",
      hintText:
        "Not that. **Look at your knight on e5.** It's standing between your rook and his king.",
    },
    // ---------- Primer 2 - otkriveni sah koji moze da se blokira ----------
    {
      id: 'p2-bishop-on-the-diagonal',
      kind: 'puzzle',
      fen: '6k1/pb6/1n6/3N4/8/P7/B7/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['d5b6'],
      prompt: 'Discovered check, winning a piece',
      introText: "**Find White's best move.** Find a discovered check.",
      moveGuides: {
        0: {
          hintText:
            'Your bishop on a2 has been **aimed at his king the whole time**. What is in its way?',
          highlight: {
            squares: [
              { square: 'a2', color: '#07DA63' },
              { square: 'd5', color: '#07DA63' },
            ],
            arrows: [{ from: 'a2', to: 'g8', color: L2_LINE }],
          },
          missTexts: [
            'Not that. **Look at the a2 to g8 diagonal.** Your own knight is blocking it.',
            '**Knight takes on b6.**',
          ],
        },
      },
      doneText:
        "**Nxb6+.** The knight wins his knight, and your bishop checks down the a2 to g8 diagonal. One move, two jobs. Notice one thing: **this check can be blocked.** Bd5 gets in the way, and then Bxd5+ takes that bishop too. **The next three can't be blocked at all.**",
      hintText:
        'Not that. **Look at the a2 to g8 diagonal.** Your own knight is blocking it.',
    },
    // ---------- Primer 3 - dvostruki sah ----------
    {
      id: 'p3-first-double-check',
      kind: 'puzzle',
      fen: '4k2r/6p1/5b2/7r/4N3/8/7P/4R1K1 w - - 0 1',
      orientation: 'w',
      solution: ['e4f6'],
      prompt: 'Double check',
      introText: "**Find White's best move.**",
      moveGuides: {
        0: {
          hintText:
            'Your knight on e4 is **blocking your own rook**. It can also jump to a square that checks the king by itself. **Find the square that does both.**',
          highlight: {
            squares: [
              { square: 'e4', color: '#07DA63' },
              { square: 'e1', color: '#07DA63' },
              { square: 'f6', color: L2_CHECKER, fill: true },
            ],
            arrows: [{ from: 'e1', to: 'e8', color: L2_LINE }],
          },
          missTexts: [
            'Not that. **Your knight on e4 is blocking your rook.** Where can it go and check him too?',
            '**Knight takes on f6.**',
          ],
        },
      },
      doneText:
        '**Nxf6+.** The knight takes the bishop and checks from f6. Leaving e4 also opens your rook on the e-file. **Two checkers at once: double check.** No block, no capture. His king just has to run.',
      hintText:
        'Not that. **Your knight on e4 is blocking your rook.** Where can it go and check him too?',
    },
    // ---------- Primer 4 - dvostruki sah, pa dama ----------
    {
      id: 'p4-double-check-then-queen',
      kind: 'puzzle',
      fen: '6k1/3q1p1p/8/8/6N1/1p6/1P4R1/K7 w - - 0 1',
      orientation: 'w',
      // Crni igra Kf8. Posle Kh8 sledi Rg8#, to se pominje u replyText.
      solution: ['g4f6', 'g8f8', 'f6d7'],
      prompt: 'Double check, then the queen',
      introText: "**Find White's best move.**",
      moveGuides: {
        0: {
          hintText:
            'Same idea. Your knight on g4 **blocks your rook on the g-file**. Find the square where it checks the king too.',
          highlight: {
            squares: [
              { square: 'g4', color: '#07DA63' },
              { square: 'g2', color: '#07DA63' },
              { square: 'f6', color: L2_CHECKER, fill: true },
            ],
            arrows: [{ from: 'g2', to: 'g8', color: L2_LINE }],
          },
          missTexts: [
            'Not that. **Your knight is blocking the g-file.** Which jump checks him too?',
            '**Knight to f6.**',
          ],
          replyText:
            'Kf8. **Kh8 was worse: Rg8 is mate there.** Now look at where your knight landed.',
        },
        2: {
          hintText:
            'Your knight on f6 is **hitting something nothing defends**.',
          missTexts: [
            'Not that. **What is your knight on f6 attacking?**',
            '**Knight takes the queen.**',
          ],
        },
      },
      moveExplanations: {
        0: '**Nf6+.** Double check again: the knight hits g8, the rook hits down the g-file. **Only two squares left for his king.**',
      },
      doneText:
        '**A whole queen.** The double check forced the king to move, and the same knight was already sitting on his queen.',
      hintText:
        'Not that. **Your knight is blocking the g-file.** Which jump checks him too?',
    },
    // ---------- Primer 5 - crni, samo jedan legalan odgovor ----------
    {
      id: 'p5-one-legal-reply',
      kind: 'puzzle',
      fen: '5k2/5p1p/q3pQ2/b7/6N1/7P/2P2P2/K5R1 b - - 0 1',
      orientation: 'b',
      // Posle Bc3+ beli ima samo Kb1, a Qa1 je mat.
      solution: ['a5c3', 'a1b1', 'a6a1'],
      prompt: 'Hardest: one legal reply',
      introText: "You're Black. **Find your best move.**",
      moveGuides: {
        0: {
          hintText:
            'Your bishop on a5 is **standing between your queen and his king** on the a-file. Where can it jump and check him too?',
          highlight: {
            squares: [
              { square: 'a5', color: '#07DA63' },
              { square: 'a6', color: '#07DA63' },
              { square: 'c3', color: L2_CHECKER, fill: true },
            ],
            arrows: [{ from: 'a6', to: 'a1', color: L2_LINE }],
          },
          missTexts: [
            'Not that. **Your bishop is blocking your queen on the a-file.** Find the diagonal check.',
            '**Bishop to c3.**',
          ],
          replyText: 'Kb1, forced. **Now finish it.**',
        },
        2: {
          hintText: 'Your bishop on c3 **already covers a1**.',
          missTexts: [
            'Not that. **Your queen still owns the a-file.**',
            '**Queen to a1.**',
          ],
        },
      },
      moveExplanations: {
        0: '**Bc3+.** The bishop checks on the long diagonal, and leaving a5 opens the a-file for your queen. Double check. **He has exactly one legal move.**',
      },
      doneText:
        '**Qa1#.** The double check left him one square, and your bishop was already guarding the mating square.',
      hintText:
        'Not that. **Your bishop is blocking your queen on the a-file.** Find the diagonal check.',
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

const L2_ESCAPE = 'rgba(242, 53, 141, 0.45)';

// Kviz posle mata: isti polozaj, dva imena paterna, ne ulazi u progress.
const l2NameTheMate = (
  id: string,
  fen: string,
  options: string[],
  correct: number,
  wrongText: string,
  rightText: string
): LessonStep => ({
  id,
  kind: 'quiz',
  fen,
  orientation: 'w',
  solution: ['quiz'],
  prompt: 'Name the pattern',
  introText: "You've seen this one before. **What's it called?**",
  quizOptions: options,
  quizCorrectIndex: correct,
  quizRetryOnWrong: true,
  quizExplanationWrong: wrongText,
  quizExplanation: rightText,
  doneText: rightText,
  hintText: '',
  excludeFromProgress: true,
  progressAttachToPrevious: true,
});

// Provereno u chess.js: jedini prvi potez koji forsira mat u 2, svi odgovori vode u mat.
const L2_DAY_24_MATE_IN_TWO: Lesson = {
  id: 'l2-d24-mate-in-two',
  level: 2,
  day: 24,
  title: 'Mate in Two',
  endScreenTitle: 'Same patterns. One move further.',
  endScreenText:
    'Back rank, a piece cutting off a square, a protected queen next to the king. **The patterns never changed.** You just had to **check every reply** before you played.',
  flatProgressSegments: true,
  piece: {
    name: 'mate in two',
    glyph: '♛',
    movement: 'static',
    bannerText: 'Mate in Two',
  },
  intro: {
    title: 'Mate in two',
    text: 'Mate in one is spotting a pattern. Mate in two is **calculation**: your move, every reply he has, then your mate. **Check every reply, not just the one you expect.**',
  },
  introSteps: [
    {
      text: 'Mate in one is spotting a pattern. Mate in two is **calculation**: your move, every reply he has, then your mate. **Check every reply, not just the one you expect.**',
      buttonText: 'Start calculating',
    },
  ],
  steps: [
    // ---------- Primer 1 - zadnji red, dva poteza dublje ----------
    {
      id: 'p1-back-rank-deeper',
      kind: 'puzzle',
      fen: '1r1qr1k1/p1p1bppp/2ppb3/4p1NQ/4P3/2NPB3/PPP2PPP/R4RK1 w - - 0 1',
      orientation: 'w',
      solution: ['h5h7', 'g8f8', 'h7h8'],
      prompt: 'Mate in two',
      introText: '**Find mate in two.**',
      moveGuides: {
        0: {
          hintText:
            'Your knight on g5 already **eyes h7**. What if your queen takes that pawn too?',
          highlight: {
            squares: [
              { square: 'h5', color: '#07DA63' },
              { square: 'g5', color: '#07DA63' },
              { square: 'h7', color: L2_ESCAPE, fill: true },
            ],
          },
          missTexts: [
            'Not that. Your knight on g5 already **eyes h7**. What if your queen takes that pawn too?',
            '**Queen takes on h7.**',
          ],
        },
        2: {
          hintText:
            'His own rook and pawns **box the king in on f8**. Where does your queen mate?',
          missTexts: [
            'Not that. The king ran to f8, and **his own pieces box him in**. Where does your queen mate?',
            '**Queen to h8.**',
          ],
        },
      },
      moveExplanations: {
        0: '**Qxh7+.** The knight protects her. **Only one square for the king.**',
      },
      doneText:
        "**Qh8#.** That's your **Back Rank Mate**, just two moves deeper this time.",
      hintText:
        'Not that. Your knight on g5 already **eyes h7**. What if your queen takes that pawn too?',
    },
    l2NameTheMate(
      'p1-name-the-mate',
      '1r1qrk1Q/p1p1bpp1/2ppb3/4p1N1/4P3/2NPB3/PPP2PPP/R4RK1 b - - 2 2',
      ['Back Rank Mate', 'Smothered Mate'],
      0,
      'No. Smothered Mate is a **knight** mating a king buried in his own pieces. Here the **queen** checks along the back rank.',
      '**Back Rank Mate.** King stuck on the last rank, his own pieces block the way out, and **the queen checks along that rank**.'
    ),
    // ---------- Primer 2 - dama i lovac ----------
    {
      id: 'p2-queen-bishop-battery',
      kind: 'puzzle',
      fen: '6k1/5ppp/8/7Q/2B5/7P/1r1q2P1/7K w - - 0 1',
      orientation: 'w',
      solution: ['h5f7', 'g8h8', 'f7g8'],
      // Posle Kh8 mat su i Qe8# i Qf8#.
      altMoves: { 2: ['f7e8', 'f7f8'] },
      altSolutions: [
        {
          uci: 'f7e8',
          doneText:
            '**Qe8#.** Back rank, and your bishop still covers g8. **Qg8# works too.**',
        },
        {
          uci: 'f7f8',
          doneText:
            '**Qf8#.** Back rank, and your bishop still covers g8. **Qg8# works too.**',
        },
      ],
      prompt: 'Queen and bishop',
      introText: '**Find mate in two.**',
      moveGuides: {
        0: {
          hintText:
            'Your bishop on c4 is **already aimed at g8**. What is in the way on f7?',
          highlight: {
            squares: [
              { square: 'h5', color: '#07DA63' },
              { square: 'c4', color: '#07DA63' },
              { square: 'f7', color: L2_ESCAPE, fill: true },
            ],
          },
          missTexts: [
            'Not that. Your bishop on c4 is **already aimed at g8**. What is in the way on f7?',
            '**Queen takes on f7.**',
          ],
        },
        2: {
          hintText:
            'His own pawns box him in. **Where does your queen land, protected by the bishop?**',
          missTexts: [
            'Not that. His own pawns box him in. **Where does your queen land, protected by the bishop?**',
            '**Queen to g8.**',
          ],
        },
      },
      moveExplanations: {
        0: '**Qxf7+.** Clears the diagonal and checks at the same time. **One legal reply.**',
      },
      doneText:
        "**Qg8#.** The bishop on c4 guards your queen, so **the king can't take her**.",
      hintText:
        'Not that. Your bishop on c4 is **already aimed at g8**. What is in the way on f7?',
    },
    // ---------- Primer 3 - skakac gura kralja na ivicu ----------
    {
      id: 'p3-knight-pushes-to-edge',
      kind: 'puzzle',
      fen: '5rk1/5pp1/2N5/8/6K1/3P4/8/3Q4 w - - 0 1',
      orientation: 'w',
      // Crni igra Kh7 (klasican Anastasia polozaj za kviz). Qh1# je mat i posle Kh8.
      solution: ['c6e7', 'g8h7', 'd1h1'],
      prompt: 'Knight check, queen on the edge',
      introText: '**Find mate in two.**',
      moveGuides: {
        0: {
          hintText:
            'Your knight can **check him and take away his escape squares** in one jump. Which square does that?',
          highlight: {
            squares: [
              { square: 'c6', color: '#07DA63' },
              { square: 'e7', color: L2_ESCAPE, fill: true },
              { square: 'h8', color: L2_ESCAPE, fill: true },
              { square: 'h7', color: L2_ESCAPE, fill: true },
            ],
          },
          missTexts: [
            'Not that. Your knight can **check him and take away his escape squares** in one jump.',
            '**Knight to e7.**',
          ],
          replyText: 'Kh7. **Kh8 loses the same way.**',
        },
        2: {
          hintText:
            'His own pawns trap him on the edge. **The h-file is wide open.**',
          missTexts: [
            'Not that. His own pawns trap him on the edge. **The h-file is wide open.**',
            '**Queen to h1.**',
          ],
        },
      },
      moveExplanations: {
        0: '**Ne7+.** He gets pushed to the edge. **Two squares, both losing.**',
      },
      doneText:
        '**Qh1#.** Your knight holds g6 and g8, his own pawn blocks g7, and **the h-file is completely open**.',
      hintText:
        'Not that. Your knight can **check him and take away his escape squares** in one jump.',
    },
    l2NameTheMate(
      'p3-name-the-mate',
      '5r2/4Nppk/8/8/6K1/3P4/8/7Q b - - 3 2',
      ['Smothered Mate', "Anastasia's Mate"],
      1,
      'No. In a Smothered Mate the **knight gives the check**. Here the knight only shuts the doors, and **the queen mates on the file**.',
      "**Anastasia's Mate.** The knight shuts the escape squares, his own pawn blocks the rest, and **the queen mates down the h-file**."
    ),
    // ---------- Primer 4 - lovac sece g7 ----------
    {
      id: 'p4-bishop-cuts-off',
      kind: 'puzzle',
      fen: '1r3r2/5pk1/4b1p1/6B1/5R2/4K3/7R/8 w - - 0 1',
      orientation: 'w',
      solution: ['g5f6', 'g7g8', 'h2h8'],
      prompt: 'The quiet check',
      introText: '**Find mate in two.**',
      moveGuides: {
        0: {
          hintText:
            'This move takes nothing. It checks and **takes away his escape square**. **Look at your bishop.**',
          highlight: {
            squares: [
              { square: 'g5', color: '#07DA63' },
              { square: 'g7', color: L2_ESCAPE, fill: true },
            ],
          },
          missTexts: [
            'Not that. This move takes nothing. It checks and **takes away his escape square**. **Look at your bishop.**',
            '**Bishop to f6.**',
          ],
        },
        2: {
          hintText: 'He went to g8. **Your rook on h2 owns the whole h-file.**',
          missTexts: [
            'Not that. **Your rook on h2 owns the whole h-file.**',
            '**Rook to h8.**',
          ],
        },
      },
      moveExplanations: {
        0: '**Bf6+.** Quiet-looking check. Your rook on f4 protects the bishop, and **from f6 it keeps watching g7**. One square left for the king.',
      },
      doneText: '**Rh8#.** The bishop holds g7, the rook mates on the file.',
      hintText:
        'Not that. This move takes nothing. It checks and **takes away his escape square**. **Look at your bishop.**',
    },
    // ---------- Primer 5 - zrtva dame, pesak matira ----------
    {
      id: 'p5-queen-sac-pawn-mates',
      kind: 'puzzle',
      fen: 'r5k1/5pbp/6p1/8/4P2P/q1p3P1/P1Qn4/K7 b - - 0 1',
      orientation: 'b',
      solution: ['a3b2', 'c2b2', 'c3b2'],
      prompt: 'Hardest: give up the queen',
      introText: "You're Black. **Find mate in two.**",
      moveGuides: {
        0: {
          hintText:
            "Hardest one. **It starts with giving up your queen.** Find the check he's forced to take.",
          highlight: {
            squares: [
              { square: 'a3', color: '#07DA63' },
              { square: 'c3', color: '#07DA63' },
            ],
          },
          missTexts: [
            "Not that. **It starts with giving up your queen.** Find the check he's forced to take.",
            '**Queen to b2.**',
          ],
        },
        2: {
          hintText: 'His queen took yours. **Look what still hits b2.**',
          missTexts: [
            'Not that. **Look what still hits b2.**',
            '**Pawn takes on b2.**',
          ],
        },
      },
      moveExplanations: {
        0: "**Qb2+.** His king can't take, your c3 pawn guards b2. **He has to take with the queen.**",
      },
      doneText:
        '**cxb2#.** A pawn mates. Your knight covers b1, his own pawn blocks a2, and **your bishop on g7 guards the pawn**.',
      hintText:
        "Not that. **It starts with giving up your queen.** Find the check he's forced to take.",
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

const L2_RACE_PAWN = 'rgba(7, 218, 99, 0.45)';
const L2_RACE_KING = 'rgba(255, 199, 0, 0.35)';

// Prognoza pre trke: ko pobedjuje, pa ponovo dok ne pogodi. Ne ulazi u progress.
const l2RaceQuestion = (
  id: string,
  fen: string,
  orientation: 'w' | 'b',
  introText: string,
  correct: number,
  wrongText: string,
  rightText: string
): LessonStep => ({
  id,
  kind: 'quiz',
  fen,
  orientation,
  solution: ['quiz'],
  prompt: 'Predict the race',
  introText,
  quizOptions: ['White', 'Black', 'Draw'],
  quizCorrectIndex: correct,
  quizRetryOnWrong: true,
  quizExplanationWrong: wrongText,
  quizExplanation: rightText,
  doneText: rightText,
  hintText: '',
  excludeFromProgress: true,
});

const l2RaceSquares = (squares: string[], color = L2_RACE_PAWN) =>
  squares.map((square) => ({ square, color, fill: true }));

// Provereno: chess.js (legalnost linija) + Stockfish 18 u browseru (P2/P3 0.00 na dubini 60+).
const L2_DAY_25_PAWN_RACES: Lesson = {
  id: 'l2-d25-pawn-races',
  level: 2,
  day: 25,
  title: 'Pawn Races',
  endScreenTitle: 'Count it. Then look again.',
  endScreenText:
    "A race is calculation, not instinct. **Count the moves, see who queens first**, then check the position with both queens on the board. And sometimes the fastest way to win is to **give up a pawn on purpose. That's a breakthrough.**",
  flatProgressSegments: true,
  piece: {
    name: 'pawn races',
    glyph: '♙',
    movement: 'static',
    bannerText: 'Pawn Races',
  },
  intro: {
    title: 'Pawn races',
    text: 'Both sides push, and the kings are too far away to help. **Count the moves each pawn needs.** The side to move often wins. Then check one more thing: **what happens once both queens are on the board.**',
  },
  introSteps: [
    {
      text: 'Both sides push, and the kings are too far away to help. **Count the moves each pawn needs.** The side to move often wins. Then check one more thing: **what happens once both queens are on the board.**',
      buttonText: 'Start racing',
    },
  ],
  steps: [
    // ---------- Primer 1 - prosto brojanje ----------
    l2RaceQuestion(
      'p1-predict',
      '7k/7p/8/8/8/8/P7/K7 w - - 0 1',
      'w',
      'Both sides just push. White to move. **Who wins?**',
      0,
      'Count it out. White needs **5 moves** with the double step, and so does Black. **Who moves first?**',
      '**White.** Same number of moves, and White moves first, so **White queens one tempo sooner**.'
    ),
    {
      id: 'p1-play',
      requireExactPromotion: true,
      nonQueenPromotionText:
        'Legal, and maybe not even bad. **Always take the strongest piece: the Queen.**',
      kind: 'puzzle',
      fen: '7k/7p/8/8/8/8/P7/K7 w - - 0 1',
      orientation: 'w',
      solution: [
        'a2a4',
        'h7h5',
        'a4a5',
        'h5h4',
        'a5a6',
        'h4h3',
        'a6a7',
        'h3h2',
        'a7a8q',
      ],
      prompt: 'Simple count',
      introText: '**Now play it out.**',
      moveGuides: {
        0: {
          hintText: 'Use the **double step**. Every tempo counts.',
          highlight: { squares: l2RaceSquares(['a2', 'h7']) },
          missTexts: [
            'Not that. **Push the a-pawn two squares.** Every tempo counts.',
            '**a4.**',
          ],
        },
      },
      missTexts: [
        'Not that. **Keep pushing the a-pawn.**',
        '**Push the a-pawn.**',
      ],
      doneText:
        '**a8=Q+.** You queen first, with check. He has to deal with the check, and **your queen already covers h1**.',
      hintText: 'Not that. **Keep pushing the a-pawn.**',
    },
    // ---------- Primer 2 - zamka: crni prvi, a remi ----------
    l2RaceQuestion(
      'p2-predict',
      '8/8/6k1/6p1/P7/8/1K6/8 b - - 0 1',
      'b',
      "You're Black, and it's your move. Count the moves. **Who wins?**",
      2,
      'Black needs **4 moves**, White needs **4 too**. Black moves first and queens one move sooner. **Does that actually win?**',
      '**Draw.** Black queens first, and White queens **right after**. With both queens on the board, nobody can force anything. **Counting tells you who queens first. Not who wins.**'
    ),
    {
      id: 'p2-play',
      requireExactPromotion: true,
      nonQueenPromotionText:
        'Legal, and maybe not even bad. **Always take the strongest piece: the Queen.**',
      kind: 'puzzle',
      fen: '8/8/6k1/6p1/P7/8/1K6/8 b - - 0 1',
      orientation: 'b',
      // Linija se zavrsava belim a8=Q, posle toga je 0.00.
      solution: [
        'g5g4',
        'a4a5',
        'g4g3',
        'a5a6',
        'g3g2',
        'a6a7',
        'g2g1q',
        'a7a8q',
      ],
      prompt: 'The trap',
      introText: "You're Black. **Now play it out.**",
      moveGuides: {
        0: {
          hintText: 'Push the g-pawn. **Every tempo counts.**',
          highlight: {
            squares: [
              ...l2RaceSquares(['g5', 'a4']),
              ...l2RaceSquares(['g6', 'b2'], L2_RACE_KING),
            ],
          },
          missTexts: ['Not that. **Push the g-pawn.**', '**g4.**'],
        },
      },
      missTexts: [
        'Not that. **Keep pushing the g-pawn.**',
        '**Push the g-pawn.**',
      ],
      doneText:
        "Both queens are on. **Equal material, nothing to force.** That's the trap: you queened first and still only got a draw.",
      hintText: 'Not that. **Keep pushing the g-pawn.**',
    },
    // ---------- Primer 3 - ista zamka, prvo razmena ----------
    l2RaceQuestion(
      'p3-predict',
      '8/5k2/1p6/6pp/PP6/7P/8/K7 w - - 0 1',
      'w',
      'This one starts with a trade. White to move. **Who wins?**',
      2,
      "White trades on a5 first. Then **White's a-pawn races Black's g-pawn**. Count from there, and don't stop at who queens first.",
      "**Draw again.** After the trade, both sides queen almost together. **Same trap as before:** finishing the count isn't the same as knowing who wins."
    ),
    {
      id: 'p3-play',
      requireExactPromotion: true,
      nonQueenPromotionText:
        'Legal, and maybe not even bad. **Always take the strongest piece: the Queen.**',
      kind: 'puzzle',
      fen: '8/5k2/1p6/6pp/PP6/7P/8/K7 w - - 0 1',
      orientation: 'w',
      // Linija se zavrsava crnim g1=Q+, posle toga je 0.00.
      solution: [
        'a4a5',
        'b6a5',
        'b4a5',
        'g5g4',
        'a5a6',
        'g4g3',
        'a6a7',
        'g3g2',
        'a7a8q',
        'g2g1q',
      ],
      prompt: 'Trade first, then race',
      introText: '**Now play it out.**',
      moveGuides: {
        0: {
          hintText: 'Start with the **trade on a5**.',
          highlight: { squares: l2RaceSquares(['a4', 'b4', 'b6']) },
          missTexts: ['Not that. **Start with the trade: a5.**', '**a5.**'],
        },
        2: {
          hintText: '**Take back on a5.**',
          missTexts: [
            'Not that. **Take back on a5.**',
            '**b-pawn takes on a5.**',
          ],
        },
      },
      // Provereno: i ovi potezi drze remi, samo nisu trka koju vezbamo.
      otherTypeMoves: {
        4: [
          {
            uci: 'h3g4',
            message:
              "That draws too. **This one's about the race.** Push the a-pawn.",
          },
        ],
        8: [
          { uci: 'a1b2', message: 'That draws too. **Queen first.**' },
          { uci: 'a1a2', message: 'That draws too. **Queen first.**' },
        ],
      },
      missTexts: [
        'Not that. **Keep pushing the a-pawn.**',
        '**Push the a-pawn.**',
      ],
      doneText:
        'Both queens are on, and his came **with check**. Still nothing to force. **Dead equal.**',
      hintText: 'Not that. **Keep pushing the a-pawn.**',
    },
    // ---------- Primer 4 - proboj belog ----------
    l2RaceQuestion(
      'p4-predict',
      '7k/8/1p6/pP5p/P1P5/8/K7/8 w - - 0 1',
      'w',
      'White is about to **give up a pawn on purpose**. White to move. **Who wins?**',
      0,
      "White has **only one pawn move** here. It looks like it just loses a pawn. **It doesn't.**",
      "**White wins.** That's a **pawn breakthrough**: c5 gives up a pawn to open the road for **b6**. Nothing stops the b-pawn after that."
    ),
    {
      id: 'p4-play',
      requireExactPromotion: true,
      nonQueenPromotionText:
        'Legal, and maybe not even bad. **Always take the strongest piece: the Queen.**',
      kind: 'puzzle',
      fen: '7k/8/1p6/pP5p/P1P5/8/K7/8 w - - 0 1',
      orientation: 'w',
      solution: ['c4c5', 'b6c5', 'b5b6', 'h5h4', 'b6b7', 'h4h3', 'b7b8q'],
      prompt: 'Breakthrough',
      introText: '**Now play it out.**',
      moveGuides: {
        0: {
          hintText: 'Your only pawn move is the one. **Give it up.**',
          highlight: {
            squares: [
              ...l2RaceSquares(['a4', 'b5', 'c4']),
              ...l2RaceSquares(['a5', 'b6'], L2_RACE_KING),
            ],
          },
          missTexts: [
            'Not that. **Sacrifice a pawn to open the way.**',
            '**c5.**',
          ],
        },
        2: {
          hintText: 'His b-pawn is gone. **Nothing guards b6 now.**',
          missTexts: ['Not that. **Push to b6.**', '**b6.**'],
        },
      },
      moveExplanations: {
        0: "**c5.** He took. Now look: **his pawns on a5 and c5 can't touch b6.**",
      },
      // Provereno: i dalje dobija, samo sporije.
      otherTypeMoves: {
        0: [
          {
            uci: 'a2b3',
            message: 'That still wins, slower. **Find the breakthrough.**',
          },
          {
            uci: 'a2b2',
            message: 'That still wins, slower. **Find the breakthrough.**',
          },
        ],
      },
      missTexts: [
        'Not that. **Keep pushing the b-pawn.**',
        '**Push the b-pawn.**',
      ],
      doneText:
        "**b8=Q+.** One pawn given up, one queen made. **That's a breakthrough.**",
      hintText: 'Not that. **Keep pushing the b-pawn.**',
    },
    // ---------- Primer 5 - proboj crnog ----------
    l2RaceQuestion(
      'p5-predict',
      '7k/8/1p6/pPp2p1p/P1P2Pp1/2K3P1/8/8 b - - 0 1',
      'b',
      "You're Black, **three pawns against two** on the kingside. Black to move. **Who wins?**",
      1,
      "Black has a push that **gives up a pawn on purpose**, to drag White's g-pawn off g3. **Look again.**",
      '**Black wins.** Another **breakthrough**: h4 lures the g3 pawn away, and **your g-pawn gets a clear road**.'
    ),
    {
      id: 'p5-play',
      requireExactPromotion: true,
      nonQueenPromotionText:
        'Legal, and maybe not even bad. **Always take the strongest piece: the Queen.**',
      kind: 'puzzle',
      fen: '7k/8/1p6/pPp2p1p/P1P2Pp1/2K3P1/8/8 b - - 0 1',
      orientation: 'b',
      solution: ['h5h4', 'g3h4', 'g4g3', 'c3d2', 'g3g2', 'd2e2', 'g2g1q'],
      prompt: 'Hardest: breakthrough for Black',
      introText: "You're Black. **Now play it out.**",
      moveGuides: {
        0: {
          hintText: 'Give up a pawn to **drag his g-pawn off g3**.',
          highlight: {
            squares: [
              ...l2RaceSquares(['f5', 'g4', 'h5']),
              ...l2RaceSquares(['f4', 'g3'], L2_RACE_KING),
            ],
          },
          missTexts: [
            'Not that. **Which push drags his g-pawn away?**',
            '**h4.**',
          ],
        },
        2: {
          hintText: '**g3 is empty.** Nothing stands in front of your g-pawn.',
          missTexts: ['Not that. **Push the g-pawn.**', '**g3.**'],
        },
      },
      moveExplanations: {
        0: '**h4.** He took. **g3 is empty now.**',
      },
      // Provereno: i dalje dobija, samo sporije.
      otherTypeMoves: {
        0: [
          {
            uci: 'h8h7',
            message: 'That still wins, slower. **Find the breakthrough.**',
          },
          {
            uci: 'h8g7',
            message: 'That still wins, slower. **Find the breakthrough.**',
          },
        ],
      },
      missTexts: [
        'Not that. **Keep pushing the g-pawn.**',
        '**Push the g-pawn.**',
      ],
      doneText:
        "**g1=Q.** You gave up a pawn, and **his king was never close enough**. Breakthrough, from Black's side this time.",
      hintText: 'Not that. **Keep pushing the g-pawn.**',
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Provereno: chess.js (svi legalni odgovori) + Stockfish 18 (svaka odbrana gubi).
const L2_DAY_26_DEFLECTION: Lesson = {
  id: 'l2-d26-deflection',
  level: 2,
  day: 26,
  title: 'Deflection',
  endScreenTitle: 'Find the only defender. Then move it.',
  endScreenText:
    'Every time, one piece was **the only thing holding something together**. A check, a pawn push, a sacrifice: **make it leave, then take what it guarded.**',
  flatProgressSegments: true,
  piece: {
    name: 'deflection',
    glyph: '♜',
    movement: 'static',
    bannerText: 'Deflection',
  },
  intro: {
    title: 'Deflection',
    text: '**Force a defender away from its post**, usually with a check, then take what it was guarding. Ask one question: **what is this piece the only defender of?**',
  },
  introSteps: [
    {
      text: '**Force a defender away from its post**, usually with a check, then take what it was guarding. Ask one question: **what is this piece the only defender of?**',
      buttonText: 'Start',
    },
  ],
  steps: [
    // ---------- Primer 0 - vodjeni primer, potez po potez ----------
    {
      id: 'p0-worked-example',
      kind: 'puzzle',
      fen: '1k6/1Pr5/K1nR1p2/4p3/4P3/4BP2/8/8 w - - 0 1',
      orientation: 'w',
      // Mat u 2 (Stockfish). Na Rd8+ crni moze i Rc8, posle toga bxc8=Q#.
      solution: ['d6d8', 'c6d8', 'e3a7'],
      prompt: 'Worked example',
      introText:
        "Let's walk through this one together. **Find the defender first.** His knight on c6 guards two squares: **a7 and d8**. Your bishop wants a7. Follow the arrow.",
      showSolutionArrowUpfront: true,
      quizBoardHighlightUpfront: true,
      excludeFromProgress: true,
      moveGuides: {
        0: {
          hintText:
            'Check him on **d8**. The knight is the only piece that can take.',
          highlight: {
            squares: [
              { square: 'c6', color: L2_ESCAPE, fill: true },
              { square: 'a7', color: 'rgba(255, 199, 0, 0.35)', fill: true },
              { square: 'd8', color: 'rgba(255, 199, 0, 0.35)', fill: true },
              { square: 'e3', color: '#07DA63' },
            ],
          },
          missTexts: ['Not that. **Follow the arrow: Rd8+.**', '**Rd8+.**'],
          replyText:
            'He took with the knight. **Look what the knight just left behind: a7.**',
        },
        2: {
          hintText: 'Your bishop can reach a7 now. **Nobody guards it.**',
          missTexts: [
            'Not that. **Follow the arrow: bishop to a7.**',
            '**Ba7#.**',
          ],
        },
      },
      moveExplanations: {
        0: '**Rd8+.** Your rook checks on the back rank. Blocking with Rc8 runs straight into bxc8=Q mate. **Taking with the knight is his only real try.**',
      },
      doneText:
        '**Ba7#.** The knight guarded a7, your check dragged it to d8, and the bishop walked in. Your king and b7 pawn cover the rest. **Now you find them.**',
      hintText: 'Not that. **Follow the arrow: Rd8+.**',
    },
    // ---------- Primer 1 - pesak sahom odvlaci kralja ----------
    {
      id: 'p1-pawn-checks',
      kind: 'puzzle',
      fen: '5r2/pp2k1pp/8/3P4/5R2/1P6/6PP/6K1 w - - 0 1',
      orientation: 'w',
      // Crni igra Ke8. Svih 5 odgovora na d6+ gubi (Stockfish -5.9 do -6.4).
      solution: ['d5d6', 'e7e8', 'd6d7', 'e8d7', 'f4f8'],
      prompt: 'Drag the king away',
      introText: "**Find White's best move.**",
      moveGuides: {
        0: {
          hintText:
            'Your passed pawn can **check the king twice in a row**. Keep checking until he has to let go of f8.',
          highlight: {
            squares: [
              { square: 'd5', color: '#07DA63' },
              { square: 'f8', color: L2_ESCAPE, fill: true },
            ],
          },
          missTexts: [
            "Not that. **Your d-pawn can check the king.** What's he defending?",
            '**d6+.**',
          ],
          replyText: 'Ke8. **Still guarding f8.** Check him again.',
        },
        2: {
          hintText: '**Push again, with check.**',
          missTexts: ['Not that. **One more pawn check.**', '**d7+.**'],
        },
        4: {
          hintText: '**f8 has no defender.**',
          missTexts: [
            'Not that. **Nobody guards f8 anymore.**',
            '**Rook takes on f8.**',
          ],
        },
      },
      moveExplanations: {
        0: '**d6+.** He has to answer the check first.',
        2: '**d7+.** He took the pawn, and **f8 is on its own now**.',
      },
      doneText:
        '**A whole rook for a pawn.** The checks dragged his king off f8. Any square he picked after d6+ loses the same way.',
      hintText:
        "Not that. **Your d-pawn can check the king.** What's he defending?",
    },
    // ---------- Primer 2 - skakac branilac ----------
    {
      id: 'p2-knight-defender',
      kind: 'puzzle',
      fen: '3rkr2/1R3pp1/2p1b2p/3n4/2B5/Q1q5/P4PPP/5RK1 w - - 0 1',
      orientation: 'w',
      solution: ['b7e7', 'd5e7', 'a3c3'],
      prompt: 'A knight defender',
      introText: "**Find White's best move.**",
      moveGuides: {
        0: {
          hintText:
            'Your queen wants c3, and **a knight guards it**. Can you force that knight to move?',
          highlight: {
            squares: [
              { square: 'b7', color: '#07DA63' },
              { square: 'd5', color: L2_ESCAPE, fill: true },
            ],
          },
          missTexts: [
            'Not that. **The knight on d5 guards c3.** Make it move first.',
            '**Re7+.**',
          ],
        },
        2: {
          hintText: '**c3 is wide open now.**',
          missTexts: [
            'Not that. **Nothing guards his queen now.**',
            '**Queen takes on c3.**',
          ],
        },
      },
      moveExplanations: {
        0: '**Re7+.** Only the knight could deal with this check. **It had to take.**',
      },
      doneText:
        '**His queen falls.** The knight was the only defender, and your check pulled it away.',
      hintText: 'Not that. **The knight on d5 guards c3.** Make it move first.',
    },
    // ---------- Primer 3 - top branilac, crni ----------
    {
      id: 'p3-rook-defender',
      kind: 'puzzle',
      fen: '3qr1k1/5pp1/1p4bp/8/3Q4/5P2/P1P3PP/R2R3K b - - 0 2',
      orientation: 'b',
      // Beli igra Rxe1. Qg1 gubi damu takodje (Stockfish -4.35).
      solution: ['e8e1', 'd1e1', 'd8d4'],
      prompt: 'Check the defender away',
      introText: "You're Black. **Find your best move.**",
      moveGuides: {
        0: {
          hintText:
            'Your queen is staring at d4. **Something defends it.** Find the check that removes it.',
          highlight: {
            squares: [
              { square: 'e8', color: '#07DA63' },
              { square: 'd1', color: L2_ESCAPE, fill: true },
            ],
          },
          missTexts: [
            'Not that. **The rook on d1 guards his queen.** Check it away.',
            '**Re1+.**',
          ],
        },
        2: {
          hintText: '**d4 has no defender now.**',
          missTexts: [
            'Not that. **Nothing guards his queen now.**',
            '**Queen takes on d4.**',
          ],
        },
      },
      moveExplanations: {
        0: "**Re1+.** His rook had to take. Blocking with the queen on g1 loses her too: **you'd just take it with check.**",
      },
      doneText:
        '**Queen for a rook.** The d1 rook was the only defender, and one check pulled it off the file.',
      hintText: 'Not that. **The rook on d1 guards his queen.** Check it away.',
    },
    // ---------- Primer 4 - zrtva topa odvlaci kralja ----------
    {
      id: 'p4-rook-sac',
      kind: 'puzzle',
      fen: '1k1r4/2q1Q1p1/4p2p/1P3p2/6n1/6P1/5P1P/R5K1 w - - 0 2',
      orientation: 'w',
      // Crni igra Kxa8. Posle Kb7 sledi Ra7+ i mat u 6 (Stockfish).
      solution: ['a1a8', 'b8a8', 'e7c7'],
      prompt: 'Sacrifice the rook',
      introText: "**Find White's best move.**",
      moveGuides: {
        0: {
          hintText:
            'His king is **the only defender of his queen**. What if you gave up your rook to move it?',
          highlight: {
            squares: [
              { square: 'a1', color: '#07DA63' },
              { square: 'c7', color: L2_ESCAPE, fill: true },
            ],
          },
          missTexts: [
            'Not that. **His king is the only thing guarding c7.**',
            '**Ra8+.**',
          ],
        },
        2: {
          hintText: '**His king left c7 behind.**',
          missTexts: [
            'Not that. **Nothing guards his queen now.**',
            '**Queen takes on c7.**',
          ],
        },
      },
      moveExplanations: {
        0: "**Ra8+.** A real sacrifice. He took. If he'd run to b7 instead, **Ra7+ does the same job again**.",
      },
      doneText:
        '**Rook for a queen.** You gave up the rook on purpose, and the king had to leave his queen.',
      hintText: 'Not that. **His king is the only thing guarding c7.**',
    },
    // ---------- Primer 5 - dva topa, samo jedan moze ----------
    {
      id: 'p5-doubled-rooks',
      kind: 'puzzle',
      fen: 'rr4k1/5ppp/8/p1R5/P7/7P/Qq3PP1/5BK1 w - - 0 1',
      orientation: 'w',
      solution: ['c5c8', 'b8c8', 'a2b2'],
      prompt: 'Hardest: two rooks, one defender',
      introText: "**Find White's best move.**",
      moveGuides: {
        0: {
          hintText:
            'Two rooks on the back rank, **only one of them can move**. Which one guards b2?',
          highlight: {
            squares: [
              { square: 'c5', color: '#07DA63' },
              { square: 'b8', color: L2_ESCAPE, fill: true },
              { square: 'b2', color: L2_ESCAPE, fill: true },
            ],
          },
          missTexts: [
            'Not that. **Which rook really guards b2?** Make it leave.',
            '**Rc8+.**',
          ],
        },
        2: {
          hintText: '**b2 has no defender now.**',
          missTexts: [
            'Not that. **Nothing guards his queen now.**',
            '**Queen takes on b2.**',
          ],
        },
      },
      moveExplanations: {
        0: '**Rc8+.** The a8 rook is stuck behind b8, so **only b8 could answer**. It took, and left b2 behind.',
      },
      doneText:
        '**His queen falls.** Two rooks looked like two defenders. **Only one could move, and you pulled it away.**',
      hintText: 'Not that. **Which rook really guards b2?** Make it leave.',
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

const L2_BAIT = 'rgba(242, 53, 141, 0.5)';
const L2_RUNNER = 'rgba(7, 218, 99, 0.45)';
const L2_RUNNER_ARROW = 'rgba(7, 218, 99, 0.85)';
const L2_BAIT_ARROW = 'rgba(242, 53, 141, 0.85)';

// Pokazni primer: mamac sa natpisom DECOY, pesak koji trci sa RUNNER, strelice za plan obe strane.
const l2DecoyDemo = (
  bait: string,
  runner: string,
  arrows: [string, string, 'run' | 'bait'][]
) => ({
  squares: [
    { square: bait, color: L2_BAIT, fill: true, label: 'DECOY' },
    { square: runner, color: L2_RUNNER, fill: true, label: 'RUNNER' },
  ],
  arrows: arrows.map(([from, to, kind]) => ({
    from,
    to,
    color: kind === 'run' ? L2_RUNNER_ARROW : L2_BAIT_ARROW,
  })),
});

const L2_DECOY_TOO_SLOW =
  "Too slow. **That's only a draw:** his b-pawn and king get organized in time. The decoy has to go **now**.";

// FEN-ovi iz tiketa (Claude, ceka Dragutinovu potvrdu). Stockfish 18: E2 samo a6 remi, E3 dobijaju samo a5/axb5.
const L2_DAY_27_DECOY_PAWN: Lesson = {
  id: 'l2-d27-decoy-pawn',
  level: 2,
  day: 27,
  title: 'Decoy Pawn',
  endScreenTitle: 'Bait on one side. Win on the other.',
  endScreenText:
    'Ask one question: **is this pawn doing anything right now, or is it just bait?** When it is bait, let it go. **The real win is happening on the other side of the board.**',
  flatProgressSegments: true,
  piece: {
    name: 'decoy pawn',
    glyph: '♙',
    movement: 'static',
    bannerText: 'Decoy Pawn',
  },
  intro: {
    title: 'Decoy',
    text: "A decoy is **a pawn you let go on purpose**. While he's busy collecting it, **you win somewhere else**. Ask yourself: is this pawn doing anything for me, or is it just bait?",
  },
  introSteps: [
    {
      text: "A decoy is **a pawn you let go on purpose**. While he's busy collecting it, **you win somewhere else**. Ask yourself: is this pawn doing anything for me, or is it just bait?",
      buttonText: 'Start!',
    },
  ],
  steps: [
    // ---------- Primer 1 - gledaj, obe strane igraju same ----------
    {
      id: 'e1-watch',
      kind: 'quiz',
      fen: '8/8/8/4k2P/P7/8/8/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Watch the decoy',
      introText:
        'Just watch this one. **White lets the h-pawn go on purpose.** Click **Show me** to start.',
      quizOptions: ['Show me'],
      quizAnswerViaNextButton: true,
      quizCorrectIndex: 0,
      quizExplanation: 'Watch both sides.',
      // Svih 8 odgovora crnog na a5 gubi (Stockfish), Kxh5 je najpouceniji.
      // Mamac (roze) i pesak koji trci (zeleno) obelezeni su na tabli od starta.
      quizBoardHighlightUpfront: true,
      quizBoardHighlight: l2DecoyDemo('h5', 'a4', [['a4', 'a8', 'run']]),
      quizDemoLine: [
        {
          uci: 'a4a5',
          text: '**a5.** White pushes the a-pawn and ignores the h-pawn. **That h-pawn is the decoy.**',
          highlight: l2DecoyDemo('h5', 'a5', [['a5', 'a8', 'run']]),
        },
        {
          uci: 'e5f5',
          text: "**Kf5.** Black's king heads for h5. A free pawn is hard to ignore.",
          highlight: l2DecoyDemo('h5', 'a5', [
            ['a5', 'a8', 'run'],
            ['f5', 'h5', 'bait'],
          ]),
        },
        {
          uci: 'a5a6',
          text: "**a6.** White keeps marching. **The plan doesn't change.**",
          highlight: l2DecoyDemo('h5', 'a6', [
            ['a6', 'a8', 'run'],
            ['f5', 'h5', 'bait'],
          ]),
        },
        {
          uci: 'f5g5',
          text: '**Kg5.** One square closer to the bait.',
          highlight: l2DecoyDemo('h5', 'a6', [
            ['a6', 'a8', 'run'],
            ['g5', 'h5', 'bait'],
          ]),
        },
        {
          uci: 'a6a7',
          text: '**a7.** One step from queening. Black is about to spend a whole move on one pawn.',
          highlight: l2DecoyDemo('h5', 'a7', [
            ['a7', 'a8', 'run'],
            ['g5', 'h5', 'bait'],
          ]),
        },
        {
          uci: 'g5h5',
          text: "**Kxh5.** He took the bait. It feels like winning a pawn. **It's the losing move: it did nothing to stop the real one.**",
          highlight: {
            squares: [
              { square: 'h5', color: L2_BAIT, fill: true, label: 'BAIT TAKEN' },
              { square: 'a7', color: L2_RUNNER, fill: true, label: 'RUNNER' },
              { square: 'a8', color: L2_RUNNER, fill: true },
            ],
            arrows: [{ from: 'a7', to: 'a8', color: L2_RUNNER_ARROW }],
          },
        },
        {
          uci: 'a7a8q',
          text: '**a8=Q.** While his king took a detour for one pawn, **this one walked in for free.**',
          celebrate: true,
          highlight: {
            squares: [
              { square: 'h5', color: L2_BAIT, fill: true },
              { square: 'a8', color: L2_RUNNER, fill: true, label: 'QUEEN' },
            ],
            arrows: [],
          },
        },
      ],
      doneText: "That's a decoy. **Now you try it.**",
      hintText: '',
      excludeFromProgress: true,
      noAutoAdvance: true,
    },
    // ---------- Primer 2 - ne spasavaj mamac ----------
    {
      id: 'e2-dont-rescue',
      kind: 'freePlay',
      fen: '8/1p6/8/P4k2/8/8/7P/1K6 w - - 0 1',
      orientation: 'w',
      solution: [],
      prompt: "Don't rescue the bait",
      introText:
        'Your turn. **Find the best move, then win it.** He plays the best defense there is. Ask yourself: **does your a-pawn need help right now?**',
      strongOpponent: true,
      liveHint: true,
      freePlayGoal: 'promote',
      freePlayKeepWinning: {
        firstMoveTexts: {
          a5a6: "**a6** looks natural. **bxa6** just takes it, and your extra pawn is gone. That's a draw. The a-pawn isn't in danger: **leave it alone.**",
        },
        wrongText:
          "That lets the win slip. **It's not winning anymore.** Try another move.",
      },
      freePlayFailText:
        "That's a draw. Back to the start. **Leave the a-pawn alone and use your king.**",
      doneText:
        '**Queen.** You left the bait alone and won it against the best defense.',
      hintText: '',
    },
    // ---------- Primer 3 - mamac radi samo sada ----------
    {
      id: 'e3-right-now',
      kind: 'freePlay',
      fen: '8/8/8/1p1k4/P7/8/1K5P/8 w - - 0 1',
      orientation: 'w',
      solution: [],
      prompt: 'Hardest: the decoy only works right now',
      introText:
        "Hardest one. **Find White's best move, and don't waste a tempo.**",
      strongOpponent: true,
      liveHint: true,
      freePlayGoal: 'promote',
      freePlayKeepWinning: {
        // Svi potezi kraljem i h3/h4 su tacno 0.00 (Stockfish).
        firstMoveTexts: Object.fromEntries(
          [
            'b2a1',
            'b2a2',
            'b2a3',
            'b2b1',
            'b2b3',
            'b2c1',
            'b2c2',
            'b2c3',
            'h2h3',
            'h2h4',
          ].map((uci) => [uci, L2_DECOY_TOO_SLOW])
        ),
        wrongText:
          "That lets the win slip. **It's not winning anymore.** Try another move.",
      },
      freePlayFailText:
        "That's a draw. Back to the start. **The decoy has to go right away.**",
      doneText:
        "**Queen.** You sent the decoy right on time, and **his king couldn't cover both sides**.",
      hintText: '',
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Provereno: chess.js (svi legalni odgovori) + Stockfish 18 (najbolji potez, P6 mat u 5).
const L2_DAY_28_DOUBLE_ATTACK: Lesson = {
  id: 'l2-d28-double-attack',
  level: 2,
  day: 28,
  title: 'Double Attack',
  endScreenTitle: 'One move. Two threats.',
  endScreenText:
    'He only gets to answer one. Watch for **knight forks, rooks on open lines, queens on two diagonals**. And sometimes a double attack is **the first move of a mate**.',
  flatProgressSegments: true,
  piece: {
    name: 'double attack',
    glyph: '♞',
    movement: 'static',
    bannerText: 'Double Attack',
  },
  intro: {
    title: 'Double attack',
    text: 'A double attack is **one move, two threats**. He can only answer one. Knights do it best, any piece can. **A double attack with check is the hardest to escape.**',
  },
  introSteps: [
    {
      text: 'A double attack is **one move, two threats**. He can only answer one. Knights do it best, any piece can. **A double attack with check is the hardest to escape.**',
      buttonText: 'Start',
    },
  ],
  steps: [
    // ---------- Primer 1 - skakac, sah i top ----------
    {
      id: 'p1-knight-check-rook',
      moveGlyphs: { 0: '!' },
      kind: 'puzzle',
      fen: '8/p1p5/k3rbp1/4n3/4N3/2P2P2/PP2K3/6R1 w - - 0 1',
      orientation: 'w',
      // Crni bira Kb6/Kb5/Ka5, Nxe6 uzima topa u sva tri slucaja.
      solution: ['e4c5', ANY_LEGAL_REPLY, 'c5e6'],
      prompt: 'Knight fork with check',
      introText: "**Find White's best move.**",
      moveGuides: {
        0: {
          hintText:
            'Your knight on e4 can **check the king on a6** and hit something else from the same square.',
          highlight: {
            squares: [
              { square: 'e4', color: '#07DA63' },
              { square: 'a6', color: L2_ESCAPE, fill: true },
              { square: 'e6', color: L2_ESCAPE, fill: true },
            ],
          },
          missTexts: [
            'Not that. **Which knight jump checks a6 and hits e6?**',
            '**Nc5+.**',
          ],
          replyText: 'He had to move the king. **Now cash in.**',
        },
        2: {
          hintText: 'Your knight on c5 is **still hitting the rook**.',
          missTexts: [
            'Not that. **Take the rook.**',
            '**Knight takes on e6.**',
          ],
        },
      },
      moveExplanations: {
        0: '**Nc5+.** Check on the king, and the same knight **hits the rook on e6**. He has to answer the check first.',
      },
      doneText:
        '**A whole rook.** The check came first, so he never had time to save it.',
      hintText: 'Not that. **Which knight jump checks a6 and hits e6?**',
    },
    // ---------- Primer 2 - isto, crni ----------
    {
      id: 'p2-knight-check-bishop',
      moveGlyphs: { 0: '!' },
      kind: 'puzzle',
      fen: '8/p5k1/1p3p2/8/1PB3n1/6P1/P5KP/8 b - - 0 1',
      orientation: 'b',
      // Beli bira bilo koji od 5 poteza kraljem, lovac na c4 pada svaki put.
      solution: ['g4e3', ANY_LEGAL_REPLY, 'e3c4'],
      prompt: 'Same fork, from Black',
      introText: "You're Black. **Find your best move.**",
      moveGuides: {
        0: {
          hintText:
            'Your knight on g4 can **check the king on g2** and hit his bishop on c4 at the same time.',
          highlight: {
            squares: [
              { square: 'g4', color: '#07DA63' },
              { square: 'g2', color: L2_ESCAPE, fill: true },
              { square: 'c4', color: L2_ESCAPE, fill: true },
            ],
          },
          missTexts: [
            'Not that. **Which knight jump checks g2 and hits c4?**',
            '**Ne3+.**',
          ],
          replyText: 'His king moved. **The bishop is still hanging.**',
        },
        2: {
          hintText: 'Your knight on e3 is **hitting the bishop on c4**.',
          missTexts: [
            'Not that. **Take the bishop.**',
            '**Knight takes on c4.**',
          ],
        },
      },
      moveExplanations: {
        0: '**Ne3+.** Check first, and the knight **already hits c4**. Same idea as before, from the other side.',
      },
      doneText:
        '**A free bishop.** Wherever his king went, nothing was guarding c4.',
      hintText: 'Not that. **Which knight jump checks g2 and hits c4?**',
    },
    // ---------- Primer 3 - skakac bez saha ----------
    {
      id: 'p3-knight-no-check',
      kind: 'puzzle',
      fen: '1r4k1/p5pp/4pp2/b2pN3/3P3P/4P3/P4PP1/2R3K1 w - - 0 1',
      orientation: 'w',
      // Crni igra Rc8 (Stockfish: Ne7+ onda +6, Nxa5? Rxc1+ -5.75). Najbolji spas crnog je Bd2.
      solution: ['e5c6', 'b8c8', 'c6e7', 'g8f7', 'e7c8'],
      altMoves: { 4: ['c1c8'] },
      moveGlyphs: { 0: '!', 2: '!' },
      prompt: 'Fork without check',
      introText: "**Find White's best move.**",
      otherTypeMoves: {
        2: [
          {
            uci: 'c6a5',
            glyph: '?',
            message:
              '**Nxa5?** Greedy. **Rxc1+** and your rook is gone. Look for a check first.',
          },
        ],
      },
      moveGuides: {
        0: {
          hintText:
            'No check this time. Find the square where your knight **hits two pieces that cannot protect each other**.',
          highlight: {
            squares: [
              { square: 'e5', color: '#07DA63' },
              { square: 'b8', color: L2_ESCAPE, fill: true },
              { square: 'a5', color: L2_ESCAPE, fill: true },
            ],
          },
          missTexts: [
            'Not that. **Which knight jump hits both b8 and a5?**',
            '**Nc6.**',
          ],
          replyText:
            'He moved the rook to c8. **Careful:** look at that rook before you grab anything.',
        },
        2: {
          hintText:
            'Your knight can **check the king and hit the rook on c8** in one jump.',
          highlight: {
            squares: [
              { square: 'c6', color: '#07DA63' },
              { square: 'g8', color: L2_ESCAPE, fill: true },
              { square: 'c8', color: L2_ESCAPE, fill: true },
            ],
          },
          missTexts: ['Not that. **Find the knight check.**', '**Ne7+.**'],
        },
        4: {
          hintText: '**The rook on c8 is hanging.**',
          missTexts: [
            'Not that. **The rook on c8 is hanging.**',
            '**Take on c8.**',
          ],
        },
      },
      moveExplanations: {
        0: '**Nc6!** The knight hits **the rook and the bishop** at once.',
        2: '**Ne7+!** Check, and the knight **hits the rook on c8**. A second fork.',
      },
      doneText:
        '**A whole rook.** Two forks in a row: rook and bishop, then king and rook. His best try was **Bd2** right after Nc6, hitting your rook. Even then you stand better.',
      hintText: 'Not that. **Which knight jump hits both b8 and a5?**',
    },
    // ---------- Primer 4 - top po otvorenoj liniji ----------
    {
      id: 'p4-rook-fork',
      moveGlyphs: { 0: '!' },
      kind: 'puzzle',
      fen: 'r1r1n3/pb5k/1p5p/3PB3/8/P7/1P4PP/R4R1K w - - 0 1',
      orientation: 'w',
      // Crni bira Kg8/Kg6/Ng7, Rxb7 dobija u sva tri slucaja (Stockfish +4).
      solution: ['f1f7', ANY_LEGAL_REPLY, 'f7b7'],
      prompt: 'Rook fork, win it back',
      introText:
        "**Find White's best move.** You're **down a piece** here. Win it back.",
      moveGuides: {
        0: {
          hintText:
            'The **f-file is wide open**. Where does your rook land with check and line up with something on the same rank?',
          highlight: {
            squares: [
              { square: 'f1', color: '#07DA63' },
              { square: 'b7', color: L2_ESCAPE, fill: true },
            ],
            arrows: [{ from: 'f1', to: 'f7', color: L2_LINE }],
          },
          missTexts: ['Not that. **Use the open f-file.**', '**Rf7+.**'],
          replyText:
            'He dealt with the check. **The 7th rank is still yours.**',
        },
        2: {
          hintText:
            'Your rook on f7 is **looking straight down the 7th rank**.',
          missTexts: [
            'Not that. **Take the bishop.**',
            '**Rook takes on b7.**',
          ],
        },
      },
      moveExplanations: {
        0: '**Rf7+.** Check on the king, and the rook **lines up with the bishop on b7**.',
      },
      doneText:
        '**Piece back.** You started a piece down. **The fork is what won it back.**',
      hintText: 'Not that. **Use the open f-file.**',
    },
    // ---------- Primer 5 - dama na dve dijagonale ----------
    {
      id: 'p5-queen-two-diagonals',
      moveGlyphs: { 0: '!' },
      kind: 'puzzle',
      fen: 'r2qk1nr/2p2ppp/p3p3/8/1BnP4/2N1PQ2/PP3PPP/R1B1K2R w - - 0 1',
      orientation: 'w',
      solution: ['f3c6', 'd8d7', 'c6a8'],
      prompt: 'Queen on two diagonals',
      introText: "**Find White's best move.**",
      moveGuides: {
        0: {
          hintText:
            'Your queen can **check along one diagonal** and sit on another one pointing at his rook.',
          highlight: {
            squares: [
              { square: 'f3', color: '#07DA63' },
              { square: 'e8', color: L2_ESCAPE, fill: true },
              { square: 'a8', color: L2_ESCAPE, fill: true },
            ],
            arrows: [
              { from: 'c6', to: 'e8', color: L2_LINE },
              { from: 'c6', to: 'a8', color: L2_LINE },
            ],
          },
          missTexts: [
            'Not that. **Find the queen check that also looks at a8.**',
            '**Qc6+.**',
          ],
        },
        2: {
          hintText: '**The a8 rook is still on your diagonal.**',
          missTexts: ['Not that. **Take the rook.**', '**Queen takes on a8.**'],
        },
      },
      moveExplanations: {
        0: '**Qc6+.** His only legal move is to block with the queen. **Your queen is still looking at a8.**',
      },
      doneText:
        '**Qxa8+.** A whole rook, **with check again**. He never got a move to save it.',
      hintText: 'Not that. **Find the queen check that also looks at a8.**',
    },
    // ---------- Primer 6 - najtezi: mat u 5 ----------
    {
      id: 'p6-mate-in-five',
      moveGlyphs: { 0: '!' },
      kind: 'puzzle',
      fen: '2r2r2/3q1p1k/p3p3/3PpP1p/1Pp1P1n1/P1P4Q/2B5/3R2RK w - - 0 1',
      orientation: 'w',
      // Mat u 5 (Stockfish). 1.Rxg4 je takodje mat u 5, ali nije ideja ove lekcije.
      solution: [
        'h3h5',
        'g4h6',
        'h5h6',
        'h7h6',
        'd1d2',
        'd7e7',
        'd2h2',
        'e7h4',
        'h2h4',
      ],
      prompt: 'Hardest: double attack into mate',
      introText:
        "Hardest one. **Find White's best move.** It's forced mate if you find the idea.",
      otherTypeMoves: {
        0: [
          {
            uci: 'g1g4',
            message:
              "That's also mate in five. **This lesson starts with the queen.** Find the queen check.",
          },
        ],
      },
      moveGuides: {
        0: {
          hintText:
            'Your queen on h3 is **lined up with his king on h7**. What if you take the pawn in the way, with check?',
          highlight: {
            squares: [
              { square: 'h3', color: '#07DA63' },
              { square: 'h7', color: L2_ESCAPE, fill: true },
            ],
            arrows: [{ from: 'h3', to: 'h7', color: L2_LINE }],
          },
          missTexts: [
            'Not that. **Open the h-file, with check.**',
            '**Queen takes on h5.**',
          ],
          replyText: 'He blocked with the knight. **Now tear it open.**',
        },
        2: {
          hintText: 'Give the queen back. **Take on h6, with check.**',
          missTexts: [
            'Not that. **Sacrifice the queen on h6.**',
            '**Queen takes on h6.**',
          ],
          replyText:
            'His king had to take. **Now bring a rook to the h-file.**',
        },
        4: {
          hintText:
            'Your d1 rook can **reach the h-file in two moves**. Start with d2.',
          missTexts: [
            'Not that. **Get a rook to the h-file.**',
            '**Rook to d2.**',
          ],
          replyText: 'Nothing stops it. **Check him on the h-file.**',
        },
        6: {
          hintText: '**Rook to h2, with check.**',
          missTexts: ['Not that. **Check on the h-file.**', '**Rh2+.**'],
          replyText: 'He blocked with the queen. **Finish it.**',
        },
        8: {
          hintText: '**Take the queen on h4.** That is mate.',
          missTexts: ['Not that. **Take on h4.**', '**Rxh4#.**'],
        },
      },
      moveExplanations: {
        0: '**Qxh5+.** Check, and the **h-file is open now**.',
        2: '**Qxh6+.** The queen goes, and his king is **dragged out to h6**.',
        4: '**Rd2.** Quiet, and **every answer loses**. The rook is coming to h2.',
        6: '**Rh2+.** Only a block is left.',
      },
      doneText:
        '**Rxh4#.** One check opened the file, one sacrifice pulled the king out, and the rook did the rest.',
      hintText: 'Not that. **Open the h-file, with check.**',
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// ---------- Day 29 - Box method (top i kralj protiv kralja) ----------
const L2_BOX_CUT = 'rgba(17, 198, 209, 0.28)';
const L2_BOX_CHECK = 'rgba(242, 53, 141, 0.35)';
const L2_BOX_KING = 'rgba(7, 218, 99, 0.45)';
const L2_BOX_ARROW = 'rgba(7, 218, 99, 0.85)';
const L2_BOX_WRONG =
  "Might not be a bad move. **We're drilling one exact method right now.** Play the highlighted move.";

// Ceo red (rank) obojen, natpis na jednom polju.
const l2BoxRank = (
  rank: number,
  label: string,
  color = L2_BOX_CUT,
  labelFile = 'h'
) =>
  ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file) => ({
    square: `${file}${rank}`,
    color,
    fill: true,
    ...(file === labelFile ? { label } : {}),
  }));

// "I 'L' you": oba kralja obojena, strelica od belog do crnog (skakacev skok).
// Red koji top drzi je u boardBackdrop, pa ovde samo kraljevi.
const l2BoxL = (white: string, black: string) => ({
  squares: [
    { square: white, color: L2_BOX_KING, fill: true },
    { square: black, color: L2_BOX_KING, fill: true, label: 'L' },
  ],
  arrows: [{ from: white, to: black, color: L2_BOX_ARROW }],
});

// Linija je provedena kroz chess.js (37 polu-poteza, mat na kraju). Crni igra
// Dragutinovu skriptu, ne najbolju odbranu; jedini prisilan odgovor je pretposlednji Kb8.
const l2BoxStep = (
  step: Partial<LessonStep> &
    Pick<LessonStep, 'id' | 'prompt' | 'solution' | 'doneText'>
): LessonStep => ({
  kind: 'puzzle',
  fen: '8/8/4k3/8/8/8/4K3/R7 w - - 0 1',
  orientation: 'w',
  introText: '',
  hintText: L2_BOX_WRONG,
  hintTextAlways: true,
  missTexts: [L2_BOX_WRONG],
  suggestSolutionMoves: true,
  // "L" se vidi dok crni kralj jos stoji na polju, pa nestaje sa njegovim odgovorom.
  moveHighlightHoldMs: 1800,
  ...step,
});

const L2_DAY_29_BOX_METHOD: Lesson = {
  id: 'l2-d29-box-method',
  level: 2,
  day: 29,
  title: 'The Box Method',
  endScreenTitle: 'Box closed.',
  endScreenText:
    "Four pictures, every time: **the L approach, the face-off, the rook switching sides** when it's attacked, and **handing over the move** when you can't advance. That's the whole technique. Next lesson, you run it yourself.",
  flatProgressSegments: true,
  piece: {
    name: 'box method',
    glyph: '♜',
    movement: 'static',
    bannerText: 'The Box Method',
  },
  intro: {
    title: 'The box method',
    text: "King and rook against a lone king always wins. **Your rook cuts off a rank or a file. Your king walks in to shrink the space.** Four pictures do all the work here: the knight's-move approach, the face-off, the rook switching sides when it's attacked, and handing over the move when you can't advance. Watch for all four. You'll see each one more than once.",
  },
  introSteps: [
    {
      text: "King and rook against a lone king always wins. **Your rook cuts off a rank or a file. Your king walks in to shrink the space.** Four pictures do all the work here: the knight's-move approach, the face-off, the rook switching sides when it's attacked, and handing over the move when you can't advance. Watch for all four. You'll see each one more than once.",
      buttonText: 'Start!',
    },
  ],
  steps: [
    // ---------- Deo 1 - kutija i prvo "L" ----------
    l2BoxStep({
      id: 'box-1-cut-off',
      prompt: 'Build the box',
      introText: 'Play each move as it shows up. **Drag it, or tap it below.**',
      solution: ['a1a5', 'e6d6', 'e2d3', 'd6e6', 'd3d4', 'e6f6'],
      moveExplanations: {
        0: "**Ra5.** The rook seals off the whole 5th rank. The king can't cross it. **That's the box.**",
        2: '**Kd3.** Now the king walks in.',
        4: "**Kd4.** See the shape between the kings? **A knight's jump. An L.**",
      },
      moveGuides: {
        0: {
          replyText: 'Kd6. **Nowhere to go except deeper into the box.**',
        },
        2: {
          replyText:
            "Ke6. Won't retreat. **Retreat and the rook shrinks the box another row.**",
        },
      },
      moveBackdrops: { 0: l2BoxRank(5, 'CUT OFF') },
      moveHighlights: {
        4: l2BoxL('d4', 'e6'),
      },
      doneText:
        "Kf6. Running from the face-off. **It knows what's coming if it stays.**",
    }),
    // ---------- Deo 2 - "L" do suocavanja ----------
    l2BoxStep({
      id: 'box-2-l-approach',
      boardBackdrop: l2BoxRank(5, 'CUT OFF'),
      continuesGame: true,
      fen: '8/8/5k2/R7/3K4/8/8/8 w - - 6 4',
      introText: 'Keep making **the L**.',
      prompt: "I 'L' you",
      preStepIntro: {
        title: "I 'L' you with my King",
        text: "See the shape between the two kings? **That's a knight's jump. An L.** Keep making that shape, one step at a time, until the kings end up face to face. **That face-off is the next picture you need to remember.**",
        diagramFen: '8/8/4k3/R7/3K4/8/8/8 b - - 5 3',
        buttonText: 'Got it!',
      },
      solution: ['d4e4', 'f6g6', 'e4f4', 'g6h6', 'f4g4', 'h6g6'],
      moveExplanations: {
        0: '**Ke4.** Same shape, new square.',
        2: '**Kf4.**',
        4: '**Kg4.**',
      },
      moveGuides: {
        0: { replyText: 'Kg6. Still running.' },
        2: { replyText: "Kh6. **Corner's getting close.**" },
      },
      moveHighlights: {
        0: l2BoxL('e4', 'f6'),
        2: l2BoxL('f4', 'g6'),
        4: l2BoxL('g4', 'h6'),
      },
      quizBoardHighlight: {
        squares: [
          { square: 'g4', color: L2_BOX_KING, fill: true },
          { square: 'g5', color: L2_BOX_CHECK, fill: true, label: 'FACE-OFF' },
          { square: 'g6', color: L2_BOX_KING, fill: true },
        ],
        arrows: [],
      },
      doneText: 'Kg6. Out of room. **This is the face-off.**',
    }),
    // ---------- Deo 3 - bocni sah i nazad na "L" ----------
    l2BoxStep({
      id: 'box-3-face-off',
      boardBackdrop: l2BoxRank(5, 'CUT OFF'),
      moveBackdrops: { 0: l2BoxRank(6, 'CUT OFF') },
      continuesGame: true,
      fen: '8/8/6k1/R7/6K1/8/8/8 w - - 12 7',
      introText: 'Face-off on the board. **Time for the side check.**',
      prompt: 'Face to face',
      preStepIntro: {
        title: 'Face to face',
        text: "Kings lined up, one square apart, same file or rank. **Whenever you see this picture, it's time for a side check.** It pushes the king down another row.",
        diagramFen: '8/8/6k1/R7/6K1/8/8/8 w - - 12 7',
        buttonText: 'Got it!',
      },
      solution: [
        'a5a6',
        'g6f7',
        'g4g5',
        'f7e7',
        'g5f5',
        'e7d7',
        'f5e5',
        'd7c7',
        'e5d5',
        'c7b7',
      ],
      moveExplanations: {
        0: '**Ra6+.** Side check. **Down you go.**',
        2: '**Kg5.** Here we go again.',
        4: '**Kf5.**',
        6: '**Ke5.**',
        8: '**Kd5.**',
      },
      moveGuides: {
        0: {
          replyText: 'Kf7. Forced back a row. **The box just got smaller.**',
        },
        2: { replyText: 'Ke7.' },
        4: { replyText: 'Kd7.' },
        6: { replyText: 'Kc7.' },
      },
      moveHighlights: {
        0: { squares: l2BoxRank(6, 'CHECK', L2_BOX_CHECK), arrows: [] },
        2: l2BoxL('g5', 'f7'),
        4: l2BoxL('f5', 'e7'),
        6: l2BoxL('e5', 'd7'),
        8: l2BoxL('d5', 'c7'),
      },
      quizBoardHighlight: {
        squares: [
          { square: 'a6', color: L2_BOX_CHECK, fill: true, label: 'ATTACKED' },
          { square: 'b7', color: L2_BOX_CHECK, fill: true },
        ],
        arrows: [{ from: 'b7', to: 'a6', color: 'rgba(242, 53, 141, 0.85)' }],
      },
      doneText: "Kb7. Not running anymore. **It's going after your rook.**",
    }),
    // ---------- Deo 4 - top menja stranu ----------
    l2BoxStep({
      id: 'box-4-switch-sides',
      boardBackdrop: l2BoxRank(6, 'CUT OFF'),
      continuesGame: true,
      fen: '8/1k6/R7/3K4/8/8/8/8 w - - 22 12',
      introText: '**Your rook is attacked.** Switch sides.',
      prompt: 'Rook switches sides',
      preStepIntro: {
        title: 'Rook switches sides',
        text: 'Rook under attack? **It just slides to the far end of the same line it is already holding.** Same cutoff. Zero risk.',
        diagramFen: '8/1k6/R7/3K4/8/8/8/8 w - - 22 12',
        diagramHighlightRank: 6,
        buttonText: 'Got it!',
      },
      solution: ['a6h6', 'b7c7'],
      moveGlyphs: { 0: '!' },
      moveExplanations: {
        0: "**Rh6!** Rook's safe. **The box didn't move an inch.**",
      },
      moveHighlights: {
        0: {
          squares: [{ square: 'h6', color: L2_BOX_KING, fill: true }],
          arrows: [{ from: 'a6', to: 'h6', color: L2_BOX_ARROW }],
        },
      },
      doneText:
        "Kc7. Smart. **Making sure you can't play the L move this time.**",
    }),
    // ---------- Deo 5 - predaj potez, pa mat ----------
    l2BoxStep({
      id: 'box-5-hand-over',
      boardBackdrop: l2BoxRank(6, 'CUT OFF'),
      moveBackdrops: {
        6: l2BoxRank(7, 'CUT OFF'),
        12: l2BoxRank(8, 'MATE', L2_BOX_CHECK),
      },
      continuesGame: true,
      fen: '8/2k5/7R/3K4/8/8/8/8 w - - 24 13',
      introText: '**No L move available.** Hand over the move.',
      prompt: 'Hand over the move',
      preStepIntro: {
        title: 'Hand over the move',
        text: "No L move on the board? **Shift the rook one square along the same line instead.** You're not gaining ground, you're passing the move, so the king has to walk into the face-off on its own next turn.",
        diagramFen: '8/2k5/7R/3K4/8/8/8/8 w - - 24 13',
        diagramHighlightRank: 6,
        buttonText: 'Got it!',
      },
      solution: [
        'h6g6',
        'c7b7',
        'd5c5',
        'b7a7',
        'c5b5',
        'a7b7',
        'g6g7',
        'b7b8',
        'b5c6',
        'b8a8',
        'c6b6',
        'a8b8',
        'g7g8',
      ],
      moveGlyphs: { 0: '!' },
      moveExplanations: {
        0: "**Rg6!** That's the pass. **Watch what it walks into.**",
        2: "**Kc5.** L move's back on.",
        4: '**Kb5.**',
        6: '**Rg7+.** You know this picture by now.',
        8: '**Kc6.**',
        10: '**Kb6.**',
      },
      moveGuides: {
        0: {
          replyText: 'Kb7. Had to move somewhere. **Right back into range.**',
        },
        2: { replyText: 'Ka7.' },
        4: {
          replyText: "Kb7. Last row's getting close. **Nowhere left to hide.**",
        },
        6: { replyText: 'Kb8. One row from the edge.' },
        8: { replyText: 'Ka8.' },
        10: { replyText: 'Kb8. **Only square left.**' },
      },
      moveHighlights: {
        0: {
          squares: [
            { square: 'g6', color: L2_BOX_KING, fill: true, label: 'PASS' },
          ],
          arrows: [{ from: 'h6', to: 'g6', color: L2_BOX_ARROW }],
        },
        2: l2BoxL('c5', 'b7'),
        4: l2BoxL('b5', 'a7'),
        6: { squares: l2BoxRank(7, 'CHECK', L2_BOX_CHECK), arrows: [] },
        8: l2BoxL('c6', 'b8'),
        10: l2BoxL('b6', 'a8'),
      },
      quizBoardHighlight: {
        squares: [{ square: 'b8', color: L2_BOX_CHECK, fill: true }],
        arrows: [],
      },
      doneText: "**Rg8#.** That's the technique. **Start to finish.**",
    }),
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Lessons 2 tura, prikazuje se na /lesson_2. Id-jevi moraju biti jedinstveni u obe ture.
export const LESSON_DATABASE_2: Lesson[] = [
  L2_DAY_1_PIN,
  L2_DAY_2_BACK_RANK_MATE,
  L2_DAY_3_RULE_OF_SQUARE,
  L2_DAY_4_CENTER_CONTROL,
  L2_DAY_5_OPENING_MISTAKES,
  L2_DAY_6_FORK,
  L2_DAY_7_PAWNY_4,
  L2_DAY_8_LADDER_MATE,
  L2_DAY_9_OPPOSITION_2,
  L2_DAY_10_DEVELOPMENT,
  L2_DAY_11_OPENING_NAMES,
  L2_DAY_12_SKEWER,
  L2_DAY_13_SMOTHERED_MATE,
  L2_DAY_14_PAWNY_5,
  L2_DAY_15_DECOY,
  L2_DAY_16_HANGS,
  L2_DAY_17_OPENING_TRAPS,
  L2_DAY_18_DISCOVERED_ATTACK,
  L2_DAY_19_ANASTASIA_MATE,
  L2_DAY_20_PASSED_PAWN,
  L2_DAY_21_PAWN_ISLANDS,
  L2_DAY_22_PAWNY_6,
  L2_DAY_23_DISCOVERED_CHECK,
  L2_DAY_24_MATE_IN_TWO,
  L2_DAY_25_PAWN_RACES,
  L2_DAY_26_DEFLECTION,
  L2_DAY_27_DECOY_PAWN,
  L2_DAY_28_DOUBLE_ATTACK,
  L2_DAY_29_BOX_METHOD,
];

const LESSON_TRACKS: Lesson[][] = [LESSON_DATABASE, LESSON_DATABASE_2];

/** Stranica sa spiskom lekcija iz iste ture (Done dugme). */
export function getLessonsPagePath(lessonId?: string): string {
  return lessonId && LESSON_DATABASE_2.some((l) => l.id === lessonId)
    ? '/lesson_2'
    : '/lessons';
}

export const DEFAULT_LESSON_ID = DAY_1_ROOK.id;

export function findLesson(lessonId: string): Lesson | null {
  for (const track of LESSON_TRACKS) {
    const lesson = track.find((l) => l.id === lessonId);
    if (lesson) return lesson;
  }
  return null;
}

export function findLessonStep(
  lessonId: string,
  stepIndex: number
): LessonStep | null {
  return findLesson(lessonId)?.steps[stepIndex] ?? null;
}

/** Id sledece lekcije u nizu (npr. Rook -> Bishop), ili null ako je poslednja. */
export function getNextLessonId(currentLessonId: string): string | null {
  // Sledeca lekcija uvek iz iste ture.
  for (const track of LESSON_TRACKS) {
    const idx = track.findIndex((l) => l.id === currentLessonId);
    if (idx === -1) continue;
    return idx === track.length - 1 ? null : track[idx + 1].id;
  }
  return null;
}
