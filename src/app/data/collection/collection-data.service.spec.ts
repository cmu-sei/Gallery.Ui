// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { Collection, CollectionService } from 'src/app/generated/api';
import { CollectionDataService } from './collection-data.service';
import { CollectionStore } from './collection.store';
import { CollectionQuery } from './collection.query';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { activatedRouteStub } from 'src/app/test-utils/activated-route';
import { recordEmissions } from 'src/app/test-utils/record-emissions';

function makeCollection(overrides: Partial<Collection> = {}): Collection {
  return {
    id: 'c1',
    name: 'Alpha',
    description: 'First collection',
    dateCreated: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function setup(
  overrides: {
    api?: ApiStub<CollectionService>;
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
        ? [{ provide: CollectionService, useValue: overrides.api }]
        : []),
      { provide: ActivatedRoute, useValue: route.route },
      { provide: Router, useValue: router },
      { provide: MatSnackBar, useValue: snackBar },
    ]),
  });

  return {
    service: TestBed.inject(CollectionDataService),
    store: TestBed.inject(CollectionStore),
    query: TestBed.inject(CollectionQuery),
    setQueryParams: route.setQueryParams,
    navigate,
    open,
  };
}

describe('CollectionQuery', () => {
  /**
   * Verifies: selectAll() orders collections by name ascending, per the query's @QueryConfig.
   * Interacts with: real CollectionStore and CollectionQuery, constructed without TestBed.
   * Data: three collections set out of name order.
   */
  it('selects all collections sorted by name', () => {
    const store = new CollectionStore();
    const query = new CollectionQuery(store);
    store.set([
      makeCollection({ id: 'c2', name: 'Charlie' }),
      makeCollection({ id: 'c1', name: 'Alpha' }),
      makeCollection({ id: 'c3', name: 'Bravo' }),
    ]);
    const [all] = recordEmissions(query.selectAll());
    expect(all.map((c) => c.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  /**
   * Verifies: selectById emits the current entity on subscribe, then again when it changes.
   * Interacts with: CollectionStore.update, CollectionQuery.selectById.
   * Data: one collection renamed after subscribing.
   */
  it('selectById emits the entity and its later updates', () => {
    const store = new CollectionStore();
    const query = new CollectionQuery(store);
    store.set([makeCollection()]);
    const seen = recordEmissions(query.selectById('c1'));
    store.update('c1', { name: 'Renamed' });
    expect(seen.map((c) => c.name)).toEqual(['Alpha', 'Renamed']);
  });
});

describe('CollectionDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  describe('load() / loadMine()', () => {
    /**
     * Verifies: load() marks the store loading while getCollections is in flight, then replaces the store and clears loading.
     * Interacts with: CollectionService.getCollections (stubbed with a Subject), real CollectionStore/Query.
     * Data: a store pre-seeded with a stale collection; the API returns two others.
     */
    it('replaces the store with all collections and toggles loading', () => {
      const response = new Subject<Collection[]>();
      const getCollections = vi.fn(() => response);
      const { service, store, query } = setup({ api: { getCollections } });
      store.set([makeCollection({ id: 'stale', name: 'Stale' })]);

      service.load();
      expect(query.getValue().loading).toBe(true);

      response.next([
        makeCollection({ id: 'c2', name: 'Bravo' }),
        makeCollection({ id: 'c1', name: 'Alpha' }),
      ]);
      expect(getCollections).toHaveBeenCalledOnce();
      expect(query.getAll().map((c) => c.id)).toEqual(['c1', 'c2']);
      expect(query.getValue().loading).toBe(false);
    });

    /**
     * Verifies: loadMine() loads through getMyCollections rather than getCollections.
     * Interacts with: CollectionService.getMyCollections, real CollectionQuery.
     * Data: one collection returned by the "mine" endpoint.
     */
    it('loadMine() fills the store from getMyCollections', () => {
      const getMyCollections = vi.fn(() => of([makeCollection({ id: 'm1' })]));
      const getCollections = vi.fn();
      const { service, query } = setup({
        api: { getMyCollections, getCollections },
      });

      service.loadMine();

      expect(getCollections).not.toHaveBeenCalled();
      expect(query.getAll().map((c) => c.id)).toEqual(['m1']);
    });

    /**
     * Verifies: a failed load empties the store and clears loading instead of leaving stale data or a spinner.
     * Interacts with: CollectionService.getCollections (throws), real CollectionQuery.
     * Data: a store pre-seeded with one collection.
     */
    it('empties the store and clears loading when the request fails', () => {
      const getCollections = vi.fn(() => throwError(() => new Error('500')));
      const { service, store, query } = setup({ api: { getCollections } });
      store.set([makeCollection()]);

      service.load();

      expect(query.getCount()).toBe(0);
      expect(query.getValue().loading).toBe(false);
    });

    /**
     * Verifies: when load() and loadMine() overlap, the newest request wins and the superseded one is cancelled.
     * Interacts with: getCollections/getMyCollections stubbed with separate Subjects; real CollectionQuery.
     * Data: "all" is requested first, "mine" second; "all" then answers late.
     */
    it('cancels a superseded load so a late response cannot overwrite the newer one', () => {
      const all$ = new Subject<Collection[]>();
      const mine$ = new Subject<Collection[]>();
      const { service, query } = setup({
        api: {
          getCollections: vi.fn(() => all$),
          getMyCollections: vi.fn(() => mine$),
        },
      });

      service.load();
      service.loadMine();
      mine$.next([makeCollection({ id: 'mine' })]);
      all$.next([makeCollection({ id: 'all' })]);

      expect(all$.observed).toBe(false);
      expect(query.getAll().map((c) => c.id)).toEqual(['mine']);
    });
  });

  /**
   * Verifies: loadById upserts the fetched collection next to the existing ones and clears loading.
   * Interacts with: CollectionService.getCollection, real CollectionStore/Query.
   * Data: store holds c1; the API returns c2.
   */
  it('loadById() upserts the collection without dropping the others', () => {
    const getCollection = vi.fn(() =>
      of(makeCollection({ id: 'c2', name: 'Bravo' })),
    );
    const { service, store, query } = setup({ api: { getCollection } });
    store.set([makeCollection()]);

    service.loadById('c2');

    expect(getCollection).toHaveBeenCalledWith('c2');
    expect(query.getAll().map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(query.getValue().loading).toBe(false);
  });

  /**
   * Verifies: add() stores the collection the API created (with its server id), not the request body.
   * Interacts with: CollectionService.createCollection, real CollectionQuery.
   * Data: a request without an id; the API answers with id 'new'.
   */
  it('add() stores the created collection returned by the API', () => {
    const createCollection = vi.fn(() =>
      of(makeCollection({ id: 'new', name: 'Created' })),
    );
    const { service, query } = setup({ api: { createCollection } });

    service.add({ name: 'Created' });

    expect(createCollection).toHaveBeenCalledWith({ name: 'Created' });
    expect(query.getEntity('new')?.name).toBe('Created');
  });

  describe('copy()', () => {
    /**
     * Verifies: copy() adds the copy returned by the API.
     * Interacts with: CollectionService.copyCollection, real CollectionQuery.
     * Data: store holds c1; the API returns copy c1-copy.
     */
    it('adds the copied collection', () => {
      const copyCollection = vi.fn(() =>
        of(makeCollection({ id: 'c1-copy', name: 'Alpha copy' })),
      );
      const { service, store, query } = setup({ api: { copyCollection } });
      store.set([makeCollection()]);

      service.copy('c1');

      expect(copyCollection).toHaveBeenCalledWith('c1');
      expect(query.getAll().map((c) => c.id)).toEqual(['c1', 'c1-copy']);
    });

    /**
     * Verifies: a failed copy clears loading and leaves the store unchanged.
     * Interacts with: CollectionService.copyCollection (throws), real CollectionQuery.
     * Data: store holds c1.
     */
    it('clears loading and keeps the store when the copy fails', () => {
      const copyCollection = vi.fn(() => throwError(() => new Error('403')));
      const { service, store, query } = setup({ api: { copyCollection } });
      store.set([makeCollection()]);

      service.copy('c1');

      expect(query.getAll().map((c) => c.id)).toEqual(['c1']);
      expect(query.getValue().loading).toBe(false);
    });
  });

  /**
   * Verifies: updateCollection() writes the API's version of the collection into the store.
   * Interacts with: CollectionService.updateCollection, real CollectionQuery.
   * Data: c1 renamed locally to 'Local' but the API returns 'Server'.
   */
  it('updateCollection() stores the server response', () => {
    const updateCollection = vi.fn(() =>
      of(makeCollection({ name: 'Server' })),
    );
    const { service, store, query } = setup({ api: { updateCollection } });
    store.set([makeCollection()]);

    service.updateCollection(makeCollection({ name: 'Local' }));

    expect(updateCollection).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ name: 'Local' }),
    );
    expect(query.getEntity('c1')?.name).toBe('Server');
    expect(query.getValue().loading).toBe(false);
  });

  /**
   * Verifies: delete() removes the collection only after the API confirms.
   * Interacts with: CollectionService.deleteCollection (Subject), real CollectionQuery.
   * Data: store holds c1 and c2; c1 is deleted.
   */
  it('delete() removes the collection once the API succeeds', () => {
    const response = new Subject<void>();
    const deleteCollection = vi.fn(() => response);
    const { service, store, query } = setup({ api: { deleteCollection } });
    store.set([makeCollection(), makeCollection({ id: 'c2', name: 'Bravo' })]);

    service.delete('c1');
    expect(query.hasEntity('c1')).toBe(true);

    response.next();
    expect(query.getAll().map((c) => c.id)).toEqual(['c2']);
  });

  describe('uploadJson()', () => {
    // What uploadJsonFiles emits when called the way admin-collections.component.ts:225
    // calls uploadJson(file, 'events', true): one HttpEvent per stage.
    const uploadEvents = (body: Collection): HttpEvent<Collection>[] => [
      { type: HttpEventType.Sent },
      { type: HttpEventType.UploadProgress, loaded: 50, total: 100 },
      new HttpResponse({ body, status: 200 }),
    ];

    /**
     * Verifies: an upload in 'events' mode (the only mode the app uses) stores nothing, leaves loading set and never reports progress (current behavior).
     * Interacts with: CollectionService.uploadJsonFiles (Sent, UploadProgress, Response events), real CollectionQuery, uploadProgress.
     * Data: one row with an empty store (a new import) and one with the uploaded collection already stored (a re-import); the Response body renames it 'New'.
     */
    it.each([
      ['a new import', false],
      ['a re-import', true],
    ])(
      'stores nothing and leaves loading set for %s',
      (_case, alreadyStored) => {
        const uploadJsonFiles = vi.fn(() =>
          of(...uploadEvents(makeCollection({ name: 'New' }))),
        );
        const { service, store, query } = setup({ api: { uploadJsonFiles } });
        const stored = alreadyStored ? [makeCollection()] : [];
        store.set(stored);
        const progress = recordEmissions(service.uploadProgress);
        const file = new File(['{}'], 'collection.json');

        service.uploadJson(file, 'events', true);

        expect(uploadJsonFiles).toHaveBeenCalledWith(file, 'events', true);
        expect(query.getAll()).toEqual(stored);
        expect(query.getValue().loading).toBe(true);
        expect(progress).toEqual([]);
      },
    );

    /**
     * Verifies: a failed upload clears loading, resets the progress stream to 0, and shows the server's problem detail.
     * Interacts with: CollectionService.uploadJsonFiles (throws), MatSnackBar.open, uploadProgress subject.
     * Data: each row is an error body and the message it should produce.
     */
    it.each([
      [{ detail: 'Bad JSON', title: 'Bad Request' }, 'Bad JSON'],
      [{ title: 'Bad Request' }, 'Bad Request'],
      [{}, 'The uploaded file could not be processed.'],
    ])('reports upload failure %o as "%s"', (error, message) => {
      const uploadJsonFiles = vi.fn(() => throwError(() => ({ error })));
      const { service, query, open } = setup({ api: { uploadJsonFiles } });
      const progress = recordEmissions(service.uploadProgress);

      service.uploadJson(new File(['{}'], 'c.json'), 'events', true);

      expect(query.getValue().loading).toBe(false);
      expect(progress).toEqual([0]);
      expect(open).toHaveBeenCalledWith(message, 'OK', { duration: 5000 });
    });
  });

  /**
   * Verifies: updateStore/deleteFromStore (the SignalR entry points) upsert and remove without any API call.
   * Interacts with: real CollectionStore/Query only.
   * Data: an update for c1, a create for c2, then a delete of c1.
   */
  it('updateStore() and deleteFromStore() upsert and remove entities', () => {
    const { service, store, query } = setup();
    store.set([makeCollection()]);

    service.updateStore(makeCollection({ name: 'Renamed' }));
    service.updateStore(makeCollection({ id: 'c2', name: 'Bravo' }));
    service.deleteFromStore('c1');

    expect(query.getAll()).toEqual([
      expect.objectContaining({ id: 'c2', name: 'Bravo' }),
    ]);
  });

  /**
   * Verifies: setActive() and unload() drive the query's active entity and empty the store.
   * Interacts with: real CollectionStore/Query.
   * Data: two collections; c2 made active, then the store unloaded.
   */
  it('setActive() selects the active collection and unload() clears it', () => {
    const { service, store, query } = setup();
    store.set([makeCollection(), makeCollection({ id: 'c2', name: 'Bravo' })]);
    const active = recordEmissions(query.selectActiveId());

    service.setActive('c2');
    service.unload();

    expect(active).toEqual([undefined, 'c2', null]);
    expect(query.getCount()).toBe(0);
  });

  describe('CollectionList', () => {
    /**
     * Verifies: with no query params the list keeps the query's name order.
     * Interacts with: CollectionList (query.selectAll + ActivatedRoute.queryParamMap).
     * Data: three collections set out of order; default sorton=name.
     */
    it('defaults to name order', async () => {
      const { service, store } = setup();
      store.set([
        makeCollection({ id: 'c2', name: 'Bravo' }),
        makeCollection({ id: 'c1', name: 'Alpha' }),
      ]);
      const list = await firstValueFrom(service.CollectionList);
      expect(list.map((c) => c.name)).toEqual(['Alpha', 'Bravo']);
    });

    /**
     * Verifies: the collectionmask query param filters on description or id, case-insensitively.
     * Interacts with: CollectionList, the activatedRouteStub stand-in.
     * Data: mask 'SECOND' matches c2's description; mask 'c3' matches c3's id.
     */
    it('filters by the collectionmask query param on description or id', () => {
      const { service, store, setQueryParams } = setup({
        queryParams: { collectionmask: 'SECOND' },
      });
      store.set([
        makeCollection({ id: 'c1', description: 'first one' }),
        makeCollection({ id: 'c2', name: 'B', description: 'the second one' }),
        makeCollection({ id: 'c3', name: 'C', description: 'third' }),
      ]);
      const seen = recordEmissions(service.CollectionList);

      setQueryParams({ collectionmask: 'c3' });

      expect(seen[0].map((c) => c.id)).toEqual(['c2']);
      expect(seen.at(-1)?.map((c) => c.id)).toEqual(['c3']);
      // One navigation re-emits once per route-derived stream (filter, sort
      // column, sort direction, page size, page index) because each is its own
      // map() over queryParamMap inside combineLatest. The result is right; the
      // list is just recomputed five times.
      expect(seen).toHaveLength(6);
    });

    /**
     * Verifies: sorton/sortdir sort by description or dateCreated in either direction.
     * Interacts with: CollectionList, the activatedRouteStub stand-in.
     * Data: two collections whose description and date orders disagree.
     */
    it('sorts by description or dateCreated per the sort query params', () => {
      const { service, store, setQueryParams } = setup({
        queryParams: { sorton: 'description', sortdir: 'desc' },
      });
      store.set([
        makeCollection({
          id: 'old',
          name: 'A',
          description: 'zulu',
          dateCreated: new Date('2026-01-01'),
        }),
        makeCollection({
          id: 'new',
          name: 'B',
          description: 'alpha',
          dateCreated: new Date('2026-02-01'),
        }),
      ]);
      const seen = recordEmissions(service.CollectionList);

      setQueryParams({ sorton: 'dateCreated', sortdir: 'desc' });

      expect(seen[0].map((c) => c.id)).toEqual(['old', 'new']);
      expect(seen.at(-1)?.map((c) => c.id)).toEqual(['new', 'old']);
    });
  });

  /**
   * Verifies: typing in filterControl writes the term to the collectionmask query param, merging with the rest.
   * Interacts with: filterControl.valueChanges, Router.navigate stub.
   * Data: the term 'abc'.
   */
  it('filterControl navigates with the collectionmask query param', () => {
    const { service, navigate } = setup();

    service.filterControl.setValue('abc');

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { collectionmask: 'abc' },
      queryParamsHandling: 'merge',
    });
  });
});

describe('CollectionDataService error paths', () => {
  const failure = new Error('500');
  const fail = () => throwError(() => failure);

  /**
   * Verifies: a failed loadById(), add() or updateCollection() leaves loading set (current behavior), while the error escapes to the global handler.
   * Interacts with: the named CollectionService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity, so loading starts false; each endpoint fails with a 500.
   */
  it.each<
    [
      string,
      () => ApiStub<CollectionService>,
      (s: CollectionDataService) => void,
    ]
  >([
    [
      'loadById()',
      () => ({ getCollection: vi.fn(fail) }),
      (s) => s.loadById('c1'),
    ],
    [
      'add()',
      () => ({ createCollection: vi.fn(fail) }),
      (s) => s.add({ name: 'New' }),
    ],
    [
      'updateCollection()',
      () => ({ updateCollection: vi.fn(fail) }),
      (s) => s.updateCollection(makeCollection()),
    ],
  ])(
    '%s leaves loading stuck when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup({ api: api() });
      store.set([makeCollection()]);

      run(service);
      await flush();

      expect(query.getValue().loading).toBe(true);
      // The error itself reaches the app's global ErrorHandler (ErrorService,
      // provided in app.module.ts:270), which shows it to the user.
      expect(errors).toEqual([failure]);
    },
  );

  /**
   * Verifies: a failed delete() keeps the collection and never touches loading, and the error escapes to the global handler.
   * Interacts with: the named CollectionService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity; each endpoint fails with a 500.
   */
  it.each<
    [
      string,
      () => ApiStub<CollectionService>,
      (s: CollectionDataService) => void,
    ]
  >([
    [
      'delete()',
      () => ({ deleteCollection: vi.fn(fail) }),
      (s) => s.delete('c1'),
    ],
  ])(
    '%s leaves the store unchanged when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup({ api: api() });
      store.set([makeCollection()]);

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
