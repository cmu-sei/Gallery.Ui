// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Sort } from '@angular/material/sort';
import { Article, Exhibit, ItemStatus, SourceType, Team} from 'src/app/generated/api/model/models';
import { ArticleDataService } from 'src/app/data/article/article-data.service';
import { ArticleQuery } from 'src/app/data/article/article.query';
import { ArticleTeamDataService } from 'src/app/data/team/article-team-data.service';
import { Card } from 'src/app/data/card/card.store';
import { CardQuery } from 'src/app/data/card/card.query';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-exhibit-articles',
  templateUrl: './admin-exhibit-articles.component.html',
  styleUrls: ['./admin-exhibit-articles.component.scss'],
})
export class AdminExhibitArticlesComponent implements OnDestroy, OnInit {
  @Input() exhibit: Exhibit;
  @Input() teamList: Team[];
  filterControl: UntypedFormControl = new UntypedFormControl();
  filterString = '';
  isLoading = false;
  articleList: Article[] = [];
  cardList: Card[] = [];
  sortedArticles: Article[] = [];
  sort: Sort = {active: 'move', direction: 'asc'};
  itemStatusList: ItemStatus[] = [
    ItemStatus.Unused,
    ItemStatus.Affected,
    ItemStatus.Closed,
    ItemStatus.Critical,
    ItemStatus.Open
  ];
  sourceTypeList: SourceType[] = [
    SourceType.Intel,
    SourceType.News,
    SourceType.Reporting,
    SourceType.Social,
    SourceType.Phone,
    SourceType.Email,
    SourceType.Orders
  ];
  private unsubscribe$ = new Subject();

  constructor(
    private router: Router,
    public dialogService: DialogService,
    private articleDataService: ArticleDataService,
    private articleQuery: ArticleQuery,
    private articleTeamDataService: ArticleTeamDataService,
    private cardQuery: CardQuery
  ) {
    this.articleDataService.unload();
    this.sortChanged(this.sort);
    this.cardQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(cards => {
      this.cardList = cards;
    });
    this.articleQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(articles => {
      this.articleList = articles;
      this.sortChanged(this.sort);
    });
    this.filterControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((term) => {
        this.filterString = term.trim().toLowerCase();
        this.applyFilter();
      });
  }

  ngOnInit() {
    if (this.exhibit && this.exhibit.collectionId) {
      this.articleDataService.loadByCollection(this.exhibit.collectionId);
      this.articleTeamDataService.getTeamArticlesFromApi(this.exhibit.id);
    }
    this.filterControl.setValue(this.filterString);
    this.loadInitialData();
  }

  loadInitialData() {
    this.articleQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(articles => {
      this.articleList = Array.from(articles);
      this.applyFilter();
    });
  }

  addArticleTeam(articleId: string, teamId: string) {
    const datePosted = new Date();
    const articleTeam = {
      name: '',
      description: '',
      move: 0,
      inject: 0,
      status: ItemStatus.Unused,
      sourceType: SourceType.Intel,
      sourceName: '',
      datePosted: datePosted
    };
    this.saveArticleTeam(articleTeam);
  }

  selectCollection(collectionId: string) {
    this.router.navigate([], {
      queryParams: { collection: collectionId },
      queryParamsHandling: 'merge',
    });
  }

  saveArticleTeam(article: Article) {
    if (article.id) {
      this.articleDataService.updateArticle(article);
    } else {
      this.articleDataService.add(article);
    }
  }

  deleteArticleTeam(article: Article): void {
    this.dialogService
      .confirm(
        'Delete Article',
        'Are you sure that you want to delete ' + article.name + '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.articleDataService.delete(article.id);
        }
      });
  }

  applyFilter() {
    this.sortedArticles = this.articleList.filter(article =>
      !this.filterString ||
      article.name.toLowerCase().includes(this.filterString) ||
      this.getCardName(article.cardId).toLowerCase().includes(this.filterString) ||
      article.sourceName.toLowerCase().includes(this.filterString)
    );
    this.sortChanged(this.sort);
  }

  clearFilter() {
    this.filterControl.setValue('');
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    this.sortedArticles.sort((a, b) => this.sortArticles(a, b, sort.active, sort.direction));
  }

  getFilteredArticles(articles: Article[]): Article[] {
    let filteredArticles = articles;
    if (articles && articles.length > 0 && this.filterString) {
      const filterString = this.filterString.toLowerCase();
      filteredArticles = articles
        .filter((a) => (!this.filterString ||
          a.name.toLowerCase().includes(this.filterString.toLowerCase()) ||
          this.getCardName(a.cardId).toLowerCase().includes(this.filterString.toLowerCase()) ||
          a.sourceName.toLowerCase().includes(this.filterString.toLowerCase())
        ));
    }
    return filteredArticles;
  }

  getSortedArticles(articles: Article[]) {
    if (articles) {
      articles.sort((a, b) => this.sortArticles(a, b, this.sort.active, this.sort.direction));
    }
    return articles;
  }

  private sortArticles(
    a: Article,
    b: Article,
    column: string,
    direction: string
  ) {
    const isAsc = direction !== 'desc';
    switch (column) {
      case 'name':
        return (
          (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'cardId':
        const aVal = this.getCardName(a.cardId).toLowerCase();
        const bVal = this.getCardName(b.cardId).toLowerCase();
        if (aVal === bVal) {
          if (+a.move === +b.move) {
            return (
              (+a.inject < +b.inject ? -1 : 1) *
              (isAsc ? 1 : -1)
            );
          }
          return (
            (+a.move < +b.move ? -1 : 1) *
            (isAsc ? 1 : -1)
          );
        }
        return (
          (aVal < bVal ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'move':
        if (+a.move === +b.move) {
          if (+a.inject === +b.inject) {
            return (
              (this.getCardName(a.cardId).toLowerCase() < this.getCardName(b.cardId).toLowerCase() ? -1 : 1) *
              (isAsc ? 1 : -1)
            );
          }
          return (
            (+a.inject < +b.inject ? -1 : 1) *
            (isAsc ? 1 : -1)
          );
        }
        return (
          (+a.move < +b.move ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'inject':
        return (
          (+a.inject < +b.inject ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'sourceName':
        if (a.sourceName === b.sourceName) {
          if (+a.move === +b.move) {
            if (+a.inject === +b.inject) {
              return (
                (this.getCardName(a.cardId).toLowerCase() < this.getCardName(b.cardId).toLowerCase() ? -1 : 1) *
                (isAsc ? 1 : -1)
              );
            }
            return (
              (+a.inject < +b.inject ? -1 : 1) *
              (isAsc ? 1 : -1)
            );
          }
          return (
            (+a.move < +b.move ? -1 : 1) *
            (isAsc ? 1 : -1)
          );
        }
        return (
          (a.sourceName.toLowerCase() < b.sourceName.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      default:
        return 0;
    }
  }

  getCardName(id: string) {
    const card = id ? this.cardList.find(c => c.id === id) : null;
    const name = card ? card.name : '';
    return name;
  }

  getArticleId(index: number, article: Article) {
    return article.id;
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
