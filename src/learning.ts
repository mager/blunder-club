export { italian, openingSteps } from './openings';
export { classifyMistake } from './rules';

export const skills = [
  { id: 'center', name: 'Own the center', nickname: 'Claim your turf', text: 'Central pawns and pieces control useful squares. Space gives you choices.', related: ['development', 'safety'], lesson: 'italian', x: 15, y: 24 },
  { id: 'development', name: 'Develop your pieces', nickname: 'Everybody works', text: 'Bring out knights and bishops. Give each piece a job before you move one piece again.', related: ['center', 'king', 'tactics'], lesson: 'italian', x: 50, y: 24 },
  { id: 'king', name: 'Keep your king safe', nickname: 'Get home safe', text: 'Castle when it is safe. Keep a pawn shield, and watch the lines that lead to your king.', related: ['development', 'threats'], lesson: 'mate', x: 85, y: 24 },
  { id: 'threats', name: 'Read their last move', nickname: 'What changed?', text: 'After every move, ask: what does that piece attack now? Check your king, queen, and loose pieces.', related: ['king', 'safety'], lesson: 'hanging', x: 85, y: 76 },
  { id: 'safety', name: 'Keep your pieces', nickname: 'No free lunch', text: 'Before moving, check whether the destination is attacked and whether the piece you leave behind is defended.', related: ['threats', 'center', 'tactics'], lesson: 'hanging', x: 50, y: 76 },
  { id: 'tactics', name: 'Spot tactical chances', nickname: 'The two-for-one', text: 'Look for safe captures first. Then look for forks: one piece attacking two targets. A check can give you time to take the second target.', related: ['safety', 'development'], lesson: 'fork', x: 15, y: 76 },
];
export const connections = [['center', 'development'], ['development', 'king'], ['king', 'threats'], ['threats', 'safety'], ['safety', 'tactics'], ['center', 'safety'], ['development', 'tactics']];
