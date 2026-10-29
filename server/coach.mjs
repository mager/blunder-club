import { Chess } from 'chess.js';

export const skillDescriptions = {
  center: 'Occupying or controlling central squares with pawns and pieces.',
  development: 'Activating knights and bishops instead of repeated or early queen moves.',
  king: 'King safety, castling, back-rank threats, and forced checkmate.',
  threats: 'Reading the opponent’s threat before making a plan.',
  safety: 'Avoiding lost or undefended pieces and checking capture sequences.',
  tactics: 'Spotting free captures, forks, and other tactical chances.',
};
export function validateEvidence(body) {
  if (!body || typeof body !== 'object' || !Array.isArray(body.moments) || body.moments.length > 8) throw new Error('Invalid evidence');
  const moments = body.moments.map(item => {
    if (!item || typeof item.fen !== 'string' || item.fen.length > 100 || typeof item.move !== 'string' || item.move.length > 10 || typeof item.best !== 'string' || item.best.length > 10 || typeof item.line !== 'string' || item.line.length > 160 || !Number.isFinite(item.loss) || item.loss < 0 || item.loss > 200000 || !Object.hasOwn(skillDescriptions, item.skill)) throw new Error('Invalid moment');
    const game = new Chess(item.fen);
    game.move(item.move); // Reject impossible evidence before making a paid request.
    return { fen: item.fen, move: item.move, best: item.best, engineReplyLine: item.line, estimatedCentipawnLoss: item.loss, localRuleSkill: item.skill };
  });
  const history = {};
  for (const id of Object.keys(skillDescriptions)) {
    const count = body.history?.[id] ?? 0;
    if (!Number.isSafeInteger(count) || count < 0 || count > 10000) throw new Error('Invalid history');
    history[id] = count;
  }
  return { learner: { approximateRating: 350, goal: 'Understand recurring mistakes, openings, and strategy through practice.' }, moments, previousSkillCounts: history };
}
export async function chooseLesson(evidence, apiKey, fetcher = fetch) {
  const response = await fetcher('https://api.typesafe.ai/v1/systemone', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
    body: JSON.stringify({
      model: 'jev-latest', state: evidence,
      questions: {
        next_skill: { type: 'choice', instructions: 'Choose the single most useful next skill for this beginner. Use the supplied engine evidence and recurring mistake counts. Do not independently evaluate chess positions or treat a club nickname as a standard chess term. Prefer concrete piece and king safety over subtle strategy. Choose uncertain if there is no adequate evidence.', criteria: { ...skillDescriptions, uncertain: 'Insufficient or contradictory evidence for a specific skill.' } },
        teaching_action: { type: 'choice', instructions: 'Select how to teach this next. Repeated errors favor replaying the exact position. A new forcing line may need the opponent reply demonstrated. Opening development issues may benefit from guided opening practice.', criteria: { retry_position: 'Retry the same position without revealing the answer first.', show_reply: 'Show the engine’s concrete reply, then let the learner retry.', opening_practice: 'Use the guided opening to learn the purpose of development and king safety.' } },
      },
    }),
  });
  if (!response.ok) throw new Error(`Jev returned HTTP ${response.status}`);
  const result = await response.json();
  const choice = result?.answers?.next_skill;
  const action = result?.answers?.teaching_action;
  if (choice?.type !== 'choice' || !Object.hasOwn(skillDescriptions, choice.choice) || !Number.isFinite(choice.confidence) || choice.confidence < .65 || choice.confidence > 1) return { source: 'local', reason: 'low_confidence' };
  const allowedActions = ['retry_position', 'show_reply', 'opening_practice'];
  return { source: 'jev', skill: choice.choice, confidence: choice.confidence, action: action?.type === 'choice' && action.confidence >= .65 && allowedActions.includes(action.choice) ? action.choice : 'retry_position', model: typeof result.model === 'string' ? result.model : 'jev-latest' };
}

/** Local development middleware. Keys stay on this side of the Vite boundary. */
export function coachMiddleware(getKey) {
  let busy = false; let lastRequest = 0;
  const cache = new Map();
  const clients = new Map();
  return async (req, res, next) => {
    if (req.url !== '/api/coach') return next();
    const send = (status, payload) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(payload)); };
    if (req.method === 'GET') return send(200, { available: Boolean(getKey()), provider: 'jev' });
    if (req.method !== 'POST') return send(405, { error: 'Method not allowed' });
    if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'JSON required' });
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`) return send(403, { error: 'Origin not allowed' });
    const key = getKey();
    if (!key) return send(200, { source: 'local', reason: 'not_configured' });
    if (busy || Date.now() - lastRequest < 1000) return send(429, { source: 'local', reason: 'rate_limited' });
    let raw = ''; let oversized = false;
    try {
      if (req.body !== undefined) raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      else for await (const chunk of req) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 20000) { oversized = true; break; }
      }
      if (Buffer.byteLength(raw) > 20000) oversized = true;
      if (oversized) return send(413, { error: 'Evidence too large' });
      let evidence;
      try { evidence = validateEvidence(JSON.parse(raw)); } catch { return send(400, { error: 'Invalid chess evidence' }); }
      const fingerprint = JSON.stringify(evidence);
      const cached = cache.get(fingerprint);
      if (cached && Date.now() - cached.at < 3600000) return send(200, cached.value);
      const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0];
      const recent = (clients.get(ip) || []).filter(time => Date.now() - time < 60000);
      if (recent.length >= 6) return send(429, { source: 'local', reason: 'rate_limited' });
      if (clients.size > 1000) clients.clear();
      clients.set(ip, [...recent, Date.now()]);
      busy = true; lastRequest = Date.now();
      try { const value = await chooseLesson(evidence, key); if (cache.size >= 100) cache.delete(cache.keys().next().value); cache.set(fingerprint, { at: Date.now(), value }); send(200, value); }
      catch { send(200, { source: 'local', reason: 'provider_unavailable' }); }
      finally { busy = false; }
    } catch { send(400, { error: 'Could not read request' }); }
  };
}
