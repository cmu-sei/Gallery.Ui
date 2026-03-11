// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AdminContainerComponent } from './admin-container.component';
import { renderComponent } from 'src/app/test-utils/render-component';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { SignalRService } from 'src/app/services/signalr.service';
import { HealthCheckService } from 'src/app/generated/api';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { SystemPermission } from 'src/app/generated/api';

function buildMockDocument() {
  // The component calls document.getElementById('appTitle').innerHTML in the constructor
  const mockDoc = document;
  const appTitle = document.createElement('div');
  appTitle.id = 'appTitle';
  document.body.appendChild(appTitle);
  return mockDoc;
}

async function renderAdmin(overrides: {
  permissions?: SystemPermission[];
  hasCollections?: boolean;
  section?: string;
} = {}) {
  const { permissions = [], hasCollections = false, section = null } = overrides;

  const mockCollectionQuery = {
    selectAll: () => of(hasCollections ? [{ id: '1', name: 'Test Collection' }] : []),
    selectActiveId: () => of(null),
    select: () => of(null),
    selectEntity: () => of(null),
    selectLoading: () => of(false),
    getAll: () => [],
    getEntity: () => null,
  };

  const mockPermissionDataService = {
    load: () => of([]),
    loadCollectionPermissions: () => of([]),
    loadExhibitPermissions: () => of([]),
    hasPermission: (p: SystemPermission) => permissions.includes(p),
  };

  return renderComponent(AdminContainerComponent, {
    declarations: [AdminContainerComponent],
    providers: [
      { provide: DOCUMENT, useFactory: buildMockDocument },
      {
        provide: CollectionDataService,
        useValue: { load: () => {} },
      },
      { provide: CollectionQuery, useValue: mockCollectionQuery },
      {
        provide: ExhibitDataService,
        useValue: { loadByCollection: () => {} },
      },
      { provide: PermissionDataService, useValue: mockPermissionDataService },
      {
        provide: UserDataService,
        useValue: { load: () => of([]), setCurrentUser: () => {} },
      },
      {
        provide: SignalRService,
        useValue: {
          startConnection: () => Promise.resolve(),
          join: () => {},
          leaveChannel: () => {},
        },
      },
      {
        provide: HealthCheckService,
        useValue: { getVersion: () => of('1.0.0+abc') },
      },
      {
        provide: ComnSettingsService,
        useValue: {
          settings: {
            ApiUrl: '',
            AppTopBarText: 'Gallery',
            AppTopBarHexColor: '#0F1D47',
            AppTopBarHexTextColor: '#FFFFFF',
            AppTopBarImage: '',
            AppTitle: 'Gallery',
          },
        },
      },
      {
        provide: ActivatedRoute,
        useValue: {
          params: of({}),
          paramMap: of({ get: () => null, has: () => false }),
          queryParams: of({}),
          queryParamMap: of({
            get: () => section,
            has: () => section !== null,
          }),
          snapshot: {
            params: {},
            paramMap: { get: () => null, has: () => false },
          },
        },
      },
    ],
  });
}

describe('AdminContainerComponent', () => {
  beforeEach(() => {
    // Ensure appTitle element exists for each test
    if (!document.getElementById('appTitle')) {
      const el = document.createElement('div');
      el.id = 'appTitle';
      document.body.appendChild(el);
    }
  });

  it('should create the component', async () => {
    const { fixture } = await renderAdmin();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the Administration header', async () => {
    await renderAdmin();
    expect(screen.getByText('Administration')).toBeInTheDocument();
  });

  it('should display version information from the API', async () => {
    const { fixture } = await renderAdmin();
    fixture.detectChanges();
    expect(fixture.componentInstance.apiVersion).toBe('1.0.0');
  });

  it('should show Users nav item when user has ViewUsers permission', async () => {
    await renderAdmin({
      permissions: [SystemPermission.ViewUsers],
    });
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('should hide Users nav item when user lacks ViewUsers permission', async () => {
    await renderAdmin({ permissions: [] });
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('should show Roles nav item when user has ViewRoles permission', async () => {
    await renderAdmin({
      permissions: [SystemPermission.ViewRoles],
    });
    expect(screen.getByText('Roles')).toBeInTheDocument();
  });

  it('should show Groups nav item when user has ViewGroups permission', async () => {
    await renderAdmin({
      permissions: [SystemPermission.ViewGroups],
    });
    expect(screen.getByText('Groups')).toBeInTheDocument();
  });

  it('should show Collections nav item when collections exist', async () => {
    await renderAdmin({ hasCollections: true });
    expect(screen.getByText('Collections')).toBeInTheDocument();
  });

  it('should show Collections nav item when user can create collections', async () => {
    await renderAdmin({
      permissions: [SystemPermission.CreateCollections],
    });
    expect(screen.getByText('Collections')).toBeInTheDocument();
  });
});
