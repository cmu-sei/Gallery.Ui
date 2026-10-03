// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, beforeEach } from 'vitest';
import { UIDataService, UIState } from './ui-data.service';

function saved(): UIState {
  return JSON.parse(localStorage.getItem('uiState') ?? 'null');
}

describe('UIDataService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /**
   * Verifies: the service starts from defaults when nothing is saved.
   * Interacts with: localStorage (empty).
   * Data: none.
   */
  it('starts from empty defaults', () => {
    const service = new UIDataService();

    expect(service.getTheme()).toBe('');
    expect(service.getCollection()).toBe('');
    expect(service.getExhibit()).toBe('');
    expect(service.isItemExpanded('x')).toBe(false);
  });

  /**
   * Verifies: a saved uiState is merged over the defaults on construction.
   * Interacts with: localStorage 'uiState'.
   * Data: a saved state with a theme, an exhibit and one expanded item.
   */
  it('restores the saved state', () => {
    localStorage.setItem(
      'uiState',
      JSON.stringify({
        selectedTheme: 'dark-theme',
        selectedExhibit: 'e1',
        expandedItems: ['row-1'],
      }),
    );

    const service = new UIDataService();

    expect(service.getTheme()).toBe('dark-theme');
    expect(service.getExhibit()).toBe('e1');
    expect(service.isItemExpanded('row-1')).toBe(true);
    expect(service.getSection('e1')).toBeUndefined();
  });

  /**
   * Verifies: a corrupt uiState entry makes the constructor throw instead of falling back to defaults.
   * Interacts with: localStorage 'uiState'.
   * Data: a non-JSON string.
   */
  it('throws on a corrupt saved state', () => {
    localStorage.setItem('uiState', 'not json');

    expect(() => new UIDataService()).toThrow(SyntaxError);
  });

  /**
   * Verifies: expanding and collapsing items is tracked and persisted.
   * Interacts with: localStorage 'uiState'.
   * Data: rows a and b expanded, then a collapsed.
   */
  it('tracks expanded items and persists them', () => {
    const service = new UIDataService();

    service.setItemExpanded('a');
    service.setItemExpanded('b');
    service.setItemCollapsed('a');

    expect(service.isItemExpanded('a')).toBe(false);
    expect(service.isItemExpanded('b')).toBe(true);
    expect(saved().expandedItems).toEqual(['b']);
  });

  /**
   * Verifies: collapsing an item that is not expanded removes the last expanded item instead.
   * Interacts with: localStorage 'uiState'.
   * Data: rows a and b expanded; never-expanded row z collapsed.
   */
  it('collapsing an unknown item collapses the last expanded one', () => {
    const service = new UIDataService();
    service.setItemExpanded('a');
    service.setItemExpanded('b');

    service.setItemCollapsed('z');

    expect(saved().expandedItems).toEqual(['a']);
  });

  /**
   * Verifies: an empty collection or exhibit id is stored as the 'blank' sentinel.
   * Interacts with: localStorage 'uiState'.
   * Data: '' for both, then real ids.
   */
  it("stores 'blank' for an empty collection or exhibit selection", () => {
    const service = new UIDataService();

    service.setCollection('');
    service.setExhibit('');
    expect(service.getCollection()).toBe('blank');
    expect(service.getExhibit()).toBe('blank');

    service.setCollection('c1');
    service.setExhibit('e1');
    expect(saved()).toEqual(
      expect.objectContaining({
        selectedCollection: 'c1',
        selectedExhibit: 'e1',
      }),
    );
  });

  /**
   * Verifies: section and team selections are remembered per exhibit and survive a new instance.
   * Interacts with: localStorage 'uiState'.
   * Data: exhibits e1 and e2 with different sections and teams.
   */
  it('remembers section and team per exhibit across instances', () => {
    const first = new UIDataService();
    first.setSection('e1', 'archive');
    first.setSection('e2', 'wall');
    first.setTeam('e1', 't1');
    first.setTheme('dark-theme');

    const second = new UIDataService();

    expect(second.getSection('e1')).toBe('archive');
    expect(second.getSection('e2')).toBe('wall');
    expect(second.getTeam('e1')).toBe('t1');
    expect(second.getTeam('e2')).toBeUndefined();
    expect(second.getTheme()).toBe('dark-theme');
  });
});
