// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { DOCUMENT } from '@angular/common';
import { Component, Inject, Input, OnDestroy } from '@angular/core';
import { TeamCard, UserArticle, ItemStatus } from 'src/app/generated/api/model/models';
import { Card } from 'src/app/data/card/card.store';
import { CardQuery } from 'src/app/data/card/card.query';
import { TeamCardQuery } from 'src/app/data/team-card/team-card.query';
import { UserArticleQuery } from 'src/app/data/user-article/user-article.query';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { HealthService } from 'src/app/generated/api';
import { ActivatedRoute, Router } from '@angular/router';
import { Section } from 'src/app/utilities/enumerations';
import { ComnSettingsService } from '@cmusei/crucible-common';

@Component({
  selector: 'app-wall',
  templateUrl: './wall.component.html',
  styleUrls: ['./wall.component.scss'],
})
export class WallComponent implements OnDestroy {
  @Input() showAdminButton: boolean;
  isLoading = false;
  apiIsSick = false;
  apiMessage = 'The GALLERY API web service is not responding.';
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
    private healthService: HealthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private settingsService: ComnSettingsService
  ) {
    this.healthCheck();
    this._document.getElementById('appFavicon').setAttribute('href', '/assets/img/wall-blue.png');
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

  healthCheck() {
    this.healthService.healthGetReadiness().pipe(take(1)).subscribe(healthReport => {
      this.apiIsSick = false;
      this.apiMessage = healthReport.status;
    },
    error => {
      this.apiIsSick = true;
      this.apiMessage = error.message;
    });
  }

  gotoAdmin() {
    this.router.navigate(['/admin'], {
      queryParams: { section: Section.exhibits },
      queryParamsHandling: 'merge',
    });
  }

  gotoArchive(cardId: string) {
    this.router.navigate([''], {
      queryParams: { card: cardId, section: Section.archive },
      queryParamsHandling: 'merge',
    });
  }

  getDisplayedStatus(itemStatus: ItemStatus) {
    if (itemStatus === ItemStatus.Unused) {
      return 'Not Applicable';
    }

    return itemStatus.toString();
  }

  setShownCardList() {
    const shownCardList: Card[] = [];
    this.cardList.forEach(card => {
      const teamCard = this.teamCardList.find(tc => tc.cardId === card.id);
      if (teamCard && teamCard.isShownOnWall) {
        const cardToAdd = { ... card };
        const userArticles = this.userArticleList
          .filter(ua => ua.article.cardId === card.id)
          .sort((a: Card, b: Card) => a.datePosted < b.datePosted ? -1 : 1);
        if (userArticles.length > 0) {
          cardToAdd.datePosted = userArticles[0].article?.datePosted;
          cardToAdd.unreadCount = userArticles.filter(ua => !ua.isRead).length;
          cardToAdd.displayedStatus = this.getDisplayedStatus(userArticles[0].article.status);
        } else {
          cardToAdd.datePosted = new Date('1/1/1900');
          cardToAdd.unreadCount = 0;
          cardToAdd.displayedStatus = this.getDisplayedStatus(ItemStatus.Unused);
        }
        shownCardList.push(cardToAdd);
      }
    });
    this.shownCardList = shownCardList;
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}
