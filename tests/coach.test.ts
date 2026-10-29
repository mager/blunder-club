import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error Server-only native JavaScript module.
import { chooseLesson, validateEvidence, coachMiddleware } from '../server/coach.mjs';
const evidence = { moments:[{fen:'rnbqkbnr/pppp1ppp/8/4p3/8/5P2/PPPPP1PP/RNBQKBNR w KQkq e6 0 2',move:'g4',best:'e4',line:'Qh4#',loss:99900,skill:'king'}],history:{king:2} };
const response = (choice = 'king', confidence = .9) => async () => new Response(JSON.stringify({model:'jev-test',answers:{next_skill:{type:'choice',choice,confidence},teaching_action:{type:'choice',choice:'show_reply',confidence:.9}}}),{status:200});
describe('Jev decision boundary',()=>{
 it('sends a bounded legal position and skill history',()=>{expect(validateEvidence(evidence).moments[0].move).toBe('g4');});
 it('rejects illegal moves before a paid request',()=>{expect(()=>validateEvidence({...evidence,moments:[{...evidence.moments[0],move:'Qh8'}]})).toThrow();});
 it('rejects non-numeric scores and unbounded history',()=>{expect(()=>validateEvidence({...evidence,moments:[{...evidence.moments[0],loss:Infinity}]})).toThrow();expect(()=>validateEvidence({...evidence,history:{king:-1}})).toThrow();});
 it('accepts a valid confident choice',async()=>{expect(await chooseLesson({},'test-only',response())).toMatchObject({source:'jev',skill:'king',action:'show_reply'});});
 it('falls back for uncertainty, missing confidence, and out-of-list choices',async()=>{
   expect(await chooseLesson({},'test-only',response('king',.4))).toMatchObject({source:'local'});
   expect(await chooseLesson({},'test-only',response('invented',.99))).toMatchObject({source:'local'});
   expect(await chooseLesson({},'test-only',response('king',NaN))).toMatchObject({source:'local'});
 });
 it('does not treat provider failures as successful analysis',async()=>{await expect(chooseLesson({},'test-only',async()=>new Response('',{status:429}))).rejects.toThrow('429');});
});


describe('hosted coach endpoint', () => {
 const invoke = async (request: object) => {
   let status = 0; let payload: any;
   const res = { writeHead(code: number) { status = code; }, end(body: string) { payload = JSON.parse(body); } };
   await coachMiddleware(() => 'test-only')(request, res, () => { throw new Error('unexpected route'); });
   return {status, payload};
 };
 const base = {url:'/api/coach',method:'POST',headers:{'content-type':'application/json',host:'example.test',origin:'https://example.test'}};
 it('accepts the parsed JSON body supplied by Vercel', async () => {
   const fetcher = vi.fn(response()); vi.stubGlobal('fetch', fetcher);
   try {
     const result = await invoke({...base,body:evidence});
     expect(result.status).toBe(200); expect(result.payload.source).toBe('jev');
     expect(fetcher).toHaveBeenCalledOnce();
   } finally { vi.unstubAllGlobals(); }
 });
 it('rejects foreign origins and oversized parsed bodies', async () => {
   const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
   try {
     expect((await invoke({...base,headers:{...base.headers,origin:'https://foreign.test'},body:evidence})).status).toBe(403);
     expect((await invoke({...base,body:{...evidence,extra:'x'.repeat(21000)}})).status).toBe(413);
     expect(fetcher).not.toHaveBeenCalled();
   } finally { vi.unstubAllGlobals(); }
 });
});
