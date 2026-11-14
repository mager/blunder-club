import { describe, expect, it } from 'vitest';
import { createImportedGame, parseGamePgn } from '../src/imported-games';
import { normalizePublicProfile, projectProfile, type ProfileDetails } from '../src/profile';
import { libraryHash, readLibraryRoute } from '../src/library-routes';

describe('public projection', () => {
  it('contains only the published fields and never account or import metadata', async () => {
    const game = { ...await createImportedGame(parseGamePgn('[Date "2026.11.04"]\n[White "Player"]\n[WhiteElo "360"]\n1. e4 {private note} *'), 'w'), favorite: true, publicId: 'f'.repeat(32) };
    const p = projectProfile('My games', [game], 1);
    expect(p).not.toHaveProperty('details');
    expect(normalizePublicProfile(p)).toEqual(p);
    expect(Object.keys(p.games[0]).sort()).toEqual(['black','fen','id','moves','result','side','title','white']);
    expect(JSON.stringify(p)).not.toContain(game.id);
    expect(JSON.stringify(p)).not.toMatch(/private note|360|2026\.11\.04/);
    expect(normalizePublicProfile({ ...p, email: 'test@example.invalid' })).toBeNull();
    expect(normalizePublicProfile({ ...p, games: [{ ...p.games[0], moves: 'e2e5' }] })).toBeNull();
    expect(() => projectProfile('Name', [{ ...game, favorite: false }], 1)).toThrow('favorite');
    expect(() => projectProfile('Name', [{ ...game, deleted: true }], 1)).toThrow('favorite');
  });

  const selected = 'a'.repeat(32);
  const unselected = 'b'.repeat(32);
  const favorite = async () => ({ ...await createImportedGame(parseGamePgn('1. e4 *'), 'w'), favorite: true, publicId: selected });
  const details: ProfileDetails = { bio: 'I play for fun', avatar: 'r', spotlight: selected, stories: { [selected]: 'My first game' } };

  it('round trips trimmed identity and a story at the 160-character limit', async () => {
    const story = '♘'.repeat(159) + '🎉';
    const p = projectProfile('Name', [await favorite()], 1, { ...details, bio: `  ${details.bio}\u00a0`, stories: { [selected]: ` ${story} ` } });
    expect(p.details).toEqual({ ...details, stories: { [selected]: story } });
    expect(normalizePublicProfile(p)).toEqual(p);
  });

  it('accepts an avatar without a bio, stories, or spotlight', async () => {
    const p = projectProfile('Name', [await favorite()], 1, { bio: '', avatar: 'q', spotlight: null, stories: {} });
    expect(normalizePublicProfile(p)?.details).toEqual({ bio: '', avatar: 'q', spotlight: null, stories: {} });
  });

  it.each([
    ['an oversized bio', { bio: 'x'.repeat(161) }],
    ['an oversized story', { stories: { [selected]: '🎉'.repeat(161) } }],
    ['a leading control in the bio', { bio: '\tHello' }],
    ['a C1 control in a story', { stories: { [selected]: 'a\u0085b' } }],
    ['an unsupported avatar', { avatar: 'p' }],
    ['an unselected spotlight', { spotlight: unselected }],
    ['an unselected story', { stories: { [unselected]: 'A private story' } }],
    ['an unknown detail field', { email: 'private@example.invalid' }],
    ['a non-text story', { stories: { [selected]: { text: 'My first game' } } }],
    ['an array of stories', { stories: [] }],
  ])('rejects %s in both projection and reads', async (_label, invalid) => {
    const game = await favorite();
    const broken = { ...details, ...invalid };
    const old = projectProfile('Name', [game], 1);
    expect(() => projectProfile('Name', [game], 1, broken as ProfileDetails)).toThrow();
    expect(normalizePublicProfile({ ...old, details: broken })).toBeNull();
  });

  it('rejects a public snapshot that has untrimmed details', async () => {
    const old = projectProfile('Name', [await favorite()], 1);
    expect(normalizePublicProfile({ ...old, details: { ...details, bio: ' I play for fun' } })).toBeNull();
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
