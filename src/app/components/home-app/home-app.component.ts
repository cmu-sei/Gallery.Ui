// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { EntityActions } from '@datorama/akita';
import { ComnSettingsService, Theme, ComnAuthQuery } from '@cmusei/crucible-common';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { TopbarView } from './../shared/top-bar/topbar.models';
import { HealthCheckService } from 'src/app/generated/api';
import { SignalRService } from 'src/app/services/signalr.service';
import { Collection, Exhibit, Team, User } from 'src/app/generated/api/model/models';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { UserArticleDataService } from 'src/app/data/user-article/user-article-data.service';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamQuery } from 'src/app/data/team/team.query';
import { TeamCardDataService } from 'src/app/data/team-card/team-card-data.service';
import { Section } from 'src/app/utilities/enumerations';
import { XApiService } from 'src/app/generated/api';

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
  loggedInUser = { id: '', name: '' };
  userList: User[] = [];
  collectionList: Collection[] = [];
  collectionLoadCount = 0;
  allExhibits: Exhibit[] = [];
  exhibitList: Exhibit[] = [];
  teamList: Team[] = [];
  selectedTeamId = '';
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
  public filterString: string;

  constructor(
    private userDataService: UserDataService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private settingsService: ComnSettingsService,
    private authQuery: ComnAuthQuery,
    private signalRService: SignalRService,
    private healthCheckService: HealthCheckService,
    private userArticleDataService: UserArticleDataService,
    private cardDataService: CardDataService,
    private exhibitDataService: ExhibitDataService,
    private exhibitQuery: ExhibitQuery,
    private teamDataService: TeamDataService,
    private teamQuery: TeamQuery,
    private teamCardDataService: TeamCardDataService,
    private collectionDataService: CollectionDataService,
    private collectionQuery: CollectionQuery,
    private xApiService: XApiService
  ) {
    this.healthCheck();

    this.theme$ = this.authQuery.userTheme$;
    this.hideTopbar = this.inIframe();
    // subscribe to route changes
    this.activatedRoute.queryParamMap.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.selectedSection = params.get('section');
      const exhibitId = params.get('exhibit');
      const collectionId = params.get('collection');
      const cardId = params.get('card');
      this.exhibitId = exhibitId ? exhibitId : this.exhibitId;
      this.collectionId = collectionId ? collectionId : this.collectionId;
      if (!exhibitId && !collectionId) {
        this.collectionDataService.loadMine();
      } else {
        if (exhibitId) {
          if (!this.exhibit || this.exhibit.id !== exhibitId) {
            this.exhibitDataService.loadById(exhibitId);
            this.exhibitDataService.setActive(exhibitId);
          }
        } else {
          if (!this.collection || this.collectionId !== collectionId) {
            this.collectionDataService.loadById(collectionId);
            this.collectionDataService.setActive(collectionId);
            this.exhibitDataService.loadMineByCollection(collectionId);
          }
        }
      }
      this.exhibitDataService.setActive(this.exhibitId);
      this.collectionDataService.setActive(this.collectionId);
      if (this.exhibitId && this.selectedTeamId) {
        if (this.selectedTeamId !== this.teamDataService.getMyTeamId()) {
          // observed
          if (this.selectedSection === 'archive') {
            this.xApiService.observedExhibitArchive(exhibitId, this.selectedTeamId).pipe(take(1)).subscribe();
          } else if (this.selectedSection === 'wall') {
            this.xApiService.observedExhibitWall(exhibitId, this.selectedTeamId).pipe(take(1)).subscribe();
          }
        } else {
          // viewed
          if (this.selectedSection === 'archive') {
            this.xApiService.viewedExhibitArchive(exhibitId).pipe(take(1)).subscribe();
            if (cardId && cardId !== 'all') {
              this.xApiService.viewedCard(exhibitId, cardId).pipe(take(1)).subscribe();
            }
          } else if (this.selectedSection === 'wall') {
            this.xApiService.viewedExhibitWall(exhibitId).pipe(take(1)).subscribe();
          }
        }
      }
    });
    // subscribe to the collections
    this.collectionQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(collections => {
      this.collectionList = collections;
    });
    // subscribe to the exhibits
    this.exhibitQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(exhibits => {
      this.exhibitList = exhibits;
    });
    // subscribe to the active exhibit
    (this.exhibitQuery.selectActive() as Observable<Exhibit>).pipe(takeUntil(this.unsubscribe$)).subscribe(exhibit => {
      if (exhibit && (!this.exhibit || this.exhibit.id !== exhibit.id)) {
        this.exhibit = exhibit;
        this.loadExhibitData();
      };
    });
    // subscribe to the user list
    this.userDataService.userList.pipe(takeUntil(this.unsubscribe$)).subscribe(users => {
      this.userList = users;
    });
    this.userDataService.getUsersFromApi();
    this.teamQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(teams => {
      this.teamList = teams;
      this.setMyTeam();
    });
    this.userDataService.loggedInUser
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((user) => {
        if (user && user.profile && user.profile.sub !== this.loggedInUser.id) {
          this.loggedInUser.id = user.profile.sub;
          this.loggedInUser.name = user.profile.name;
        }
      });
    this.userDataService.isAuthorizedUser
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((isAuthorized) => {
        this.isAuthorizedUser = isAuthorized;
      });
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
    this.filterString = '';
  }

  setMyTeam() {
    this.teamList.forEach(t => {
      t.users.forEach(u => {
        if (u && u.id === this.loggedInUser.id) {
          this.teamDataService.setMyTeam(t.id);
          if (!this.teamQuery.getActiveId()) {
            this.selectedTeamId = t.id;
            this.teamDataService.setActive(t.id);
            this.loadTeamData();
          }
        }
      });
    });
  }

  changeTeam(teamId: string) {
    this.selectedTeamId = teamId;
    this.teamDataService.setActive(teamId);
    this.loadTeamData();
    this.router.navigate([], {
      queryParams: { team: teamId },
      queryParamsHandling: 'merge'
    });
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
    this.healthCheckService.getReadiness().pipe(take(1)).subscribe(healthReport => {
      this.apiIsSick = false;
    },
    error => {
      this.apiIsSick = true;
    });
  }

  loadExhibitData() {
    // process the change
    if (this.exhibit) {
      this.collectionId = this.exhibit.collectionId;
      this.exhibitDataService.setActive(this.exhibitId);
      this.currentMove = this.exhibit.currentMove;
      this.currentInject = this.exhibit.currentInject;
      this.cardDataService.loadByExhibit(this.exhibitId);
      this.teamDataService.loadMine(this.exhibitId);
    }
  }

  loadTeamData() {
    // process the change
    if (this.selectedTeamId) {
      this.teamCardDataService.loadByExhibitTeam(this.exhibitId, this.selectedTeamId);
      this.userArticleDataService.loadByExhibitTeam(this.exhibitId, this.selectedTeamId);
    }
  }

  selectCollection(collectionId: string) {
    this.collectionId = collectionId;
    this.exhibitId = '';
    this.router.navigate([], {
      queryParams: { collection: collectionId, exhibit: '' },
      queryParamsHandling: 'merge',
    });
  }

  selectExhibit(exhibitId: string) {
    const section = this.selectedSection ? this.selectedSection : 'archive';
    this.router.navigate([], {
      queryParams: { exhibit: exhibitId, section: section },
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

  applyFilter(filterValue: string) {
    this.filterString = filterValue.trim().toLowerCase();
    this.exhibitList = this.exhibitList.filter(exhibit => {
      const createdBy = this.getUserName(exhibit.createdBy).toLowerCase();
      return createdBy.includes(this.filterString);
    });
  }

  onFilterChange() {
    if (!this.filterString) {
      this.clearFilter();
    }
  }

  clearFilter() {
    this.filterString = '';
    this.exhibitDataService.loadMineByCollection(this.collectionId);
  }

  topBarNavigate(url): void {
    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
