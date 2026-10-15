// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { DisplayOrderPipe, SortByPipe } from './sort-by-pipe';

// Pure pipes: instantiated directly, as the Angular pipe-testing guide does.
describe('SortByPipe', () => {
  /**
   * Verifies: an array of objects sorts by the named column in the given direction, as a new array, leaving the input as it was.
   * Interacts with: SortByPipe.transform (lodash orderBy branch).
   * Data: names Carol, alice, Bob; per row, the direction and the expected order (orderBy compares case-sensitively).
   */
  it.each([
    { order: 'asc', names: ['Bob', 'Carol', 'alice'] },
    { order: 'desc', names: ['alice', 'Carol', 'Bob'] },
  ])('sorts objects by a column, $order', ({ order, names }) => {
    const people = [{ name: 'Carol' }, { name: 'alice' }, { name: 'Bob' }];

    const sorted = new SortByPipe().transform(people, order, 'name');

    expect(sorted.map((p) => p.name)).toEqual(names);
    expect(sorted).not.toBe(people);
    expect(people.map((p) => p.name)).toEqual(['Carol', 'alice', 'Bob']);
  });

  /**
   * Verifies: a plain array sorts ascending for 'asc' and descending for any other order.
   * Interacts with: SortByPipe.transform (1-D branch).
   * Data: ['pear', 'apple', 'fig']; per row, the order.
   */
  it.each([
    { order: 'asc', expected: ['apple', 'fig', 'pear'] },
    { order: 'desc', expected: ['pear', 'fig', 'apple'] },
    { order: 'down', expected: ['pear', 'fig', 'apple'] },
  ])('sorts plain values for order $order', ({ order, expected }) => {
    expect(new SortByPipe().transform(['pear', 'apple', 'fig'], order)).toEqual(
      expected,
    );
  });

  /**
   * Verifies: with no order, or a missing array, the input comes back as it is.
   * Interacts with: SortByPipe.transform guard.
   * Data: per row, the value and the order ('' or undefined).
   */
  it.each([
    { kind: 'an empty order', value: [3, 1, 2], order: '' },
    { kind: 'an undefined order', value: [3, 1, 2], order: undefined },
    { kind: 'an undefined array', value: undefined, order: 'asc' },
    { kind: 'a null array', value: null, order: 'asc' },
  ])('returns the input for $kind', ({ value, order }) => {
    const pipe = new SortByPipe();

    expect(pipe.transform(value as unknown as number[], order)).toBe(value);
  });

  /**
   * Verifies: an empty or one-item array comes back as the same array, even with a column.
   * Interacts with: SortByPipe.transform length guard.
   * Data: per row, [] or one object, sorted by name.
   */
  it.each([
    { kind: 'an empty array', value: [] },
    { kind: 'one item', value: [{ name: 'Only' }] },
  ])('returns $kind unchanged', ({ value }) => {
    expect(new SortByPipe().transform(value, 'desc', 'name')).toBe(value);
  });

  /**
   * Verifies: plain numbers sort by their string form, so multi-digit values land out of numeric order (current behavior).
   * Interacts with: SortByPipe.transform (1-D branch, Array.prototype.sort with no comparator).
   * Data: [10, 2, 1] ascending.
   */
  it('sorts plain numbers by their string form', () => {
    // Current behavior; see agent-docs/ui-test-bugs/gallery.ui.md.
    expect(new SortByPipe().transform([10, 2, 1], 'asc')).toEqual([1, 10, 2]);
  });

  /**
   * Verifies: sorting a plain array reorders the input array itself and returns it (current behavior).
   * Interacts with: SortByPipe.transform (1-D branch).
   * Data: ['b', 'c', 'a']; per row, the order.
   */
  it.each([
    { order: 'asc', expected: ['a', 'b', 'c'] },
    { order: 'desc', expected: ['c', 'b', 'a'] },
  ])('sorts plain values in place, $order', ({ order, expected }) => {
    const values = ['b', 'c', 'a'];

    const result = new SortByPipe().transform(values, order);

    // Current behavior; see agent-docs/ui-test-bugs/gallery.ui.md.
    expect(result).toBe(values);
    expect(values).toEqual(expected);
  });
});

describe('DisplayOrderPipe', () => {
  /**
   * Verifies: items come back ordered by displayOrder as a new array, and the input array is left untouched.
   * Interacts with: DisplayOrderPipe.transform.
   * Data: three items with display orders 3, 1, 2.
   */
  it('orders by displayOrder without changing the input', () => {
    const items = [
      { id: 'c', displayOrder: 3 },
      { id: 'a', displayOrder: 1 },
      { id: 'b', displayOrder: 2 },
    ];

    const sorted = new DisplayOrderPipe().transform(items);

    expect(sorted.map((x) => x.id)).toEqual(['a', 'b', 'c']);
    expect(sorted).not.toBe(items);
    expect(items.map((x) => x.id)).toEqual(['c', 'a', 'b']);
  });

  /**
   * Verifies: a missing, empty or one-item input is returned as it is.
   * Interacts with: DisplayOrderPipe.transform guard.
   * Data: per row, undefined, [] or one item.
   */
  it.each([
    { kind: 'undefined', value: undefined as unknown as unknown[] },
    { kind: 'an empty array', value: [] },
    { kind: 'one item', value: [{ displayOrder: 5 }] },
  ])('passes through $kind', ({ value }) => {
    expect(new DisplayOrderPipe().transform(value)).toBe(value);
  });
});
