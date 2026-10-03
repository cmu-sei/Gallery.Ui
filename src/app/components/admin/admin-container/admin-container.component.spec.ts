// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach, onTestFinished } from 'vitest';
import { Component, Input, Type } from '@angular/core';
import { By } from '@angular/platform-browser';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  Collection,
  CollectionService,
  HealthCheckService,
  SystemPermission,
  User,
  UserService,
} from 'src/app/generated/api';
import { SignalRService } from 'src/app/services/signalr.service';
import { AdminContainerComponent } from './admin-container.component';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { TopbarView } from 'src/app/components/shared/top-bar/topbar.models';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { activatedRouteStub } from 'src/app/test-utils/activated-route';
import { permissionDataProviders } from 'src/app/test-utils/mock-permission-data.service';

@Component({
  selector: 'app-topbar',
  template: '',
  standalone: false,
})
class TopbarStubComponent {
  @Input() title?: string;
  @Input() topbarView?: TopbarView;
}

@Component({
  selector: 'app-admin-collections',
  template: '',
  standalone: false,
})
class AdminCollectionsStubComponent {}

@Component({
  selector: 'app-admin-exhibits',
  template: '',
  standalone: false,
})
class AdminExhibitsStubComponent {
  @Input() userList?: User[];
}

@Component({
  selector: 'app-admin-users',
  template: '',
  standalone: false,
})
class AdminUsersStubComponent {}

@Component({
  selector: 'app-admin-roles',
  template: '',
  standalone: false,
})
class AdminRolesStubComponent {}

@Component({
  selector: 'app-admin-groups',
  template: '',
  standalone: false,
})
class AdminGroupsStubComponent {}

const SECTION_LABELS = ['Collections', 'Exhibits', 'Users', 'Roles', 'Groups'];

// The stub each ?section= value renders in the content area.
const SECTION_STUBS: Record<string, Type<unknown>> = {
  collections: AdminCollectionsStubComponent,
  exhibits: AdminExhibitsStubComponent,
  users: AdminUsersStubComponent,
  roles: AdminRolesStubComponent,
  groups: AdminGroupsStubComponent,
};

async function renderAdmin(
  overrides: {
    permissions?: SystemPermission[];
    section?: string;
    apiVersion?: Observable<string>;
  } = {},
) {
  // Distinct answers per endpoint, so a spec can tell from the real
  // CollectionQuery which of the two loads ran.
  const getCollections = vi.fn(() =>
    of<Collection[]>([{ id: 'all-1', name: 'Every collection' }]),
  );
  const getMyCollections = vi.fn(() =>
    of<Collection[]>([{ id: 'mine-1', name: 'My collection' }]),
  );
  const navigate = vi.fn(() => Promise.resolve(true));
  const router = { navigate } satisfies Pick<Router, 'navigate'>;
  const signalR: Pick<SignalRService, 'startConnection' | 'join'> = {
    startConnection: vi.fn(() => Promise.resolve()),
    join: vi.fn(),
  };
  const route = activatedRouteStub(
    overrides.section ? { section: overrides.section } : {},
  );

  const rendered = await renderComponent(AdminContainerComponent, {
    imports: [
      MatSidenavModule,
      MatToolbarModule,
      MatListModule,
      MatIconModule,
      MatButtonModule,
    ],
    declarations: [
      AdminContainerComponent,
      TopbarStubComponent,
      AdminCollectionsStubComponent,
      AdminExhibitsStubComponent,
      AdminUsersStubComponent,
      AdminRolesStubComponent,
      AdminGroupsStubComponent,
    ],
    providers: [
      ...permissionDataProviders({ system: overrides.permissions ?? [] }),
      { provide: ActivatedRoute, useValue: route.route },
      { provide: Router, useValue: router },
      { provide: SignalRService, useValue: signalR },
      {
        provide: CollectionService,
        useValue: {
          getCollections,
          getMyCollections,
        } satisfies ApiStub<CollectionService>,
      },
      {
        provide: HealthCheckService,
        useValue: {
          getVersion: vi.fn(() => overrides.apiVersion ?? of('1.9.0+abc123')),
        } satisfies ApiStub<HealthCheckService>,
      },
      {
        provide: UserService,
        useValue: {
          getUsers: vi.fn(() => of([])),
        } satisfies ApiStub<UserService>,
      },
    ],
  });
  return { ...rendered, getCollections, getMyCollections, navigate, signalR };
}

function visibleSections() {
  return SECTION_LABELS.filter((label) => screen.queryByText(label) !== null);
}

describe('AdminContainerComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    // The constructor writes the window title into #appTitle (index.html's
    // <title>); jsdom's document has none, so provide one.
    const title = document.createElement('span');
    title.id = 'appTitle';
    document.body.appendChild(title);
    onTestFinished(() => title.remove());
  });

  /**
   * Verifies: each sidebar section appears only with its permission(s); a related permission (Manage* for Users, Roles and Groups, the other content area for Collections and Exhibits) does not reveal it.
   * Interacts with: real PermissionDataService (hasPermission) over stubbed endpoints.
   * Data: one row per single system permission and the sections it should reveal, plus every permission at once.
   */
  it.each<{
    label: string;
    permissions: SystemPermission[];
    expected: string[];
  }>([
    ...(
      [
        [SystemPermission.ViewCollections, ['Collections']],
        [SystemPermission.EditCollections, ['Collections']],
        [SystemPermission.ManageCollections, ['Collections']],
        [SystemPermission.CreateCollections, ['Collections']],
        [SystemPermission.ViewExhibits, ['Exhibits']],
        [SystemPermission.EditExhibits, ['Exhibits']],
        [SystemPermission.ManageExhibits, ['Exhibits']],
        [SystemPermission.CreateExhibits, ['Exhibits']],
        [SystemPermission.ViewUsers, ['Users']],
        [SystemPermission.ManageUsers, []],
        [SystemPermission.ViewRoles, ['Roles']],
        [SystemPermission.ManageRoles, []],
        [SystemPermission.ViewGroups, ['Groups']],
        [SystemPermission.ManageGroups, []],
      ] satisfies [SystemPermission, string[]][]
    ).map(([permission, expected]) => ({
      label: permission,
      permissions: [permission],
      expected,
    })),
    {
      label: 'everything',
      permissions: Object.values(SystemPermission),
      expected: SECTION_LABELS,
    },
  ])('with $label shows $expected', async ({ permissions, expected }) => {
    await renderAdmin({ permissions });

    expect(visibleSections()).toEqual(expected);
  });

  /**
   * Verifies: with no section in the URL, the collections section renders when the user has collection access.
   * Interacts with: section query param (absent), AdminCollectionsStubComponent.
   * Data: ViewCollections.
   */
  it('renders the collections section by default', async () => {
    const { fixture } = await renderAdmin({
      permissions: [SystemPermission.ViewCollections],
    });

    expect(
      fixture.debugElement.query(By.directive(AdminCollectionsStubComponent)),
    ).not.toBeNull();
  });

  /**
   * Verifies: the default collections section is not rendered for a user without collection access.
   * Interacts with: section query param (absent), AdminCollectionsStubComponent.
   * Data: ViewExhibits only (the neighbouring content permission).
   */
  it('renders no default section without collection access', async () => {
    const { fixture } = await renderAdmin({
      permissions: [SystemPermission.ViewExhibits],
    });

    expect(
      fixture.debugElement.query(By.directive(AdminCollectionsStubComponent)),
    ).toBeNull();
  });

  /**
   * Verifies: a section named in the URL renders its content only with a permission its gate accepts, so the URL alone cannot open it.
   * Interacts with: section query param, the section stub components, real PermissionDataService.
   * Data: one granting row per branch of each content gate, and one near miss (a related permission the gate does not accept) per section.
   */
  it.each<[string, SystemPermission, boolean]>([
    ['collections', SystemPermission.ViewCollections, true],
    ['collections', SystemPermission.CreateCollections, true],
    ['collections', SystemPermission.ViewExhibits, false],
    ['exhibits', SystemPermission.ViewExhibits, true],
    ['exhibits', SystemPermission.CreateExhibits, true],
    ['exhibits', SystemPermission.ViewCollections, false],
    ['users', SystemPermission.ViewUsers, true],
    ['users', SystemPermission.ManageUsers, false],
    ['roles', SystemPermission.ViewRoles, true],
    ['roles', SystemPermission.ManageRoles, false],
    ['groups', SystemPermission.ViewGroups, true],
    ['groups', SystemPermission.ManageGroups, false],
  ])(
    '?section=%s with %s renders the section content: %s',
    async (section, permission, shown) => {
      const { fixture } = await renderAdmin({
        permissions: [permission],
        section,
      });

      const stub = fixture.debugElement.query(
        By.directive(SECTION_STUBS[section]),
      );
      expect(stub !== null).toBe(shown);
    },
  );

  /**
   * Verifies: users with system-wide collection/exhibit access load every collection into the store; others load only their own.
   * Interacts with: CollectionService.getCollections / getMyCollections via the real CollectionDataService, real CollectionQuery.
   * Data: each endpoint answers with a different collection; ViewExhibits loads all, CreateCollections alone loads mine.
   */
  it.each<[SystemPermission, string[]]>([
    [SystemPermission.ViewExhibits, ['all-1']],
    [SystemPermission.CreateCollections, ['mine-1']],
  ])('with %s stores collections %j', async (permission, ids) => {
    await renderAdmin({ permissions: [permission] });

    expect(
      TestBed.inject(CollectionQuery)
        .getAll()
        .map((c) => c.id),
    ).toEqual(ids);
  });

  /**
   * Verifies: clicking a sidebar section writes it to the query string.
   * Interacts with: Router.navigate stub; user-event.
   * Data: every permission; the Groups item clicked.
   */
  it('navigates to the clicked section', async () => {
    const { navigate } = await renderAdmin({
      permissions: Object.values(SystemPermission),
    });

    await userEvent.setup().click(screen.getByText('Groups'));

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { section: 'groups' },
      queryParamsHandling: 'merge',
    });
  });

  /**
   * Verifies: the admin area opens the hub in the admin group, joins once the connection resolves, and shows the API version without its build suffix.
   * Interacts with: SignalRService stub, HealthCheckService.getVersion.
   * Data: API version '1.9.0+abc123'.
   */
  it('connects to the admin hub and shows the API version', async () => {
    const { signalR, fixture } = await renderAdmin({
      permissions: [SystemPermission.ViewUsers],
    });

    expect(signalR.startConnection).toHaveBeenCalledWith('Admin');
    await fixture.whenStable();
    expect(signalR.join).toHaveBeenCalledOnce();
    expect(screen.getByText(/API 1\.9\.0$/)).toBeInTheDocument();
  });

  /**
   * Verifies: a failed version request shows 'ERROR!' as the API version.
   * Interacts with: HealthCheckService.getVersion (throws).
   * Data: a 503 from the health endpoint. apiVersion also starts as 'ERROR!', so the text alone cannot tell the branches apart; what proves the error callback exists is that the failure does not escape as an unhandled RxJS error (which would fail the run).
   */
  it('shows ERROR! when the API version cannot be fetched', async () => {
    await renderAdmin({
      permissions: [SystemPermission.ViewUsers],
      apiVersion: throwError(() => new Error('503')),
    });

    expect(screen.getByText(/API ERROR!$/)).toBeInTheDocument();
  });
});
