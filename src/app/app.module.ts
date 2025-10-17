// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { CdkTableModule } from '@angular/cdk/table';
import { CdkTreeModule } from '@angular/cdk/tree';
import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacySliderModule as MatSliderModule } from '@angular/material/legacy-slider';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  ComnAuthModule,
  ComnSettingsConfig,
  ComnSettingsModule,
  ComnSettingsService,
} from '@cmusei/crucible-common';
import { AkitaNgRouterStoreModule } from '@datorama/akita-ng-router-store';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { ClipboardModule } from 'ngx-clipboard';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AdminContainerComponent } from './components/admin/admin-container/admin-container.component';
import { AdminArticleEditDialogComponent } from './components/admin/admin-article-edit-dialog/admin-article-edit-dialog.component';
import { AdminArticlesComponent } from './components/admin/admin-articles/admin-articles.component';
import { AdminCardEditDialogComponent } from './components/admin/admin-card-edit-dialog/admin-card-edit-dialog.component';
import { AdminCardsComponent } from './components/admin/admin-cards/admin-cards.component';
import {
  AdminCollectionEditDialogComponent
} from 'src/app/components/admin/admin-collection-edit-dialog/admin-collection-edit-dialog.component';
import { AdminCollectionsComponent } from 'src/app/components/admin/admin-collections/admin-collections.component';
import { AdminExhibitArticlesComponent } from './components/admin/admin-exhibit-articles/admin-exhibit-articles.component';
import { AdminExhibitArticleTeamsComponent } from './components/admin/admin-exhibit-article-teams/admin-exhibit-article-teams.component';
import { AdminExhibitsComponent } from './components/admin/admin-exhibits/admin-exhibits.component';
import { AdminExhibitEditDialogComponent } from './components/admin/admin-exhibit-edit-dialog/admin-exhibit-edit-dialog.component';
import { AdminObserversComponent } from './components/admin/admin-observers/admin-observers.component';
import { AdminTeamCardsComponent } from './components/admin/admin-team-cards/admin-team-cards.component';
import { AdminTeamCardEditDialogComponent } from './components/admin/admin-team-card-edit-dialog/admin-team-card-edit-dialog.component';
import { AdminTeamEditDialogComponent } from './components/admin/admin-team-edit-dialog/admin-team-edit-dialog.component';
import { AdminTeamsComponent } from './components/admin/admin-teams/admin-teams.component';
import { AdminTeamUsersComponent } from './components/admin/admin-team-users/admin-team-users.component';
import { AdminUserEditDialogComponent } from './components/admin/admin-user-edit-dialog/admin-user-edit-dialog.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { ArticleComponent } from './components/article/article.component';
import { ArticleEditDialogComponent } from './components/article-edit-dialog/article-edit-dialog.component';
import { ArticleMoreDialogComponent } from './components/article-more-dialog/article-more-dialog.component';
import { ArticleShareDialogComponent } from './components/article-share-dialog/article-share-dialog.component';
import { ArticleTeamsComponent } from './components/article-teams/article-teams.component';
import { AdminGroupsComponent } from './components/admin/admin-groups/admin-groups.component';
import { AdminGroupsDetailComponent } from './components/admin/admin-groups/admin-groups-detail/admin-groups-detail.component';
import { AdminGroupsMemberListComponent } from './components/admin/admin-groups/admin-groups-member-list/admin-groups-member-list.component';
import { AdminGroupsMembershipListComponent } from './components/admin/admin-groups/admin-groups-membership-list/admin-groups-membership-list.component';
import { AdminRolesComponent } from './components/admin/admin-roles/admin-roles.component';
import { AdminExhibitRolesComponent } from './components/admin/admin-roles/admin-exhibit-roles/admin-exhibit-roles.component';
import { AdminCollectionRolesComponent } from './components/admin/admin-roles/admin-collection-roles/admin-collection-roles.component';
import { CollectionMembershipsComponent } from './components/collections/collection-memberships/collection-memberships/collection-memberships.component';
import { CollectionMemberListComponent } from './components/collections/collection-memberships/collection-member-list/collection-member-list.component';
import { CollectionMembershipListComponent } from './components/collections/collection-memberships/collection-membership-list/collection-membership-list.component';
import { ExhibitMembershipsComponent } from './components/exhibits/exhibit-memberships/exhibit-memberships/exhibit-memberships.component';
import { ExhibitMemberListComponent } from './components/exhibits/exhibit-memberships/exhibit-member-list/exhibit-member-list.component';
import { ExhibitMembershipListComponent } from './components/exhibits/exhibit-memberships/exhibit-membership-list/exhibit-membership-list.component';
import { AdminSystemRolesComponent } from './components/admin/admin-roles/admin-system-roles/admin-system-roles.component';
import { AdminUserListComponent } from './components/admin/admin-users/admin-user-list/admin-user-list.component';
import { HomeAppComponent } from './components/home-app/home-app.component';
import { CwdDialogsModule } from './components/shared/confirm-dialog/cwd-dialogs.module';
import { NameDialogComponent } from './components/shared/name-dialog/name-dialog.component';
import { SystemMessageComponent } from './components/shared/system-message/system-message.component';
import { TopbarComponent } from './components/shared/top-bar/topbar.component';
import { UserDataService } from './data/user/user-data.service';
import { DialogService } from './services/dialog/dialog.service';
import { ErrorService } from './services/error/error.service';
import { SystemMessageService } from './services/system-message/system-message.service';
import { BASE_PATH } from './generated/api';
import { ApiModule as SwaggerCodegenApiModule } from './generated/api/api.module';
import { DisplayOrderPipe, SortByPipe } from 'src/app/utilities/sort-by-pipe';
import { ArchiveComponent } from './components/archive/archive.component';
import { WallComponent } from './components/wall/wall.component';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { NgxMatDatetimePickerModule, NgxMatTimepickerModule, NgxMatNativeDateModule } from '@angular-material-components/datetime-picker';
import { TeamSelectorComponent } from './components/team-selector/team-selector.component';
import { UIDataService } from './data/ui/ui-data.service';

const settings: ComnSettingsConfig = {
  url: 'assets/config/settings.json',
  envUrl: 'assets/config/settings.env.json',
};

export function getBasePath(settingsSvc: ComnSettingsService) {
  return settingsSvc.settings.ApiUrl;
}

@NgModule({
  declarations: [
    AppComponent,
    HomeAppComponent,
    SystemMessageComponent,
    NameDialogComponent,
    AdminContainerComponent,
    AdminArticleEditDialogComponent,
    AdminArticlesComponent,
    AdminCardEditDialogComponent,
    AdminCardsComponent,
    AdminCollectionEditDialogComponent,
    AdminCollectionsComponent,
    AdminExhibitArticlesComponent,
    AdminExhibitArticleTeamsComponent,
    AdminExhibitsComponent,
    AdminExhibitEditDialogComponent,
    AdminObserversComponent,
    AdminTeamCardsComponent,
    AdminTeamCardEditDialogComponent,
    AdminTeamEditDialogComponent,
    AdminTeamsComponent,
    AdminTeamUsersComponent,
    AdminUsersComponent,
    AdminUserEditDialogComponent,
    AdminUserListComponent,
    AdminGroupsComponent,
    AdminGroupsDetailComponent,
    AdminGroupsMemberListComponent,
    AdminGroupsMembershipListComponent,
    AdminRolesComponent,
    AdminExhibitRolesComponent,
    AdminCollectionRolesComponent,
    AdminExhibitsComponent,
    AdminCollectionsComponent,
    AdminSystemRolesComponent,
    ArticleComponent,
    ArticleEditDialogComponent,
    ArticleMoreDialogComponent,
    ArticleShareDialogComponent,
    ArticleTeamsComponent,
    CollectionMemberListComponent,
    CollectionMembershipListComponent,
    CollectionMembershipsComponent,
    ExhibitMemberListComponent,
    ExhibitMembershipListComponent,
    ExhibitMembershipsComponent,
    TopbarComponent,
    DisplayOrderPipe,
    SortByPipe,
    ArchiveComponent,
    WallComponent,
    TeamSelectorComponent
  ],
  imports: [
    AkitaNgDevtools,
    AkitaNgRouterStoreModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    CwdDialogsModule,
    SwaggerCodegenApiModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatExpansionModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatRippleModule,
    MatSelectModule,
    MatSidenavModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatStepperModule,
    MatBottomSheetModule,
    MatBadgeModule,
    MatFormFieldModule,
    CdkTableModule,
    MatTreeModule,
    CdkTreeModule,
    MatDatepickerModule,
    NgxMatTimepickerModule,
    NgxMatDatetimePickerModule,
    NgxMatNativeDateModule,
    ClipboardModule,
    ComnAuthModule.forRoot(),
    ComnSettingsModule.forRoot(),
    AngularEditorModule
  ],
  exports: [MatSortModule],
  providers: [
    DialogService,
    SystemMessageService,
    UIDataService,
    UserDataService,
    {
      provide: BASE_PATH,
      useFactory: getBasePath,
      deps: [ComnSettingsService],
    },
    {
      provide: ErrorHandler,
      useClass: ErrorService,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
