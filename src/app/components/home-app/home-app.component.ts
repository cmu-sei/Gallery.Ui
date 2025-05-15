// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import {
  ComnAuthService,
  ComnSettingsService,
  Theme,
  ComnAuthQuery,
} from '@cmusei/crucible-common';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { UserQuery } from 'src/app/data/user/user.query';
import { CurrentUserQuery } from 'src/app/data/user/user.query';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { SystemPermission } from 'src/app/generated/api';
import { TopbarView } from './../shared/top-bar/topbar.models';
import {
  ApplicationArea,
  SignalRService,
} from 'src/app/services/signalr.service';
import {
  Collection,
  Exhibit,
  Team,
  User,
} from 'src/app/generated/api/model/models';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { UserArticleDataService } from 'src/app/data/user-article/user-article-data.service';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamQuery } from 'src/app/data/team/team.query';
import { TeamCardDataService } from 'src/app/data/team-card/team-card-data.service';
import { UIDataService } from 'src/app/data/ui/ui-data.service';
import { Section } from 'src/app/utilities/enumerations';
import { XApiService } from 'src/app/generated/api';

@Component({
  selector: 'app-home-app',
  templateUrl: './home-app.component.html',
  styleUrls: ['./home-app.component.scss'],
})
export class HomeAppComponent implements OnDestroy, OnInit {
  @ViewChild('sidenav') sidenav: MatSidenav;
  apiMessage =
    'The GALLERY API web service appears to be experiencing technical difficulties.';
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
  username = '';
  permissions: SystemPermission[] = [];
  readonly SystemPermission = SystemPermission;

  constructor(
    @Inject(DOCUMENT) private _document: HTMLDocument,
    private authService: ComnAuthService,
    private userDataService: UserDataService,
    private userQuery: UserQuery,
    private currentUserQuery: CurrentUserQuery,
    private permissionDataService: PermissionDataService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private settingsService: ComnSettingsService,
    private authQuery: ComnAuthQuery,
    private signalRService: SignalRService,
    private userArticleDataService: UserArticleDataService,
    private cardDataService: CardDataService,
    private exhibitDataService: ExhibitDataService,
    private exhibitQuery: ExhibitQuery,
    private teamDataService: TeamDataService,
    private teamQuery: TeamQuery,
    private teamCardDataService: TeamCardDataService,
    private collectionDataService: CollectionDataService,
    private collectionQuery: CollectionQuery,
    private uiDataService: UIDataService,
    private xApiService: XApiService
  ) {
    this.theme$ = this.authQuery.userTheme$;
    this.hideTopbar = this.inIframe();
    // Set the display settings from config file
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.topbarTextColor = this.settingsService.settings.AppTopBarHexTextColor
      ? this.settingsService.settings.AppTopBarHexTextColor
      : this.topbarTextColor;
    this.titleText = this.settingsService.settings.AppTopBarText;
    this._document.getElementById('appTitle').innerHTML = this.settingsService.settings.AppTitle;
  }

  ngOnInit() {
    this.currentUserQuery
      .select()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((cu) => {
        this.username = cu.name;
        this.isAuthorizedUser = !!cu.id;
        this.startup();
      });
    this.userDataService.setCurrentUser();
    this.permissionDataService
      .load()
      .subscribe(
        (x) => (this.permissions = this.permissionDataService.permissions)
      );
  }

  startup() {
    // subscribe to route changes
    this.activatedRoute.queryParamMap
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((params) => {
        // exhibit and collection
        const exhibitId = params.get('exhibit');
        const collectionId = params.get('collection');
        if (exhibitId) {
          this.exhibitId = exhibitId;
          this.exhibitDataService.loadById(exhibitId);
          this.exhibitDataService.setActive(exhibitId);
          this.uiDataService.setExhibit(exhibitId);
          // section
          this.selectedSection = params.get('section') as Section;
          if (this.selectedSection) {
            this.uiDataService.setSection(exhibitId, this.selectedSection);
          } else {
            this.selectedSection = this.uiDataService.getSection(exhibitId);
          }
          if (!this.selectedSection) {
            this.selectedSection = Section.archive;
          }
          this.loadExhibitData();
        } else if (collectionId) {
          this.exhibitId = '';
          this.collectionId = collectionId;
          this.loadCollectionData();
        } else {
          this.exhibitId = '';
          this.collectionDataService.loadMine();
        }
        this.collectionDataService.setActive(this.collectionId);
        // card
        const cardId = params.get('card');
        if (exhibitId && cardId) {
          this.cardDataService.setActive(cardId);
        }
        // team
        if (this.exhibitId && this.selectedTeamId) {
          this.uiDataService.setTeam(exhibitId, this.selectedTeamId);
          // xAPI
          if (this.selectedTeamId !== this.teamDataService.getMyTeamId()) {
            // observed
            if (this.selectedSection === Section.archive) {
              this.xApiService
                .observedExhibitArchive(this.exhibitId, this.selectedTeamId)
                .pipe(take(1))
                .subscribe();
            } else if (this.selectedSection === Section.wall) {
              this.xApiService
                .observedExhibitWall(this.exhibitId, this.selectedTeamId)
                .pipe(take(1))
                .subscribe();
            }
          } else {
            // viewed
            if (this.selectedSection === Section.archive) {
              this.xApiService
                .viewedExhibitArchive(this.exhibitId)
                .pipe(take(1))
                .subscribe();
              if (cardId && cardId !== 'all') {
                this.xApiService
                  .viewedCard(this.exhibitId, cardId)
                  .pipe(take(1))
                  .subscribe();
              }
            } else if (this.selectedSection === Section.wall) {
              this.xApiService
                .viewedExhibitWall(this.exhibitId)
                .pipe(take(1))
                .subscribe();
            }
          }
        }
      });
    // subscribe to the collections
    this.collectionQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((collections) => {
        this.collectionList = collections;
      });
    // subscribe to the exhibits
    this.exhibitQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((exhibits) => {
        this.exhibitList = exhibits;
      });
    // subscribe to the active exhibit
    (this.exhibitQuery.selectActive() as Observable<Exhibit>)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((exhibit) => {
        if (exhibit && exhibit.id) {
          this.exhibit = exhibit;
          // only handle the changing of move or inject if they are both defined and have actually changed
          const inIntialState =
            this.currentMove === -1 || this.currentInject === -1;
          const moveOrInjectChanged =
            !inIntialState &&
            (this.exhibit.currentMove !== this.currentMove ||
              this.exhibit.currentInject !== this.currentInject);
          this.collectionId = this.exhibit.collectionId;
          this.currentMove = this.exhibit.currentMove;
          this.currentInject = this.exhibit.currentInject;
          if (moveOrInjectChanged) {
            this.handleExhibitMoveOrInjectChange();
          }
        }
      });
    // subscribe to the user list
    this.userQuery.selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((users) => {
        this.userList = users;
      });
    this.userDataService.load().pipe(take(1)).subscribe();
    // subscribe to teams
    this.teamQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((teams) => {
        // in the initial state, we need to set the team and register with signalr.
        if (!this.selectedTeamId) {
          this.teamList = teams;
          this.setMyTeam();
        }
      });
    this.signalRService
      .startConnection(ApplicationArea.home)
      .then(() => {
        this.signalRService.join();
      })
      .catch((err) => {
        console.log(err);
      });
    this.filterString = '';
  }

  setMyTeam() {
    let myTeamId = '';
    this.teamList.forEach((t) => {
      t.users.forEach((u) => {
        if (u && u.id === this.loggedInUser.id) {
          myTeamId = t.id;
          this.teamDataService.setMyTeam(t.id);
        }
      });
    });
    if (!this.teamQuery.getActiveId() || !this.selectedTeamId) {
      this.changeTeam(myTeamId);
      this.uiDataService.setTeam(this.exhibitId, myTeamId);
    }
  }

  changeTeam(teamId: string) {
    let oldTeamId = this.selectedTeamId;
    if (oldTeamId !== teamId) {
      // make sure to send a Guid for old team ID
      oldTeamId = oldTeamId ? oldTeamId : teamId;
      // signalR hub: leave the old team and join the new team
      this.signalRService.switchTeam(oldTeamId, teamId);
    }
    this.selectedTeamId = teamId;
    this.teamDataService.setActive(teamId);
    this.uiDataService.setTeam(this.exhibitId, teamId);
    this.cardDataService.setActive('');
    this.loadTeamData();
  }

  logout() {
    this.authService.logout();
  }

  inIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  loadCollectionData() {
    this.collectionDataService.loadById(this.collectionId);
    this.collectionDataService.setActive(this.collectionId);
    this.uiDataService.setCollection(this.collectionId);
    this.exhibitDataService.loadMineByCollection(this.collectionId);
  }

  loadExhibitData() {
    // process the change
    this.exhibitDataService.setActive(this.exhibitId);
    console.log('load my exhibit teams');
    this.teamDataService.loadMine(this.exhibitId);
  }

  loadTeamData() {
    // process the change
    if (this.selectedTeamId) {
      this.cardDataService.loadByExhibitTeam(this.exhibitId, this.selectedTeamId);
      this.cardDataService.setActive('all');
      this.teamCardDataService.loadByExhibitTeam(
        this.exhibitId,
        this.selectedTeamId
      );
      this.userArticleDataService.loadByExhibitTeam(
        this.exhibitId,
        this.selectedTeamId
      );
    }
  }

  selectCollection(collectionId: string) {
    this.collectionId = collectionId;
    this.exhibitId = '';
    this.loadCollectionData();
  }

  handleExhibitMoveOrInjectChange() {
    this.teamCardDataService.loadByExhibitTeam(
      this.exhibitId,
      this.selectedTeamId
    );
    this.userArticleDataService.loadByExhibitTeam(
      this.exhibitId,
      this.selectedTeamId
    );
  }

  getUserName(userId: string) {
    const user = this.userList.find((u) => u.id === userId);
    return user ? user.name : ' ';
  }

  gotoAdmin() {
    this.router.navigate(['/admin'], {
      queryParams: { exhibit: this.exhibitId },
    });
  }

  gotoSection(sectionOrCardId: string) {
    switch (sectionOrCardId) {
      case 'wall':
      case 'archive':
        this.selectedSection = sectionOrCardId;
        this.cardDataService.setActive('');
        this.uiDataService.setSection(this.exhibitId, sectionOrCardId);
        break;
      case 'admin':
        this.gotoAdmin();
        break;
      default:
        this.selectedSection = Section.archive;
        this.cardDataService.setActive(sectionOrCardId);
        this.uiDataService.setSection(this.exhibitId, this.selectedSection);
        break;
    }
  }

  applyFilter(filterValue: string) {
    this.filterString = filterValue.trim().toLowerCase();
    this.exhibitList = this.exhibitList.filter((exhibit) => {
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

  getQueryParams(exhibitId: string) {
    const queryParams = { exhibit: exhibitId };
    this.uiDataService.setSection(exhibitId, Section.archive);
    return queryParams;
  }

  canViewCollectionList(): boolean {
    return this.permissionDataService.canViewCollectionList();
  }

  canViewExhibitList(): boolean {
    return this.permissionDataService.canViewExhibitList();
  }

  canViewAdministration() {
    return this.permissionDataService.canViewAdiminstration();
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
