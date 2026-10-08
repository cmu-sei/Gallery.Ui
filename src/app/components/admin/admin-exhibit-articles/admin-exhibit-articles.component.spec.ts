// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatSortModule } from '@angular/material/sort';
import {
  Article,
  ArticleService,
  Card,
  Exhibit,
  TeamArticleService,
} from 'src/app/generated/api';
import { CardStore } from 'src/app/data/card/card.store';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { AdminExhibitArticlesComponent } from './admin-exhibit-articles.component';

@Component({
  selector: 'app-admin-exhibit-article-teams',
  template: '',
  standalone: false,
})
class ArticleTeamsStubComponent {
  @Input() exhibitId?: string;
  @Input() articleId?: string;
  @Input() canEdit?: boolean;
}

const EXHIBIT: Exhibit = { id: 'e1', collectionId: 'c1' };
const CARDS: Card[] = [{ id: 'k1', name: 'Power' }];
const ARTICLES: Article[] = [
  {
    id: 'a2',
    name: 'Later',
    description: '',
    sourceName: 'City',
    cardId: 'k1',
    move: 1,
    inject: 0,
  },
  {
    id: 'a1',
    name: 'First',
    description: '',
    sourceName: 'News',
    cardId: 'k1',
    move: 0,
    inject: 1,
  },
];

async function renderExhibitArticles({ canEdit }: { canEdit: boolean }) {
  const articleApi = {
    getCollectionArticles: vi.fn(() => of(structuredClone(ARTICLES))),
  } satisfies ApiStub<ArticleService>;
  const teamArticleApi = {
    getExhibitTeamArticles: vi.fn(() => of([])),
  } satisfies ApiStub<TeamArticleService>;
  const rendered = await renderComponent(AdminExhibitArticlesComponent, {
    imports: [
      MatCardModule,
      MatExpansionModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatProgressSpinnerModule,
      MatSelectModule,
      MatSortModule,
    ],
    declarations: [AdminExhibitArticlesComponent, ArticleTeamsStubComponent],
    providers: [
      { provide: ArticleService, useValue: articleApi },
      { provide: TeamArticleService, useValue: teamArticleApi },
    ],
    componentInputs: { exhibit: EXHIBIT, teamList: [], canEdit },
    configureTestBed: () =>
      TestBed.inject(CardStore).set(structuredClone(CARDS)),
  });
  const teamStubs = () =>
    rendered.fixture.debugElement
      .queryAll(By.directive(ArticleTeamsStubComponent))
      .map((d) => d.componentInstance as ArticleTeamsStubComponent);
  return { ...rendered, articleApi, teamArticleApi, teamStubs };
}

function titles(container: Element) {
  return Array.from(
    container.querySelectorAll('mat-expansion-panel-header'),
  ).map((h) => h.querySelectorAll('.cell')[2].textContent?.trim());
}

describe('AdminExhibitArticlesComponent', () => {
  /**
   * Verifies: the collection's articles and the exhibit's team articles load, sorted by move, each with a teams panel for that article.
   * Interacts with: ArticleService.getCollectionArticles, TeamArticleService.getExhibitTeamArticles, ArticleTeamsStubComponent inputs.
   * Data: First (move 0) and Later (move 1) in c1; exhibit e1; canEdit true.
   */
  it('lists the articles by move with a teams panel each', async () => {
    const { container, articleApi, teamArticleApi, teamStubs } =
      await renderExhibitArticles({ canEdit: true });

    expect(articleApi.getCollectionArticles).toHaveBeenCalledWith('c1');
    expect(teamArticleApi.getExhibitTeamArticles).toHaveBeenCalledWith('e1');
    expect(titles(container)).toEqual(['First', 'Later']);
    expect(teamStubs().map((s) => [s.exhibitId, s.articleId])).toEqual([
      ['e1', 'a1'],
      ['e1', 'a2'],
    ]);
  });

  /**
   * Verifies: choosing a move shows only that move's articles.
   * Interacts with: MatSelectHarness on the Move select.
   * Data: move 1 chosen.
   */
  it('filters by move', async () => {
    const { container, fixture } = await renderExhibitArticles({
      canEdit: true,
    });
    const move = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      MatSelectHarness.with({ selector: '[placeholder="Move"]' }),
    );

    await move.clickOptions({ text: '1' });

    expect(titles(container)).toEqual(['Later']);
  });

  /**
   * Verifies: canEdit true reaches every article's teams panel.
   * Interacts with: ArticleTeamsStubComponent canEdit inputs.
   * Data: canEdit true.
   */
  it('passes canEdit true to the article teams', async () => {
    const { teamStubs } = await renderExhibitArticles({ canEdit: true });

    expect(teamStubs().map((s) => s.canEdit)).toEqual([true, true]);
  });

  /**
   * Verifies: canEdit false reaches every article's teams panel.
   * Interacts with: ArticleTeamsStubComponent canEdit inputs.
   * Data: canEdit false.
   */
  it('passes canEdit false to the article teams', async () => {
    const { teamStubs } = await renderExhibitArticles({ canEdit: false });

    expect(teamStubs()).toHaveLength(2);
    teamStubs().forEach((s) => expect(s.canEdit).toBe(false));
  });
});
