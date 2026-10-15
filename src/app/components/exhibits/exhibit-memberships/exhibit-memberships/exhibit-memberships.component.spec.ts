// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import {
  ExhibitMembership,
  ExhibitMembershipsService,
  ExhibitPermission,
  ExhibitRole,
  ExhibitRolesService,
  Group,
  GroupService,
  SystemPermission,
  User,
  UserService,
} from 'src/app/generated/api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import {
  PermissionGrants,
  permissionDataProviders,
} from 'src/app/test-utils/mock-permission-data.service';
import { ExhibitMembershipsComponent } from './exhibit-memberships.component';

@Component({
  selector: 'app-exhibit-membership-list',
  template: '',
  standalone: false,
})
class MembershipListStubComponent {
  @Input() users?: User[];
  @Input() groups?: Group[];
  @Input() canEdit?: boolean | null;
  @Output() createMembership = new EventEmitter<ExhibitMembership>();
}

@Component({
  selector: 'app-exhibit-member-list',
  template: '',
  standalone: false,
})
class MemberListStubComponent {
  @Input() memberships?: ExhibitMembership[];
  @Input() users?: User[];
  @Input() groups?: Group[];
  @Input() roles?: ExhibitRole[];
  @Input() canEdit?: boolean | null;
  @Output() deleteMembership = new EventEmitter<string>();
  @Output() editMembership = new EventEmitter<ExhibitMembership>();
}

const USERS: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];
const GROUPS: Group[] = [
  { id: 'g1', name: 'Analysts' },
  { id: 'g2', name: 'Blue Cell' },
];
const MEMBERSHIPS: ExhibitMembership[] = [
  { id: 'm1', exhibitId: 'e1', userId: 'u1', roleId: 'r1' },
  { id: 'm2', exhibitId: 'e1', groupId: 'g2', roleId: 'r1' },
];

async function renderMemberships(grants: PermissionGrants) {
  const membershipsApi = {
    getAllExhibitMemberships: vi.fn(() => of(structuredClone(MEMBERSHIPS))),
    createExhibitMembership: vi.fn((id: string, m: ExhibitMembership) =>
      of({ ...m, id: 'm3' }),
    ),
    updateExhibitMembership: vi.fn((id: string, m: ExhibitMembership) =>
      of({ ...MEMBERSHIPS[0], ...m }),
    ),
    deleteExhibitMembership: vi.fn(() => of(undefined)),
  } satisfies ApiStub<ExhibitMembershipsService>;
  const rendered = await renderComponent(ExhibitMembershipsComponent, {
    declarations: [
      ExhibitMembershipsComponent,
      MembershipListStubComponent,
      MemberListStubComponent,
    ],
    providers: [
      ...permissionDataProviders(grants),
      { provide: ExhibitMembershipsService, useValue: membershipsApi },
      {
        provide: UserService,
        useValue: {
          getUsers: vi.fn(() => of(structuredClone(USERS))),
        } satisfies ApiStub<UserService>,
      },
      {
        provide: GroupService,
        useValue: {
          getAllGroups: vi.fn(() => of(structuredClone(GROUPS))),
        } satisfies ApiStub<GroupService>,
      },
      {
        provide: ExhibitRolesService,
        useValue: {
          getAllExhibitRoles: vi.fn(() =>
            of<ExhibitRole[]>([{ id: 'r1', name: 'Member' }]),
          ),
        } satisfies ApiStub<ExhibitRolesService>,
      },
    ],
    componentInputs: { exhibitId: 'e1' },
  });
  rendered.fixture.detectChanges();
  const stub = <T>(type: new (...args: never[]) => T) =>
    rendered.fixture.debugElement.query(By.directive(type))
      .componentInstance as T;
  return {
    ...rendered,
    membershipsApi,
    available: () => stub(MembershipListStubComponent),
    members: () => stub(MemberListStubComponent),
  };
}

describe('ExhibitMembershipsComponent', () => {
  /**
   * Verifies: users and groups are split into members and non-members of the exhibit, with the roles passed to the member list.
   * Interacts with: ExhibitMembershipsService, UserService, GroupService, ExhibitRolesService through the real data services; the two list stubs.
   * Data: Alice (user member) and Blue Cell (group member); EditExhibit on e1.
   */
  it('splits users and groups into members and others', async () => {
    const { available, members } = await renderMemberships({
      exhibit: [
        { exhibitId: 'e1', permissions: [ExhibitPermission.EditExhibit] },
      ],
    });

    expect(members().users?.map((u) => u.name)).toEqual(['Alice']);
    expect(members().groups?.map((g) => g.name)).toEqual(['Blue Cell']);
    expect(members().roles?.map((r) => r.name)).toEqual(['Member']);
    expect(available().users?.map((u) => u.name)).toEqual(['Bob']);
    expect(available().groups?.map((g) => g.name)).toEqual(['Analysts']);
  });

  /**
   * Verifies: both lists get canEdit true for EditExhibit on this exhibit or the system EditExhibits permission, and false for near misses (View or Manage on this exhibit, Edit on another exhibit, a neighbouring system permission).
   * Interacts with: real PermissionDataService.canEditExhibit, the two list stubs' canEdit inputs.
   * Data: one grant set per row and the canEdit both lists should get.
   */
  it.each(
    (
      [
        [
          'EditExhibit on e1',
          {
            exhibit: [
              { exhibitId: 'e1', permissions: [ExhibitPermission.EditExhibit] },
            ],
          },
          true,
        ],
        [
          'system EditExhibits',
          { system: [SystemPermission.EditExhibits] },
          true,
        ],
        [
          'ViewExhibit on e1',
          {
            exhibit: [
              { exhibitId: 'e1', permissions: [ExhibitPermission.ViewExhibit] },
            ],
          },
          false,
        ],
        [
          'ManageExhibit on e1',
          {
            exhibit: [
              {
                exhibitId: 'e1',
                permissions: [ExhibitPermission.ManageExhibit],
              },
            ],
          },
          false,
        ],
        [
          'EditExhibit on e2',
          {
            exhibit: [
              { exhibitId: 'e2', permissions: [ExhibitPermission.EditExhibit] },
            ],
          },
          false,
        ],
        [
          'system ViewExhibits',
          { system: [SystemPermission.ViewExhibits] },
          false,
        ],
      ] satisfies [string, PermissionGrants, boolean][]
    ).map(([label, grants, expected]) => ({ label, grants, expected })),
  )('with $label passes canEdit $expected', async ({ grants, expected }) => {
    const { available, members } = await renderMemberships(grants);

    expect(available().canEdit).toBe(expected);
    expect(members().canEdit).toBe(expected);
  });

  /**
   * Verifies: a user without edit rights on the exhibit (View only) gets read-only lists.
   * Interacts with: real PermissionDataService, the two list stubs.
   * Data: ViewExhibit on e1 and EditExhibit on e2 (near misses).
   */
  it('passes canEdit false without EditExhibit on this exhibit', async () => {
    const { available, members } = await renderMemberships({
      exhibit: [
        { exhibitId: 'e1', permissions: [ExhibitPermission.ViewExhibit] },
        { exhibitId: 'e2', permissions: [ExhibitPermission.EditExhibit] },
      ],
    });

    expect(available().canEdit).toBe(false);
    expect(members().canEdit).toBe(false);
  });

  /**
   * Verifies: the list outputs create (with the exhibit id), edit and delete memberships through the API, and the lists follow.
   * Interacts with: ExhibitMembershipsService create/update/delete via the real ExhibitMembershipDataService.
   * Data: Bob added, m1 given role r2, then m1 removed.
   */
  it('creates, edits and deletes memberships', async () => {
    const { fixture, membershipsApi, available, members } =
      await renderMemberships({
        system: [SystemPermission.EditExhibits],
      });

    available().createMembership.emit({ userId: 'u2' });
    fixture.detectChanges();
    expect(membershipsApi.createExhibitMembership).toHaveBeenCalledWith('e1', {
      userId: 'u2',
      exhibitId: 'e1',
    });
    expect(members().users?.map((u) => u.name)).toEqual(['Alice', 'Bob']);

    members().editMembership.emit({ id: 'm1', roleId: 'r2' });
    expect(membershipsApi.updateExhibitMembership).toHaveBeenCalledWith('m1', {
      id: 'm1',
      roleId: 'r2',
    });

    members().deleteMembership.emit('m1');
    fixture.detectChanges();
    expect(membershipsApi.deleteExhibitMembership).toHaveBeenCalledWith('m1');
    expect(members().users?.map((u) => u.name)).toEqual(['Bob']);
  });
});
