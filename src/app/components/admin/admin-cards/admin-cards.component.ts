// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-admin-cards',
  templateUrl: './admin-cards.component.html',
  styleUrls: ['./admin-cards.component.scss'],
})
export class AdminCardsComponent implements OnInit, OnDestroy {
  @Input() pageSize: number;
  @Input() pageIndex: number;
  @Output() pageChange = new EventEmitter<PageEvent>();
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
        this.filterString = term;
        this.sortChanged(this.sort);
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
    this.filterControl.setValue(this.filterString);
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
      width: '800px',
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

  applyFilter(filterValue: string) {
    this.filterControl.setValue(filterValue);
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    if (this.cardList && this.cardList.length > 0) {
      this.filteredCardList = this.cardList
        .sort((a: Card, b: Card) => this.sortCards(a, b, sort.active, sort.direction))
        .filter((a) => (
          !this.filterString ||
          a.name.toLowerCase().includes(this.filterString.toLowerCase()) ||
          a.description.toLowerCase().includes(this.filterString.toLowerCase())
        ));
    }
  }

  private sortCards(
    a: Card,
    b: Card,
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
      case "description":
        return (
          (a.description.toLowerCase() < b.description.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case "collectionId":
        return (
          (this.getCollectionName(a.collectionId).toLowerCase() < this.getCollectionName(b.collectionId).toLowerCase() ? -1 : 1) *
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
      default:
        return 0;
    }
  }

  getCollectionName(collectionId: string) {
    return this.collectionList.find(c => c.id === collectionId).name;
  }

  paginatorEvent(page: PageEvent) {
    this.pageChange.emit(page);
  }

  paginateCards(cards: Card[], pageIndex: number, pageSize: number) {
    if (!cards) {
      return [];
    }
    const startIndex = pageIndex * pageSize;
    const copy = cards.slice();
    return copy.splice(startIndex, pageSize);
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}
