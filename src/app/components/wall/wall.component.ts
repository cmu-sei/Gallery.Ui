// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.


import { Component, EventEmitter, Inject, Input, Output, OnDestroy, DOCUMENT } from '@angular/core';
import { TeamCard, UserArticle, ItemStatus, Exhibit } from 'src/app/generated/api/model/models';
import { Card } from 'src/app/data/card/card.store';
import { CardQuery } from 'src/app/data/card/card.query';
import { TeamCardQuery } from 'src/app/data/team-card/team-card.query';
import { UserArticleQuery } from 'src/app/data/user-article/user-article.query';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ComnSettingsService } from '@cmusei/crucible-common';

@Component({
  selector: 'app-wall',
  templateUrl: './wall.component.html',
  styleUrls: ['./wall.component.scss'],
  standalone: false
})
export class WallComponent implements OnDestroy {
  @Input() showAdminButton: boolean;
  @Input() showAdvanceButton: boolean;
  @Input() exhibit: Exhibit;
  @Output() changeTeam = new EventEmitter<string>();
  @Output() sectionSelected = new EventEmitter<string>();
  isLoading = false;
  isAdvancing = false;
  cardList: Card[] = [];
  shownCardList: Card[] = [];
  teamCardList: TeamCard[] = [];
  userArticleList: UserArticle[] = [];
  private unsubscribe$ = new Subject();

  constructor(
    @Inject(DOCUMENT) private _document: HTMLDocument,
    private cardQuery: CardQuery,
    private teamCardQuery: TeamCardQuery,
    private userArticleQuery: UserArticleQuery,
    private exhibitDataService: ExhibitDataService,
    private snackBar: MatSnackBar,
    private router: Router,
    private settingsService: ComnSettingsService
  ) {
    this._document.getElementById('appTitle').innerHTML = this.settingsService.settings.AppTitle + ' Wall';
    this.cardQuery.selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(cards => {
        this.cardList = cards;
        this.setShownCardList();
      });
    this.teamCardQuery.selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(teamCards => {
        this.teamCardList = teamCards;
        this.setShownCardList();
      });
    this.userArticleQuery.selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(userArticles => {
        this.userArticleList = userArticles;
        this.setShownCardList();
      });
  }

  gotoAdmin() {
    this.sectionSelected.emit('admin');
  }

  gotoArchive(cardId: string) {
    this.sectionSelected.emit(cardId);
  }

  getDisplayedStatus(itemStatus: ItemStatus) {
    if (itemStatus === ItemStatus.Unused) {
      return 'Not Applicable';
    }

    return itemStatus.toString();
  }

  // matches the ItemStatus enum values in the API, where a lower value is more severe
  private statusSeverity(itemStatus: ItemStatus) {
    switch (itemStatus) {
      case ItemStatus.Closed:
        return 10;
      case ItemStatus.Critical:
        return 20;
      case ItemStatus.Affected:
        return 40;
      case ItemStatus.Open:
        return 50;
      default:
        return Number.MAX_SAFE_INTEGER;
    }
  }

  getMostSevereStatus(userArticles: UserArticle[]) {
    return userArticles
      .map(ua => ua.article?.status)
      .filter(status => status && status !== ItemStatus.Unused)
      .reduce((worst, status) =>
        this.statusSeverity(status) < this.statusSeverity(worst) ? status : worst, ItemStatus.Unused);
  }

  setShownCardList() {
    const shownCardList: Card[] = [];
    this.cardList.forEach(card => {
      const teamCard = this.teamCardList.find(tc => tc.cardId === card.id);
      if (teamCard && teamCard.isShownOnWall) {
        const cardToAdd = { ...card };
        const userArticles = this.userArticleList
          .filter(ua => ua.article.cardId === card.id)
          .sort((a: UserArticle, b: UserArticle) => a.actualDatePosted.getTime() > b.actualDatePosted.getTime() ? -1 : 1);
        if (userArticles.length > 0) {
          cardToAdd.datePosted = userArticles[0].article?.datePosted;
          cardToAdd.unreadCount = userArticles.filter(ua => !ua.isRead).length;
          cardToAdd.status = this.getMostSevereStatus(userArticles);
        } else {
          cardToAdd.datePosted = new Date('1/1/1900');
          cardToAdd.unreadCount = 0;
          cardToAdd.status = ItemStatus.Unused;
        }
        cardToAdd.displayedStatus = this.getDisplayedStatus(cardToAdd.status);
        shownCardList.push(cardToAdd);
      }
    });
    this.shownCardList = shownCardList;
  }

  advanceExhibit() {
    if (!this.exhibit?.id || this.isAdvancing) return;
    this.isAdvancing = true;
    this.exhibitDataService.advance(this.exhibit.id)
      .subscribe({
        next: (updatedExhibit) => {
          this.isAdvancing = false;
          this.exhibitDataService.updateStore(updatedExhibit);
        },
        error: (err) => {
          this.isAdvancing = false;
          const message = err?.error?.detail || err?.error?.title || 'Already at the last move/inject.';
          this.snackBar.open(message, 'OK', { duration: 5000 });
        }
      });
  }

  changeTeamRequest(teamId: string) {
    this.changeTeam.emit(teamId);
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}
