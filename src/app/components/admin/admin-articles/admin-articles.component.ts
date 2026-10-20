// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, OnDestroy, OnInit, inject as inject_1, input } from '@angular/core';
import { UntypedFormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { Sort, MatSort, MatSortHeader } from '@angular/material/sort';
import {
  Article,
  Collection,
  ItemStatus,
  SourceType,
} from 'src/app/generated/api/model/models';
import { ArticleDataService } from 'src/app/data/article/article-data.service';
import { ArticleQuery } from 'src/app/data/article/article.query';
import { Card } from 'src/app/data/card/card.store';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { CardQuery } from 'src/app/data/card/card.query';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { ComnSettingsService, CrucibleDialogService } from '@cmusei/crucible-common';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminArticleEditDialogComponent } from 'src/app/components/admin/admin-article-edit-dialog/admin-article-edit-dialog.component';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/autocomplete';
import { MatInput } from '@angular/material/input';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader } from '@angular/material/expansion';
import { MatCard } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-admin-articles',
    templateUrl: './admin-articles.component.html',
    styleUrls: ['./admin-articles.component.scss'],
    imports: [MatFormField, MatLabel, MatSelect, MatOption, MatInput, FormsModule, ReactiveFormsModule, MatIconButton, MatSuffix, MatIcon, MatPaginator, MatAccordion, MatSort, MatSortHeader, MatExpansionPanel, MatExpansionPanelHeader, MatCard, MatProgressSpinner]
})
export class AdminArticlesComponent implements OnDestroy, OnInit {
  private dialog = inject_1(MatDialog);
  private crucibleDialog = inject_1(CrucibleDialogService);
  private settingsService = inject_1(ComnSettingsService);
  private articleDataService = inject_1(ArticleDataService);
  private articleQuery = inject_1(ArticleQuery);
  private cardDataService = inject_1(CardDataService);
  private cardQuery = inject_1(CardQuery);
  private collectionDataService = inject_1(CollectionDataService);
  private permissionDataService = inject_1(PermissionDataService);

  readonly selectedCollectionId = input<string>(undefined);
  canEdit = false;
  pageSize = 10;
  pageIndex = 0;
  newArticle: Article = { id: '', name: '' };
  isLoading = false;
  topbarColor = '#ef3a47';
  articleList: Article[] = [];
  selectedCardId = '';
  cardList: Card[] = [];
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
  sort: Sort = { active: 'datePosted', direction: 'desc' };
  private unsubscribe$ = new Subject();

  constructor() {
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.articleQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((articles) => {
        this.articleList = [];
        articles.forEach((article) => {
          this.articleList.push({ ...article });
          if (article.id === this.editArticle.id) {
            this.originalArticle = article;
            this.editArticle = { ...article };
          }
        });
        this.applyFilter();
        const moves: number[] = [];
        articles.forEach((a) => {
          if (!moves.includes(+a.move)) {
            moves.push(+a.move);
          }
        });
        this.moveList = moves;
        this.sortChanged(this.sort);
      });
    // observe the card list
    this.cardQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((cards) => {
        this.cardList = cards;
      });
    // observe filter control changes
    this.filterControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((term) => {
        this.filterString = term.trim().toLowerCase();
        this.applyFilter();
      });
  }

  ngOnInit() {
    this.loadCollectionData();
    this.canEdit = this.permissionDataService.canEditCollection(this.selectedCollectionId());
  }

  loadCollectionData() {
    const selectedCollectionId = this.selectedCollectionId();
    this.cardDataService.loadByCollection(selectedCollectionId);
    this.articleDataService.loadByCollection(selectedCollectionId);
  }

  addOrEditArticle(article: Article) {
    if (!article) {
      const datePosted = new Date();
      article = {
        name: '',
        summary: '',
        description: '',
        collectionId: this.selectedCollectionId(),
        cardId: '',
        move: 0,
        inject: 0,
        status: ItemStatus.Gray,
        sourceType: SourceType.Intel,
        sourceName: '',
        url: '',
        openInNewTab: false,
        datePosted: datePosted,
      };
    } else {
      article = { ...article };
    }
    const dialogRef = this.dialog.open(AdminArticleEditDialogComponent, {
      width: 'auto',
      maxWidth: '90vw',
      minWidth: '900px',
      data: {
        article: article,
        cardList: this.cardList || [],
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
    this.editArticle =
      this.editArticle.id === article.id
        ? (this.editArticle = {})
        : (this.editArticle = { ...article });
  }

  selectCollection(collectionId: string) {
    this.collectionDataService.setActive(collectionId);
  }

  selectCard(cardId: string) {
    this.selectedCardId = cardId;
    this.applyFilter();
  }

  selectMove(move: number) {
    this.selectedMove = move;
    this.applyFilter();
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
    this.crucibleDialog
      .confirm({
        title: 'Delete Article',
        message: 'Are you sure that you want to delete ' + article.name + '?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.articleDataService.delete(article.id);
        }
      });
  }

  applyFilter() {
    this.filteredArticleList = this.articleList.filter(
      (article) =>
        (!this.filterString ||
          article.name.toLowerCase().includes(this.filterString) ||
          article.description.toLowerCase().includes(this.filterString) ||
          article.sourceName.toLowerCase().includes(this.filterString)) &&
        (!this.selectedCardId || article.cardId === this.selectedCardId) &&
        (+this.selectedMove === -1 || +article.move === +this.selectedMove)
    );
    this.sortChanged(this.sort);
  }

  clearFilter() {
    this.filterControl.setValue('');
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    this.filteredArticleList.sort((a, b) =>
      this.sortArticles(a, b, sort.active, sort.direction)
    );
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
          (this.getCardName(a.cardId).toLowerCase() <
            this.getCardName(b.cardId).toLowerCase()
            ? -1
            : 1) * (isAsc ? 1 : -1)
        );
      case 'move':
        return (a.move < b.move ? -1 : 1) * (isAsc ? 1 : -1);
      case 'inject':
        return (a.inject < b.inject ? -1 : 1) * (isAsc ? 1 : -1);
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
    const card = id ? this.cardList.find((item) => item.id === id) : null;
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
    this.displayedArticles = this.filteredArticleList.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
