// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { UserArticleStore } from './user-article.store';
import { UserArticleQuery } from './user-article.query';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { Injectable } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Router, ActivatedRoute } from '@angular/router';
import {
  Article,
  ShareDetails,
  UserArticle,
  UserArticleService,
} from 'src/app/generated/api';
import { map, take, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserArticleDataService {
  private _requestedUserArticleId: string;
  private _requestedUserArticleId$ = this.activatedRoute.queryParamMap.pipe(
    map((params) => params.get('userArticleId') || '')
  );
  readonly UserArticleList: Observable<UserArticle[]>;
  readonly filterControl = new UntypedFormControl();
  private filterTerm: Observable<string>;
  private sortColumn: Observable<string>;
  private sortIsAscending: Observable<boolean>;
  private _pageEvent: PageEvent = { length: 0, pageIndex: 0, pageSize: 10 };
  readonly pageEvent = new BehaviorSubject<PageEvent>(this._pageEvent);
  private pageSize: Observable<number>;
  private pageIndex: Observable<number>;

  constructor(
    private userArticleStore: UserArticleStore,
    private userArticleQuery: UserArticleQuery,
    private userArticleService: UserArticleService,
    private exhibitQuery: ExhibitQuery,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.filterTerm = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('userArticlemask') || '')
    );
    this.filterControl.valueChanges.subscribe((term) => {
      this.router.navigate([], {
        queryParams: { userArticlemask: term },
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
    this.UserArticleList = combineLatest([
      this.userArticleQuery.selectAll(),
      this.filterTerm,
      this.sortColumn,
      this.sortIsAscending,
    ]).pipe(
      map(([items, filterTerm, sortColumn, sortIsAscending]) =>
        items
          ? (items as UserArticle[])
              .sort((a: UserArticle, b: UserArticle) =>
                this.sortArticles(
                  a.article,
                  b.article,
                  sortColumn,
                  sortIsAscending
                )
              )
              .filter(
                (userArticle) =>
                  ('' + userArticle.article.description)
                    .toLowerCase()
                    .includes(filterTerm.toLowerCase()) ||
                  userArticle.id
                    .toLowerCase()
                    .includes(filterTerm.toLowerCase())
              )
          : []
      )
    );
  }

  private sortArticles(a: Article, b: Article, column: string, isAsc: boolean) {
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

  loadByExhibit(exhibitId: string) {
    this.userArticleStore.setLoading(true);
    this.userArticleService
      .getExhibitUserArticles(exhibitId)
      .pipe(
        tap(() => {
          this.userArticleStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (userArticles) => {
          userArticles.forEach((a) => {
            this.setAsDates(a);
          });
          this.userArticleStore.set(userArticles);
        },
        (error) => {
          this.userArticleStore.set([]);
        }
      );
  }

  loadByExhibitTeam(exhibitId: string, teamId: string) {
    this.userArticleStore.setLoading(true);
    this.userArticleService
      .getExhibitTeamUserArticles(exhibitId, teamId)
      .pipe(
        tap(() => {
          this.userArticleStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (userArticles) => {
          userArticles.forEach((a) => {
            this.setAsDates(a);
          });
          this.userArticleStore.set(userArticles);
        },
        (error) => {
          this.userArticleStore.set([]);
        }
      );
  }

  unload() {
    this.userArticleStore.set([]);
  }

  add(userArticle: UserArticle) {
    this.userArticleStore.setLoading(true);
    this.userArticleService
      .createUserArticle(userArticle)
      .pipe(
        tap(() => {
          this.userArticleStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.setAsDates(s);
        this.userArticleStore.add(s);
      });
  }

  shareUserArticle(userArticleId: string, shareDetails: ShareDetails) {
    this.userArticleStore.setLoading(true);
    this.userArticleService
      .shareUserArticle(userArticleId, shareDetails)
      .pipe(
        tap(() => {
          this.userArticleStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe();
  }

  setIsRead(id: string, isRead: boolean) {
    this.userArticleStore.setLoading(true);
    this.userArticleService
      .setIsRead(id, isRead)
      .pipe(
        tap(() => {
          this.userArticleStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((n) => {
        this.setAsDates(n);
        this.updateStore(n);
      });
  }

  delete(id: string) {
    this.userArticleService
      .deleteUserArticle(id)
      .pipe(take(1))
      .subscribe((r) => {
        this.deleteFromStore(id);
      });
  }

  setActive(id: string) {
    this.userArticleStore.setActive(id);
  }

  setPageEvent(pageEvent: PageEvent) {
    this.userArticleStore.update({ pageEvent: pageEvent });
  }

  updateStore(userArticle: UserArticle) {
    this.userArticleStore.upsert(userArticle.id, userArticle);
  }

  deleteFromStore(id: string) {
    this.userArticleStore.remove(id);
  }

  setAsDates(userArticle: UserArticle) {
    // set to a date object.
    userArticle.dateCreated = new Date(userArticle.dateCreated);
    userArticle.dateModified = new Date(userArticle.dateModified);
    userArticle.article.dateCreated = new Date(userArticle.article.dateCreated);
    userArticle.article.dateModified = new Date(
      userArticle.article.dateModified
    );
    userArticle.actualDatePosted = new Date(userArticle.actualDatePosted);
    userArticle.article.datePosted = new Date(userArticle.article.datePosted);
  }
}
