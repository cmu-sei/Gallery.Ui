// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { EntityActions } from '@datorama/akita';
import { ComnSettingsService, Theme, ComnAuthQuery } from '@cmusei/crucible-common';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { TopbarView } from './../shared/top-bar/topbar.models';
import { HealthService } from 'src/app/generated/api';
import { SignalRService } from 'src/app/services/signalr.service';
import { Collection, Exhibit, Team, User } from 'src/app/generated/api/model/models';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { UserArticleDataService } from 'src/app/data/user-article/user-article-data.service';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamCardDataService } from 'src/app/data/team-card/team-card-data.service';
import { Section } from 'src/app/utilities/enumerations';

@Component({
  selector: 'app-home-app',
  templateUrl: './home-app.component.html',
  styleUrls: ['./home-app.component.scss'],
})
export class HomeAppComponent implements OnDestroy, OnInit {
  @ViewChild('sidenav') sidenav: MatSidenav;
  apiIsSick = false;
  apiMessage = 'The GALLERY API web service appears to be experiencing technical difficulties.';
  titleText = 'Gallery';
  exhibitId = '';
  exhibit: Exhibit;
  collectionId = '';
  collection: Collection;
  currentMove = -1;
  currentInject = -1;
  selectedSection: string = Section.none;
  loggedInUserId = '';
  userList: User[] = [];
  collectionList: Collection[] = [];
  collectionLoadCount = 0;
  allExhibits: Exhibit[] = [];
  exhibitList: Exhibit[] = [];
  teamList: Team[] = [];
  isContentDeveloper$ = this.userDataService.isContentDeveloper.asObservable();
  isAuthorizedUser = false;
  isSidebarOpen = true;
  private unsubscribe$ = new Subject();
  hideTopbar = false;
  topbarColor = '#ef3a47';
  topbarTextColor = '#FFFFFF';
  topbarImage = this.settingsService.settings.AppTopBarImage;
  TopbarView = TopbarView;
  theme$: Observable<Theme>;

  constructor(
    private userDataService: UserDataService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private settingsService: ComnSettingsService,
    private authQuery: ComnAuthQuery,
    private signalRService: SignalRService,
    private healthService: HealthService,
    private userArticleDataService: UserArticleDataService,
    private cardDataService: CardDataService,
    private exhibitDataService: ExhibitDataService,
    private exhibitQuery: ExhibitQuery,
    private teamDataService: TeamDataService,
    private teamCardDataService: TeamCardDataService,
    private collectionDataService: CollectionDataService,
    private collectionQuery: CollectionQuery
  ) {
    this.healthCheck();

    this.theme$ = this.authQuery.userTheme$;
    this.hideTopbar = this.inIframe();
    // subscribe to route changes
    this.activatedRoute.queryParamMap.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.selectedSection = params.get('section');
      const exhibitId = params.get('exhibit');
      const collectionId = params.get('collection');
      this.exhibitId = exhibitId ? exhibitId : this.exhibitId;
      this.collectionId = collectionId ? collectionId : this.collectionId;
      this.exhibitDataService.setActive(this.exhibitId);
      this.collectionDataService.setActive(this.collectionId);
      this.setExhibitAndCollection();
    });
    // subscribe to the collections
    (this.collectionQuery.selectAll() as Observable<Collection[]>).pipe(takeUntil(this.unsubscribe$)).subscribe(collections => {
      this.collectionList = collections;
      if ((!collections || collections.length === 0) && this.collectionLoadCount < 5) {
        this.collectionDataService.loadMine();
        this.collectionLoadCount++;
        console.log('Attempt to load collections #' + this.collectionLoadCount);
      }
      this.setExhibitAndCollection();
    });
    // subscribe to the exhibits
    (this.exhibitQuery.selectAll() as Observable<Exhibit[]>).pipe(takeUntil(this.unsubscribe$)).subscribe(exhibits => {
      this.allExhibits = exhibits;
      this.setExhibitAndCollection();
    });
    // subscribe to an exhibit update
    this.exhibitQuery.selectEntityAction(EntityActions.Update).pipe(takeUntil(this.unsubscribe$)).subscribe(entities => {
      const exhibit = this.exhibitQuery.getActive() as Exhibit;
      if (exhibit && entities.includes(exhibit.id)) {
        this.exhibit = null;
        this.setExhibitAndCollection();
      }
    });
    // subscribe to the user list
    this.userDataService.userList.pipe(takeUntil(this.unsubscribe$)).subscribe(users => {
      this.userList = users;
    });

    this.userDataService.getUsersFromApi();

    this.userDataService.loggedInUser
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((user) => {
        if (user && user.profile && user.profile.sub !== this.loggedInUserId) {
          this.loggedInUserId = user.profile.sub;
          this.exhibitDataService.unload();
          this.collectionDataService.unload();
          this.cardDataService.unload();
          this.teamDataService.unload();
          this.teamCardDataService.unload();
          this.userArticleDataService.unload();
        }
      });

    this.userDataService.isAuthorizedUser
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((isAuthorized) => {
        this.isAuthorizedUser = isAuthorized;
      });
    this.collectionDataService.loadMine();
    this.exhibitDataService.loadMine();

    // Set the display settings from config file
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.topbarTextColor = this.settingsService.settings.AppTopBarHexTextColor
      ? this.settingsService.settings.AppTopBarHexTextColor
      : this.topbarTextColor;
    this.titleText = this.settingsService.settings.AppTopBarText;

  }

  ngOnInit() {
    this.signalRService
      .startConnection()
      .then(() => {
        this.signalRService.join();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  setExhibitAndCollection() {
    if (this.exhibitId && (!this.exhibit || this.exhibit.id !== this.exhibitId)) {
      this.exhibit = this.allExhibits.find(e => e.id === this.exhibitId);
      if (this.exhibit) {
        if (this.collectionId && this.collectionId !== this.exhibit.collectionId) {
          this.router.navigate([], {
            queryParams: { collection: this.exhibit.collectionId },
            queryParamsHandling: 'merge'
          });
        }
        this.collectionId = this.exhibit.collectionId;
        this.collectionDataService.setActive(this.collectionId);
      }
      this.reloadCardsAndArticles();
    } else if (this.collectionId && (!this.collection || this.collection.id !== this.collectionId)) {
      this.collectionDataService.setActive(this.collectionId);
    }
    this.exhibitList = this.allExhibits.filter(e => e.collectionId === this.collectionId);
  }

  logout() {
    this.userDataService.logout();
  }

  inIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  healthCheck() {
    this.healthService.healthGetReadiness().pipe(take(1)).subscribe(healthReport => {
      this.apiIsSick = false;
    },
    error => {
      this.apiIsSick = true;
    });
  }

  reloadCardsAndArticles() {
    this.cardDataService.unload();
    this.teamDataService.unload();
    this.teamCardDataService.unload();
    this.userArticleDataService.unload();
    // process the change
    if (this.exhibit) {
      this.collectionId = this.exhibit.collectionId;
      this.exhibitDataService.setActive(this.exhibitId);
      this.currentMove = this.exhibit.currentMove;
      this.currentInject = this.exhibit.currentInject;
      this.cardDataService.loadMine(this.exhibitId);
      this.teamDataService.loadByExhibitId(this.exhibitId);
      this.teamCardDataService.loadMineByExhibit(this.exhibit.id);
      this.userArticleDataService.loadMine(this.exhibitId);
    }
  }

  selectCollection(collectionId: string) {
    this.collectionId = collectionId;
    this.exhibitList = this.allExhibits.filter(e => e.collectionId === collectionId);
    this.exhibitId = '';
    this.router.navigate([], {
      queryParams: { collection: collectionId, exhibit: '' },
      queryParamsHandling: 'merge',
    });
  }

  selectExhibit(exhibitId: string) {
    this.router.navigate([], {
      queryParams: { exhibit: exhibitId },
      queryParamsHandling: 'merge',
    });
  }

  getUserName(userId: string) {
    const user = this.userList.find(u => u.id === userId);
    return user ? user.name : ' ';
  }

  gotoAdmin() {
    this.router.navigate(['/admin'], {
      queryParams: { section: Section.exhibits },
      queryParamsHandling: 'merge',
    });
  }

  gotoArchiveSection() {
    this.router.navigate([], {
      queryParams: { section: Section.archive },
      queryParamsHandling: 'merge'
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
}
