// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ComnAuthService, Theme } from '@cmusei/crucible-common';
import {
  CollectionPermission,
  ExhibitPermission,
  SystemPermission,
} from 'src/app/generated/api';
import { CurrentUserStore } from 'src/app/data/user/user.store';
import { TopbarComponent } from './topbar.component';
import { TopbarView } from './topbar.models';
import { renderComponent } from 'src/app/test-utils/render-component';
import {
  PermissionGrants,
  permissionDataProviders,
} from 'src/app/test-utils/mock-permission-data.service';

async function renderTopbar(
  overrides: {
    permissions?: SystemPermission[];
    grants?: PermissionGrants;
    topbarView?: TopbarView;
    teams?: { id: string; name: string }[];
  } = {},
) {
  const setUserTheme = vi.fn();
  const logout = vi.fn(() => Promise.resolve());
  const auth: Pick<ComnAuthService, 'setUserTheme' | 'logout'> = {
    setUserTheme,
    logout,
  };

  const rendered = await renderComponent(TopbarComponent, {
    imports: [
      MatToolbarModule,
      MatButtonModule,
      MatIconModule,
      MatMenuModule,
      MatSlideToggleModule,
      MatTooltipModule,
    ],
    declarations: [TopbarComponent],
    providers: [
      ...permissionDataProviders(
        overrides.grants ?? { system: overrides.permissions ?? [] },
      ),
      { provide: ComnAuthService, useValue: auth },
    ],
    componentInputs: {
      title: 'wall',
      topbarView: overrides.topbarView ?? TopbarView.GALLERY_HOME,
      teams: overrides.teams,
      team: overrides.teams?.[0],
    },
  });
  // The user menu only renders once CurrentUserQuery has a user; give it a
  // name so the trigger button has an accessible name.
  TestBed.inject(CurrentUserStore).update({ name: 'Alice', id: 'u1' });
  rendered.fixture.detectChanges();
  return { ...rendered, setUserTheme, logout };
}

async function openUserMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /Alice/ }));
  return user;
}

describe('TopbarComponent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /**
   * Verifies: a user with any system permission sees the Administration item in the user menu.
   * Interacts with: real PermissionDataService (load + canViewAdministration) over stubbed endpoints; mat-menu.
   * Data: ViewUsers only; home view.
   */
  it('shows Administration to a user with a system permission', async () => {
    await renderTopbar({ permissions: [SystemPermission.ViewUsers] });

    await openUserMenu();

    expect(
      screen.getByRole('menuitem', { name: 'Administration' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Exit Administration' }),
    ).not.toBeInTheDocument();
  });

  /**
   * Verifies: a user who manages an exhibit and a collection, but holds no system permission, does not see Administration, only Logout.
   * Interacts with: real PermissionDataService over stubbed endpoints; mat-menu.
   * Data: ManageExhibit on e1 and ManageCollection on c1 (resource-scoped near misses), no system permissions; home view.
   */
  it('hides Administration without a system permission', async () => {
    await renderTopbar({
      grants: {
        exhibit: [
          { exhibitId: 'e1', permissions: [ExhibitPermission.ManageExhibit] },
        ],
        collection: [
          {
            collectionId: 'c1',
            permissions: [CollectionPermission.ManageCollection],
          },
        ],
      },
    });

    await openUserMenu();

    expect(
      screen.queryByRole('menuitem', { name: 'Administration' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Logout' }),
    ).toBeInTheDocument();
  });

  /**
   * Verifies: inside the admin area the menu offers Exit Administration instead of Administration, whatever the permissions.
   * Interacts with: topbarView input; mat-menu.
   * Data: every system permission; GALLERY_ADMIN view.
   */
  it('offers Exit Administration in the admin view', async () => {
    await renderTopbar({
      permissions: Object.values(SystemPermission),
      topbarView: TopbarView.GALLERY_ADMIN,
    });

    await openUserMenu();

    expect(
      screen.getByRole('menuitem', { name: 'Exit Administration' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Administration' }),
    ).not.toBeInTheDocument();
  });

  /**
   * Verifies: choosing Logout calls ComnAuthService.logout.
   * Interacts with: ComnAuthService stub; mat-menu; user-event.
   * Data: default render.
   */
  it('logs out from the user menu', async () => {
    const { logout } = await renderTopbar();

    const user = await openUserMenu();
    await user.click(screen.getByRole('menuitem', { name: 'Logout' }));

    expect(logout).toHaveBeenCalledOnce();
  });

  /**
   * Verifies: the theme toggle switches to dark, through ComnAuthService and the persisted UI state.
   * Interacts with: ComnAuthService.setUserTheme stub, real UIDataService (localStorage).
   * Data: default (light) theme, toggle switched on.
   */
  it('switches to the dark theme and remembers it', async () => {
    const { setUserTheme } = await renderTopbar();
    setUserTheme.mockClear();

    const user = await openUserMenu();
    await user.click(screen.getByRole('switch', { name: 'Dark Theme' }));

    expect(setUserTheme).toHaveBeenCalledWith(Theme.DARK);
    expect(
      JSON.parse(localStorage.getItem('uiState') ?? '{}').selectedTheme,
    ).toBe(Theme.DARK);
  });

  // Text nodes directly inside the toolbar row whose content is a lone "s".
  function strayText(container: Element) {
    return Array.from(
      container.querySelector('mat-toolbar-row')?.childNodes ?? [],
    ).filter(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim() === 's',
    );
  }

  /**
   * Verifies: with a team the topbar shows the team name, followed by a stray "s" text node.
   * Interacts with: teams/team inputs; the toolbar row's direct text nodes.
   * Data: one team, Blue.
   */
  it('shows the current team, with a stray "s" after it', async () => {
    const { container } = await renderTopbar({
      teams: [{ id: 't1', name: 'Blue' }],
    });

    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(strayText(container)).toHaveLength(1);
  });

  /**
   * Verifies: without teams the team block, and with it the stray "s", is not rendered.
   * Interacts with: teams input; the toolbar row's direct text nodes.
   * Data: no teams.
   */
  it('renders no team block without teams', async () => {
    const { container } = await renderTopbar();

    expect(screen.queryByText('Blue')).not.toBeInTheDocument();
    expect(strayText(container)).toHaveLength(0);
  });
});
