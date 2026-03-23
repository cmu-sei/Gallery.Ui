// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { AdminCollectionsComponent } from './admin-collections.component';
import { renderComponent } from 'src/app/test-utils/render-component';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import {
  SystemPermission,
  CollectionPermission,
  CollectionPermissionClaim,
} from 'src/app/generated/api';

const TEST_COLLECTION_ID = 'col-1';

async function renderCollections(
  overrides: {
    permissions?: SystemPermission[];
    collectionPerms?: CollectionPermissionClaim[];
    collections?: any[];
  } = {},
) {
  const {
    permissions = [],
    collectionPerms = [],
    collections = [
      { id: TEST_COLLECTION_ID, name: 'Test Collection', description: 'A test' },
    ],
  } = overrides;

  const mockCollectionQuery = {
    selectAll: () => of(collections),
    selectActiveId: () => of(null),
    select: () => of(null),
    selectEntity: () => of(null),
    selectLoading: () => of(false),
    getAll: () => collections,
    getEntity: () => null,
  };

  const mockPermissionDataService = {
    load: () => of(permissions),
    loadCollectionPermissions: () => of(collectionPerms),
    loadExhibitPermissions: () => of([]),
    hasPermission: (p: SystemPermission) => permissions.includes(p),
    canEditCollection: (collectionId: string) =>
      permissions.includes(SystemPermission.EditCollections) ||
      permissions.includes(SystemPermission.ManageCollections) ||
      collectionPerms.some(
        (c) =>
          c.collectionId === collectionId &&
          c.permissions?.includes(CollectionPermission.EditCollection),
      ) ||
      collectionPerms.some(
        (c) =>
          c.collectionId === collectionId &&
          c.permissions?.includes(CollectionPermission.ManageCollection),
      ),
    canManageCollection: (collectionId: string) =>
      permissions.includes(SystemPermission.ManageCollections) ||
      collectionPerms.some(
        (c) =>
          c.collectionId === collectionId &&
          c.permissions?.includes(CollectionPermission.ManageCollection),
      ),
  };

  return renderComponent(AdminCollectionsComponent, {
    declarations: [AdminCollectionsComponent],
    imports: [MatTableModule, MatSortModule, MatPaginatorModule],
    providers: [
      {
        provide: CollectionDataService,
        useValue: {
          load: () => {},
          loadMine: () => {},
          setActive: () => {},
          updateCollection: () => {},
          add: () => {},
          delete: () => {},
          downloadJson: () => of(new Blob()),
          uploadJson: () => {},
        },
      },
      { provide: CollectionQuery, useValue: mockCollectionQuery },
      { provide: PermissionDataService, useValue: mockPermissionDataService },
      { provide: DialogService, useValue: { confirm: () => of({ confirm: true }) } },
    ],
  });
}

describe('AdminCollectionsComponent', () => {
  it('should create the component', async () => {
    const { fixture } = await renderCollections();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should enable Add Collection button when user has CreateCollections', async () => {
    await renderCollections({
      permissions: [SystemPermission.CreateCollections, SystemPermission.ViewCollections],
    });
    const addBtn = screen.getByTitle('Add Collection') as HTMLButtonElement;
    expect(addBtn).toBeInTheDocument();
    expect(addBtn.disabled).toBe(false);
  });

  it('should disable Add Collection button when user lacks CreateCollections', async () => {
    await renderCollections({
      permissions: [SystemPermission.ViewCollections],
    });
    const addBtn = screen.getByTitle('Add Collection') as HTMLButtonElement;
    expect(addBtn).toBeInTheDocument();
    expect(addBtn.disabled).toBe(true);
  });

  it('should enable Upload Collection button when user has CreateCollections', async () => {
    await renderCollections({
      permissions: [SystemPermission.CreateCollections, SystemPermission.ViewCollections],
    });
    const uploadBtn = screen.getByTitle('Upload Collection') as HTMLButtonElement;
    expect(uploadBtn.disabled).toBe(false);
  });

  it('should disable Upload Collection button when user lacks CreateCollections', async () => {
    await renderCollections({
      permissions: [SystemPermission.ViewCollections],
    });
    const uploadBtn = screen.getByTitle('Upload Collection') as HTMLButtonElement;
    expect(uploadBtn.disabled).toBe(true);
  });

  it('should enable Edit button when user has system EditCollections', async () => {
    await renderCollections({
      permissions: [SystemPermission.ViewCollections, SystemPermission.EditCollections],
    });
    const editBtn = screen.getByTitle('Edit Test Collection') as HTMLButtonElement;
    expect(editBtn.disabled).toBe(false);
  });

  it('should disable Edit button when user lacks edit permission', async () => {
    await renderCollections({
      permissions: [SystemPermission.ViewCollections],
    });
    const editBtn = screen.getByTitle('Edit Test Collection') as HTMLButtonElement;
    expect(editBtn.disabled).toBe(true);
  });

  it('should enable Edit button with resource-level EditCollection permission', async () => {
    await renderCollections({
      permissions: [SystemPermission.ViewCollections],
      collectionPerms: [
        {
          collectionId: TEST_COLLECTION_ID,
          permissions: [CollectionPermission.EditCollection],
        },
      ],
    });
    const editBtn = screen.getByTitle('Edit Test Collection') as HTMLButtonElement;
    expect(editBtn.disabled).toBe(false);
  });

  it('should enable Delete button when user has system ManageCollections', async () => {
    await renderCollections({
      permissions: [SystemPermission.ViewCollections, SystemPermission.ManageCollections],
    });
    const deleteBtn = screen.getByTitle('Delete Test Collection') as HTMLButtonElement;
    expect(deleteBtn.disabled).toBe(false);
  });

  it('should disable Delete button when user lacks manage permission', async () => {
    await renderCollections({
      permissions: [SystemPermission.ViewCollections],
    });
    const deleteBtn = screen.getByTitle('Delete Test Collection') as HTMLButtonElement;
    expect(deleteBtn.disabled).toBe(true);
  });

  it('should enable Delete button with resource-level ManageCollection permission', async () => {
    await renderCollections({
      permissions: [SystemPermission.ViewCollections],
      collectionPerms: [
        {
          collectionId: TEST_COLLECTION_ID,
          permissions: [CollectionPermission.ManageCollection],
        },
      ],
    });
    const deleteBtn = screen.getByTitle('Delete Test Collection') as HTMLButtonElement;
    expect(deleteBtn.disabled).toBe(false);
  });
});
