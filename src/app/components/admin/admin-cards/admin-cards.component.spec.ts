// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import {
  CRUCIBLE_DIALOG_IMPORTS,
  CrucibleDialogService,
} from '@cmusei/crucible-common';
import {
  Card,
  CardService,
  CollectionPermission,
  SystemPermission,
} from 'src/app/generated/api';
import { AdminCardEditDialogComponent } from 'src/app/components/admin/admin-card-edit-dialog/admin-card-edit-dialog.component';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import {
  PermissionGrants,
  permissionDataProviders,
} from 'src/app/test-utils/mock-permission-data.service';
import { AdminCardsComponent } from './admin-cards.component';

const CARDS: Card[] = [
  {
    id: 'k2',
    name: 'Water',
    description: 'Utility status',
    collectionId: 'c1',
  },
  { id: 'k1', name: 'Power', description: 'Grid status', collectionId: 'c1' },
];

const EDIT_C1: PermissionGrants = {
  collection: [
    { collectionId: 'c1', permissions: [CollectionPermission.EditCollection] },
  ],
};

async function renderCards(grants: PermissionGrants) {
  const cardApi = {
    getCollectionCards: vi.fn(() => of(structuredClone(CARDS))),
    createCard: vi.fn((card: Card) => of({ ...card, id: 'k3' })),
    deleteCard: vi.fn(() => of(undefined)),
  } satisfies ApiStub<CardService>;
  const confirm = vi.fn(() => dialogRefStub<unknown, boolean>(true).dialogRef);
  const rendered = await renderComponent(AdminCardsComponent, {
    imports: [
      ...CRUCIBLE_DIALOG_IMPORTS,
      MatButtonModule,
      MatCardModule,
      MatDialogModule,
      MatExpansionModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatPaginatorModule,
      MatProgressSpinnerModule,
      MatSortModule,
    ],
    declarations: [AdminCardsComponent, AdminCardEditDialogComponent],
    providers: [
      ...permissionDataProviders(grants),
      { provide: CardService, useValue: cardApi },
      {
        provide: CrucibleDialogService,
        useValue: { confirm } satisfies Pick<CrucibleDialogService, 'confirm'>,
      },
    ],
    componentInputs: { selectedCollectionId: 'c1' },
  });
  return { ...rendered, cardApi, confirm };
}

function cardNames() {
  return Array.from(
    document.querySelectorAll('mat-expansion-panel-header'),
  ).map((h) => h.querySelectorAll('.cell')[1].textContent?.trim());
}

// The row buttons sit in a disabled mat-expansion-panel, whose header is
// aria-disabled, so jest-dom reports every one as disabled; the buttons' own
// disabled property is what the gate sets.
function rowButtonsDisabled() {
  return (screen.queryAllByTitle(/^(Edit|Delete) /) as HTMLButtonElement[]).map(
    (b) => b.disabled,
  );
}

describe('AdminCardsComponent', () => {
  /**
   * Verifies: the collection's cards load and are listed.
   * Interacts with: CardService.getCollectionCards via the real CardDataService and CardQuery.
   * Data: Power and Water in c1; EditCollection on c1.
   */
  it("lists the collection's cards", async () => {
    const { cardApi, container } = await renderCards(EDIT_C1);

    expect(cardApi.getCollectionCards).toHaveBeenCalledWith('c1');
    const names = Array.from(
      container.querySelectorAll('mat-expansion-panel-header'),
    ).map((h) => h.querySelectorAll('.cell')[1].textContent?.trim());
    expect(names.sort()).toEqual(['Power', 'Water']);
  });

  /**
   * Verifies: Add, Edit and Delete are enabled with EditCollection on this collection or the system EditCollections permission, and disabled for near misses.
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
          'system ViewCollections',
          { system: [SystemPermission.ViewCollections] },
          false,
        ],
      ] satisfies [string, PermissionGrants, boolean][]
    ).map(([label, grants, enabled]) => ({ label, grants, enabled })),
  )('with $label enables editing: $enabled', async ({ grants, enabled }) => {
    await renderCards(grants);

    expect(
      (screen.getByTitle('Add a Card') as HTMLButtonElement).disabled,
    ).toBe(!enabled);
    expect(rowButtonsDisabled()).toEqual([
      !enabled,
      !enabled,
      !enabled,
      !enabled,
    ]);
  });

  /**
   * Verifies: without EditCollection on this collection (View on it, Edit on another) every card button is disabled.
   * Interacts with: real PermissionDataService.canEditCollection.
   * Data: ViewCollection on c1 and EditCollection on c2.
   */
  it('disables card editing without EditCollection on the collection', async () => {
    await renderCards({
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

    expect(screen.getByTitle('Add a Card')).toBeDisabled();
    expect(rowButtonsDisabled()).toEqual([true, true, true, true]);
  });

  /**
   * Verifies: Add opens the card dialog, and saving it creates the card in the collection and lists it.
   * Interacts with: real MatDialog and AdminCardEditDialogComponent, CardService.createCard via the real CardDataService and CardQuery.
   * Data: EditCollection on c1; card 'Comms' added.
   */
  it('adds a card from the dialog', async () => {
    const { fixture, cardApi } = await renderCards(EDIT_C1);
    const user = userEvent.setup();

    await user.click(screen.getByTitle('Add a Card'));
    const dialog = await screen.findByRole('dialog');
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Name' }),
      'Comms',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await fixture.whenStable();

    expect(cardApi.createCard).toHaveBeenCalledWith({
      name: 'Comms',
      description: '',
      collectionId: 'c1',
    });
    fixture.detectChanges();
    expect(cardNames().sort()).toEqual(['Comms', 'Power', 'Water']);
  });

  /**
   * Verifies: Delete asks for confirmation, deletes the card and drops it from the list.
   * Interacts with: CrucibleDialogService.confirm stub, CardService.deleteCard via the real CardDataService and CardQuery.
   * Data: EditCollection on c1; Power deleted.
   */
  it('deletes a card after confirmation', async () => {
    const { cardApi, confirm } = await renderCards(EDIT_C1);

    await userEvent.setup().click(screen.getByTitle('Delete Power'));

    expect(confirm).toHaveBeenCalledOnce();
    expect(cardApi.deleteCard).toHaveBeenCalledWith('k1');
    expect(cardNames()).toEqual(['Water']);
  });
});
