// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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
import { MatTableModule } from '@angular/material/table';
import {
  CRUCIBLE_DIALOG_IMPORTS,
  CrucibleDialogService,
} from '@cmusei/crucible-common';
import {
  Collection,
  CollectionPermission,
  CollectionService,
  SystemPermission,
} from 'src/app/generated/api';
import { CollectionStore } from 'src/app/data/collection/collection.store';
import { AdminCollectionEditDialogComponent } from 'src/app/components/admin/admin-collection-edit-dialog/admin-collection-edit-dialog.component';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import {
  PermissionGrants,
  permissionDataProviders,
} from 'src/app/test-utils/mock-permission-data.service';
import { AdminCollectionsComponent } from './admin-collections.component';

@Component({ selector: 'app-admin-cards', template: '', standalone: false })
class AdminCardsStubComponent {
  @Input() selectedCollectionId?: string;
}

@Component({ selector: 'app-admin-articles', template: '', standalone: false })
class AdminArticlesStubComponent {
  @Input() selectedCollectionId?: string;
}

@Component({
  selector: 'app-collection-memberships',
  template: '',
  standalone: false,
})
class CollectionMembershipsStubComponent {
  @Input() collectionId?: string;
  @Input() embedded?: boolean;
}

const COLLECTIONS: Collection[] = [
  {
    id: 'c1',
    name: 'Exercise',
    description: 'Main',
    dateCreated: new Date('2026-01-01'),
  },
];

async function renderCollections(grants: PermissionGrants) {
  const collectionApi = {
    createCollection: vi.fn((c: Collection) => of({ ...c, id: 'c2' })),
    copyCollection: vi.fn(() =>
      of({
        id: 'c3',
        name: 'Exercise copy',
        dateCreated: new Date('2026-01-02'),
      }),
    ),
    deleteCollection: vi.fn(() => of(undefined)),
  } satisfies ApiStub<CollectionService>;
  const confirm = vi.fn(() => dialogRefStub<unknown, boolean>(true).dialogRef);
  const rendered = await renderComponent(AdminCollectionsComponent, {
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
      MatTableModule,
    ],
    declarations: [
      AdminCollectionsComponent,
      AdminCollectionEditDialogComponent,
      AdminCardsStubComponent,
      AdminArticlesStubComponent,
      CollectionMembershipsStubComponent,
    ],
    providers: [
      ...permissionDataProviders(grants),
      { provide: CollectionService, useValue: collectionApi },
      {
        provide: CrucibleDialogService,
        useValue: { confirm } satisfies Pick<CrucibleDialogService, 'confirm'>,
      },
    ],
    configureTestBed: () =>
      TestBed.inject(CollectionStore).set(structuredClone(COLLECTIONS)),
  });
  return { ...rendered, collectionApi, confirm };
}

function collectionNames() {
  return Array.from(
    document.querySelectorAll('tr.element-row td:nth-child(2)'),
  ).map((c) => c.textContent?.trim());
}

const BUTTONS = [
  'Add Collection',
  'Upload Collection',
  'Copy Exercise',
  'Edit Exercise',
  'Delete Exercise',
];

/** The titles of the enabled collection buttons, in BUTTONS order. */
function enabledButtons() {
  return BUTTONS.filter(
    (t) => !(screen.getByTitle(t) as HTMLButtonElement).disabled,
  );
}

describe('AdminCollectionsComponent', () => {
  /**
   * Verifies: each collection button is enabled exactly by its permission: Add, Upload and Copy by CreateCollections, Edit by edit rights on the collection, Delete by manage rights; Download needs none.
   * Interacts with: real PermissionDataService (hasPermission, canEditCollection, canManageCollection).
   * Data: one grant set per row, including near misses (View on c1, Edit on c2, Manage on c2, a neighbouring system permission), and the exact enabled list.
   */
  it.each(
    (
      [
        [
          'system CreateCollections',
          { system: [SystemPermission.CreateCollections] },
          ['Add Collection', 'Upload Collection', 'Copy Exercise'],
        ],
        [
          'system EditCollections',
          { system: [SystemPermission.EditCollections] },
          ['Edit Exercise'],
        ],
        [
          'system ManageCollections',
          { system: [SystemPermission.ManageCollections] },
          ['Delete Exercise'],
        ],
        [
          'EditCollection on c1',
          {
            collection: [
              {
                collectionId: 'c1',
                permissions: [CollectionPermission.EditCollection],
              },
            ],
          },
          ['Edit Exercise'],
        ],
        [
          'ManageCollection on c1',
          {
            collection: [
              {
                collectionId: 'c1',
                permissions: [CollectionPermission.ManageCollection],
              },
            ],
          },
          ['Delete Exercise'],
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
          [],
        ],
        [
          'Edit and Manage on c2',
          {
            collection: [
              {
                collectionId: 'c2',
                permissions: [
                  CollectionPermission.EditCollection,
                  CollectionPermission.ManageCollection,
                ],
              },
            ],
          },
          [],
        ],
        [
          'system ViewCollections',
          { system: [SystemPermission.ViewCollections] },
          [],
        ],
      ] satisfies [string, PermissionGrants, string[]][]
    ).map(([label, grants, expected]) => ({ label, grants, expected })),
  )('with $label enables $expected', async ({ grants, expected }) => {
    await renderCollections(grants);

    expect(enabledButtons()).toEqual(expected);
    expect(screen.getByTitle('Download Exercise')).toBeEnabled();
  });

  /**
   * Verifies: a user who can only view the collection (and edit another) gets no enabled Add, Upload, Copy, Edit or Delete.
   * Interacts with: real PermissionDataService.
   * Data: ViewCollection on c1, EditCollection on c2, system ViewCollections.
   */
  it('disables every collection change without a matching permission', async () => {
    await renderCollections({
      system: [SystemPermission.ViewCollections],
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

    expect(enabledButtons()).toEqual([]);
    expect(screen.getByTitle('Delete Exercise')).toBeDisabled();
  });

  /**
   * Verifies: clicking a collection opens its detail with the cards, articles and memberships panels for that collection.
   * Interacts with: toggleExpand, the three child stubs.
   * Data: system ViewCollections; Exercise clicked.
   */
  it('opens the collection detail', async () => {
    const { fixture } = await renderCollections({
      system: [SystemPermission.ViewCollections],
    });

    await userEvent
      .setup()
      .click(within(screen.getByRole('table')).getByText('Exercise'));

    const cards = fixture.debugElement.query(
      By.directive(AdminCardsStubComponent),
    ).componentInstance as AdminCardsStubComponent;
    expect(cards.selectedCollectionId).toBe('c1');
    const memberships = fixture.debugElement.query(
      By.directive(CollectionMembershipsStubComponent),
    ).componentInstance as CollectionMembershipsStubComponent;
    expect(memberships.collectionId).toBe('c1');
  });

  /**
   * Verifies: Add opens the collection dialog and saving creates the collection; Copy copies it; both new collections are listed.
   * Interacts with: real MatDialog and AdminCollectionEditDialogComponent, CollectionService.createCollection / copyCollection via the real CollectionDataService and CollectionQuery.
   * Data: system CreateCollections; 'Drill' added, Exercise copied.
   */
  it('adds and copies collections', async () => {
    const { fixture, collectionApi } = await renderCollections({
      system: [SystemPermission.CreateCollections],
    });
    const user = userEvent.setup();

    await user.click(screen.getByTitle('Add Collection'));
    const dialog = await screen.findByRole('dialog');
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Name' }),
      'Drill',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await fixture.whenStable();
    expect(collectionApi.createCollection).toHaveBeenCalledWith({
      name: 'Drill',
      description: '',
    });

    await user.click(screen.getByTitle('Copy Exercise'));
    expect(collectionApi.copyCollection).toHaveBeenCalledWith('c1');
    expect(collectionNames().sort()).toEqual([
      'Drill',
      'Exercise',
      'Exercise copy',
    ]);
  });

  /**
   * Verifies: Delete asks for confirmation, deletes the collection and drops it from the table.
   * Interacts with: CrucibleDialogService.confirm stub, CollectionService.deleteCollection via the real CollectionDataService and CollectionQuery.
   * Data: ManageCollection on c1.
   */
  it('deletes a collection after confirmation', async () => {
    const { collectionApi, confirm } = await renderCollections({
      collection: [
        {
          collectionId: 'c1',
          permissions: [CollectionPermission.ManageCollection],
        },
      ],
    });

    await userEvent.setup().click(screen.getByTitle('Delete Exercise'));

    expect(confirm).toHaveBeenCalledOnce();
    expect(collectionApi.deleteCollection).toHaveBeenCalledWith('c1');
    expect(collectionNames()).toEqual([]);
  });
});
