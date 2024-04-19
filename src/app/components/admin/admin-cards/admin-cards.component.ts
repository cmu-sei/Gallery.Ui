// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Sort } from '@angular/material/sort';
import { Collection } from 'src/app/generated/api/model/models';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { Card } from 'src/app/data/card/card.store';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { CardQuery } from 'src/app/data/card/card.query';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { AdminCardEditDialogComponent } from 'src/app/components/admin/admin-card-edit-dialog/admin-card-edit-dialog.component';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-admin-cards',
  templateUrl: './admin-cards.component.html',
  styleUrls: ['./admin-cards.component.scss'],
})
export class AdminCardsComponent implements OnInit, OnDestroy {
  @Input() pageSize: number;
  @Input() pageIndex: number;
  collectionList: Collection[] = [];
  selectedCollectionId = '';
  newCard: Card = { id: '', name: '' };
  cardList: Card[];
  isLoading = false;
  topbarColor = '#ef3a47';
  addingNewCard = false;
  newCardName = '';
  editCard: Card = {};
  originalCard: Card = {};
  filteredCardList: Card[] = [];
  filterControl = new UntypedFormControl();
  filterString = '';
  sort: Sort = {active: 'datePosted', direction: 'desc'};
  private unsubscribe$ = new Subject();

  constructor(
    activatedRoute: ActivatedRoute,
    private router: Router,
    private settingsService: ComnSettingsService,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private collectionDataService: CollectionDataService,
    private collectionQuery: CollectionQuery,
    private cardDataService: CardDataService,
    private cardQuery: CardQuery
  ) {
    this.cardDataService.unload();
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.cardQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(cards => {
      this.cardList = [];
      this.filteredCardList = [];
      cards.forEach(card => {
        this.cardList.push({ ...card });
        if (card.id === this.editCard.id) {
          this.editCard = { ...card};
        }
        this.sortChanged(this.sort);
      });
    });
    this.collectionQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(collections => {
      this.collectionList = collections;
    });
    this.collectionDataService.load();

    this.filterControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((term) => {
        this.filterString = term.trim().toLowerCase();
        this.applyFilter();
      });

    activatedRoute.queryParamMap.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.selectedCollectionId = params.get('collection');
      this.cardDataService.unload();
      if (this.selectedCollectionId) {
        this.cardDataService.loadByCollection(this.selectedCollectionId);
      }
    });
  }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.cardQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(cards => {
      this.cardList = Array.from(cards);
      this.applyFilter();
    });
  }

  addOrEditCard(card: Card) {
    if (!card) {
      card = {
        name: '',
        description: '',
        collectionId: this.selectedCollectionId
      };
    } else {
      card = {... card};
    }
    const dialogRef = this.dialog.open(AdminCardEditDialogComponent, {
      width: '480px',
      data: {
        card: card,
        collectionList: this.collectionList
      },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.card) {
        this.saveCard(result.card);
      }
      dialogRef.close();
    });
  }

  togglePanel(card: Card) {
    this.editCard = this.editCard.id === card.id ? this.editCard = {} : this.editCard = { ...card};
  }

  cancelCardAdd() {
    this.addingNewCard = false;
    this.newCardName = '';
  }

  selectCollection(collectionId: string) {
    this.router.navigate([], {
      queryParams: { collection: collectionId },
      queryParamsHandling: 'merge',
    });
  }

  selectCard(card: Card) {
    this.editCard = { ...card };
    this.originalCard = { ...card };
    return false;
  }

  saveCard(card: Card) {
    if (card.id) {
      this.cardDataService.updateCard(card);
    } else {
      this.cardDataService.add(card);
    }
  }

  deleteCard(card: Card): void {
    this.dialogService
      .confirm(
        'Delete Card',
        'Are you sure that you want to delete ' + card.name + '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.cardDataService.delete(card.id);
        }
      });
  }

  cancelEdit() {
    this.editCard = { ... this.originalCard };
  }

  applyFilter() {
    this.filteredCardList = this.cardList.filter(card =>
      !this.filterString ||
      card.name.toLowerCase().includes(this.filterString) ||
      card.description.toLowerCase().includes(this.filterString)
    );
    this.sortChanged(this.sort);
  }

  clearFilter() {
    this.filterString = '';
    this.filterControl.setValue('');
    this.loadInitialData();
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    this.filteredCardList.sort((a, b) => this.sortCards(a, b, sort.active, sort.direction));
    this.applyPagination();
  }

  private sortCards(
    a: Card,
    b: Card,
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
      case 'description':
        return (
          (a.description.toLowerCase() < b.description.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'collectionId':
        return (
          (this.getCollectionName(a.collectionId).toLowerCase() < this.getCollectionName(b.collectionId).toLowerCase() ? -1 : 1) *
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
      default:
        return 0;
    }
  }

  getCollectionName(collectionId: string) {
    return this.collectionList.find(c => c.id === collectionId).name;
  }

  paginatorEvent(page: PageEvent) {
    this.pageIndex = page.pageIndex;
    this.pageSize = page.pageSize;
    this.applyPagination();
  }

  applyPagination() {
    const startIndex = this.pageIndex * this.pageSize;
    this.cardList = this.filteredCardList.slice(startIndex, startIndex + this.pageSize);
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}
