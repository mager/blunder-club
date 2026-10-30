import { chooseOpponentMove, type OpponentLevel } from './opponent';
self.onmessage = ({data}: MessageEvent<{id:number;fen:string;level:Exclude<OpponentLevel,'challenge'>}>) => {
  try { self.postMessage({id:data.id,move:chooseOpponentMove(data.fen,data.level)}); }
  catch { self.postMessage({id:data.id,error:'The opponent could not choose a move.'}); }
};
