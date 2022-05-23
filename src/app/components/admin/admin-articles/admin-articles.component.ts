// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { Article, Collection, User, ItemStatus, SourceType} from 'src/app/generated/api/model/models';
import { ArticleDataService } from 'src/app/data/article/article-data.service';
import { ArticleQuery } from 'src/app/data/article/article.query';
import { Card } from 'src/app/data/card/card.store';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { CardQuery } from 'src/app/data/card/card.query';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { createAdd } from 'typescript';
import { AdminArticleEditDialogComponent } from 'src/app/components/admin/admin-article-edit-dialog/admin-article-edit-dialog.component';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-admin-articles',
  templateUrl: './admin-articles.component.html',
  styleUrls: ['./admin-articles.component.scss'],
})
export class AdminArticlesComponent implements OnInit, OnDestroy {
  @Input() pageSize: number;
  @Input() pageIndex: number;
  @Output() pageChange = new EventEmitter<PageEvent>();
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
  newArticleName = '';
  editArticle: Article = {};
  originalArticle: Article = {};
  defaultScoringModelId = this.settingsService.settings.DefaultScoringModelId;
  filteredArticleList: Article[] = [];
  filterControl = new FormControl();
  filterString = '';
  sort: Sort = {active: 'datePosted', direction: 'desc'};
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
    SourceType.Social
  ]
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
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((term) => {
        this.filterString = term;
        this.sortChanged(this.sort);
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
    this.filterControl.setValue(this.filterString);
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
      width: '800px',
      data: {
        article: article,
        cardList: this.cardList,
        itemStatusList: this.itemStatusList,
        sourceTypeList: this.sourceTypeList
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

  applyFilter(filterValue: string) {
    this.filterControl.setValue(filterValue);
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    if (this.articleList && this.articleList.length > 0) {
      this.filteredArticleList = this.articleList
        .sort((a: Article, b: Article) => this.sortArticles(a, b, sort.active, sort.direction))
        .filter((a) => ((this.selectedCard.id === '') || a.cardId === this.selectedCard.id)
                        && (!this.filterString ||
                              a.name.toLowerCase().includes(this.filterString.toLowerCase()) ||
                              a.description.toLowerCase().includes(this.filterString.toLowerCase()) ||
                              a.sourceName.toLowerCase().includes(this.filterString.toLowerCase())
                            )
                );
    }
    if (this.selectedMove > -1) {
      this.filteredArticleList = this.filteredArticleList.filter((a) => (a.move == this.selectedMove));
    }
  }

  private sortArticles(
    a: Article,
    b: Article,
    column: string,
    direction: string
  ) {
    const isAsc = direction !== 'desc';
    switch (column) {
      case "name":
        return (
          (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case "cardId":
        return (
          (this.getCardName(a.cardId).toLowerCase() < this.getCardName(b.cardId).toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case "move":
          return (
            (a.move < b.move ? -1 : 1) *
            (isAsc ? 1 : -1)
          );
      case "inject":
        return (
          (a.inject < b.inject ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case "sourceName":
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
    var card = id ? this.cardList.find(card => card.id === id) : null;
    var name = card ? card.name : '';
    return name;
  }

  paginatorEvent(page: PageEvent) {
    this.pageChange.emit(page);
  }

  paginateArticles(articles: Article[], pageIndex: number, pageSize: number) {
    if (!articles) {
      return [];
    }
    const startIndex = pageIndex * pageSize;
    const copy = articles.slice();
    return copy.splice(startIndex, pageSize);
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}
