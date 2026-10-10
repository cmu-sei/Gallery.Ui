// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatSortModule } from '@angular/material/sort';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import {
  Article,
  ArticleService,
  Card,
  CardService,
  CollectionPermission,
  SystemPermission,
} from 'src/app/generated/api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import {
  PermissionGrants,
  permissionDataProviders,
} from 'src/app/test-utils/mock-permission-data.service';
import { AdminArticlesComponent } from './admin-articles.component';

const CARDS: Card[] = [
  { id: 'k1', name: 'Power' },
  { id: 'k2', name: 'Water' },
];
const ARTICLES: Article[] = [
  {
    id: 'a1',
    name: 'Outage',
    description: '',
    sourceName: 'Daily News',
    cardId: 'k1',
    move: 0,
    inject: 1,
    datePosted: new Date('2026-01-01'),
  },
  {
    id: 'a2',
    name: 'Boil notice',
    description: '',
    sourceName: 'City',
    cardId: 'k2',
    move: 1,
    inject: 1,
    datePosted: new Date('2026-01-02'),
  },
];

const EDIT_C1: PermissionGrants = {
  collection: [
    { collectionId: 'c1', permissions: [CollectionPermission.EditCollection] },
  ],
};

async function renderArticles(grants: PermissionGrants) {
  const articleApi = {
    getCollectionArticles: vi.fn(() => of(structuredClone(ARTICLES))),
    deleteArticle: vi.fn(() => of(undefined)),
  } satisfies ApiStub<ArticleService>;
  const cardApi = {
    getCollectionCards: vi.fn(() => of(structuredClone(CARDS))),
  } satisfies ApiStub<CardService>;
  const confirm = vi.fn(() => dialogRefStub<unknown, boolean>(true).dialogRef);
  const rendered = await renderComponent(AdminArticlesComponent, {
    imports: [
      MatButtonModule,
      MatCardModule,
      MatExpansionModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatPaginatorModule,
      MatProgressSpinnerModule,
      MatSelectModule,
      MatSortModule,
    ],
    declarations: [AdminArticlesComponent],
    providers: [
      ...permissionDataProviders(grants),
      { provide: ArticleService, useValue: articleApi },
      { provide: CardService, useValue: cardApi },
      {
        provide: CrucibleDialogService,
        useValue: { confirm } satisfies Pick<CrucibleDialogService, 'confirm'>,
      },
    ],
    componentInputs: { selectedCollectionId: 'c1' },
  });
  return { ...rendered, articleApi, cardApi, confirm };
}

function titles(container: Element) {
  return Array.from(
    container.querySelectorAll('mat-expansion-panel-header'),
  ).map((h) => h.querySelectorAll('.cell')[2].textContent?.trim());
}

// The row buttons sit in a disabled mat-expansion-panel, whose header is
// aria-disabled, so jest-dom reports every one as disabled; the buttons' own
// disabled property is what the gate sets.
function rowButtonsDisabled() {
  return (screen.queryAllByTitle(/^(Edit|Delete) /) as HTMLButtonElement[]).map(
    (b) => b.disabled,
  );
}

describe('AdminArticlesComponent', () => {
  /**
   * Verifies: the collection's articles and cards load, newest first, each with its card name.
   * Interacts with: ArticleService.getCollectionArticles and CardService.getCollectionCards via the real data services.
   * Data: Outage (Power, Jan 1) and Boil notice (Water, Jan 2); EditCollection on c1.
   */
  it("lists the collection's articles newest first", async () => {
    const { container, articleApi, cardApi } = await renderArticles(EDIT_C1);

    expect(articleApi.getCollectionArticles).toHaveBeenCalledWith('c1');
    expect(cardApi.getCollectionCards).toHaveBeenCalledWith('c1');
    expect(titles(container)).toEqual(['Boil notice', 'Outage']);
  });

  /**
   * Verifies: choosing a card in the Card filter shows only that card's articles.
   * Interacts with: MatSelectHarness on the Card select.
   * Data: Power chosen.
   */
  it('filters by card', async () => {
    const { container, fixture } = await renderArticles(EDIT_C1);
    const card = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      MatSelectHarness.with({ selector: '[placeholder="Card"]' }),
    );

    await card.clickOptions({ text: 'Power' });

    expect(titles(container)).toEqual(['Outage']);
  });

  /**
   * Verifies: Add, Edit and Delete are enabled with EditCollection on this collection or system EditCollections, and disabled for near misses.
   * Interacts with: real PermissionDataService.canEditCollection.
   * Data: one grant set per row and whether the buttons are enabled.
   */
  it.each(
    (
      [
        ['EditCollection on c1', EDIT_C1, true],
        [
          'system EditCollections',
          { system: [SystemPermission.EditCollections] },
          true,
        ],
        [
          'ViewCollection on c1',
          {
            collection: [
              {
                collectionId: 'c1',
                permissions: [CollectionPermission.ViewCollection],
              },
            ],
          },
          false,
        ],
        [
          'EditCollection on c2',
          {
            collection: [
              {
                collectionId: 'c2',
                permissions: [CollectionPermission.EditCollection],
              },
            ],
          },
          false,
        ],
        [
          'system EditExhibits',
          { system: [SystemPermission.EditExhibits] },
          false,
        ],
      ] satisfies [string, PermissionGrants, boolean][]
    ).map(([label, grants, enabled]) => ({ label, grants, enabled })),
  )('with $label enables editing: $enabled', async ({ grants, enabled }) => {
    await renderArticles(grants);

    expect(
      (screen.getByTitle('Add an Article') as HTMLButtonElement).disabled,
    ).toBe(!enabled);
    expect(rowButtonsDisabled()).toEqual([
      !enabled,
      !enabled,
      !enabled,
      !enabled,
    ]);
  });

  /**
   * Verifies: without EditCollection on this collection (View on it, Edit on another) every article button is disabled.
   * Interacts with: real PermissionDataService.canEditCollection.
   * Data: ViewCollection on c1 and EditCollection on c2.
   */
  it('disables article editing without EditCollection on the collection', async () => {
    await renderArticles({
      collection: [
        {
          collectionId: 'c1',
          permissions: [CollectionPermission.ViewCollection],
        },
        {
          collectionId: 'c2',
          permissions: [CollectionPermission.EditCollection],
        },
      ],
    });

    expect(screen.getByTitle('Add an Article')).toBeDisabled();
    expect(rowButtonsDisabled()).toEqual([true, true, true, true]);
  });

  /**
   * Verifies: Delete asks for confirmation, deletes the article and drops it from the list.
   * Interacts with: CrucibleDialogService.confirm stub, ArticleService.deleteArticle via the real ArticleDataService and ArticleQuery.
   * Data: EditCollection on c1; Outage deleted.
   */
  it('deletes an article after confirmation', async () => {
    const { articleApi, confirm, container } = await renderArticles(EDIT_C1);

    await userEvent.setup().click(screen.getByTitle('Delete Outage'));

    expect(confirm).toHaveBeenCalledOnce();
    expect(articleApi.deleteArticle).toHaveBeenCalledWith('a1');
    expect(titles(container)).toEqual(['Boil notice']);
  });
});
