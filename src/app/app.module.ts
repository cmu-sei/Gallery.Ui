// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { CdkTableModule } from '@angular/cdk/table';
import { CdkTreeModule } from '@angular/cdk/tree';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatPaginator } from '@angular/material/paginator';
import { MatListModule, MatListItem, MatDivider } from '@angular/material/list';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { MatOption } from '@angular/material/core';
import { MatTable } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AdminContainerComponent } from './components/admin/admin-container/admin-container.component';
import { AdminArticleEditDialogComponent } from './components/admin/admin-article-edit-dialog/admin-article-edit-dialog.component';
import { AdminArticlesComponent } from './components/admin/admin-articles/admin-articles.component';
import { AdminCardEditDialogComponent } from './components/admin/admin-card-edit-dialog/admin-card-edit-dialog.component';
import { AdminCardsComponent } from './components/admin/admin-cards/admin-cards.component';
import { AdminCollectionEditDialogComponent } from 'src/app/components/admin/admin-collection-edit-dialog/admin-collection-edit-dialog.component';
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
import { CollectionMembershipsPageComponent } from './components/collections/collection-memberships/collection-memberships-page/collection-memberships-page.component';
import { CollectionMembershipListComponent } from './components/collections/collection-memberships/collection-membership-list/collection-membership-list.component';
import { ExhibitMembershipsComponent } from './components/exhibits/exhibit-memberships/exhibit-memberships/exhibit-memberships.component';
import { ExhibitMemberListComponent } from './components/exhibits/exhibit-memberships/exhibit-member-list/exhibit-member-list.component';
import { ExhibitMembershipsPageComponent } from './components/exhibits/exhibit-memberships/exhibit-memberships-page/exhibit-memberships-page.component';
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
import { ArchiveComponent } from './components/archive/archive.component';
import { WallComponent } from './components/wall/wall.component';
import { AngularEditorModule } from '@kolkov/angular-editor';
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
    CollectionMembershipsPageComponent,
    ExhibitMemberListComponent,
    ExhibitMembershipListComponent,
    ExhibitMembershipsComponent,
    ExhibitMembershipsPageComponent,
    TopbarComponent,
    ArchiveComponent,
    WallComponent,
    TeamSelectorComponent,
  ],
  exports: [MatSortModule],
  bootstrap: [AppComponent],
  imports: [
    AkitaNgDevtools,
    AkitaNgRouterStoreModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    CwdDialogsModule,
    SwaggerCodegenApiModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatExpansionModule,
    MatGridListModule,
    MatIconModule,
    MatNativeDateModule,
    MatRippleModule,
    MatSidenavModule,
    MatSortModule,
    MatToolbarModule,
    MatStepperModule,
    MatBottomSheetModule,
    MatBadgeModule,
    CdkTableModule,
    MatTreeModule,
    CdkTreeModule,
    ComnAuthModule.forRoot(),
    ComnSettingsModule.forRoot(),
    AngularEditorModule,
    MatFormFieldModule,
    MatLabel,
    MatSelect,
    MatPaginator,
    MatListModule,
    MatListItem,
    MatDivider,
    MatTabGroup,
    MatTab,
    MatOption,
    MatTable,
    MatMenuModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
  ],
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
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
