import { DEFAULT_POSITION } from 'chess.js';
import type { LessonStep, StudyLesson } from './lesson-types';
const italianBoard = { id: 'italian', title: 'The Italian Game', detail: 'Six moves. Three ideas. An opening you understand.', fen: DEFAULT_POSITION, focus: 'Your first opening', tip: 'Control the center, bring out your pieces, and give your king a safe home.' };
export const openingSteps: LessonStep[] = [
  { move: 'e2e4', reply: 'e7e5', title: 'Take your space.', skill: 'center', short: 'Center', hint: 'Move your e-pawn two squares to open your bishop.', question: 'Which pawn can claim the center and open a path for your bishop?', why: 'e4 puts a pawn in the center and opens the diagonal for your bishop on f1. More space gives your pieces more choices.' },
  { move: 'g1f3', reply: 'b8c6', title: 'Develop with a threat.', skill: 'development', short: 'Develop', hint: 'Your g1 knight can attack e5.', question: 'Find a knight move that attacks the pawn on e5 and controls the center.', why: 'Nf3 brings out a new piece, attacks e5, and clears one square between your king and rook. One move does three jobs.' },
  { move: 'f1c4', reply: 'f8c5', title: 'Point at the weak spot.', skill: 'development', short: 'Aim', hint: 'Your f1 bishop can aim at f7.', question: 'Put your bishop on a useful diagonal toward the pawn beside Black’s king.', why: 'Bc4 develops your bishop and points at f7. At the start, only the black king defends that pawn. You have also cleared the path to castle.' },
  { move: 'e1g1', reply: 'g8f6', title: 'Get the king home.', skill: 'king', short: 'Castle', hint: 'Move your king two squares toward the h1 rook.', question: 'Your king and rook have a clear path. Make the move that helps both.', why: 'O-O is kingside castling: move your king from e1 to g1. The rook moves to f1. Your king gets a pawn shield and the rook moves toward the center.' },
  { move: 'd2d3', reply: 'd7d6', title: 'Hold what you built.', skill: 'safety', short: 'Support', hint: 'Use your d-pawn to defend e4.', question: 'Black’s knight attacks e4. Which pawn move supports e4 and frees your other bishop?', why: 'd3 defends e4 with a pawn and opens the diagonal for your bishop on c1. Defending a piece can also improve your position.' },
  { move: 'b1c3', reply: 'e8g8', title: 'Everyone gets a job.', skill: 'development', short: 'Connect', hint: 'Your b1 knight can defend e4 from c3.', question: 'One knight is still on its starting square. Bring it toward the center.', why: 'Nc3 develops a new piece, adds support to e4, and controls d5. You now have a safe king, a center pawn, and three active minor pieces.' },
];

export const italian:StudyLesson={...italianBoard,kind:'opening',skill:'development',level:'Start',steps:openingSteps,completion:'Center claimed. Pieces active. King safe.'};
export const openings:StudyLesson[]=[italian];
const openingStep=(move:string,reply:string,title:string,question:string,why:string,skill:LessonStep['skill']):LessonStep=>({move,reply,title,question,why,skill,short:title,hint:why});
export const london:StudyLesson={id:'london',kind:'opening',skill:'development',level:'Start',title:'The London setup',detail:'Develop around a steady center.',fen:DEFAULT_POSITION,focus:'Build a useful setup',tip:'Develop your bishop before closing its diagonal.',completion:'A steady center, active bishops, and a castled king.',steps:[
 openingStep('d2d4','d7d5','Start in the center.','Advance your queen pawn two squares.','d4 controls e5 and opens the diagonal for your bishop.','center'),
 openingStep('c1f4','g8f6','Let the bishop out.','Develop the c1 bishop before playing e3.','Bf4 puts the bishop outside the pawn chain before e3 closes its diagonal.','development'),
 openingStep('e2e3','e7e6','Support your center.','Defend d4 and open a path for the other bishop.','e3 supports d4 and opens the f1 bishop’s diagonal.','center'),
 openingStep('g1f3','f8d6','A knight with a job.','Develop a knight toward the center.','Nf3 develops a new piece and supports d4.','development'),
 openingStep('f1d3','e8g8','Aim at the king.','Develop your remaining bishop toward h7.','Bd3 points toward h7 and clears the last square needed for castling.','development'),
 openingStep('e1g1','c7c5','Finish safely.','Castle your king.','O-O puts your king behind its pawn shield. Now watch Black’s pressure on d4.','king'),
]};
export const queensGambit:StudyLesson={id:'queens-gambit',kind:'opening',skill:'center',level:'Build',title:'The Queen’s Gambit',detail:'Challenge the center, then develop.',fen:DEFAULT_POSITION,focus:'Challenge the center',tip:'Use the c-pawn to challenge Black’s d-pawn.',completion:'You challenged the center and developed before attacking.',steps:[
 openingStep('d2d4','d7d5','Take central space.','Move the d-pawn two squares.','d4 claims space and opens your c1 bishop’s diagonal.','center'),
 openingStep('c2c4','e7e6','Challenge the center.','Attack Black’s d5 pawn with your c-pawn.','c4 is the Queen’s Gambit. It challenges the pawn holding Black’s center.','center'),
 openingStep('b1c3','g8f6','Add pressure.','Develop the b1 knight toward d5.','Nc3 develops a piece and adds pressure to the center.','development'),
 openingStep('g1f3','f8e7','Bring the other knight.','Develop your kingside knight.','Nf3 supports d4 and clears a square for castling.','development'),
 openingStep('e2e3','e8g8','Open the bishop’s path.','Support d4 and make room for the f1 bishop.','e3 reinforces d4 and lets the f1 bishop develop.','center'),
 openingStep('f1d3','c7c5','Join the game.','Develop the f1 bishop toward the kingside.','Bd3 develops the bishop and clears the way to castle.','development'),
 openingStep('e1g1','b8c6','King safe. Game on.','Castle before starting your next plan.','O-O finishes this setup. Black’s c5 pawn now challenges your center.','king'),
]};
openings.push(london,queensGambit);
