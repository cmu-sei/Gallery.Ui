// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { Exhibit, ExhibitService } from 'src/app/generated/api';
import { ExhibitDataService } from './exhibit-data.service';
import { ExhibitStore } from './exhibit.store';
import { ExhibitQuery } from './exhibit.query';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { activatedRouteStub } from 'src/app/test-utils/activated-route';
import { recordEmissions } from 'src/app/test-utils/record-emissions';

function makeExhibit(overrides: Partial<Exhibit> = {}): Exhibit {
  return {
    id: 'e1',
    name: 'Exercise One',
    collectionId: 'c1',
    createdBy: 'alice',
    currentMove: 0,
    currentInject: 0,
    dateCreated: new Date('2026-01-01T00:00:00Z'),
    dateModified: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  };
}

// What the API actually sends: JSON dates arrive as ISO strings.
function wireExhibit(overrides: Partial<Exhibit> = {}): Exhibit {
  return {
    ...makeExhibit(overrides),
    dateCreated: '2026-01-01T00:00:00Z',
    dateModified: '2026-01-02T00:00:00Z',
    ...overrides,
  } as unknown as Exhibit;
}

function setup(
  overrides: {
    api?: ApiStub<ExhibitService>;
    queryParams?: Record<string, string>;
  } = {},
) {
  const navigate = vi.fn(() => Promise.resolve(true));
  const open = vi.fn();
  const route = activatedRouteStub(overrides.queryParams);
  const router = { navigate } satisfies Pick<Router, 'navigate'>;
  const snackBar: Pick<MatSnackBar, 'open'> = { open };

  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      ...(overrides.api
        ? [{ provide: ExhibitService, useValue: overrides.api }]
        : []),
      { provide: ActivatedRoute, useValue: route.route },
      { provide: Router, useValue: router },
      { provide: MatSnackBar, useValue: snackBar },
    ]),
  });

  return {
    service: TestBed.inject(ExhibitDataService),
    store: TestBed.inject(ExhibitStore),
    query: TestBed.inject(ExhibitQuery),
    setQueryParams: route.setQueryParams,
    navigate,
    open,
  };
}

describe('ExhibitQuery', () => {
  /**
   * Verifies: selectAll() orders exhibits by name and selectById tracks one exhibit.
   * Interacts with: real ExhibitStore and ExhibitQuery, constructed without TestBed.
   * Data: two exhibits set out of name order, then e2 renamed.
   */
  it('sorts by name and tracks a single exhibit by id', () => {
    const store = new ExhibitStore();
    const query = new ExhibitQuery(store);
    store.set([
      makeExhibit({ id: 'e2', name: 'Zulu' }),
      makeExhibit({ id: 'e1', name: 'Alpha' }),
    ]);
    const e2 = recordEmissions(query.selectById('e2'));

    store.update('e2', { name: 'Bravo' });

    expect(query.getAll().map((e) => e.id)).toEqual(['e1', 'e2']);
    expect(e2.map((e) => e.name)).toEqual(['Zulu', 'Bravo']);
  });
});

describe('ExhibitDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    // The service console.logs every load failure; keep test output clean.
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  describe('load()', () => {
    /**
     * Verifies: load() toggles loading around getExhibits and stores the exhibits with their dates parsed into Date objects.
     * Interacts with: ExhibitService.getExhibits (Subject), real ExhibitQuery.
     * Data: one exhibit whose dates arrive as ISO strings.
     */
    it('stores all exhibits with parsed dates', () => {
      const response = new Subject<Exhibit[]>();
      const { service, query } = setup({
        api: { getExhibits: vi.fn(() => response) },
      });

      service.load();
      expect(query.getValue().loading).toBe(true);
      response.next([wireExhibit()]);

      const stored = query.getEntity('e1');
      expect(stored?.dateCreated).toBeInstanceOf(Date);
      expect(stored?.dateCreated.toISOString()).toBe(
        '2026-01-01T00:00:00.000Z',
      );
      expect(query.getValue().loading).toBe(false);
    });

    /**
     * Verifies: an exhibit that was never modified gets a 1970 epoch dateModified rather than null.
     * Interacts with: ExhibitService.getExhibits, setAsDates.
     * Data: one exhibit with dateModified null.
     */
    it('turns a null dateModified into the epoch', () => {
      const { service, query } = setup({
        api: {
          getExhibits: vi.fn(() => of([wireExhibit({ dateModified: null })])),
        },
      });

      service.load();

      // setAsDates() wraps every date in new Date(), and new Date(null) is the
      // epoch. No template renders an exhibit's dateModified, and the wall
      // uses the same "year > 1970" convention for unset dates, so this is
      // pinned as current behavior.
      expect(query.getEntity('e1')?.dateModified?.getTime()).toBe(0);
    });

    /**
     * Verifies: a failed load empties the store and clears loading.
     * Interacts with: ExhibitService.getExhibits (throws), real ExhibitQuery.
     * Data: a store pre-seeded with e1.
     */
    it('empties the store when the request fails', () => {
      const { service, store, query } = setup({
        api: { getExhibits: vi.fn(() => throwError(() => new Error('500'))) },
      });
      store.set([makeExhibit()]);

      service.load();

      expect(query.getCount()).toBe(0);
      expect(query.getValue().loading).toBe(false);
    });
  });

  /**
   * Verifies: loadMine() fills the store from getMyExhibits.
   * Interacts with: ExhibitService.getMyExhibits, real ExhibitQuery.
   * Data: the API returns m1.
   */
  it('loadMine() loads my exhibits', () => {
    const getMyExhibits = vi.fn(() => of([wireExhibit({ id: 'm1' })]));
    const { service, query } = setup({ api: { getMyExhibits } });

    service.loadMine();

    expect(query.getAll().map((e) => e.id)).toEqual(['m1']);
  });

  /**
   * Verifies: a failed loadMine() empties the store and clears loading.
   * Interacts with: ExhibitService.getMyExhibits (throws), real ExhibitQuery.
   * Data: a store pre-seeded with e1.
   */
  it('loadMine() empties the store when the request fails', () => {
    const { service, store, query } = setup({
      api: { getMyExhibits: vi.fn(() => throwError(() => new Error('500'))) },
    });
    store.set([makeExhibit()]);

    service.loadMine();

    expect(query.getCount()).toBe(0);
    expect(query.getValue().loading).toBe(false);
  });

  describe('loadByCollection()', () => {
    /**
     * Verifies: loadByCollection() replaces the store with the collection's exhibits.
     * Interacts with: ExhibitService.getCollectionExhibits, real ExhibitQuery.
     * Data: collection c1 with two exhibits.
     */
    it('loads the exhibits of a collection', () => {
      const getCollectionExhibits = vi.fn(() =>
        of([wireExhibit(), wireExhibit({ id: 'e2', name: 'Two' })]),
      );
      const { service, query } = setup({ api: { getCollectionExhibits } });

      service.loadByCollection('c1');

      expect(getCollectionExhibits).toHaveBeenCalledWith('c1');
      expect(query.getCount()).toBe(2);
    });

    /**
     * Verifies: an empty collection id is ignored: no API call, store and loading untouched.
     * Interacts with: ExhibitService.getCollectionExhibits (must not be called).
     * Data: collection id ''.
     */
    it('does nothing without a collection id', () => {
      const getCollectionExhibits = vi.fn();
      const { service, store, query } = setup({
        api: { getCollectionExhibits },
      });
      store.set([makeExhibit()]);

      service.loadByCollection('');

      expect(getCollectionExhibits).not.toHaveBeenCalled();
      expect(query.getCount()).toBe(1);
    });

    /**
     * Verifies: loadByCollection() empties the store on failure.
     * Interacts with: ExhibitService.getCollectionExhibits (throws).
     * Data: a store pre-seeded with e1.
     */
    it('empties the store when the request fails', () => {
      const { service, store, query } = setup({
        api: {
          getCollectionExhibits: vi.fn(() =>
            throwError(() => new Error('404')),
          ),
        },
      });
      store.set([makeExhibit()]);

      service.loadByCollection('c1');

      expect(query.getCount()).toBe(0);
    });
  });

  /**
   * Verifies: loadMineByCollection() loads through getMyCollectionExhibits.
   * Interacts with: ExhibitService.getMyCollectionExhibits, real ExhibitQuery.
   * Data: collection c1; the API returns m1.
   */
  it('loadMineByCollection() loads my exhibits in a collection', () => {
    const getMyCollectionExhibits = vi.fn(() =>
      of([wireExhibit({ id: 'm1' })]),
    );
    const { service, query } = setup({ api: { getMyCollectionExhibits } });

    service.loadMineByCollection('c1');

    expect(getMyCollectionExhibits).toHaveBeenCalledWith('c1');
    expect(query.getAll().map((e) => e.id)).toEqual(['m1']);
  });

  /**
   * Verifies: a failed loadMineByCollection() empties the store.
   * Interacts with: ExhibitService.getMyCollectionExhibits (throws), real ExhibitQuery.
   * Data: a store pre-seeded with e1.
   */
  it('loadMineByCollection() empties the store when the request fails', () => {
    const { service, store, query } = setup({
      api: {
        getMyCollectionExhibits: vi.fn(() =>
          throwError(() => new Error('500')),
        ),
      },
    });
    store.set([makeExhibit()]);

    service.loadMineByCollection('c1');

    expect(query.getCount()).toBe(0);
  });

  describe('loadById()', () => {
    /**
     * Verifies: loadById() upserts the exhibit alongside existing ones.
     * Interacts with: ExhibitService.getExhibit, real ExhibitQuery.
     * Data: store holds e1; the API returns e2.
     */
    it('upserts the fetched exhibit', () => {
      const getExhibit = vi.fn(() => of(makeExhibit({ id: 'e2' })));
      const { service, store, query } = setup({ api: { getExhibit } });
      store.set([makeExhibit()]);

      service.loadById('e2');

      expect(query.getAll().map((e) => e.id)).toEqual(['e1', 'e2']);
      expect(query.getValue().loading).toBe(false);
    });

    /**
     * Verifies: a missing exhibit clears loading and sends the user home with no query params.
     * Interacts with: ExhibitService.getExhibit (throws), Router.navigate stub.
     * Data: exhibit id 'gone'.
     */
    it('navigates home when the exhibit cannot be loaded', () => {
      const { service, query, navigate } = setup({
        api: { getExhibit: vi.fn(() => throwError(() => new Error('404'))) },
      });

      service.loadById('gone');

      expect(navigate).toHaveBeenCalledWith(['/'], { queryParams: {} });
      expect(query.getValue().loading).toBe(false);
    });
  });

  /**
   * Verifies: add() stores the exhibit the API created.
   * Interacts with: ExhibitService.createExhibit, real ExhibitQuery.
   * Data: a request without an id; the API answers with id 'new'.
   */
  it('add() stores the created exhibit', () => {
    const createExhibit = vi.fn(() => of(makeExhibit({ id: 'new' })));
    const { service, query } = setup({ api: { createExhibit } });

    service.add({ name: 'Exercise One', collectionId: 'c1' });

    expect(query.hasEntity('new')).toBe(true);
  });

  describe('copy()', () => {
    /**
     * Verifies: copy() adds the copy the API returns.
     * Interacts with: ExhibitService.copyExhibit, real ExhibitQuery.
     * Data: store holds e1; the API returns e1-copy.
     */
    it('adds the copied exhibit', () => {
      const copyExhibit = vi.fn(() => of(makeExhibit({ id: 'e1-copy' })));
      const { service, store, query } = setup({ api: { copyExhibit } });
      store.set([makeExhibit()]);

      service.copy('e1');

      expect(copyExhibit).toHaveBeenCalledWith('e1');
      expect(query.getAll().map((e) => e.id)).toEqual(['e1', 'e1-copy']);
    });

    /**
     * Verifies: a failed copy clears loading and leaves the store unchanged.
     * Interacts with: ExhibitService.copyExhibit (throws), real ExhibitQuery.
     * Data: store holds e1; the copy fails with a 403.
     */
    it('clears loading and keeps the store when the copy fails', () => {
      const { service, store, query } = setup({
        api: { copyExhibit: vi.fn(() => throwError(() => new Error('403'))) },
      });
      store.set([makeExhibit()]);

      service.copy('e1');

      expect(query.getAll().map((e) => e.id)).toEqual(['e1']);
      expect(query.getValue().loading).toBe(false);
    });
  });

  /**
   * Verifies: updateExhibit() stores the API's version of the exhibit.
   * Interacts with: ExhibitService.updateExhibit, real ExhibitQuery.
   * Data: e1 advanced to move 2 by the server.
   */
  it('updateExhibit() stores the server response', () => {
    const updateExhibit = vi.fn(() => of(makeExhibit({ currentMove: 2 })));
    const { service, store, query } = setup({ api: { updateExhibit } });
    store.set([makeExhibit()]);

    service.updateExhibit(makeExhibit({ currentMove: 1 }));

    expect(updateExhibit).toHaveBeenCalledWith(
      'e1',
      expect.objectContaining({ currentMove: 1 }),
    );
    expect(query.getEntity('e1')?.currentMove).toBe(2);
  });

  /**
   * Verifies: delete() removes the exhibit after the API call succeeds.
   * Interacts with: ExhibitService.deleteExhibit, real ExhibitQuery.
   * Data: store holds e1 and e2; e1 deleted.
   */
  it('delete() removes the exhibit', () => {
    const deleteExhibit = vi.fn(() => of(undefined));
    const { service, store, query } = setup({ api: { deleteExhibit } });
    store.set([makeExhibit(), makeExhibit({ id: 'e2', name: 'Two' })]);

    service.delete('e1');

    expect(deleteExhibit).toHaveBeenCalledWith('e1');
    expect(query.getAll().map((e) => e.id)).toEqual(['e2']);
  });

  describe('advance()', () => {
    /**
     * Verifies: advance() is cold, holds loading while in flight, and clears it on success without touching the store.
     * Interacts with: ExhibitService.advanceExhibit (Subject), real ExhibitQuery.
     * Data: store holds e1; the API returns e1 at move 1.
     */
    it('clears loading when the advance succeeds', async () => {
      const response = new Subject<Exhibit>();
      const advanceExhibit = vi.fn(() => response);
      const { service, store, query } = setup({ api: { advanceExhibit } });
      store.set([makeExhibit()]);

      const result = firstValueFrom(service.advance('e1'));
      expect(query.getValue().loading).toBe(true);
      response.next(makeExhibit({ currentMove: 1 }));

      expect((await result).currentMove).toBe(1);
      expect(query.getValue().loading).toBe(false);
      // The store is updated by the ExhibitUpdated hub event, not here.
      expect(query.getEntity('e1')?.currentMove).toBe(0);
    });

    /**
     * Verifies: a failed advance clears loading and surfaces the error to the caller.
     * Interacts with: ExhibitService.advanceExhibit (throws), real ExhibitQuery.
     * Data: exhibit e1.
     */
    it('clears loading and rethrows when the advance fails', async () => {
      const { service, query } = setup({
        api: {
          advanceExhibit: vi.fn(() => throwError(() => new Error('409'))),
        },
      });

      await expect(firstValueFrom(service.advance('e1'))).rejects.toThrow(
        '409',
      );
      expect(query.getValue().loading).toBe(false);
    });
  });

  describe('uploadJson()', () => {
    // What uploadJsonFiles emits when called the way admin-exhibits.component.ts:323
    // calls uploadJson(file, 'events', true): one HttpEvent per stage.
    const uploadEvents = (body: Exhibit): HttpEvent<Exhibit>[] => [
      { type: HttpEventType.Sent },
      { type: HttpEventType.UploadProgress, loaded: 50, total: 100 },
      new HttpResponse({ body, status: 200 }),
    ];

    /**
     * Verifies: an upload in 'events' mode (the only mode the app uses) stores nothing, leaves loading set and never reports progress (current behavior).
     * Interacts with: ExhibitService.uploadJsonFiles (Sent, UploadProgress, Response events), real ExhibitQuery, uploadProgress.
     * Data: one row with an empty store (a new import) and one with the uploaded exhibit already stored (a re-import); the Response body renames it 'New'.
     */
    it.each([
      ['a new import', false],
      ['a re-import', true],
    ])(
      'stores nothing and leaves loading set for %s',
      (_case, alreadyStored) => {
        const uploadJsonFiles = vi.fn(() =>
          of(...uploadEvents(makeExhibit({ name: 'New' }))),
        );
        const { service, store, query } = setup({ api: { uploadJsonFiles } });
        const stored = alreadyStored ? [makeExhibit()] : [];
        store.set(stored);
        const progress = recordEmissions(service.uploadProgress);
        const file = new File(['{}'], 'exhibit.json');

        service.uploadJson(file, 'events', true);

        expect(uploadJsonFiles).toHaveBeenCalledWith(file, 'events', true);
        expect(query.getAll()).toEqual(stored);
        expect(query.getValue().loading).toBe(true);
        expect(progress).toEqual([]);
      },
    );

    /**
     * Verifies: a failed upload clears loading, resets progress to 0, and shows the problem title when there is no detail.
     * Interacts with: ExhibitService.uploadJsonFiles (throws), MatSnackBar.open, uploadProgress.
     * Data: an error body with only a title.
     */
    it('reports a failed upload', () => {
      const uploadJsonFiles = vi.fn(() =>
        throwError(() => ({ error: { title: 'Bad Request' } })),
      );
      const { service, query, open } = setup({ api: { uploadJsonFiles } });
      const progress = recordEmissions(service.uploadProgress);

      service.uploadJson(new File(['{}'], 'e.json'), 'events', true);

      expect(query.getValue().loading).toBe(false);
      expect(progress).toEqual([0]);
      expect(open).toHaveBeenCalledWith('Bad Request', 'OK', {
        duration: 5000,
      });
    });
  });

  /**
   * Verifies: setActive() drives getActive(), and updateStore/deleteFromStore upsert and remove.
   * Interacts with: real ExhibitStore/Query.
   * Data: e1 made active, then renamed via updateStore, then deleted.
   */
  it('setActive(), updateStore() and deleteFromStore() drive the query', () => {
    const { service, store, query } = setup();
    store.set([makeExhibit()]);

    service.setActive('e1');
    service.updateStore(makeExhibit({ name: 'Renamed' }));
    expect((query.getActive() as Exhibit).name).toBe('Renamed');

    service.deleteFromStore('e1');
    expect(query.getActive()).toBeUndefined();
  });

  describe('ExhibitList', () => {
    /**
     * Verifies: the exhibitmask query param filters on exhibit id only (not name).
     * Interacts with: ExhibitList, the activatedRouteStub stand-in.
     * Data: mask 'ALPHA' matches no id even though e1 is named Alpha; mask 'e2' matches e2.
     */
    it('filters by exhibitmask on the id only', () => {
      const { service, store, setQueryParams } = setup({
        queryParams: { exhibitmask: 'ALPHA' },
      });
      store.set([
        makeExhibit({ id: 'e1', name: 'Alpha' }),
        makeExhibit({ id: 'e2', name: 'Bravo' }),
      ]);
      const seen = recordEmissions(service.ExhibitList);

      setQueryParams({ exhibitmask: 'E2' });

      expect(seen[0]).toEqual([]);
      expect(seen.at(-1)?.map((e) => e.id)).toEqual(['e2']);
    });

    /**
     * Verifies: sorton=createdBy sorts by author; sortdir=desc reverses it.
     * Interacts with: ExhibitList, the activatedRouteStub stand-in.
     * Data: exhibits created by bob and alice.
     */
    it('sorts by createdBy in either direction', () => {
      const { service, store, setQueryParams } = setup({
        queryParams: { sorton: 'createdBy' },
      });
      store.set([
        makeExhibit({ id: 'e1', name: 'A', createdBy: 'bob' }),
        makeExhibit({ id: 'e2', name: 'B', createdBy: 'alice' }),
      ]);
      const seen = recordEmissions(service.ExhibitList);

      setQueryParams({ sorton: 'createdBy', sortdir: 'desc' });

      expect(seen[0].map((e) => e.createdBy)).toEqual(['alice', 'bob']);
      expect(seen.at(-1)?.map((e) => e.createdBy)).toEqual(['bob', 'alice']);
    });
  });

  /**
   * Verifies: typing in filterControl writes the exhibitmask query param.
   * Interacts with: filterControl.valueChanges, Router.navigate stub.
   * Data: the term 'xyz'.
   */
  it('filterControl navigates with the exhibitmask query param', () => {
    const { service, navigate } = setup();

    service.filterControl.setValue('xyz');

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { exhibitmask: 'xyz' },
      queryParamsHandling: 'merge',
    });
  });
});

describe('ExhibitDataService error paths', () => {
  const failure = new Error('500');
  const fail = () => throwError(() => failure);

  /**
   * Verifies: a failed add() or updateExhibit() leaves loading set (current behavior), while the error escapes to the global handler.
   * Interacts with: the named ExhibitService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity, so loading starts false; each endpoint fails with a 500.
   */
  it.each<
    [string, () => ApiStub<ExhibitService>, (s: ExhibitDataService) => void]
  >([
    [
      'add()',
      () => ({ createExhibit: vi.fn(fail) }),
      (s) => s.add(makeExhibit()),
    ],
    [
      'updateExhibit()',
      () => ({ updateExhibit: vi.fn(fail) }),
      (s) => s.updateExhibit(makeExhibit()),
    ],
  ])(
    '%s leaves loading stuck when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup({ api: api() });
      store.set([makeExhibit()]);

      run(service);
      await flush();

      expect(query.getValue().loading).toBe(true);
      // The error itself reaches the app's global ErrorHandler (ErrorService,
      // provided in app.module.ts:270), which shows it to the user.
      expect(errors).toEqual([failure]);
    },
  );

  /**
   * Verifies: a failed delete() keeps the exhibit and never touches loading, and the error escapes to the global handler.
   * Interacts with: the named ExhibitService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity; each endpoint fails with a 500.
   */
  it.each<
    [string, () => ApiStub<ExhibitService>, (s: ExhibitDataService) => void]
  >([
    ['delete()', () => ({ deleteExhibit: vi.fn(fail) }), (s) => s.delete('e1')],
  ])(
    '%s leaves the store unchanged when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup({ api: api() });
      store.set([makeExhibit()]);

      run(service);
      await flush();

      expect(query.getCount()).toBe(1);
      expect(query.getValue().loading).toBe(false);
      // The error itself reaches the app's global ErrorHandler (ErrorService,
      // provided in app.module.ts:270), which shows it to the user.
      expect(errors).toEqual([failure]);
    },
  );
});
