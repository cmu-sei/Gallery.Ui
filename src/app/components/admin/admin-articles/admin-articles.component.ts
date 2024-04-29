// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Sort } from '@angular/material/sort';
import { Article, Collection, ItemStatus, SourceType } from 'src/app/generated/api/model/models';
import { ArticleDataService } from 'src/app/data/article/article-data.service';
import { ArticleQuery } from 'src/app/data/article/article.query';
import { Card } from 'src/app/data/card/card.store';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { CardQuery } from 'src/app/data/card/card.query';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminArticleEditDialogComponent } from 'src/app/components/admin/admin-article-edit-dialog/admin-article-edit-dialog.component';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-admin-articles',
  templateUrl: './admin-articles.component.html',
  styleUrls: ['./admin-articles.component.scss'],
})
export class AdminArticlesComponent implements OnInit, OnDestroy {
  pageSize = 10;
  pageIndex = 0;
  newArticle: Article = { id: '', name: '' };
  isLoading = false;
  topbarColor = '#ef3a47';
  articleList: Article[] = [];
  selectedCard: Card = { id: '', name: '' };
  cardList: Card[] = [];
  selectedCollectionId = '';
  collectionList: Collection[] = [];
  selectedMove = -1;
  moveList: number[] = [];
  addingNewArticle = false;
  displayedArticles: Article[] = [];
  newArticleName = '';
  editArticle: Article = {};
  originalArticle: Article = {};
  defaultScoringModelId = this.settingsService.settings.DefaultScoringModelId;
  filteredArticleList: Article[] = [];
  filterControl = new UntypedFormControl();
  filterString = '';
  sort: Sort = {active: 'datePosted', direction: 'desc'};
  private unsubscribe$ = new Subject();

  constructor(
    activatedRoute: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private settingsService: ComnSettingsService,
    private articleDataService: ArticleDataService,
    private articleQuery: ArticleQuery,
    private cardDataService: CardDataService,
    private cardQuery: CardQuery,
    private collectionDataService: CollectionDataService,
    private collectionQuery: CollectionQuery
  ) {
    this.articleDataService.unload();
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.articleQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(articles => {
      this.articleList = [];
      articles.forEach(article => {
        this.articleList.push({ ...article });
        if (article.id === this.editArticle.id) {
          this.originalArticle = article;
          this.editArticle = { ...article};
        }
      });
      const moves: number[] = [];
      articles.forEach(a => {
        if (!moves.includes(+a.move)) {
          moves.push(+a.move);
        }
      });
      this.moveList = moves;
      this.sortChanged(this.sort);
    });
    this.cardQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(cards => {
      this.cardList = cards;
    });
    this.collectionQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(collections => {
      this.collectionList = collections;
    });
    (this.cardQuery.selectActive() as Observable<Card>).pipe(takeUntil(this.unsubscribe$)).subscribe(card => {
      card = card ? card : { id: ''} as Card;
      this.selectedCard = card;
      if (card.id) {
        this.articleDataService.loadByCard(card.id);
      } else if (this.selectedCollectionId) {
        this.articleDataService.loadByCollection(this.selectedCollectionId);
      }
    });
    this.collectionDataService.load();

    this.filterControl.valueChanges
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe((term) => {
        this.filterString = term.trim().toLowerCase();
        this.applyFilter();
      });

    activatedRoute.queryParamMap.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.selectedCollectionId = params.get('collection');
      this.articleDataService.unload();
      this.cardDataService.unload();
      this.filteredArticleList = [];
      this.articleList = [];
      if (this.selectedCollectionId) {
        this.articleDataService.loadByCollection(this.selectedCollectionId);
        this.cardDataService.loadByCollection(this.selectedCollectionId);
      }
      this.sortChanged(this.sort);
    });
  }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.articleQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(articles => {
      this.articleList = Array.from(articles);
      this.applyFilter();
    });
  }

  addOrEditArticle(article: Article) {
    if (!article) {
      const datePosted = new Date();
      article = {
        name: '',
        description: '',
        collectionId: this.selectedCollectionId,
        move: 0,
        inject: 0,
        status: ItemStatus.Unused,
        sourceType: SourceType.Intel,
        sourceName: '',
        datePosted: datePosted
      };
    } else {
      article = {... article};
    }
    const dialogRef = this.dialog.open(AdminArticleEditDialogComponent, {
      width: '900px',
      data: {
        article: article,
        cardList: this.cardList
      },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.article) {
        this.saveArticle(result.article);
      }
      dialogRef.close();
    });
  }

  togglePanel(article: Article) {
    this.editArticle = this.editArticle.id === article.id ? this.editArticle = {} : this.editArticle = { ...article};
  }

  selectCollection(collectionId: string) {
    this.router.navigate([], {
      queryParams: { collection: collectionId },
      queryParamsHandling: 'merge',
    });
  }

  selectCard(cardId: string) {
    this.cardDataService.setActive(cardId);
  }

  selectMove(move: number) {
    this.selectedMove = move;
    this.sortChanged(this.sort);
  }

  selectArticle(article: Article) {
    this.editArticle = { ...article };
    this.originalArticle = article;
    return false;
  }

  saveArticle(article: Article) {
    if (article.id) {
      this.articleDataService.updateArticle(article);
    } else {
      this.articleDataService.add(article);
    }
  }

  cancelEdit() {
    this.editArticle = this.originalArticle;
  }

  deleteArticle(article: Article): void {
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
    this.filteredArticleList = this.articleList.filter(article =>
      !this.filterString ||
      article.name.toLowerCase().includes(this.filterString) ||
      article.description.toLowerCase().includes(this.filterString) ||
      article.sourceName.toLowerCase().includes(this.filterString)
    );
    this.sortChanged(this.sort);
  }

  clearFilter() {
    this.filterControl.setValue('');
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    this.filteredArticleList.sort((a, b) => this.sortArticles(a, b, sort.active, sort.direction));
    this.applyPagination();
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
        return (
          (this.getCardName(a.cardId).toLowerCase() < this.getCardName(b.cardId).toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'move':
        return (
          (a.move < b.move ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'inject':
        return (
          (a.inject < b.inject ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'sourceName':
        return (
          (a.sourceName.toLowerCase() < b.sourceName.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      default:
        return 0;
    }
  }

  handleInput(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case 'Tab':
        this.saveArticle(this.editArticle);
        break;
      case 'Escape':
        this.cancelEdit();
        break;
      default:
        break;
    }
    event.stopPropagation();
  }

  getCardName(id: string) {
    const card = id ? this.cardList.find(item => item.id === id) : null;
    const name = card ? card.name : '';
    return name;
  }

  paginatorEvent(page: PageEvent) {
    this.pageIndex = page.pageIndex;
    this.pageSize = page.pageSize;
    this.applyPagination();
  }

  applyPagination() {
    const startIndex = this.pageIndex * this.pageSize;
    this.displayedArticles = this.filteredArticleList.slice(startIndex, startIndex + this.pageSize);
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}
