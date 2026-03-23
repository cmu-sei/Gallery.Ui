// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { AdminExhibitsComponent } from './admin-exhibits.component';
import { renderComponent } from 'src/app/test-utils/render-component';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamUserDataService } from 'src/app/data/team-user/team-user-data.service';
import { CardDataService } from 'src/app/data/card/card-data.service';
import {
  SystemPermission,
  ExhibitPermission,
  ExhibitPermissionClaim,
  CollectionPermission,
  CollectionPermissionClaim,
} from 'src/app/generated/api';

const TEST_COLLECTION_ID = 'col-1';
const TEST_EXHIBIT_ID = 'exh-1';

async function renderExhibits(
  overrides: {
    permissions?: SystemPermission[];
    exhibitPerms?: ExhibitPermissionClaim[];
    collectionPerms?: CollectionPermissionClaim[];
    selectedCollectionId?: string;
    exhibits?: any[];
    collections?: any[];
  } = {},
) {
  const {
    permissions = [],
    exhibitPerms = [],
    collectionPerms = [],
    selectedCollectionId = TEST_COLLECTION_ID,
    exhibits = [
      {
        id: TEST_EXHIBIT_ID,
        collectionId: TEST_COLLECTION_ID,
        name: 'Test Exhibit',
        currentMove: 0,
        currentInject: 0,
        dateCreated: new Date('2025-01-01'),
        createdBy: 'user-1',
      },
    ],
    collections = [{ id: TEST_COLLECTION_ID, name: 'Test Collection' }],
  } = overrides;

  const mockCollectionQuery = {
    selectAll: () => of(collections),
    selectActiveId: () => of(selectedCollectionId),
    select: () => of(null),
    selectEntity: () => of(null),
    selectLoading: () => of(false),
    getAll: () => collections,
    getEntity: () => null,
  };

  const mockExhibitQuery = {
    selectAll: () => of(exhibits),
    selectActive: () => of(null),
    selectActiveId: () => of(null),
    select: () => of(null),
    selectEntity: () => of(null),
    selectLoading: () => of(false),
    getAll: () => exhibits,
    getEntity: () => null,
  };

  const mockPermissionDataService = {
    load: () => of(permissions),
    loadCollectionPermissions: () => of(collectionPerms),
    loadExhibitPermissions: () => of(exhibitPerms),
    hasPermission: (p: SystemPermission) => permissions.includes(p),
    canEditExhibit: (exhibitId: string) =>
      permissions.includes(SystemPermission.EditExhibits) ||
      permissions.includes(SystemPermission.ManageExhibits) ||
      exhibitPerms.some(
        (c) =>
          c.exhibitId === exhibitId &&
          c.permissions?.includes(ExhibitPermission.EditExhibit),
      ) ||
      exhibitPerms.some(
        (c) =>
          c.exhibitId === exhibitId &&
          c.permissions?.includes(ExhibitPermission.ManageExhibit),
      ),
    canManageExhibit: (exhibitId: string) =>
      permissions.includes(SystemPermission.ManageExhibits) ||
      exhibitPerms.some(
        (c) =>
          c.exhibitId === exhibitId &&
          c.permissions?.includes(ExhibitPermission.ManageExhibit),
      ),
    canManageCollection: (collectionId: string) =>
      permissions.includes(SystemPermission.ManageCollections) ||
      collectionPerms.some(
        (c) =>
          c.collectionId === collectionId &&
          c.permissions?.includes(CollectionPermission.ManageCollection),
      ),
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
  };

  return renderComponent(AdminExhibitsComponent, {
    declarations: [AdminExhibitsComponent],
    imports: [MatTableModule, MatSortModule, MatPaginatorModule, MatSelectModule],
    componentProperties: {
      userList: [],
    },
    providers: [
      {
        provide: CollectionDataService,
        useValue: { load: () => {}, loadMine: () => {}, setActive: () => {} },
      },
      { provide: CollectionQuery, useValue: mockCollectionQuery },
      {
        provide: ExhibitDataService,
        useValue: {
          loadByCollection: () => {},
          loadById: () => {},
          setActive: () => {},
          updateExhibit: () => {},
          add: () => {},
          delete: () => {},
          copy: () => {},
          downloadJson: () => of(new Blob()),
          uploadJson: () => {},
        },
      },
      { provide: ExhibitQuery, useValue: mockExhibitQuery },
      { provide: PermissionDataService, useValue: mockPermissionDataService },
      { provide: DialogService, useValue: { confirm: () => of({ confirm: true }) } },
      {
        provide: TeamDataService,
        useValue: { loadByExhibitId: () => {} },
      },
      {
        provide: TeamUserDataService,
        useValue: { loadByExhibit: () => {} },
      },
      {
        provide: CardDataService,
        useValue: { loadByExhibitTeam: () => {}, setActive: () => {} },
      },
    ],
  });
}

describe('AdminExhibitsComponent', () => {
  it('should create the component', async () => {
    const { fixture } = await renderExhibits();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should enable Add Exhibit button when user can manage the collection', async () => {
    await renderExhibits({
      permissions: [SystemPermission.ManageCollections],
    });
    const addBtn = screen.getByTitle('Add Exhibit') as HTMLButtonElement;
    expect(addBtn.disabled).toBe(false);
  });

  it('should disable Add Exhibit button when user cannot manage the collection', async () => {
    await renderExhibits({
      permissions: [SystemPermission.ViewExhibits],
    });
    const addBtn = screen.getByTitle('Add Exhibit') as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);
  });

  it('should enable Add Exhibit with resource-level ManageCollection permission', async () => {
    await renderExhibits({
      collectionPerms: [
        {
          collectionId: TEST_COLLECTION_ID,
          permissions: [CollectionPermission.ManageCollection],
        },
      ],
    });
    const addBtn = screen.getByTitle('Add Exhibit') as HTMLButtonElement;
    expect(addBtn.disabled).toBe(false);
  });

  it('should enable Edit button when user has system EditExhibits', async () => {
    await renderExhibits({
      permissions: [SystemPermission.EditExhibits],
    });
    const editBtn = screen.getByTitle('Edit Test Exhibit') as HTMLButtonElement;
    expect(editBtn.disabled).toBe(false);
  });

  it('should disable Edit button when user lacks exhibit edit permission', async () => {
    await renderExhibits({
      permissions: [SystemPermission.ViewExhibits],
    });
    const editBtn = screen.getByTitle('Edit Test Exhibit') as HTMLButtonElement;
    expect(editBtn.disabled).toBe(true);
  });

  it('should enable Edit button with resource-level EditExhibit permission', async () => {
    await renderExhibits({
      exhibitPerms: [
        {
          exhibitId: TEST_EXHIBIT_ID,
          permissions: [ExhibitPermission.EditExhibit],
        },
      ],
    });
    const editBtn = screen.getByTitle('Edit Test Exhibit') as HTMLButtonElement;
    expect(editBtn.disabled).toBe(false);
  });

  it('should disable Delete button when user lacks exhibit edit permission', async () => {
    await renderExhibits({
      permissions: [SystemPermission.ViewExhibits],
    });
    const deleteBtn = screen.getByTitle('Delete Test Exhibit') as HTMLButtonElement;
    expect(deleteBtn.disabled).toBe(true);
  });

  it('should enable Delete button when user has system EditExhibits', async () => {
    await renderExhibits({
      permissions: [SystemPermission.EditExhibits],
    });
    const deleteBtn = screen.getByTitle('Delete Test Exhibit') as HTMLButtonElement;
    expect(deleteBtn.disabled).toBe(false);
  });

  it('should enable Upload Exhibit button when user can manage the collection', async () => {
    await renderExhibits({
      permissions: [SystemPermission.ManageCollections],
    });
    const uploadBtn = screen.getByTitle('Upload Exhibit') as HTMLButtonElement;
    expect(uploadBtn.disabled).toBe(false);
  });

  it('should disable Upload Exhibit button when user cannot manage the collection', async () => {
    await renderExhibits({
      permissions: [SystemPermission.ViewExhibits],
    });
    const uploadBtn = screen.getByTitle('Upload Exhibit') as HTMLButtonElement;
    expect(uploadBtn.disabled).toBe(true);
  });
});
