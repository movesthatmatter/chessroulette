import { ai_prompt } from '../../util';
import type { ChapterState } from '../../movex/types';
import type { BoxMethodPhase } from '../../checkmateTechnique';

/**
 * LessonStep.liveHint (Day 20 "Deliver Mate" Phase 2) - za razliku od
 * SendQuestionCoach.tsx (korisnikovo SLOBODNO pitanje), ovde NEMA pitanja -
 * samo trazimo kratko objasnjenje ZA JEDAN KONKRETAN, vec predlozen potez
 * (checkmateTechnique.ts "box method" predlog, ne sirov engine eval). Model
 * mora da objasni BAS TAJ potez, UVEK uokviren oko tehnike koju korisnica
 * trazila (box pa approach pa mate) - zato mu saljemo i FAZU, ne samo FEN+SAN,
 * da podsetnik na pravilo bude DOSLEDAN na svaki klik, ne prepusten modelu.
 */
const PHASE_FRAMING: Record<BoxMethodPhase, string> = {
  box: "PHASE: boxing. The queen alone is shrinking the king's space - the attacker's own king stays back for now. Explain how this move cuts off more squares and pushes the king toward the edge. End by reminding them the plan: box first with the queen, bring the king in only once the king is boxed to one line.",
  approach:
    "PHASE: bringing the king in. The queen has already boxed the king down to one line (it can only shuffle left-right or up-down, nothing else) - now it's time to walk the attacker's own king closer. Explain this move as bringing the king up to help, now that the box is sealed.",
  mate: 'PHASE: mate. This move delivers checkmate right now - the "kiss of death": the queen lands right next to the king, protected by the attacker\'s own king. Explain why it\'s mate.',
};

const HINT_STYLE = `
You are a chess coach teaching a complete beginner (rating 100-500) one
specific, fixed technique for checkmating with a lone queen and king: box
the king to the edge with the queen alone first, THEN bring your own king up
to deliver the final "kiss of death" mate. Explain in ONE short sentence
(max 25-30 words) why the suggested move fits that plan right now. Reference
the move itself. Outpost brand voice: no exclamation marks, no emoji, use
contractions, one idea per sentence, never cheerleading or padded with
"but"/"unfortunately"/"that said". Always answer in English.
`.trim();

// Lessons 2 Day 8 - kralj i pesak protiv kralja, objasnjenje kroz opoziciju.
const KPK_STYLE = `
You are a chess coach teaching a player rated 600-1200 how to win a king and
pawn vs king endgame using the opposition: kings facing each other with one
square between them, the side NOT to move has the opposition and the other
king must step aside. The king leads in front of the pawn; a spare pawn move
can hand the move back to the opponent. Explain in ONE short sentence (max
25-30 words) why the suggested move helps win right now, framed around the
opposition or the king's position in front of the pawn. Reference the move
itself. Outpost brand voice: no exclamation marks, no emoji, no em dashes, use
contractions, one idea per sentence, never cheerleading or padded with
"but"/"unfortunately"/"that said". Always answer in English.
`.trim();

export async function SendHintExplanation(
  fen: string,
  suggestedSan: string,
  phase: BoxMethodPhase,
  currentChapterState: ChapterState,
  technique?: 'kpkOpposition'
) {
  const model = 'gpt-5.1';
  const previousMessageId =
    currentChapterState.messages[currentChapterState.messages.length - 1]
      ?.idResponse ?? '';

  const question =
    'POSITION (FEN):\n' +
    fen +
    '\n\n' +
    'SUGGESTED MOVE:\n' +
    suggestedSan +
    '\n\n' +
    (technique === 'kpkOpposition'
      ? KPK_STYLE
      : PHASE_FRAMING[phase] + '\n\n' + HINT_STYLE);

  const data = await ai_prompt(question, previousMessageId, model);
  return data;
}
