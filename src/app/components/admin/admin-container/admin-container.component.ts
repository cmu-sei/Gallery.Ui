// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';
import {
  Permission,
  User,
} from 'src/app/generated/api/model/models';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { UserQuery } from 'src/app/data/user/user.query';
import { TopbarView } from 'src/app/components/shared/top-bar/topbar.models';
import { ComnSettingsService, ComnAuthQuery, Theme } from '@cmusei/crucible-common';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { CurrentUserQuery } from 'src/app/data/user/user.query';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { ApplicationArea, SignalRService } from 'src/app/services/signalr.service';
import { Section } from 'src/app/utilities/enumerations';
import { environment } from 'src/environments/environment';
import { HealthCheckService } from 'src/app/generated/api';
import { ComnAuthService } from '@cmusei/crucible-common';
import { SystemPermission } from 'src/app/generated/api';

@Component({
  selector: 'app-admin-container',
  templateUrl: './admin-container.component.html',
  styleUrls: ['./admin-container.component.scss'],
})
export class AdminContainerComponent implements OnDestroy, OnInit {
  titleText = 'GALLERY';
  displayedSection = '';
  isSidebarOpen = true;
  userList: Observable<User[]>;
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
  uiVersion = environment.VERSION;
  apiVersion = 'ERROR!';
  username = '';
  permissions: SystemPermission[] = [];
  readonly SystemPermission = SystemPermission;

  constructor(
    @Inject(DOCUMENT) private _document: HTMLDocument,
    private router: Router,
    private signalRService: SignalRService,
    private collectionDataService: CollectionDataService,
    private collectionQuery: CollectionQuery,
    private exhibitDataService: ExhibitDataService,
    private exhibitQuery: ExhibitQuery,
    private authService: ComnAuthService,
    private userDataService: UserDataService,
    private userQuery: UserQuery,
    activatedRoute: ActivatedRoute,
    private healthCheckService: HealthCheckService,
    private settingsService: ComnSettingsService,
    private authQuery: ComnAuthQuery,
    private currentUserQuery: CurrentUserQuery,
    private permissionDataService: PermissionDataService
  ) {
    this.theme$ = this.authQuery.userTheme$;
    this.hideTopbar = this.inIframe();
    this._document
      .getElementById('appFavicon')
      .setAttribute('href', 'assets/img/monitor-dashboard-blue.png');
    this._document.getElementById('appTitle').innerHTML = this.settingsService.settings.AppTitle + ' Admin';

    this.collectionDataService.load();
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
        const routeCollectionId = '' + params.get('collection');
        this.collectionDataService.setActive(routeCollectionId);
      }
    });
    // observe active collection id
    this.collectionQuery.selectActiveId().pipe(takeUntil(this.unsubscribe$)).subscribe(activeId => {
      this.exhibitDataService.loadByCollection(activeId);
    });
    // Set the display settings from config file
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.topbarTextColor = this.settingsService.settings.AppTopBarHexTextColor
      ? this.settingsService.settings.AppTopBarHexTextColor
      : this.topbarTextColor;
    this.titleText = this.settingsService.settings.AppTopBarText;
    this.getApiVersion();
  }

  ngOnInit() {
    this.userList = this.userQuery.selectAll();
    this.userDataService.load().pipe(take(1)).subscribe();
    this.permissionDataService
      .load()
      .subscribe(
        (x) => (this.permissions = this.permissionDataService.permissions)
      );
    this.signalRService
      .startConnection(ApplicationArea.admin)
      .then(() => {
        this.signalRService.join();
      })
      .catch((err) => {
        console.log(err);
      });
    this.currentUserQuery
      .select()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((cu) => {
        this.username = cu.name;
      });
    this.userDataService.setCurrentUser();

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
    this.authService.logout();
  }

  selectUser(userId: string) {
    this.router.navigate([], {
      queryParams: { userId: userId },
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

  getApiVersion() {
    this.healthCheckService
      .getVersion()
      .pipe(take(1))
      .subscribe(
        (message) => {
          const messageParts = message.split('+');
          this.apiVersion = messageParts[0];
        },
        (error) => {
          this.apiVersion = 'ERROR!';
        }
      );
  }

  canViewCollectionList(): boolean {
    return this.permissionDataService.canViewCollectionList();
  }

  canViewExhibitList(): boolean {
    return this.permissionDataService.canViewExhibitList();
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
