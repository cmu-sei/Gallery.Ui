// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  ComnAuthQuery,
  ComnAuthService,
  CrucibleThemeService,
  Theme,
} from '@cmusei/crucible-common';
import { renderComponent } from 'src/app/test-utils/render-component';
import { activatedRouteStub } from 'src/app/test-utils/activated-route';
import { AppComponent } from './app.component';

async function renderApp(queryParams: Record<string, string> = {}) {
  const theme$ = new BehaviorSubject<Theme>(Theme.LIGHT);
  const applyTheme = vi.fn();
  const setUserTheme = vi.fn();
  const navigate = vi.fn(() => Promise.resolve(true));
  const route = activatedRouteStub(queryParams);
  const rendered = await renderComponent(AppComponent, {
    declarations: [AppComponent],
    // comn-header-bar comes from the common library's module.
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
      {
        provide: CrucibleThemeService,
        useValue: { applyTheme } satisfies Pick<
          CrucibleThemeService,
          'applyTheme'
        >,
      },
      {
        provide: ComnAuthQuery,
        useValue: { userTheme$: theme$.asObservable() } satisfies Pick<
          ComnAuthQuery,
          'userTheme$'
        >,
      },
      {
        provide: ComnAuthService,
        useValue: { setUserTheme } satisfies Pick<
          ComnAuthService,
          'setUserTheme'
        >,
      },
      { provide: ActivatedRoute, useValue: route.route },
      {
        provide: Router,
        useValue: { navigate } satisfies Pick<Router, 'navigate'>,
      },
    ],
  });
  return { ...rendered, theme$, applyTheme, setUserTheme, navigate };
}

describe('AppComponent', () => {
  /**
   * Verifies: the app shell mounts and applies the user's theme.
   * Interacts with: ComnAuthQuery.userTheme$, CrucibleThemeService.applyTheme.
   * Data: light theme, no query params.
   */
  it('applies the user theme on start', async () => {
    const { fixture, applyTheme, setUserTheme } = await renderApp();

    expect(fixture.componentInstance).toBeInstanceOf(AppComponent);
    expect(applyTheme).toHaveBeenCalledWith(Theme.LIGHT);
    expect(setUserTheme).not.toHaveBeenCalled();
  });

  /**
   * Verifies: a ?theme= query param sets the user theme, and a later theme change is written back to the URL.
   * Interacts with: ActivatedRoute.queryParamMap, ComnAuthService.setUserTheme, Router.navigate.
   * Data: ?theme=dark-theme, then userTheme$ emits light.
   */
  it('takes the theme from the URL and writes changes back', async () => {
    const { theme$, setUserTheme, navigate } = await renderApp({
      theme: Theme.DARK,
    });

    expect(setUserTheme).toHaveBeenCalledWith(Theme.DARK);
    theme$.next(Theme.LIGHT);

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { theme: Theme.LIGHT },
      queryParamsHandling: 'merge',
    });
  });
});
