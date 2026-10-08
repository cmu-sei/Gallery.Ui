// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MatTabsModule } from '@angular/material/tabs';
import { renderComponent } from 'src/app/test-utils/render-component';
import { AdminRolesComponent } from './admin-roles.component';

@Component({
  selector: 'app-admin-system-roles',
  template: '',
  standalone: false,
})
class SystemRolesStubComponent {}

@Component({
  selector: 'app-admin-collection-roles',
  template: '',
  standalone: false,
})
class CollectionRolesStubComponent {}

@Component({
  selector: 'app-admin-exhibit-roles',
  template: '',
  standalone: false,
})
class ExhibitRolesStubComponent {}

async function renderAdminRoles() {
  return renderComponent(AdminRolesComponent, {
    imports: [MatTabsModule],
    declarations: [
      AdminRolesComponent,
      SystemRolesStubComponent,
      CollectionRolesStubComponent,
      ExhibitRolesStubComponent,
    ],
  });
}

describe('AdminRolesComponent', () => {
  /**
   * Verifies: the roles page has three tabs and renders only the system roles matrix at first (lazy tab content).
   * Interacts with: mat-tab-group, the three role child stubs.
   * Data: none.
   */
  it('opens on the system roles tab', async () => {
    const { fixture } = await renderAdminRoles();

    expect(
      screen.getAllByRole('tab').map((t) => t.textContent?.trim()),
    ).toEqual(['Roles', 'Collection Roles', 'Exhibit Roles']);
    expect(
      fixture.debugElement.query(By.directive(SystemRolesStubComponent)),
    ).not.toBeNull();
    expect(
      fixture.debugElement.query(By.directive(ExhibitRolesStubComponent)),
    ).toBeNull();
  });

  /**
   * Verifies: choosing the Exhibit Roles tab renders the exhibit roles matrix.
   * Interacts with: mat-tab-group; user-event.
   * Data: none.
   */
  it('switches to the exhibit roles tab', async () => {
    const { fixture } = await renderAdminRoles();

    await userEvent
      .setup()
      .click(screen.getByRole('tab', { name: 'Exhibit Roles' }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.directive(ExhibitRolesStubComponent)),
    ).not.toBeNull();
  });
});
