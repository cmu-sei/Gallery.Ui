// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { CollectionStore } from './collection.store';
import { CollectionQuery } from './collection.query';
import { Injectable } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Router, ActivatedRoute } from '@angular/router';
import {
  Collection,
  CollectionService,
} from 'src/app/generated/api';
import { map, take, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CollectionDataService {
  private _requestedCollectionId: string;
  private _requestedCollectionId$ = this.activatedRoute.queryParamMap.pipe(
    map((params) => params.get('collectionId') || '')
  );
  readonly CollectionList: Observable<Collection[]>;
  readonly filterControl = new UntypedFormControl();
  private filterTerm: Observable<string>;
  private sortColumn: Observable<string>;
  private sortIsAscending: Observable<boolean>;
  private _pageEvent: PageEvent = { length: 0, pageIndex: 0, pageSize: 10 };
  readonly pageEvent = new BehaviorSubject<PageEvent>(this._pageEvent);
  private pageSize: Observable<number>;
  private pageIndex: Observable<number>;

  constructor(
    private collectionStore: CollectionStore,
    private collectionQuery: CollectionQuery,
    private collectionService: CollectionService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.filterTerm = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('collectionmask') || '')
    );
    this.filterControl.valueChanges.subscribe((term) => {
      this.router.navigate([], {
        queryParams: { collectionmask: term },
        queryParamsHandling: 'merge',
      });
    });
    this.sortColumn = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('sorton') || 'name')
    );
    this.sortIsAscending = activatedRoute.queryParamMap.pipe(
      map((params) => (params.get('sortdir') || 'asc') === 'asc')
    );
    this.pageSize = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get('pagesize') || '20', 10))
    );
    this.pageIndex = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get('pageindex') || '0', 10))
    );
    this.CollectionList = combineLatest([
      this.collectionQuery.selectAll(),
      this.filterTerm,
      this.sortColumn,
      this.sortIsAscending,
      this.pageSize,
      this.pageIndex,
    ]).pipe(
      map(
        ([
          items,
          filterTerm,
          sortColumn,
          sortIsAscending,
          pageSize,
          pageIndex,
        ]) =>
          items
            ? (items as Collection[])
              .sort((a: Collection, b: Collection) =>
                this.sortCollections(a, b, sortColumn, sortIsAscending)
              )
              .filter(
                (collection) =>
                  ('' + collection.description)
                    .toLowerCase()
                    .includes(filterTerm.toLowerCase()) ||
                    collection.id
                      .toLowerCase()
                      .includes(filterTerm.toLowerCase())
              )
            : []
      )
    );
  }

  private sortCollections(
    a: Collection,
    b: Collection,
    column: string,
    isAsc: boolean
  ) {
    switch (column) {
      case 'description':
        return (
          (a.description.toLowerCase() < b.description.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'dateCreated':
        return (
          (a.dateCreated.valueOf() < b.dateCreated.valueOf() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      default:
        return 0;
    }
  }

  load() {
    this.collectionStore.setLoading(true);
    this.collectionService
      .getCollections()
      .pipe(
        tap(() => {
          this.collectionStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (collections) => {
          this.collectionStore.set(collections);
        },
        (error) => {
          this.collectionStore.set([]);
        }
      );
  }

  loadMine() {
    this.collectionStore.setLoading(true);
    this.collectionService
      .getMyCollections()
      .pipe(
        tap(() => {
          this.collectionStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (collections) => {
          this.collectionStore.set(collections);
        },
        (error) => {
          this.collectionStore.set([]);
        }
      );
  }

  loadById(id: string) {
    this.collectionStore.setLoading(true);
    return this.collectionService
      .getCollection(id)
      .pipe(
        tap(() => {
          this.collectionStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.collectionStore.upsert(s.id, { ...s });
      });
  }

  unload() {
    this.collectionStore.set([]);
  }

  add(collection: Collection) {
    this.collectionStore.setLoading(true);
    this.collectionService
      .createCollection(collection)
      .pipe(
        tap(() => {
          this.collectionStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.collectionStore.add(s);
      });
  }

  updateCollection(collection: Collection) {
    this.collectionStore.setLoading(true);
    this.collectionService
      .updateCollection(collection.id, collection)
      .pipe(
        tap(() => {
          this.collectionStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((n) => {
        this.updateStore(n);
      });
  }

  delete(id: string) {
    this.collectionService
      .deleteCollection(id)
      .pipe(take(1))
      .subscribe((r) => {
        this.deleteFromStore(id);
      });
  }

  setActive(id: string) {
    this.collectionStore.setActive(id);
  }

  setPageEvent(pageEvent: PageEvent) {
    this.collectionStore.update({ pageEvent: pageEvent });
  }

  updateStore(collection: Collection) {
    this.collectionStore.upsert(collection.id, collection);
  }

  deleteFromStore(id: string) {
    this.collectionStore.remove(id);
  }
}
