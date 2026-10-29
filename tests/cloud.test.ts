import {beforeEach,afterEach,describe,expect,it,vi} from 'vitest';
import {emptyProgress} from '../src/progress';
const fake=vi.hoisted(()=>({listener:(_user:any)=>{},current:null as any,documents:new Map<string,any>(),fail:false}));
vi.mock('firebase/app',()=>({initializeApp:()=>({})}));
vi.mock('firebase/auth',()=>({
 getAuth:()=>({}),GoogleAuthProvider:class{setCustomParameters(){}},
 onAuthStateChanged:(_auth:any,listener:any)=>{fake.listener=listener;listener(fake.current);return ()=>{};},
 signInWithPopup:vi.fn(),signOut:async()=>{fake.listener(null);},
}));
vi.mock('firebase/firestore',()=>({
 getFirestore:()=>({}),doc:(_db:any,...path:string[])=>path.join('/'),serverTimestamp:()=>123,
 runTransaction:async(_db:any,work:any)=>{
  if(fake.fail)throw new Error('network');
  return work({get:async(path:string)=>({exists:()=>fake.documents.has(path),data:()=>fake.documents.get(path)}),set:(path:string,data:any)=>fake.documents.set(path,data)});
 },
}));
let local:Map<string,string>;
beforeEach(()=>{
 vi.useFakeTimers();fake.current=null;fake.documents.clear();fake.fail=false;local=new Map();
 vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn()});
 vi.stubGlobal('localStorage',{getItem:(key:string)=>local.get(key)??null,setItem:(key:string,value:string)=>local.set(key,value),removeItem:(key:string)=>local.delete(key)});
 vi.stubEnv('VITE_FIREBASE_AUTH_ENABLED','true');
 for(const key of ['API_KEY','AUTH_DOMAIN','PROJECT_ID','APP_ID'])vi.stubEnv(`VITE_FIREBASE_${key}`,'test');
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.unstubAllEnvs();});
const settle=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
async function setup(){
 const {createProgressSync}=await import('../src/cloud');
 const callbacks={apply:vi.fn(),account:vi.fn(),status:vi.fn(),error:vi.fn()};
 const sync=createProgressSync(callbacks);sync.start();await settle();return {sync,callbacks};
}
describe('account progress boundary',()=>{
 it('imports guest progress only after a successful account write',async()=>{
  local.set('blunder-club-v1',JSON.stringify({...emptyProgress(),moves:['e4'],updatedAt:10}));
  const {sync,callbacks}=await setup();fake.listener({uid:'alice'});await settle();
  expect(JSON.parse(fake.documents.get('users/alice/progress/current').payload).moves).toEqual(['e4']);
  expect(local.has('blunder-club-v1')).toBe(false);expect(callbacks.status).toHaveBeenLastCalledWith('saved');sync.dispose();
 });
 it('does not expose account progress to the next guest or account',async()=>{
  fake.current={uid:'alice'};fake.documents.set('users/alice/progress/current',{revision:1,payload:JSON.stringify({...emptyProgress(),moves:['d4'],updatedAt:10})});
  const {sync,callbacks}=await setup();await sync.logout();await settle();
  expect(callbacks.apply.mock.lastCall?.[0].moves).toEqual([]);
  fake.listener({uid:'bob'});await settle();expect(callbacks.apply.mock.lastCall?.[0].moves).toEqual([]);sync.dispose();
 });
 it('retains guest data when the account import fails',async()=>{
  local.set('blunder-club-v1',JSON.stringify({...emptyProgress(),moves:['e4']}));fake.fail=true;fake.current={uid:'alice'};
  const {sync,callbacks}=await setup();expect(local.has('blunder-club-v1')).toBe(true);expect(callbacks.status).toHaveBeenLastCalledWith('offline');sync.dispose();
 });
 it('keeps a local copy and stops writes when another device changes the revision',async()=>{
  fake.current={uid:'alice'};const {sync,callbacks}=await setup();
  const path='users/alice/progress/current';fake.documents.set(path,{revision:8,payload:JSON.stringify(emptyProgress())});
  sync.save({...emptyProgress(),moves:['e4'],updatedAt:10});await vi.runAllTimersAsync();await settle();
  expect(fake.documents.get(path).revision).toBe(8);expect(callbacks.status).toHaveBeenLastCalledWith('conflict');
  expect(JSON.parse(local.get('blunder-school-user-alice')!).moves).toEqual(['e4']);sync.dispose();
 });
});
