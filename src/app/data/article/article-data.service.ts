// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { ArticleStore } from './article.store';
import { ArticleQuery } from './article.query';
import { Injectable } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Router, ActivatedRoute } from '@angular/router';
import {
  Article,
  ArticleService,
  ItemStatus
} from 'src/app/generated/api';
import { map, take, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ArticleDataService {
  private _requestedArticleId: string;
  private _requestedArticleId$ = this.activatedRoute.queryParamMap.pipe(
    map((params) => params.get('articleId') || '')
  );
  readonly ArticleList: Observable<Article[]>;
  readonly filterControl = new UntypedFormControl();
  private filterTerm: Observable<string>;
  private sortColumn: Observable<string>;
  private sortIsAscending: Observable<boolean>;
  private _pageEvent: PageEvent = { length: 0, pageIndex: 0, pageSize: 10 };
  readonly pageEvent = new BehaviorSubject<PageEvent>(this._pageEvent);
  private pageSize: Observable<number>;
  private pageIndex: Observable<number>;

  constructor(
    private articleStore: ArticleStore,
    private articleQuery: ArticleQuery,
    private articleService: ArticleService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.filterTerm = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('articlemask') || '')
    );
    this.filterControl.valueChanges.subscribe((term) => {
      this.router.navigate([], {
        queryParams: { articlemask: term },
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
    this.ArticleList = combineLatest([
      this.articleQuery.selectAll(),
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
            ? (items as Article[])
                .sort((a: Article, b: Article) =>
                  this.sortArticles(a, b, sortColumn, sortIsAscending)
                )
                .filter(
                  (article) =>
                    ('' + article.description)
                      .toLowerCase()
                      .includes(filterTerm.toLowerCase()) ||
                    article.id
                      .toLowerCase()
                      .includes(filterTerm.toLowerCase())
                )
            : []
      )
    );
  }

  private sortArticles(
    a: Article,
    b: Article,
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
    this.articleStore.setLoading(true);
    this.articleService
      .getArticles()
      .pipe(
        tap(() => {
          this.articleStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (articles) => {
          articles.forEach(a => {
            this.setAsDates(a);
          });
          this.articleStore.set(articles);
        },
        (error) => {
          this.articleStore.set([]);
        }
      );
  }

  loadByCard(cardId: string) {
    this.articleStore.setLoading(true);
    this.articleService
      .getCardArticles(cardId)
      .pipe(
        tap(() => {
          this.articleStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (articles) => {
          articles.forEach(a => {
            this.setAsDates(a);
          });
          this.articleStore.set(articles);
        },
        (error) => {
          this.articleStore.set([]);
        }
      );
  }

  loadByCollection(collectionId: string) {
    this.articleStore.setLoading(true);
    this.articleService
      .getCollectionArticles(collectionId)
      .pipe(
        tap(() => {
          this.articleStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (articles) => {
          articles.forEach(a => {
            this.setAsDates(a);
          });
          this.articleStore.set(articles);
        },
        (error) => {
          this.articleStore.set([]);
        }
      );
  }

  loadById(id: string) {
    this.articleStore.setLoading(true);
    return this.articleService
      .getArticle(id)
      .pipe(
        tap(() => {
          this.articleStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.setAsDates(s);
        this.articleStore.upsert(s.id, { ...s });
      });
  }

  unload() {
    this.articleStore.set([]);
  }

  add(article: Article) {
    this.articleStore.setLoading(true);
    this.articleService
      .createArticle(article)
      .pipe(
        tap(() => {
          this.articleStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.setAsDates(s);
        this.articleStore.add(s);
      });
  }

  updateArticle(article: Article) {
    this.articleStore.setLoading(true);
    this.articleService
      .updateArticle(article.id, article)
      .pipe(
        tap(() => {
          this.articleStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((n) => {
        this.setAsDates(n);
        this.updateStore(n);
      });
  }

  delete(id: string) {
    this.articleService
      .deleteArticle(id)
      .pipe(take(1))
      .subscribe((r) => {
        this.deleteFromStore(id);
      });
  }

  setActive(id: string) {
    this.articleStore.setActive(id);
  }

  setPageEvent(pageEvent: PageEvent) {
    this.articleStore.update({ pageEvent: pageEvent });
  }

  updateStore(article: Article) {
    this.articleStore.upsert(article.id, article);
  }

  deleteFromStore(id: string) {
    this.articleStore.remove(id);
  }

  setAsDates(article: Article) {
    // set to a date object.
    article.dateCreated = new Date(article.dateCreated);
    article.dateModified = new Date(article.dateModified);
    article.datePosted = new Date(article.datePosted);
  }

}
