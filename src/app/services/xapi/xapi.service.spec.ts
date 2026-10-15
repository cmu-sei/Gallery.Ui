// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { XApiService as GeneratedXApiService } from 'src/app/generated/api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub, endpointStub } from 'src/app/test-utils/api-stub';
import { recordEmissions } from 'src/app/test-utils/record-emissions';
import { XApiService } from './xapi.service';

type Statement = keyof Pick<
  XApiService,
  | 'viewedArticle'
  | 'previewedArticle'
  | 'viewedCard'
  | 'viewedExhibitWall'
  | 'viewedExhibitArchive'
  | 'observedExhibitArchive'
  | 'observedExhibitWall'
>;

// Each app method forwards its arguments to the generated method of the same name.
const STATEMENTS: { method: Statement; args: string[] }[] = [
  { method: 'viewedArticle', args: ['e1', 'a1'] },
  { method: 'previewedArticle', args: ['e1', 'a1'] },
  { method: 'viewedCard', args: ['e1', 'c1'] },
  { method: 'viewedExhibitWall', args: ['e1'] },
  { method: 'viewedExhibitArchive', args: ['e1'] },
  { method: 'observedExhibitArchive', args: ['e1', 't1'] },
  { method: 'observedExhibitWall', args: ['e1', 't1'] },
];

function setup(
  settings: { XApiEnabled?: boolean },
  api?: ApiStub<GeneratedXApiService>,
) {
  const settingsService: Pick<ComnSettingsService, 'settings'> = { settings };
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      // The real service under test, in place of the defaults' placeholder.
      XApiService,
      { provide: ComnSettingsService, useValue: settingsService },
      // Without `api` the default unstubbed placeholder stays, so any call to
      // the generated service throws.
      ...(api ? [{ provide: GeneratedXApiService, useValue: api }] : []),
    ]),
  });
  return TestBed.inject(XApiService);
}

function send(
  service: XApiService,
  method: Statement,
  args: string[],
): Observable<unknown> {
  return (service[method] as (...a: string[]) => Observable<unknown>).apply(
    service,
    args,
  );
}

describe('XApiService', () => {
  /**
   * Verifies: with xAPI enabled, each statement method calls the generated endpoint of the same name with its arguments and emits the API's answer.
   * Interacts with: the generated XApiService endpoint (stubbed), ComnSettingsService.settings.XApiEnabled.
   * Data: XApiEnabled true; per row, the method and its exhibit, article, card or team ids.
   */
  it.each(STATEMENTS)(
    '$method sends the statement when xAPI is enabled',
    ({ method, args }) => {
      const endpoint = vi.fn(() => of({ stored: method }));
      const service = setup(
        { XApiEnabled: true },
        endpointStub(GeneratedXApiService, method, endpoint),
      );

      const seen = recordEmissions(send(service, method, args));

      expect(endpoint).toHaveBeenCalledExactlyOnceWith(...args);
      expect(seen).toEqual([{ stored: method }]);
    },
  );

  /**
   * Verifies: with xAPI disabled, each statement method emits null without touching the generated service.
   * Interacts with: the generated XApiService (unstubbed placeholder: any use throws), ComnSettingsService.settings.XApiEnabled.
   * Data: XApiEnabled false; per row, the method and its ids.
   */
  it.each(STATEMENTS)(
    '$method sends nothing when xAPI is disabled',
    ({ method, args }) => {
      const service = setup({ XApiEnabled: false });

      expect(recordEmissions(send(service, method, args))).toEqual([null]);
    },
  );

  /**
   * Verifies: a settings file without XApiEnabled leaves xAPI disabled.
   * Interacts with: the generated XApiService (unstubbed placeholder), ComnSettingsService.settings.
   * Data: settings with no XApiEnabled key.
   */
  it('sends nothing when the settings do not set XApiEnabled', () => {
    const service = setup({});

    expect(recordEmissions(service.viewedArticle('e1', 'a1'))).toEqual([null]);
  });

  /**
   * Verifies: the enabled flag is read once, when the service is built, so a later settings change has no effect.
   * Interacts with: ComnSettingsService.settings (mutated after construction), the generated XApiService (unstubbed placeholder).
   * Data: XApiEnabled false at construction, then set true.
   */
  it('keeps the enabled flag it read at construction', () => {
    const settings = { XApiEnabled: false };
    const service = setup(settings);

    settings.XApiEnabled = true;

    expect(recordEmissions(service.viewedExhibitWall('e1'))).toEqual([null]);
  });

  /**
   * Verifies: a failed statement is logged as an xAPI tracking error and turned into a null emission, so the caller's subscription completes normally.
   * Interacts with: the generated XApiService endpoint (fails), console.error (spied).
   * Data: XApiEnabled true; per row, the method; the endpoint answers a 500.
   */
  it.each(STATEMENTS)(
    '$method logs a failed statement and emits null',
    ({ method, args }) => {
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failure = new HttpErrorResponse({ status: 500 });
      const service = setup(
        { XApiEnabled: true },
        endpointStub(
          GeneratedXApiService,
          method,
          vi.fn(() => throwError(() => failure)),
        ),
      );
      let completed = false;
      const seen: unknown[] = [];

      send(service, method, args).subscribe({
        next: (value) => seen.push(value),
        complete: () => (completed = true),
      });

      expect(seen).toEqual([null]);
      expect(completed).toBe(true);
      expect(errors.mock.calls).toEqual([['xAPI tracking error:', failure]]);
    },
  );
});
