// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import {
  SystemRole,
  SystemRolesService,
  User,
  UserService,
} from 'src/app/generated/api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { AdminUserListComponent } from './admin-user-list.component';

// Stands in for ngx-clipboard's directive on the copy button. AppModule does
// not import ClipboardModule; same case as 'logs NG0303 for the copy button
// clipboard binding' in admin-groups-membership-list.component.spec.ts.
@Directive({ selector: '[ngxClipboard]', standalone: false })
class ClipboardStubDirective {
  @Input() cbContent?: string;
  @Output() cbOnSuccess = new EventEmitter<unknown>();
}

const USERS: User[] = [
  { id: 'u1', name: 'Alice', roleId: 'r1' },
  { id: 'u2', name: 'Bob', roleId: null },
];

async function renderList(canEdit: boolean, confirmed = true) {
  const userApi = {
    updateUser: vi.fn((id: string, user: User) => of({ ...user })),
  } satisfies ApiStub<UserService>;
  const confirm = vi.fn(
    () => dialogRefStub<unknown, boolean>(confirmed).dialogRef,
  );
  const rendered = await renderComponent(AdminUserListComponent, {
    imports: [
      MatButtonModule,
      MatCardModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatPaginatorModule,
      MatProgressSpinnerModule,
      MatSelectModule,
      MatSortModule,
      MatTableModule,
      MatTooltipModule,
    ],
    declarations: [AdminUserListComponent, ClipboardStubDirective],
    providers: [
      { provide: UserService, useValue: userApi },
      {
        provide: SystemRolesService,
        useValue: {
          getAllSystemRoles: vi.fn(() =>
            of<SystemRole[]>([{ id: 'r1', name: 'Administrator' }]),
          ),
        } satisfies ApiStub<SystemRolesService>,
      },
      {
        provide: CrucibleDialogService,
        useValue: { confirm } satisfies Pick<CrucibleDialogService, 'confirm'>,
      },
    ],
    componentInputs: { users: USERS, isLoading: false, canEdit },
  });
  const deleted: string[] = [];
  const created: User[] = [];
  rendered.fixture.componentInstance.delete.subscribe((id) => deleted.push(id));
  rendered.fixture.componentInstance.create.subscribe((u) => created.push(u));
  const roleSelects = () =>
    TestbedHarnessEnvironment.loader(rendered.fixture).getAllHarnesses(
      // The role selects only, not the paginator's page-size select.
      MatSelectHarness.with({ ancestor: 'table' }),
    );
  return { ...rendered, userApi, confirm, deleted, created, roleSelects };
}

describe('AdminUserListComponent', () => {
  /**
   * Verifies: with canEdit each user has an enabled role select and a Delete button; changing the role saves the user.
   * Interacts with: MatSelectHarness, UserService.updateUser via the real UserDataService, roles from SystemRolesService.
   * Data: Alice (Administrator) and Bob (no role); canEdit true; Bob given Administrator.
   */
  it('edits roles and offers Delete when editing is allowed', async () => {
    const { userApi, roleSelects } = await renderList(true);

    expect(screen.getAllByTitle('Delete User')).toHaveLength(2);
    const [, bob] = await roleSelects();
    expect(await bob.isDisabled()).toBe(false);
    await bob.clickOptions({ text: 'Administrator' });

    expect(userApi.updateUser).toHaveBeenCalledWith('u2', {
      id: 'u2',
      name: 'Bob',
      roleId: 'r1',
    });
  });

  /**
   * Verifies: with canEdit false the role selects are disabled and no Delete buttons render.
   * Interacts with: canEdit input, MatSelectHarness.
   * Data: canEdit false.
   */
  it('hides Delete and locks roles when canEdit is false', async () => {
    const { roleSelects } = await renderList(false);

    expect(screen.queryByTitle('Delete User')).not.toBeInTheDocument();
    const selects = await roleSelects();
    expect(await Promise.all(selects.map((s) => s.isDisabled()))).toEqual([
      true,
      true,
    ]);
  });

  /**
   * Verifies: the Add User button is offered whatever canEdit is, and its form emits create (current behavior).
   * Interacts with: the header Add User button, the new-user inputs, create output; user-event.
   * Data: canEdit false; id 'u3', name 'Carol'.
   */
  it('offers Add User even when canEdit is false', async () => {
    const { created, container } = await renderList(false);
    const user = userEvent.setup();

    // Current behavior; see agent-docs/ui-test-bugs/gallery.ui.md.
    await user.click(screen.getByTitle('Add User'));
    await user.type(screen.getByPlaceholderText('User ID'), 'u3');
    await user.type(screen.getByPlaceholderText('User Name'), 'Carol');
    // The confirm button has only an icon (its tooltip is on the icon).
    const add = container
      .querySelector('mat-icon[fontIcon="mdi-account-plus"]')
      ?.closest('button');
    await user.click(add as HTMLButtonElement);

    expect(created).toEqual([{ id: 'u3', name: 'Carol' }]);
  });

  /**
   * Verifies: Delete asks for confirmation and emits delete only when confirmed.
   * Interacts with: CrucibleDialogService.confirm stub, delete output.
   * Data: canEdit true; confirm answers true, then false.
   */
  it.each([
    [true, ['u1']],
    [false, []],
  ])('with confirmation %s deletes %j', async (confirmed, expected) => {
    const { deleted, confirm } = await renderList(true, confirmed);

    await userEvent
      .setup()
      .click(within(screen.getByRole('table')).getAllByTitle('Delete User')[0]);

    expect(confirm).toHaveBeenCalledOnce();
    expect(deleted).toEqual(expected);
  });
});
