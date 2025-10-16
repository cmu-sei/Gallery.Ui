// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, Input, OnDestroy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
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
import { MatDialog } from '@angular/material/dialog';
import { AdminCardEditDialogComponent } from 'src/app/components/admin/admin-card-edit-dialog/admin-card-edit-dialog.component';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';

@Component({
    selector: 'app-admin-cards',
    templateUrl: './admin-cards.component.html',
    styleUrls: ['./admin-cards.component.scss'],
    standalone: false
})
export class AdminCardsComponent implements OnDestroy {
  canEdit = false;
  pageSize = 10;
  pageIndex = 0;
  collectionList: Collection[] = [];
  selectedCollectionId = '';
  newCard: Card = { id: '', name: '' };
  cardList: Card[];
  displayedCards: Card[];
  isLoading = false;
  topbarColor = '#ef3a47';
  addingNewCard = false;
  newCardName = '';
  editCard: Card = {};
  originalCard: Card = {};
  filteredCardList: Card[] = [];
  filterControl = new UntypedFormControl();
  filterString = '';
  sort: Sort = { active: 'datePosted', direction: 'desc' };
  private unsubscribe$ = new Subject();

  constructor(
    private settingsService: ComnSettingsService,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private collectionDataService: CollectionDataService,
    private collectionQuery: CollectionQuery,
    private cardDataService: CardDataService,
    private cardQuery: CardQuery,
    private permissionDataService: PermissionDataService
  ) {
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.cardQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((cards) => {
        this.cardList = [];
        this.filteredCardList = [];
        cards.forEach((card) => {
          this.cardList.push({ ...card });
          if (card.id === this.editCard.id) {
            this.editCard = { ...card };
          }
          this.sortChanged(this.sort);
        });
      });
    this.collectionList = this.collectionQuery.getActive() as Collection[];
    this.collectionQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((collections) => {
        this.collectionList = collections;
      });
    this.cardQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((cards) => {
        this.cardList = Array.from(cards);
        this.applyFilter();
        this.isLoading = false;
      });
    this.selectedCollectionId = this.collectionQuery.getActiveId();
    if (this.selectedCollectionId) {
      this.loadCards();
    }
    this.collectionQuery
      .selectActiveId()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((collectionId) => {
        if (collectionId && this.selectedCollectionId !== collectionId) {
          this.selectedCollectionId = collectionId;
          this.loadCards();
        }
      });

    this.filterControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((term) => {
        this.filterString = term.trim().toLowerCase();
        this.applyFilter();
      });
  }

  loadCards() {
    this.isLoading = true;
    this.cardDataService.loadByCollection(this.selectedCollectionId);
    this.canEdit = this.permissionDataService.canEditCollection(
      this.selectedCollectionId
    );
  }

  addOrEditCard(card: Card) {
    if (!card) {
      card = {
        name: '',
        description: '',
        collectionId: this.selectedCollectionId,
      };
    } else {
      card = { ...card };
    }
    const dialogRef = this.dialog.open(AdminCardEditDialogComponent, {
      width: '480px',
      data: {
        card: card,
        collectionList: this.collectionList,
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
    this.editCard =
      this.editCard.id === card.id
        ? (this.editCard = {})
        : (this.editCard = { ...card });
  }

  cancelCardAdd() {
    this.addingNewCard = false;
    this.newCardName = '';
  }

  selectCollection(collectionId: string) {
    this.cardList = [];
    this.isLoading = true;
    this.collectionDataService.setActive(collectionId);
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
    this.editCard = { ...this.originalCard };
  }

  applyFilter() {
    this.filteredCardList = this.cardList.filter(
      (card) =>
        !this.filterString ||
        card.name.toLowerCase().includes(this.filterString) ||
        card.description.toLowerCase().includes(this.filterString)
    );
    this.sortChanged(this.sort);
  }

  clearFilter() {
    this.filterControl.setValue('');
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    this.filteredCardList.sort((a, b) =>
      this.sortCards(a, b, sort.active, sort.direction)
    );
    this.applyPagination();
  }

  private sortCards(a: Card, b: Card, column: string, direction: string) {
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
          (this.getCollectionName(a.collectionId).toLowerCase() <
          this.getCollectionName(b.collectionId).toLowerCase()
            ? -1
            : 1) * (isAsc ? 1 : -1)
        );
      case 'move':
        return (a.move < b.move ? -1 : 1) * (isAsc ? 1 : -1);
      case 'inject':
        return (a.inject < b.inject ? -1 : 1) * (isAsc ? 1 : -1);
      default:
        return 0;
    }
  }

  getCollectionName(collectionId: string) {
    return this.collectionList.find((c) => c.id === collectionId).name;
  }

  paginatorEvent(page: PageEvent) {
    this.pageIndex = page.pageIndex;
    this.pageSize = page.pageSize;
    this.applyPagination();
  }

  applyPagination() {
    const startIndex = this.pageIndex * this.pageSize;
    this.displayedCards = this.filteredCardList.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
