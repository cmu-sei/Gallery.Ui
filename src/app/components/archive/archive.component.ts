// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { DOCUMENT } from '@angular/common';
import { Component, Inject, Input, OnDestroy } from '@angular/core';
import { Article, ItemStatus, Team, User, UserArticle } from 'src/app/generated/api/model/models';
import { UserArticleDataService } from 'src/app/data/user-article/user-article-data.service';
import { UserArticleQuery } from 'src/app/data/user-article/user-article.query';
import { Card } from 'src/app/data/card/card.store';
import { CardQuery } from 'src/app/data/card/card.query';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { TeamQuery } from 'src/app/data/team/team.query';
import { Observable, Subject } from "rxjs";
import { map, take, takeUntil } from "rxjs/operators";
import { HealthService } from 'src/app/generated/api';
import { ActivatedRoute, Router } from '@angular/router';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Sort } from '@angular/material/sort';
import { UntypedFormControl } from '@angular/forms';
import { Section } from 'src/app/utilities/enumerations';
import { ArticleMoreDialogComponent } from '../article-more-dialog/article-more-dialog.component';
import { ArticleShareDialogComponent } from 'src/app/components/article-share-dialog/article-share-dialog.component';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.scss'],
})
export class ArchiveComponent implements OnDestroy {
  @Input() showAdminButton: boolean;
  apiIsSick = false;
  apiMessage = 'The GALLERY API web service is not responding.';
  cardId = 'all';
  exhibitId = '';
  currentMove = -1;
  currentInject = -1;
  sourceType = '';
  isLoading = false;
  userArticleList: UserArticle[] = [];
  cardList: Card[] = [];
  moveList: number[] = [];
  teamList: Team[] = [];
  filteredUserArticleList: UserArticle[] = [];
  filterControl = new UntypedFormControl();
  filterString = '';
  sort: Sort = {active: 'datePosted', direction: 'desc'};
  pageSize = 25;
  pageIndex = 0;
  sourceIcon: {[key: string]: string} = {Intel: 'mdi-shield-lock', Reporting: 'mdi-file-chart', News: 'mdi-television-classic', Social: 'mdi-bullhorn'};
  private unreadCount = 0;
  private unsubscribe$ = new Subject();

  constructor(
    @Inject(DOCUMENT) private _document: HTMLDocument,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private userArticleQuery: UserArticleQuery,
    private userArticleDataService: UserArticleDataService,
    private cardQuery: CardQuery,
    private exhibitQuery: ExhibitQuery,
    private teamQuery: TeamQuery,
    private healthService: HealthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private settingsService: ComnSettingsService
  ) {
    this.healthCheck();
    this._document.getElementById('appFavicon').setAttribute('href', '/assets/img/archive-blue.png');
    this._document.getElementById('appTitle').innerHTML = this.settingsService.settings.AppTitle + ' Archive';
    this.userArticleQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(userArticles => {
      this.userArticleList = [];
      let unreadCount = 0;
      userArticles.forEach(ua => {
        unreadCount = ua.isRead ? unreadCount : ++unreadCount;
        this.userArticleList.push({ ... ua });
      });
      this.moveList = [];
      if (userArticles.length > 0) {
        const maxMove = userArticles.sort((a: UserArticle, b: UserArticle) => (b.article.move - a.article.move))[0].article.move;
        for (let move = maxMove; move >= 0 ; move--) {
          this.moveList.push(move);
        }
      }
      this.sortChanged(this.sort);
      // put unread article count in the browser tab
      if (unreadCount === 0) {
        this._document.getElementById('appTitle').innerHTML = this.settingsService.settings.AppTitle + ' Archive';
      } else {
        this._document.getElementById('appTitle').innerHTML = this.settingsService.settings.AppTitle + ' Archive (' + unreadCount.toString() + ')';
      }
    });
    this.cardQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(cards => {
      this.cardList = [];
      cards.forEach(card => {
        this.cardList.push({ ...card });
      });
      this.sortChanged(this.sort);
    });
    this.activatedRoute.queryParamMap
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((params) => {
        const cardId  = params.get('card');
        const exhibitId  = params.get('exhibit');
        if (!exhibitId) {
          this.router.navigate([''], {
            queryParams: { },
            queryParamsHandling: 'merge'
          });
        }
        this.exhibitId = exhibitId;
        this.cardId = cardId ? cardId : 'all';
        this.sortChanged(this.sort);
    });
    this.filterControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((term) => {
        this.filterString = term;
        this.sortChanged(this.sort);
      });
    this.teamQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(teams => {
      this.teamList = teams;
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

  getCardName(id: string) {
    const card = id ? this.cardList.find(card => card.id === id) : null;
    const name = card ? card.name : '';
    return name;
  }

  getCardStatus(itemStatus: ItemStatus) {
    if (itemStatus === ItemStatus.Unused) {
      return 'Not Applicable';
    }

    return itemStatus.toString();
  }

  applyFilter(filterValue: string) {
    this.filterControl.setValue(filterValue);
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    if (this.userArticleList && this.userArticleList.length > 0) {
      this.filteredUserArticleList = this.userArticleList
        .sort((a: UserArticle, b: UserArticle) => this.sortArticles(a.article, b.article, sort.active, sort.direction))
        .filter((a) => ((this.cardId === 'all') || a.article.cardId === this.cardId)
                        && (!this.sourceType || a.article.sourceType === this.sourceType)
                        && (!this.filterString ||
                              a.article.name.toLowerCase().includes(this.filterString.toLowerCase()) ||
                              a.article.description.toLowerCase().includes(this.filterString.toLowerCase()) ||
                              a.article.sourceType.toLowerCase().includes(this.filterString.toLowerCase()) ||
                              a.article.sourceName.toLowerCase().includes(this.filterString.toLowerCase()) ||
                              a.article.status.toLowerCase().includes(this.filterString.toLowerCase())
                            )
                );
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
      case "sourceType":
        return (
          (a.sourceType.toLowerCase() < b.sourceType.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case "sourceName":
        return (
          (a.sourceName.toLowerCase() < b.sourceName.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case "cardId":
        return (
          (this.getCardName(a.cardId).toLowerCase() < this.getCardName(b.cardId).toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case "status":
        return (
          (a.status.toLowerCase() < b.status.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case "datePosted":
        return (
          (a.datePosted.getTime() < b.datePosted.getTime() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      default:
        return 0;
    }
  }

  filterBySourceType(sourceType: string) {
    if (this.sourceType === sourceType) {
      this.sourceType = '';
    } else {
      this.sourceType = sourceType;
    }
    this.sortChanged(this.sort);
  }

  getMoveArticles(move: number) {
    return this.filteredUserArticleList.filter(a => a.article.move == move)
  }

  openMoreDialog(userArticle: UserArticle) {
    if (userArticle.article.openInNewTab) {
      window.open(userArticle.article.url);
    } else {
      const dialogRef = this.dialog.open(ArticleMoreDialogComponent, {
        width: '1200px',
        data: {
          article: userArticle.article
        },
      });
      dialogRef.componentInstance.editComplete.subscribe((result) => {
        dialogRef.close();
        if (result.openNewTab) {
          window.open(userArticle.article.url);
        }
      });
    }
  }

  openShareDialog(userArticle: UserArticle) {
    const dialogRef = this.dialog.open(ArticleShareDialogComponent, {
      width: '800px',
      data: {
        article: userArticle.article,
        teamList: this.teamList,
        isEmailActive: this.settingsService.settings.IsEmailActive
      },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.shareDetails) {
        result.shareDetails.exhibitId = this.exhibitId;
        this.userArticleDataService.shareUserArticle(userArticle.id, result.shareDetails);
      }
      dialogRef.close();
    });
  }

  getIsReadClass(userArticle: UserArticle) {
    return userArticle.isRead ? 'article-read' : 'article-unread';
  }

  toggleReadStatus(userArticle: UserArticle) {
    this.userArticleDataService.setIsRead(userArticle.id, !userArticle.isRead);
  }

  paginatorEvent(page: PageEvent) {
    this.pageIndex = page.pageIndex;
    this.pageSize = page.pageSize;
  }

  paginateArticles(userArticles: UserArticle[], pageIndex: number, pageSize: number) {
    if (!userArticles) {
      return [];
    }
    const startIndex = pageIndex * pageSize;
    const copy = userArticles.slice();
    return copy.splice(startIndex, pageSize);
  }

  gotoAdmin() {
    this.router.navigate(['/admin'], {
      queryParams: { section: Section.exhibits },
      queryParamsHandling: 'merge',
    });
  }

  gotoWallSection() {
    this.router.navigate([], {
      queryParams: { section: Section.wall },
      queryParamsHandling: 'merge'
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  editorStyle = {
    height: '200px'
  };

}
