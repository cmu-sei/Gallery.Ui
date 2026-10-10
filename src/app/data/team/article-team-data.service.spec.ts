// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TeamArticle, TeamArticleService } from 'src/app/generated/api';
import { ArticleTeamDataService } from './article-team-data.service';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { recordEmissions } from 'src/app/test-utils/record-emissions';

function makeTeamArticle(overrides: Partial<TeamArticle> = {}): TeamArticle {
  return {
    id: 'ta1',
    exhibitId: 'e1',
    teamId: 't1',
    articleId: 'a1',
    ...overrides,
  };
}

// Without an api the generated service stays the default unstubbed()
// placeholder, so an unexpected call fails with the member's name.
function setup(api?: ApiStub<TeamArticleService>) {
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      ...(api ? [{ provide: TeamArticleService, useValue: api }] : []),
    ]),
  });
  return TestBed.inject(ArticleTeamDataService);
}

// Seeds the service through its public API so the private cache is consistent.
function seeded(
  teamArticles: TeamArticle[],
  api: ApiStub<TeamArticleService> = {},
) {
  const service = setup({
    getExhibitTeamArticles: vi.fn(() => of(teamArticles)),
    ...api,
  });
  service.getTeamArticlesFromApi('e1');
  return service;
}

describe('ArticleTeamDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  /**
   * Verifies: getTeamArticlesFromApi() publishes the exhibit's team articles on teamArticles.
   * Interacts with: TeamArticleService.getExhibitTeamArticles.
   * Data: two team articles for exhibit e1.
   */
  it('loads the exhibit team articles', () => {
    const getExhibitTeamArticles = vi.fn(() =>
      of([makeTeamArticle(), makeTeamArticle({ id: 'ta2', teamId: 't2' })]),
    );
    const service = setup({ getExhibitTeamArticles });
    const seen = recordEmissions(service.teamArticles);

    service.getTeamArticlesFromApi('e1');

    expect(getExhibitTeamArticles).toHaveBeenCalledWith('e1');
    expect(seen.at(-1)?.map((t) => t.id)).toEqual(['ta1', 'ta2']);
  });

  /**
   * Verifies: a failed load publishes an empty list.
   * Interacts with: TeamArticleService.getExhibitTeamArticles (throws).
   * Data: exhibit e1.
   */
  it('publishes an empty list when the load fails', () => {
    const service = setup({
      getExhibitTeamArticles: vi.fn(() => throwError(() => new Error('500'))),
    });

    service.getTeamArticlesFromApi('e1');

    expect(service.teamArticles.getValue()).toEqual([]);
  });

  describe('addTeamToArticle()', () => {
    /**
     * Verifies: the created team article is prepended to the list.
     * Interacts with: TeamArticleService.createTeamArticle.
     * Data: ta1 already shared; article a1 then shared with team t2.
     */
    it('prepends the created team article', () => {
      const createTeamArticle = vi.fn(() =>
        of(makeTeamArticle({ id: 'ta2', teamId: 't2' })),
      );
      const service = seeded([makeTeamArticle()], { createTeamArticle });

      service.addTeamToArticle('e1', 't2', 'a1');

      expect(createTeamArticle).toHaveBeenCalledWith({
        exhibitId: 'e1',
        articleId: 'a1',
        teamId: 't2',
      });
      expect(service.teamArticles.getValue().map((t) => t.id)).toEqual([
        'ta2',
        'ta1',
      ]);
    });

    /**
     * Verifies: a failed create re-publishes the unchanged list.
     * Interacts with: TeamArticleService.createTeamArticle (throws).
     * Data: ta1 already shared.
     */
    it('keeps the list when the create fails', () => {
      const service = seeded([makeTeamArticle()], {
        createTeamArticle: vi.fn(() => throwError(() => new Error('409'))),
      });

      service.addTeamToArticle('e1', 't2', 'a1');

      expect(service.teamArticles.getValue().map((t) => t.id)).toEqual(['ta1']);
    });
  });

  describe('removeTeamArticle()', () => {
    /**
     * Verifies: unsharing one article from a team calls the by-ids delete and drops that team article.
     * Interacts with: TeamArticleService.deleteTeamArticleByIds.
     * Data: team t1 shares a1, team t2 shares a1; t1/a1 removed.
     */
    it('removes the team article for that team', () => {
      const deleteTeamArticleByIds = vi.fn(() => of(undefined));
      const service = seeded(
        [makeTeamArticle(), makeTeamArticle({ id: 'ta2', teamId: 't2' })],
        { deleteTeamArticleByIds },
      );

      service.removeTeamArticle('t1', 'a1');

      expect(deleteTeamArticleByIds).toHaveBeenCalledWith('t1', 'a1');
      expect(service.teamArticles.getValue().map((t) => t.id)).toEqual(['ta2']);
    });

    /**
     * Verifies: removing one article from a team also drops that team's other articles from the local list.
     * Interacts with: TeamArticleService.deleteTeamArticleByIds.
     * Data: team t1 shares articles a1 and a2; only t1/a1 is removed.
     */
    it('drops every article of the team from the local list', () => {
      const service = seeded(
        [makeTeamArticle(), makeTeamArticle({ id: 'ta2', articleId: 'a2' })],
        { deleteTeamArticleByIds: vi.fn(() => of(undefined)) },
      );

      service.removeTeamArticle('t1', 'a1');

      expect(service.teamArticles.getValue()).toEqual([]);
    });

    /**
     * Verifies: a failed delete re-publishes the unchanged list.
     * Interacts with: TeamArticleService.deleteTeamArticleByIds (throws).
     * Data: ta1 shared.
     */
    it('keeps the list when the delete fails', () => {
      const service = seeded([makeTeamArticle()], {
        deleteTeamArticleByIds: vi.fn(() => throwError(() => new Error('404'))),
      });

      service.removeTeamArticle('t1', 'a1');

      expect(service.teamArticles.getValue().map((t) => t.id)).toEqual(['ta1']);
    });
  });

  /**
   * Verifies: updateStore() replaces-and-prepends by id and deleteFromStore() removes by id.
   * Interacts with: teamArticles only (no API calls).
   * Data: ta1 and ta2 loaded; ta2 updated, then ta1 deleted.
   */
  it('updateStore() moves the updated item to the front and deleteFromStore() removes it', () => {
    const service = seeded([
      makeTeamArticle(),
      makeTeamArticle({ id: 'ta2', teamId: 't2' }),
    ]);

    service.updateStore(makeTeamArticle({ id: 'ta2', teamId: 't3' }));
    expect(service.teamArticles.getValue()).toEqual([
      makeTeamArticle({ id: 'ta2', teamId: 't3' }),
      makeTeamArticle(),
    ]);

    service.deleteFromStore('ta1');
    expect(service.teamArticles.getValue().map((t) => t.id)).toEqual(['ta2']);
  });

  /**
   * Verifies: setAsDates() converts string dates in place.
   * Interacts with: ArticleTeamDataService.setAsDates only.
   * Data: a team article with ISO-string dates.
   */
  it('setAsDates() parses dates in place', () => {
    const service = setup();
    const teamArticle = {
      ...makeTeamArticle(),
      dateCreated: '2026-01-01T00:00:00Z',
      dateModified: '2026-01-02T00:00:00Z',
    } as unknown as TeamArticle;

    service.setAsDates(teamArticle);

    expect(teamArticle.dateCreated).toBeInstanceOf(Date);
    expect(teamArticle.dateModified).toBeInstanceOf(Date);
  });
});
