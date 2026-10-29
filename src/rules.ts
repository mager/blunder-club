import { Chess } from 'chess.js';
import type { Move } from 'chess.js';
import type { Line } from './engine';
import { playUci, pieceNames } from './chess';

export interface TeachingEvidence { move: Move; reply: Line; response: Move; bestMove?: Move; }
export interface TeachingRule {
  id: string; skill: string; name: string; priority: number;
  applies: (evidence: TeachingEvidence) => boolean;
  explain: (evidence: TeachingEvidence) => string;
}
/** Ordered, inspectable rules. Club names are labels, not official chess terms. */
export const teachingRules: TeachingRule[] = [
  { id: 'forced-mate', skill: 'king', name: 'The open door', priority: 100,
    applies: ({ reply }) => reply.mate !== undefined && reply.mate > 0,
    explain: () => 'Your opponent has a forced path to checkmate. Look at the squares and defenders around your king.' },
  { id: 'capture-reply', skill: 'safety', name: 'The free lunch', priority: 80,
    applies: ({ response }) => Boolean(response.captured),
    explain: ({ response }) => `Black can take your ${pieceNames[response.captured!]} on ${response.to}. Check the capture sequence before you choose a move.` },
  { id: 'missed-capture', skill: 'tactics', name: 'The missed gift', priority: 70,
    applies: ({ bestMove }) => Boolean(bestMove?.captured),
    explain: ({ bestMove }) => `You could capture their ${pieceNames[bestMove!.captured!]} with ${bestMove!.san}. Your move lets them respond instead. Compare the capture with the line below.` },
  { id: 'early-queen', skill: 'development', name: 'The solo mission', priority: 40,
    applies: ({ move }) => move.piece === 'q' && Number(move.before.split(' ')[5]) <= 10,
    explain: () => 'Your queen moved early while other pieces may still need to develop. Compare the line to see whether the queen loses time.' },
  { id: 'missed-reply', skill: 'threats', name: 'The plot twist', priority: 0,
    applies: () => true,
    explain: () => 'A reply changes the position against you. Follow the line and ask what your opponent’s move threatens.' },
];
export function classifyMistake(move: Move, reply: Line, best?: Line) {
  const response = playUci(new Chess(move.after), reply.move);
  const bestMove = best ? playUci(new Chess(move.before), best.move) : undefined;
  const evidence = { move, reply, response, bestMove };
  const rule = [...teachingRules].sort((a,b) => b.priority-a.priority).find(rule => rule.applies(evidence))!;
  return { id: rule.id, skill: rule.skill, name: rule.name, explanation: rule.explain(evidence) };
}
