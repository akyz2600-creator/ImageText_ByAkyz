import { describe, expect, it } from 'vitest';
import { isUserFontFamily, makeFamilyName, pickPrunable, sortByRecent } from './fonts';

describe('sortByRecent', () => {
  it('ordena de más a menos reciente sin mutar la entrada', () => {
    const input = [
      { id: 'a', lastUsedAt: 1 },
      { id: 'b', lastUsedAt: 3 },
      { id: 'c', lastUsedAt: 2 },
    ];
    expect(sortByRecent(input).map((f) => f.id)).toEqual(['b', 'c', 'a']);
    expect(input.map((f) => f.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('pickPrunable', () => {
  it('devuelve los más antiguos que exceden el máximo', () => {
    const list = [
      { id: 'a', lastUsedAt: 1 },
      { id: 'b', lastUsedAt: 4 },
      { id: 'c', lastUsedAt: 2 },
      { id: 'd', lastUsedAt: 3 },
    ];
    expect(pickPrunable(list, 2)).toEqual(['c', 'a']);
  });
  it('no devuelve nada si no se supera el máximo', () => {
    expect(pickPrunable([{ id: 'a', lastUsedAt: 1 }], 5)).toEqual([]);
  });
});

describe('familia de fuente propia', () => {
  it('genera un nombre sin espacios reconocible', () => {
    const f = makeFamilyName('abc123');
    expect(f).toBe('userfont-abc123');
    expect(isUserFontFamily(f)).toBe(true);
    expect(isUserFontFamily('sans-serif')).toBe(false);
  });
});
