import { coachMiddleware } from '../server/coach.mjs';
const handler = coachMiddleware(() => process.env.TYPESAFE_API_KEY);
export default function coach(req, res) {
  req.url = '/api/coach';
  return handler(req, res, () => { res.statusCode = 404; res.end(); });
}
