import { Chess } from 'chess.js';
import type { LessonStep, StudyLesson } from './lesson-types';
import { studies } from './curriculum';
export type StudyResult={solved:number;independent:number;lastSolved:number};
export type StudyResults=Record<string,StudyResult>;
export type StudyRun={lessonId:string;moves:string[];helped:boolean;mistakes:number;recorded:boolean};
export function acceptsStep(step:LessonStep,fen:string,uci:string):boolean {
  const board=new Chess(fen);
  try {board.move({from:uci.slice(0,2),to:uci.slice(2,4),...(uci[4]?{promotion:uci[4]}:{})});}catch{return false;}
  return uci===step.move || !!step.alternatives?.includes(uci) || (step.goal==='mate' && board.isCheckmate());
}
export function studyPosition(lesson:StudyLesson,moves:string[]) {
  const board=new Chess(lesson.fen);let ply=0;
  try {
    for(let index=0;index<lesson.steps.length;index++) {
      const step=lesson.steps[index];
      if(ply===moves.length)return {index,complete:false,valid:true};
      const fen=board.fen();const move=board.move(moves[ply++]);
      if(!acceptsStep(step,fen,`${move.from}${move.to}${move.promotion || ''}`))return {index,complete:false,valid:false};
      if(step.reply) {
        if(ply===moves.length)return {index,complete:false,valid:true,pendingReply:step.reply};
        const reply=board.move(moves[ply++]);
        if(`${reply.from}${reply.to}${reply.promotion || ''}`!==step.reply)return {index,complete:false,valid:false};
      }
    }
    return {index:lesson.steps.length,complete:ply===moves.length,valid:ply===moves.length};
  }catch{return {index:0,complete:false,valid:false};}
}
export function normalizeStudyResults(input:unknown):StudyResults {
  if(!input || typeof input!=='object')return {};
  const result:StudyResults={};
  for(const lesson of studies) {
    const value=(input as StudyResults)[lesson.id];if(!value || typeof value!=='object')continue;
    const number=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=0?Math.min(1000000,Number(n)):0;
    const solved=number(value.solved);result[lesson.id]={solved,independent:Math.min(solved,number(value.independent)),lastSolved:Number.isSafeInteger(value.lastSolved) && value.lastSolved>=0 ? value.lastSolved : 0};
  }
  return result;
}
export function completeStudy(results:StudyResults,run:StudyRun,now=Date.now()):StudyResults {
  if(run.recorded)return results;
  const previous=results[run.lessonId] || {solved:0,independent:0,lastSolved:0};
  return {...results,[run.lessonId]:{solved:previous.solved+1,independent:previous.independent+Number(!run.helped && !run.mistakes),lastSolved:now}};
}
export function mergeStudyResults(a:StudyResults={},b:StudyResults={}):StudyResults {
  const result={...a};for(const [id,value] of Object.entries(b)) {const old=result[id];result[id]={solved:Math.max(old?.solved || 0,value.solved),independent:Math.max(old?.independent || 0,value.independent),lastSolved:Math.max(old?.lastSolved || 0,value.lastSolved)};}return result;
}
