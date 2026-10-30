import type { OpponentLevel } from './opponent';
export class PracticeOpponent {
  private worker = new Worker(new URL('./opponent.worker.ts',import.meta.url),{type:'module'});
  private sequence = 0;
  private pending = new Map<number,{resolve:(move:string)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
  constructor() {
    this.worker.onmessage = ({data}) => {
      const item = this.pending.get(data.id); if (!item) return;
      clearTimeout(item.timer); this.pending.delete(data.id);
      if (data.move) item.resolve(data.move); else item.reject(new Error(data.error || 'No legal reply found.'));
    };
    this.worker.onerror = () => this.clear('The opponent stopped. Reload the engine to continue.');
  }
  choose(fen:string,level:Exclude<OpponentLevel,'challenge'>):Promise<string> {
    const id = ++this.sequence;
    return new Promise((resolve,reject)=>{
      const timer = setTimeout(()=>{this.pending.delete(id);reject(new Error('The opponent took too long. Try again.'));},15000);
      this.pending.set(id,{resolve,reject,timer});
      this.worker.postMessage({id,fen,level});
    });
  }
  private clear(message:string) { for (const item of this.pending.values()) {clearTimeout(item.timer);item.reject(new Error(message));} this.pending.clear(); }
  dispose() {this.worker.terminate();this.clear('Opponent closed.');}
}
