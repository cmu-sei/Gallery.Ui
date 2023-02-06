// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { PermissionService } from 'src/app/generated/api/api/api';
import {
  Permission,
  User,
  UserPermission,
} from 'src/app/generated/api/model/models';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { TopbarView } from 'src/app/components/shared/top-bar/topbar.models';
import { ComnSettingsService, ComnAuthQuery, Theme } from '@cmusei/crucible-common';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamQuery } from 'src/app/data/team/team.query';
import { SignalRService } from 'src/app/services/signalr.service';
import { Section } from 'src/app/utilities/enumerations';

@Component({
  selector: 'app-admin-container',
  templateUrl: './admin-container.component.html',
  styleUrls: ['./admin-container.component.scss'],
})
export class AdminContainerComponent implements OnDestroy, OnInit {
  loggedInUser = this.userDataService.loggedInUser;
  titleText = 'GALLERY';
  displayedSection = '';
  isSidebarOpen = true;
  isSuperUser = false;
  isContentDeveloper = false;
  teamList = this.teamQuery.selectAll();
  userList: Observable<User[]>;
  filterControl: UntypedFormControl = this.userDataService.filterControl;
  filterString: Observable<string>;
  permissionList: Observable<Permission[]>;
  pageSize: Observable<number>;
  pageIndex: Observable<number>;
  private unsubscribe$ = new Subject();
  hideTopbar = false;
  TopbarView = TopbarView;
  topbarColor = '#ef3a47';
  topbarTextColor = '#FFFFFF';
  topbarImage = this.settingsService.settings.AppTopBarImage;
  theme$: Observable<Theme>;
  section = Section;

  constructor(
    @Inject(DOCUMENT) private _document: HTMLDocument,
    private router: Router,
    private signalRService: SignalRService,
    private collectionDataService: CollectionDataService,
    private exhibitDataService: ExhibitDataService,
    private teamDataService: TeamDataService,
    private teamQuery: TeamQuery,
    private userDataService: UserDataService,
    activatedRoute: ActivatedRoute,
    private permissionService: PermissionService,
    private settingsService: ComnSettingsService,
    private authQuery: ComnAuthQuery
  ) {
    this.theme$ = this.authQuery.userTheme$;
    this.hideTopbar = this.inIframe();
    this._document.getElementById('appFavicon').setAttribute('href', '/assets/img/monitor-dashboard-blue.png');
    this._document.getElementById('appTitle').innerHTML = this.settingsService.settings.AppTitle + ' Admin';

    this.userDataService.isSuperUser
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((result) => {
        this.isSuperUser = result;
        this.isContentDeveloper = this.isContentDeveloper || result;
      });
    this.userDataService.isContentDeveloper
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((result) => {
        this.isContentDeveloper = result || this.isSuperUser;
      });
    this.userList = this.userDataService.userList;
    this.permissionList = this.permissionService.getPermissions();
    this.collectionDataService.load();
    this.filterString = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('filter') || '')
    );
    this.pageSize = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get('pagesize') || '20', 10))
    );
    this.pageIndex = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get('pageindex') || '0', 10))
    );
    activatedRoute.queryParamMap.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.displayedSection = params.get('section');
      const collectionId = params.get('collection');
      if (collectionId) {
        this.exhibitDataService.loadByCollection(collectionId);
      }
    });

    this.teamDataService.load();
    this.userDataService.getUsersFromApi();
    this.userDataService
      .getPermissionsFromApi()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe();
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

  exitAdmin() {
    this.router.navigate([''], {
      queryParams: { section: Section.archive },
      queryParamsHandling: 'merge',
    });
  }

  gotoSection(section: Section) {
    this.displayedSection = section;
    this.router.navigate([], {
      queryParams: {
        section: section,
        filter: '',
        pageindex: ''
      },
      queryParamsHandling: 'merge',
    });
  }

  logout() {
    this.userDataService.logout();
  }

  selectUser(userId: string) {
    this.router.navigate([], {
      queryParams: { userId: userId },
      queryParamsHandling: 'merge',
    });
  }

  addUserHandler(user: User) {
    this.userDataService.addUser(user);
  }

  deleteUserHandler(user: User) {
    this.userDataService.deleteUser(user);
  }

  addUserPermissionHandler(userPermission: UserPermission) {
    this.userDataService.addUserPermission(userPermission);
  }

  removeUserPermissionHandler(userPermission: UserPermission) {
    this.userDataService.deleteUserPermission(userPermission);
  }

  sortChangeHandler(sort: Sort) {
    this.router.navigate([], {
      queryParams: { sorton: sort.active, sortdir: sort.direction },
      queryParamsHandling: 'merge',
    });
  }

  pageChangeHandler(page: PageEvent) {
    this.router.navigate([], {
      queryParams: { pageindex: page.pageIndex, pagesize: page.pageSize },
      queryParamsHandling: 'merge',
    });
  }

  getSelectedClass(section: string) {
    if (section === this.displayedSection) {
      return 'selected-item';
    } else {
      return null;
    }
  }
  inIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
