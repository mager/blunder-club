import { validGameId, validPublicId } from './imported-games';
export type LibraryRoute =
  | { kind: 'library' | 'owner' }
  | { kind: 'private-game'; gameId: string; ply?: number }
  | { kind: 'public-profile'; profileId: string }
  | { kind: 'public-game'; profileId: string; gameId: string; ply?: number }
  | { kind: 'invalid'; error: string };

export function isLibraryHash(hash: string) { return /^#\/(me|games|profile)(?:[/?]|$)/.test(hash); }
export function readLibraryRoute(hash: string): LibraryRoute | null {
  if (!isLibraryHash(hash)) return null;
  const invalid: LibraryRoute = { kind: 'invalid', error: 'That game or profile link is not valid. Your saved game is still available.' };
  if (hash.length > 500) return invalid;
  try {
    const url = new URL(hash.slice(1), 'https://nextmove.invalid');
    const parts = url.pathname.split('/').filter(Boolean);
    const raw = url.searchParams.get('ply');
    if ([...url.searchParams.keys()].some(k => k !== 'ply') || url.searchParams.getAll('ply').length > 1 || (raw !== null && !/^\d{1,4}$/.test(raw))) return invalid;
    const ply = raw === null ? undefined : Number(raw);
    if (ply !== undefined && ply > 1000) return invalid;
    if (parts.length === 1 && raw === null) {
      if (parts[0] === 'me') return { kind: 'owner' };
      if (parts[0] === 'games') return { kind: 'library' };
    }
    if (parts[0] === 'games' && parts.length === 2 && validGameId(parts[1])) return { kind: 'private-game', gameId: parts[1], ply };
    if (parts[0] === 'profile' && validPublicId(parts[1])) {
      if (parts.length === 2 && raw === null) return { kind: 'public-profile', profileId: parts[1] };
      if (parts.length === 4 && parts[2] === 'games' && validPublicId(parts[3])) return { kind: 'public-game', profileId: parts[1], gameId: parts[3], ply };
    }
    return invalid;
  } catch { return invalid; }
}

export function libraryHash(route: Exclude<LibraryRoute, { kind: 'invalid' }>): string {
  if (route.kind === 'library') return '#/games';
  if (route.kind === 'owner') return '#/me';
  if (route.kind === 'public-profile') return `#/profile/${route.profileId}`;
  if (route.kind === 'private-game') return `#/games/${route.gameId}${route.ply === undefined ? '' : `?ply=${route.ply}`}`;
  if (route.kind === 'public-game') return `#/profile/${route.profileId}/games/${route.gameId}${route.ply === undefined ? '' : `?ply=${route.ply}`}`;
  return '#/games';
}
