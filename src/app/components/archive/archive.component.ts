// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { DOCUMENT } from '@angular/common';
import { Component, EventEmitter, Inject, Input, Output, OnDestroy } from '@angular/core';
import { Article, Card, ItemStatus, Team, TeamCard, Exhibit, UserArticle, SourceType } from 'src/app/generated/api/model/models';
import { ArticleDataService } from 'src/app/data/article/article-data.service';
import { UserArticleDataService } from 'src/app/data/user-article/user-article-data.service';
import { UserArticleQuery } from 'src/app/data/user-article/user-article.query';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { CardQuery } from 'src/app/data/card/card.query';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamQuery } from 'src/app/data/team/team.query';
import { TeamCardQuery } from 'src/app/data/team-card/team-card.query';
import {
  Observable,
  Subject,
  take,
  takeUntil
} from 'rxjs';
import { Router } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { UntypedFormControl } from '@angular/forms';
import { Section } from 'src/app/utilities/enumerations';
import { ArticleMoreDialogComponent } from '../article-more-dialog/article-more-dialog.component';
import { ArticleShareDialogComponent } from 'src/app/components/article-share-dialog/article-share-dialog.component';
import { ArticleEditDialogComponent } from 'src/app/components/article-edit-dialog/article-edit-dialog.component';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { UIDataService } from 'src/app/data/ui/ui-data.service';
import { XApiService } from 'src/app/generated/api';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.scss'],
})
export class ArchiveComponent implements OnDestroy {
  @Input() showAdminButton: boolean;
  @Output() changeTeam = new EventEmitter<string>();
  @Output() sectionSelected = new EventEmitter<string>();
  apiIsSick = false;
  apiMessage = 'The GALLERY API web service is not responding.';
  exhibitId = '';
  exhibit: Exhibit = {};
  sourceTypeList = '';
  isLoading = false;
  userArticleList: UserArticle[] = [];
  cardId = 'all';
  cardList: Card[] = [];
  moveList: number[] = [];
  teamList: Team[] = [];
  postCardList: Card[] = [];
  showCardList: Card[] = [];
  teamCardList: TeamCard[] = [];
  filteredUserArticleList: UserArticle[] = [];
  filterControl = new UntypedFormControl();
  filterString = '';
  username = 'unknown';
  userId = '';
  sort: Sort = {active: 'datePosted', direction: 'desc'};
  pageSize = 25;
  pageIndex = 0;
  sourceIcon: {[key: string]: string} = {
    Intel: 'mdi-shield-lock',
    Reporting: 'mdi-file-chart',
    News: 'mdi-television-classic',
    Social: 'mdi-bullhorn',
    Phone: 'mdi-cellphone',
    Email: 'mdi-email',
    Orders: 'mdi-police-badge'
  };
  private unsubscribe$ = new Subject();

  editorStyle = {
    height: '200px'
  };

  constructor(
    @Inject(DOCUMENT) private _document: HTMLDocument,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private articleDataService: ArticleDataService,
    private userArticleQuery: UserArticleQuery,
    private userArticleDataService: UserArticleDataService,
    private cardQuery: CardQuery,
    private exhibitQuery: ExhibitQuery,
    private teamDataService: TeamDataService,
    private teamQuery: TeamQuery,
    private teamCardQuery: TeamCardQuery,
    private uiDataService: UIDataService,
    private router: Router,
    private settingsService: ComnSettingsService,
    private xApiService: XApiService
  ) {
    this._document.getElementById('appFavicon').setAttribute('href', '/assets/img/archive-blue.png');
    this._document.getElementById('appTitle').innerHTML = this.settingsService.settings.AppTitle + ' Archive';
    // subscribe to userArticles
    this.userArticleQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(userArticles => {
      this.userArticleList = [];
      this.filteredUserArticleList = [];
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
      console.log('userArticleQuery sortChanged');
      this.sortChanged(this.sort);
      // put unread article count in the browser tab
      if (unreadCount === 0) {
        this._document.getElementById('appTitle').innerHTML = this.settingsService.settings.AppTitle + ' Archive';
      } else {
        this._document.getElementById('appTitle').innerHTML =
            this.settingsService.settings.AppTitle + ' Archive (' + unreadCount.toString() + ')';
      }
    });
    // subscribe to cards
    this.cardQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(cards => {
      this.cardList = [];
      cards.forEach(card => {
        this.cardList.push({ ...card });
      });
      console.log('cardQuery sortChanged');
      this.sortChanged(this.sort);
      this.setCardLists();
    });
    // subscribe to active card
    this.cardQuery.selectActiveId().pipe(takeUntil(this.unsubscribe$)).subscribe(id => {
      this.cardId = id ? id : 'all';
      console.log('activeCard sortChanged ' + this.cardId);
      this.sortChanged(this.sort);
    });
    // subscribe to active exhibit
    (this.exhibitQuery.selectActive() as Observable<Exhibit>).pipe(takeUntil(this.unsubscribe$)).subscribe(e => {
      if (!e) {
        this.exhibitId = '';
        this.exhibit = {};
      } else {
        this.exhibitId = e.id;
        this.exhibit = e;
      }
    });
    // subscribe to filter control changes
    this.filterControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((term) => {
        this.filterString = term;
        console.log('filterControl sortChanged');
        this.sortChanged(this.sort);
      });
    // subscribe to teamCards
    this.teamCardQuery.selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(teamCards => {
        this.teamCardList = teamCards;
        this.setCardLists();
        console.log('teamCardQuery sortChanged');
        this.sortChanged(this.sort);
      });
    // subscribe to teams
    this.teamQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(teams => {
      this.teamList = teams;
    });
  }

  getCardName(id: string) {
    const card = id ? this.cardList.find(c => c.id === id) : null;
    const name = card ? card.name : '';
    return name;
  }

  getCardStatus(itemStatus: ItemStatus) {
    if (itemStatus === ItemStatus.Unused) {
      return 'Not Applicable';
    }

    return itemStatus.toString();
  }

  changeCard(cardId: string) {
    this.cardId = cardId;
    this.sortChanged(this.sort);
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
                        && (!this.sourceTypeList || this.sourceTypeList.indexOf(a.article.sourceType) > -1)
                        && (!this.filterString ||
                              a.article.name.toLowerCase().includes(this.filterString.toLowerCase()) ||
                              a.article.description.toLowerCase().includes(this.filterString.toLowerCase()) ||
                              a.article.sourceType.toLowerCase().includes(this.filterString.toLowerCase()) ||
                              a.article.sourceName.toLowerCase().includes(this.filterString.toLowerCase()) ||
                              a.article.status.toLowerCase().includes(this.filterString.toLowerCase())
                        )
        );
    }
    console.log('userArticleList length is ' + this.userArticleList.length);
    console.log('filteredserArticleList length is ' + this.filteredUserArticleList.length);
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
      case 'sourceType':
        return (
          (a.sourceType.toLowerCase() < b.sourceType.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'sourceName':
        return (
          (a.sourceName.toLowerCase() < b.sourceName.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'cardId':
        return (
          (this.getCardName(a.cardId).toLowerCase() < this.getCardName(b.cardId).toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'status':
        return (
          (a.status.toLowerCase() < b.status.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'datePosted':
        return (
          (a.datePosted.getTime() < b.datePosted.getTime() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      default:
        return 0;
    }
  }

  filterBySourceType(sourceType: string) {
    if (this.sourceTypeList.indexOf(sourceType) > -1) {
      this.sourceTypeList = this.sourceTypeList.replace(sourceType, '');
    } else {
      this.sourceTypeList = this.sourceTypeList + sourceType;
    }
    console.log('filterBySourceType sortChanged');
    this.sortChanged(this.sort);
  }

  getMoveArticles(move: number) {
    return this.filteredUserArticleList.filter(a => a.article.move === move);
  }

  openMoreDialog(userArticle: UserArticle, useUrl: boolean) {
    if (useUrl && userArticle.article.openInNewTab) {
      window.open(userArticle.article.url);
    } else {
      this.xApiService.previewedArticle(this.exhibitId, userArticle.articleId).pipe(take(1)).subscribe();
      const dialogRef = this.dialog.open(ArticleMoreDialogComponent, {
        data: {
          article: userArticle.article,
          useUrl: useUrl,
          exhibitId: this.exhibitId
        },
      });
      dialogRef.componentInstance.editComplete.subscribe((result) => {
        dialogRef.close();
        if (result.openNewTab) {
          if (result.useUrl) {
            window.open(userArticle.article.url);
          } else {
            const url = location.origin + '/exhibit/' + this.exhibit.id + '/article/' + userArticle.articleId;
            window.open(url);
          }
        }
      });
    }
  }

  openShareDialog(userArticle: UserArticle) {
    const dialogRef = this.dialog.open(ArticleShareDialogComponent, {
      width: '900px',
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

  gotoAdmin() {
    this.router.navigate(['/admin'], {
      queryParams: { section: Section.exhibits }
    });
  }

  gotoWallSection() {
    this.sectionSelected.emit(Section.wall);
  }

  setCardLists() {
    this.postCardList = [];
    this.showCardList = [];
    if (this.teamCardList.length > 0 && this.cardList.length > 0) {
      this.teamCardList.forEach(tc => {
        const card = { ...this.cardList.find(c => c.id === tc.cardId)};
        this.showCardList.push(card);
        if (tc.canPostArticles) {
          this.postCardList.push(card);
        }
      });
    }
  }

  myTeamIsSelected(): boolean {
    return this.teamQuery.getActiveId() === this.teamDataService.getMyTeamId();
  }

  canAddArticles() {
    return this.postCardList.length > 0 &&
      this.exhibit && this.exhibit.collectionId &&
      this.myTeamIsSelected();
  }

  sourceIsMe(sourceName: string): boolean {
    return sourceName === (this.teamQuery.getActive() as Team)?.shortName;
  }

  addOrEditArticle(article: Article) {
    if (!this.exhibit || !this.exhibit.collectionId) {
      return;
    }
    if (!article) {
      const datePosted = new Date();
      article = {
        name: '',
        description: '',
        collectionId: this.exhibit.collectionId,
        exhibitId: this.exhibitId,
        move: this.exhibit.currentMove,
        inject: this.exhibit.currentInject,
        status: ItemStatus.Unused,
        sourceType: SourceType.Reporting,
        sourceName: this.teamDataService.getMyTeam().shortName,
        datePosted: datePosted
      };
    } else {
      article = {... article};
    }
    const dialogRef = this.dialog.open(ArticleEditDialogComponent, {
      width: '900px',
      data: {
        article: article,
        cardList: this.postCardList,
        exhibitId: this.exhibitId
      },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.article) {
        this.saveArticle(result.article);
      }
      dialogRef.close();
    });
  }

  saveArticle(article: Article) {
    if (article.id) {
      this.articleDataService.updateArticle(article);
    } else {
      this.articleDataService.addFromUser(article);
    }
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

  getButtonClass(sourceType: string): string {
    let classes = '';
    if (this.sourceTypeList.indexOf(sourceType) > -1) {
      classes = 'active-sourcetype-button';
    } else {
      classes = 'inactive-sourcetype-button';
    }

    return classes;
  }

  changeTeamRequest(teamId: string) {
    this.changeTeam.emit(teamId);
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}
