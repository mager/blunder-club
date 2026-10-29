export interface Line { move: string; pv: string[]; score: number; mate?: number; depth: number; }

/** Scores are always from the side-to-move's point of view, in centipawns. */
export function parseInfo(text: string): { rank: number; line: Line } | null {
  const match = text.match(/\bscore (cp|mate) (-?\d+)/);
  const pv = text.match(/\bpv (.+)$/);
  if (!match || !pv || /\b(upperbound|lowerbound)\b/.test(text)) return null;
  const value = Number(match[2]);
  const moves = pv[1].trim().split(/\s+/);
  return {
    rank: Number(text.match(/\bmultipv (\d+)/)?.[1] ?? 1),
    line: {
      move: moves[0], pv: moves,
      score: match[1] === 'cp' ? value : Math.sign(value || -1) * (100000 - Math.abs(value) * 100),
      ...(match[1] === 'mate' ? { mate: value } : {}),
      depth: Number(text.match(/\bdepth (\d+)/)?.[1] ?? 0),
    },
  };
}

export class ChessEngine {
  private worker: Worker;
  private ready: Promise<void>;
  private tail: Promise<unknown> = Promise.resolve();
  private disposed = false;
  private listeners = new Set<(line: string) => void>();
  private failures = new Set<(error: Error) => void>();
  constructor() {
    this.worker = new Worker(`${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`);
    this.worker.onmessage = ({ data }) => String(data).split('\n').forEach(line => this.listeners.forEach(fn => fn(line)));
    this.worker.onerror = () => this.fail(new Error('The chess engine did not load. Reload it to try again.'));
    this.ready = new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => this.fail(new Error('The chess engine took too long to load.')), 20000);
      const cleanup = () => { clearTimeout(timer); this.listeners.delete(onLine); this.failures.delete(onError); };
      const onError = (e: Error) => { cleanup(); reject(e); };
      const onLine = (line: string) => {
        if (line === 'uciok') {
          this.worker.postMessage('setoption name Hash value 16');
          this.worker.postMessage('isready');
        }
        if (line === 'readyok') { cleanup(); resolve(); }
      };
      this.listeners.add(onLine); this.failures.add(onError);
      this.worker.postMessage('uci');
    });
    // The app may dispose a worker before the first request starts.
    void this.ready.catch(() => {});
  }
  private fail(error: Error) { this.failures.forEach(fn => fn(error)); this.disposed = true; this.worker.terminate(); }
  analyze(fen: string, count = 3): Promise<Line[]> {
    const request = this.tail.then(async () => {
      await this.ready;
      if (this.disposed) throw new Error('The engine is offline. Reload it to continue.');
      return new Promise<Line[]>((resolve, reject) => {
        const lines = new Map<number, Line>();
        const timer = window.setTimeout(() => this.fail(new Error('Analysis timed out. Reload the engine to continue.')), 15000);
        const cleanup = () => { clearTimeout(timer); this.listeners.delete(onLine); this.failures.delete(onError); };
        const onError = (e: Error) => { cleanup(); reject(e); };
        const onLine = (text: string) => {
          const result = parseInfo(text);
          if (result) lines.set(result.rank, result.line);
          if (text.startsWith('bestmove')) {
            cleanup();
            const result = [...lines].sort(([a], [b]) => a - b).map(([, line]) => line);
            if (result.length) resolve(result);
            else reject(new Error('No analysis was returned. Reload the engine to continue.'));
          }
        };
        this.listeners.add(onLine); this.failures.add(onError);
        this.worker.postMessage(`setoption name MultiPV value ${count}`);
        this.worker.postMessage(`position fen ${fen}`);
        this.worker.postMessage('go depth 12 movetime 650');
      });
    });
    this.tail = request.catch(() => {});
    return request;
  }
  dispose() { this.fail(new Error('Engine closed.')); }
}
