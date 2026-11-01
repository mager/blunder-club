import {describe,it,expect} from 'vitest';
import {Chess} from 'chess.js';
import {studies} from '../src/curriculum';
import {acceptsStep,studyPosition,completeStudy,normalizeStudyResults,mergeStudyResults} from '../src/study';
import {playUci} from '../src/chess';
describe('authored curriculum',()=>{
 it('has unique stable IDs',()=>expect(new Set(studies.map(l=>l.id)).size).toBe(studies.length));
 for(const lesson of studies)it(`${lesson.id}: every move and reply is legal and completes its stated line`,()=>{
  const board=new Chess(lesson.fen);
  expect(board.turn()).toBe('w');expect(board.isGameOver()).toBe(false);
  for(const [index,step] of lesson.steps.entries()) {
   expect(studyPosition(lesson,board.history())).toMatchObject({index,valid:true,complete:false});
   const before=board.fen();
   for(const choice of [step.move,...(step.alternatives || [])])expect(acceptsStep(step,before,choice)).toBe(true);
   playUci(board,step.move);
   if(step.goal==='mate')expect(board.isCheckmate()).toBe(true);
   if(step.reply)playUci(board,step.reply);
  }
  expect(studyPosition(lesson,board.history())).toMatchObject({complete:true,valid:true});
 });
 it('teaches rook underpromotion to avoid a real stalemate',()=>{
  const lesson=studies.find(l=>l.id==='underpromotion')!;
  const queen=new Chess(lesson.fen);playUci(queen,'c7c8q');expect(queen.isStalemate()).toBe(true);
  const rook=new Chess(lesson.fen);playUci(rook,'c7c8r');expect(rook.isGameOver()).toBe(false);
 });
 it('accepts other checkmates but not a legal non-mating move',()=>{
  const lesson=studies.find(l=>l.id==='mate')!;
  expect(acceptsStep(lesson.steps[0],lesson.fen,'e1e7')).toBe(false);
  expect(acceptsStep(lesson.steps[0],lesson.fen,'e1e8')).toBe(true);
 });
 it('does not grant independent credit after help or a failed attempt',()=>{
  const run={lessonId:'mate',moves:[],helped:false,mistakes:0,recorded:false};
  expect(completeStudy({},run,1).mate.independent).toBe(1);
  expect(completeStudy({},{...run,helped:true},1).mate.independent).toBe(0);
  expect(completeStudy({},{...run,mistakes:1},1).mate.independent).toBe(0);
  expect(completeStudy({},{...run,recorded:true})).toEqual({});
 });
 it('validates and merges results without counting imports twice',()=>{
  const result=normalizeStudyResults({mate:{solved:2,independent:9,lastSolved:100},unknown:{solved:999}});
  expect(result).toEqual({mate:{solved:2,independent:2,lastSolved:100}});
  expect(mergeStudyResults(result,result)).toEqual(result);
 });
});

it('starts every lesson with a legal side to move, not an already checked enemy king',()=>{
 for(const lesson of studies){const board=new Chess(lesson.fen);const blackKing=board.board().flat().find(p=>p?.type==='k'&&p.color==='b')!;expect(board.isAttacked(blackKing.square,'w'),lesson.id).toBe(false);}
});
it('does not allow the forked rook to capture the checking queen',()=>{
 const lesson=studies.find(l=>l.id==='queen-fork')!;const board=new Chess(lesson.fen);playUci(board,lesson.steps[0].move);
 expect(board.isCheck()).toBe(true);expect(board.moves({verbose:true}).some(m=>m.captured==='q')).toBe(false);
});
it('the pinned knight cannot recapture the bishop',()=>{
 const board=new Chess(studies.find(l=>l.id==='pinned-defender')!.fen);playUci(board,'c2g6');
 expect(board.moves({verbose:true}).some(m=>m.from==='e7'&&m.to==='g6')).toBe(false);
});
it('every accepted rook escape avoids attack',()=>{
 const lesson=studies.find(l=>l.id==='save-rook')!;
 for(const move of [lesson.steps[0].move,...lesson.steps[0].alternatives!]){const board=new Chess(lesson.fen);playUci(board,move);expect(board.isAttacked(move.slice(2,4) as import('chess.js').Square,'b'),move).toBe(false);}
});
it('preserves a real completion timestamp through normalization',()=>{
 const time=1793556000000;expect(normalizeStudyResults({mate:{solved:1,independent:1,lastSolved:time}}).mate.lastSolved).toBe(time);
});
