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
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import {
  CollectionPermission,
  Exhibit,
  ExhibitPermission,
  ExhibitService,
  SystemPermission,
  Team,
  TeamService,
  TeamUserService,
} from 'src/app/generated/api';
import { CollectionStore } from 'src/app/data/collection/collection.store';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import {
  PermissionGrants,
  permissionDataProviders,
} from 'src/app/test-utils/mock-permission-data.service';
import { AdminExhibitsComponent } from './admin-exhibits.component';

@Component({ selector: 'app-admin-teams', template: '', standalone: false })
class AdminTeamsStubComponent {
  @Input() exhibitId?: string;
  @Input() canEdit?: boolean;
}

@Component({
  selector: 'app-admin-team-cards',
  template: '',
  standalone: false,
})
class AdminTeamCardsStubComponent {
  @Input() teamList?: Team[];
  @Input() collectionId?: string;
  @Input() exhibitId?: string;
  @Input() canEdit?: boolean;
}

@Component({
  selector: 'app-admin-exhibit-articles',
  template: '',
  standalone: false,
})
class AdminExhibitArticlesStubComponent {
  @Input() exhibit?: Exhibit;
  @Input() teamList?: Team[];
  @Input() canEdit?: boolean;
}

@Component({ selector: 'app-admin-observers', template: '', standalone: false })
class AdminObserversStubComponent {
  @Input() exhibitId?: string;
  @Input() canEdit?: boolean;
}

@Component({
  selector: 'app-exhibit-memberships',
  template: '',
  standalone: false,
})
class ExhibitMembershipsStubComponent {
  @Input() exhibitId?: string | null;
  @Input() embedded?: boolean;
}

const EXHIBIT: Exhibit = {
  id: 'x1',
  name: 'Drill',
  collectionId: 'c1',
  currentMove: 0,
  currentInject: 0,
  dateCreated: new Date('2026-01-01'),
};

async function renderExhibits(grants: PermissionGrants) {
  const exhibitApi = {
    getCollectionExhibits: vi.fn(() => of([structuredClone(EXHIBIT)])),
    getExhibit: vi.fn(() => of(structuredClone(EXHIBIT))),
    copyExhibit: vi.fn(() =>
      of({ ...structuredClone(EXHIBIT), id: 'x2', name: 'Drill copy' }),
    ),
    deleteExhibit: vi.fn(() => of(undefined)),
  } satisfies ApiStub<ExhibitService>;
  const confirm = vi.fn(() => dialogRefStub<unknown, boolean>(true).dialogRef);
  const rendered = await renderComponent(AdminExhibitsComponent, {
    imports: [
      MatButtonModule,
      MatCardModule,
      MatDialogModule,
      MatExpansionModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatPaginatorModule,
      MatProgressSpinnerModule,
      MatSelectModule,
      MatSortModule,
      MatTableModule,
    ],
    declarations: [
      AdminExhibitsComponent,
      AdminTeamsStubComponent,
      AdminTeamCardsStubComponent,
      AdminExhibitArticlesStubComponent,
      AdminObserversStubComponent,
      ExhibitMembershipsStubComponent,
    ],
    providers: [
      ...permissionDataProviders(grants),
      { provide: ExhibitService, useValue: exhibitApi },
      {
        provide: TeamService,
        useValue: {
          getTeamsByExhibit: vi.fn(() => of<Team[]>([])),
        } satisfies ApiStub<TeamService>,
      },
      {
        provide: TeamUserService,
        useValue: {
          getExhibitTeamUsers: vi.fn(() => of([])),
        } satisfies ApiStub<TeamUserService>,
      },
      {
        provide: CrucibleDialogService,
        useValue: { confirm } satisfies Pick<CrucibleDialogService, 'confirm'>,
      },
    ],
    componentInputs: { userList: [] },
    configureTestBed: () => {
      const collections = TestBed.inject(CollectionStore);
      collections.set([{ id: 'c1', name: 'Exercise' }]);
      collections.setActive('c1');
    },
  });
  const stub = <T>(type: new (...args: never[]) => T) =>
    rendered.fixture.debugElement.query(By.directive(type))
      ?.componentInstance as T | undefined;
  return { ...rendered, exhibitApi, confirm, stub };
}

function exhibitNames() {
  return Array.from(
    document.querySelectorAll('tr.element-row td:nth-child(2)'),
  ).map((c) => c.textContent?.trim());
}

const BUTTONS = [
  'Add Exhibit',
  'Upload Exhibit',
  'Copy Drill',
  'Edit Drill',
  'Delete Drill',
];

/** The titles of the enabled exhibit buttons, in BUTTONS order. */
function enabledButtons() {
  return BUTTONS.filter(
    (t) => !(screen.getByTitle(t) as HTMLButtonElement).disabled,
  );
}

const exhibitGrant = (
  exhibitId: string,
  ...permissions: ExhibitPermission[]
): PermissionGrants => ({
  exhibit: [{ exhibitId, permissions }],
});

describe('AdminExhibitsComponent', () => {
  /**
   * Verifies: the active collection's exhibits load and are listed.
   * Interacts with: ExhibitService.getCollectionExhibits via the real ExhibitDataService, real CollectionQuery active id.
   * Data: collection c1 active; exhibit Drill.
   */
  it("lists the active collection's exhibits", async () => {
    const { exhibitApi } = await renderExhibits({
      system: [SystemPermission.ViewExhibits],
    });

    expect(exhibitApi.getCollectionExhibits).toHaveBeenCalledWith('c1');
    expect(
      within(screen.getByRole('table')).getByText('Drill'),
    ).toBeInTheDocument();
  });

  /**
   * Verifies: Add, Upload and Copy follow CreateExhibits or ManageCollection on the collection, Edit follows edit rights on the exhibit, Delete manage rights; near misses enable nothing.
   * Interacts with: real PermissionDataService (hasPermission, canManageCollection, canEditExhibit, canManageExhibit).
   * Data: one grant set per row and the exact list of enabled buttons.
   */
  it.each(
    (
      [
        [
          'system CreateExhibits',
          { system: [SystemPermission.CreateExhibits] },
          ['Add Exhibit', 'Upload Exhibit', 'Copy Drill'],
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
          ['Add Exhibit', 'Upload Exhibit', 'Copy Drill'],
        ],
        [
          'system EditExhibits',
          { system: [SystemPermission.EditExhibits] },
          ['Edit Drill'],
        ],
        [
          'EditExhibit on x1',
          exhibitGrant('x1', ExhibitPermission.EditExhibit),
          ['Edit Drill'],
        ],
        [
          'ManageExhibit on x1',
          exhibitGrant('x1', ExhibitPermission.ManageExhibit),
          ['Delete Drill'],
        ],
        [
          'ViewExhibit on x1',
          exhibitGrant('x1', ExhibitPermission.ViewExhibit),
          [],
        ],
        [
          'Edit and Manage on x2',
          exhibitGrant(
            'x2',
            ExhibitPermission.EditExhibit,
            ExhibitPermission.ManageExhibit,
          ),
          [],
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
          [],
        ],
        [
          'system ViewExhibits',
          { system: [SystemPermission.ViewExhibits] },
          [],
        ],
      ] satisfies [string, PermissionGrants, string[]][]
    ).map(([label, grants, expected]) => ({ label, grants, expected })),
  )('with $label enables $expected', async ({ grants, expected }) => {
    await renderExhibits(grants);

    expect(enabledButtons()).toEqual(expected);
  });

  /**
   * Verifies: opening an exhibit the user manages shows the Memberships panel and passes canEdit true to the four child panels.
   * Interacts with: toggleExpand (canManageExhibit), the child stubs' canEdit inputs.
   * Data: EditExhibit and ManageExhibit on x1.
   */
  it('opens a managed exhibit with memberships and editable panels', async () => {
    const { stub } = await renderExhibits(
      exhibitGrant(
        'x1',
        ExhibitPermission.EditExhibit,
        ExhibitPermission.ManageExhibit,
      ),
    );

    await userEvent
      .setup()
      .click(within(screen.getByRole('table')).getByText('Drill'));

    expect(stub(ExhibitMembershipsStubComponent)?.exhibitId).toBe('x1');
    expect([
      stub(AdminTeamsStubComponent)?.canEdit,
      stub(AdminTeamCardsStubComponent)?.canEdit,
      stub(AdminExhibitArticlesStubComponent)?.canEdit,
      stub(AdminObserversStubComponent)?.canEdit,
    ]).toEqual([true, true, true, true]);
  });

  /**
   * Verifies: opening an exhibit the user can only view (a near miss) hides the Memberships panel and passes canEdit false to the child panels.
   * Interacts with: toggleExpand, the child stubs' canEdit inputs.
   * Data: ViewExhibit and ParticipateExhibit on x1.
   */
  it('opens a view-only exhibit without memberships and read-only panels', async () => {
    const { stub } = await renderExhibits(
      exhibitGrant(
        'x1',
        ExhibitPermission.ViewExhibit,
        ExhibitPermission.ParticipateExhibit,
      ),
    );

    await userEvent
      .setup()
      .click(within(screen.getByRole('table')).getByText('Drill'));

    expect(stub(ExhibitMembershipsStubComponent)).toBeUndefined();
    expect(stub(AdminTeamsStubComponent)?.canEdit).toBe(false);
    expect(stub(AdminTeamCardsStubComponent)?.canEdit).toBe(false);
    expect(stub(AdminExhibitArticlesStubComponent)?.canEdit).toBe(false);
    expect(stub(AdminObserversStubComponent)?.canEdit).toBe(false);
  });

  /**
   * Verifies: Copy copies the exhibit into the list, and Delete deletes it after confirmation and drops it from the list.
   * Interacts with: ExhibitService.copyExhibit / deleteExhibit via the real ExhibitDataService and ExhibitQuery, CrucibleDialogService.confirm stub.
   * Data: system CreateExhibits and ManageExhibits.
   */
  it('copies and deletes exhibits', async () => {
    const { exhibitApi, confirm } = await renderExhibits({
      system: [
        SystemPermission.CreateExhibits,
        SystemPermission.ManageExhibits,
      ],
    });
    const user = userEvent.setup();

    await user.click(screen.getByTitle('Copy Drill'));
    expect(exhibitApi.copyExhibit).toHaveBeenCalledWith('x1');
    expect(exhibitNames().sort()).toEqual(['Drill', 'Drill copy']);

    await user.click(screen.getByTitle('Delete Drill'));
    expect(confirm).toHaveBeenCalledOnce();
    expect(exhibitApi.deleteExhibit).toHaveBeenCalledWith('x1');
    expect(exhibitNames()).toEqual(['Drill copy']);
  });
});
