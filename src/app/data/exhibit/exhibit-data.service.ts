// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { ExhibitStore } from './exhibit.store';
import { ExhibitQuery } from './exhibit.query';
import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Router, ActivatedRoute } from '@angular/router';
import {
  Exhibit,
  ExhibitService,
  ItemStatus
} from 'src/app/generated/api';
import { map, take, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ExhibitDataService {
  private _requestedExhibitId: string;
  private _requestedExhibitId$ = this.activatedRoute.queryParamMap.pipe(
    map((params) => params.get('exhibitId') || '')
  );
  readonly ExhibitList: Observable<Exhibit[]>;
  readonly filterControl = new FormControl();
  private filterTerm: Observable<string>;
  private sortColumn: Observable<string>;
  private sortIsAscending: Observable<boolean>;
  private _pageEvent: PageEvent = { length: 0, pageIndex: 0, pageSize: 10 };
  readonly pageEvent = new BehaviorSubject<PageEvent>(this._pageEvent);
  private pageSize: Observable<number>;
  private pageIndex: Observable<number>;

  constructor(
    private exhibitStore: ExhibitStore,
    private exhibitQuery: ExhibitQuery,
    private exhibitService: ExhibitService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.filterTerm = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('exhibitmask') || '')
    );
    this.filterControl.valueChanges.subscribe((term) => {
      this.router.navigate([], {
        queryParams: { exhibitmask: term },
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
    this.ExhibitList = combineLatest([
      this.exhibitQuery.selectAll(),
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
            ? (items as Exhibit[])
                .sort((a: Exhibit, b: Exhibit) =>
                  this.sortExhibits(a, b, sortColumn, sortIsAscending)
                )
                .filter(
                  (exhibit) =>
                    exhibit.id
                      .toLowerCase()
                      .includes(filterTerm.toLowerCase())
                )
            : []
      )
    );
  }

  private sortExhibits(
    a: Exhibit,
    b: Exhibit,
    column: string,
    isAsc: boolean
  ) {
    switch (column) {
      case 'createdBy':
        return (
          (a.createdBy < b.createdBy ? -1 : 1) *
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
    this.exhibitStore.setLoading(true);
    this.exhibitService
      .getExhibits()
      .pipe(
        tap(() => {
          this.exhibitStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (exhibits) => {
          exhibits.forEach(a => {
            this.setAsDates(a);
          });
          const sortedExhibits = exhibits.sort(
            (a: Exhibit, b: Exhibit) =>
            this.sortExhibits(a, b, 'dateCreated', false)
          )
          this.exhibitStore.set(sortedExhibits);
        },
        (error) => {
          this.exhibitStore.set([]);
        }
      );
  }

  loadMine() {
    this.exhibitStore.setLoading(true);
    this.exhibitService
      .getMyExhibits()
      .pipe(
        tap(() => {
          this.exhibitStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (exhibits) => {
          exhibits.forEach(a => {
            this.setAsDates(a);
          });
          const sortedExhibits = exhibits.sort(
            (a: Exhibit, b: Exhibit) =>
            this.sortExhibits(a, b, 'dateCreated', false)
          )
          this.exhibitStore.set(sortedExhibits);
        },
        (error) => {
          this.exhibitStore.set([]);
        }
      );
  }

  loadByCollection(collectionId: string) {
    this.exhibitStore.setLoading(true);
    this.exhibitService
      .getCollectionExhibits(collectionId)
      .pipe(
        tap(() => {
          this.exhibitStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (exhibits) => {
          exhibits.forEach(a => {
            this.setAsDates(a);
          });
          this.exhibitStore.set(exhibits);
        },
        (error) => {
          this.exhibitStore.set([]);
        }
      );
  }

  loadMineByCollection(collectionId: string) {
    this.exhibitStore.setLoading(true);
    this.exhibitService
      .getMyCollectionExhibits(collectionId)
      .pipe(
        tap(() => {
          this.exhibitStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (exhibits) => {
          exhibits.forEach(a => {
            this.setAsDates(a);
          });
          this.exhibitStore.set(exhibits);
        },
        (error) => {
          this.exhibitStore.set([]);
        }
      );
  }

  loadById(id: string) {
    this.exhibitStore.setLoading(true);
    return this.exhibitService
      .getExhibit(id)
      .pipe(
        tap(() => {
          this.exhibitStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.exhibitStore.upsert(s.id, { ...s });
      });
  }

  unload() {
    this.exhibitStore.set([]);
  }

  add(exhibit: Exhibit) {
    this.exhibitStore.setLoading(true);
    this.exhibitService
      .createExhibit(exhibit)
      .pipe(
        tap(() => {
          this.exhibitStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.exhibitStore.add(s);
      });
  }

  updateExhibit(exhibit: Exhibit) {
    this.exhibitStore.setLoading(true);
    this.exhibitService
      .updateExhibit(exhibit.id, exhibit)
      .pipe(
        tap(() => {
          this.exhibitStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((n) => {
        this.updateStore(n);
      });
  }

  delete(id: string) {
    this.exhibitService
      .deleteExhibit(id)
      .pipe(take(1))
      .subscribe((r) => {
        this.deleteFromStore(id);
      });
  }

  setActive(id: string) {
    this.exhibitStore.setActive(id);
  }

  setPageEvent(pageEvent: PageEvent) {
    this.exhibitStore.update({ pageEvent: pageEvent });
  }

  updateStore(exhibit: Exhibit) {
    this.exhibitStore.upsert(exhibit.id, exhibit);
  }

  deleteFromStore(id: string) {
    this.exhibitStore.remove(id);
  }

  setAsDates(exhibit: Exhibit) {
    // set to a date object.
    exhibit.dateCreated = new Date(exhibit.dateCreated);
    exhibit.dateModified = new Date(exhibit.dateModified);
  }

}
