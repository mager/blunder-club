import { describe, expect, it } from 'vitest';
import { createImportedGame, parseGamePgn } from '../src/imported-games';
import { normalizePublicProfile, projectProfile } from '../src/profile';
import { libraryHash, readLibraryRoute } from '../src/library-routes';

describe('public projection', () => {
  it('contains only the published fields and never account or import metadata', async () => {
    const game = { ...await createImportedGame(parseGamePgn('[Date "2026.11.04"]\n[White "Player"]\n[WhiteElo "360"]\n1. e4 {private note} *'), 'w'), favorite: true };
    const p = projectProfile('My games', [game], 1);
    expect(normalizePublicProfile(p)).toEqual(p);
    expect(Object.keys(p.games[0]).sort()).toEqual(['black','fen','id','moves','result','side','title','white']);
    expect(JSON.stringify(p)).not.toContain(game.id);
    expect(JSON.stringify(p)).not.toMatch(/private note|360|2026\.11\.04/);
    expect(normalizePublicProfile({ ...p, email: 'test@example.invalid' })).toBeNull();
    expect(normalizePublicProfile({ ...p, games: [{ ...p.games[0], moves: 'e2e5' }] })).toBeNull();
    expect(() => projectProfile('Name', [{ ...game, favorite: false }], 1)).toThrow('favorite');
    expect(() => projectProfile('Name', [{ ...game, deleted: true }], 1)).toThrow('favorite');
  });
});
describe('library routes', () => {
  const id = 'a'.repeat(64); const publicId = 'b'.repeat(32);
  it('round trips both private and public selected moves without private game data', () => {
    const route = { kind: 'private-game' as const, gameId: id, ply: 71 };
    expect(readLibraryRoute(libraryHash(route))).toEqual(route);
    const publicRoute = { kind: 'public-game' as const, profileId: publicId, gameId: publicId, ply: 0 };
    expect(readLibraryRoute(libraryHash(publicRoute))).toEqual(publicRoute);
    expect(readLibraryRoute('#/me')).toEqual({ kind: 'owner' });
    expect(readLibraryRoute('#/games')).toEqual({ kind: 'library' });
    expect(readLibraryRoute('#/play?moves=e4')).toBeNull();
  });
  it.each(['#/games/bad', '#/profile/nope', `#/games/${id}?ply=-1`, `#/games/${id}?ply=1001`, `#/games/${id}?ply=1.5`, `#/games/${id}?ply=1&ply=2`, '#/me?email=x', `#/profile/${publicId}/games/${id}`])('rejects %s', link => {
    expect(readLibraryRoute(link)?.kind).toBe('invalid');
  });
});
