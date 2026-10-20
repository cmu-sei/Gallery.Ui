// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { enableProdMode, provideZoneChangeDetection, ErrorHandler, importProvidersFrom } from '@angular/core';
import { platformBrowser, BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { enableAkitaProdMode, persistState } from '@datorama/akita';

import { getBasePath } from './app/app.module';
import { environment } from './environments/environment';
import { SystemMessageService } from './app/services/system-message/system-message.service';
import { UIDataService } from './app/data/ui/ui-data.service';
import { UserDataService } from './app/data/user/user-data.service';
import { BASE_PATH } from './app/generated/api';
import { ComnSettingsService, provideCrucibleTheme, CRUCIBLE_DIALOG_IMPORTS, ComnAuthModule, ComnSettingsModule, ComnHeaderBarModule } from '@cmusei/crucible-common';
import { ErrorService } from './app/services/error/error.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { AkitaNgRouterStoreModule } from '@datorama/akita-ng-router-store';
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { A11yModule } from '@angular/cdk/a11y';
import { ApiModule as SwaggerCodegenApiModule } from './app/generated/api/api.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule, MatRippleModule, MatOption } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatBadgeModule } from '@angular/material/badge';
import { CdkTableModule } from '@angular/cdk/table';
import { MatTreeModule } from '@angular/material/tree';
import { CdkTreeModule } from '@angular/cdk/tree';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { NgxMatDatetimepicker, NgxMatDatepickerToggle, NgxMatDatepickerInput, NgxMatDatepickerActions, NgxMatDatepickerApply, NgxMatDatepickerCancel, NgxMatDatepickerClear } from '@ngxmc/datetime-picker';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatListModule, MatListItem, MatDivider } from '@angular/material/list';
import { MatTabGroup, MatTab, MatTabsModule } from '@angular/material/tabs';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppComponent } from './app/app.component';

if (environment.production) {
  enableProdMode();
  enableAkitaProdMode();
}

export const storage = persistState({
  key: 'akita-cite-ui',
  include: ['auth.ui'],
});

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(environment.production ? [] : AkitaNgDevtools.forRoot(), AkitaNgRouterStoreModule, BrowserModule, AppRoutingModule, BrowserAnimationsModule, A11yModule, SwaggerCodegenApiModule, ...CRUCIBLE_DIALOG_IMPORTS, FormsModule, ReactiveFormsModule, MatButtonToggleModule, MatDialogModule, MatExpansionModule, MatGridListModule, MatIconModule, MatNativeDateModule, MatRippleModule, MatSidenavModule, MatSortModule, MatToolbarModule, MatStepperModule, MatBottomSheetModule, MatBadgeModule, CdkTableModule, MatTreeModule, CdkTreeModule, ComnAuthModule.forRoot(), ComnSettingsModule.forRoot(), ComnHeaderBarModule, AngularEditorModule, NgxMatDatetimepicker, NgxMatDatepickerToggle, NgxMatDatepickerInput, NgxMatDatepickerActions, NgxMatDatepickerApply, NgxMatDatepickerCancel, NgxMatDatepickerClear, MatFormFieldModule, MatLabel, MatSelect, MatPaginator, MatListModule, MatListItem, MatDivider, MatTabGroup, MatTab, MatOption, MatTable, MatMenuModule, MatAutocompleteModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatChipsModule, MatDatepickerModule, MatInputModule, MatPaginatorModule, MatProgressBarModule, MatProgressSpinnerModule, MatRadioModule, MatSelectModule, MatSlideToggleModule, MatSliderModule, MatSnackBarModule, MatTableModule, MatTabsModule, MatTooltipModule),
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
        provideCrucibleTheme({ brand: { color: '#008740', text: '#FFFFFF' } }),
    ]
})
  .catch((err) => console.error(err));
