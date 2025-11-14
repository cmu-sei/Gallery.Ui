// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, HostBinding, OnDestroy } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ComnAuthQuery, ComnAuthService, Theme } from '@cmusei/crucible-common';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements OnDestroy {
  @HostBinding('class') componentCssClass: string;
  theme$: Observable<Theme> = this.authQuery.userTheme$;
  private paramTheme;
  unsubscribe$: Subject<null> = new Subject<null>();

  constructor(
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
    private overlayContainer: OverlayContainer,
    private authQuery: ComnAuthQuery,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: ComnAuthService
  ) {
    this.registerIcons(iconRegistry, sanitizer);
    this.theme$.pipe(takeUntil(this.unsubscribe$)).subscribe((theme) => {
      if (this.paramTheme && this.paramTheme !== theme) {
        this.router.navigate([], {
          queryParams: { theme: theme },
          queryParamsHandling: 'merge',
        });
      }
      this.setTheme(theme);
    });
    this.activatedRoute.queryParamMap.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const theme = params.get('theme');
      this.paramTheme = theme === Theme.DARK ? Theme.DARK : Theme.LIGHT;
      this.authService.setUserTheme(this.paramTheme);
    });
  }

  registerIcons(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
    iconRegistry.setDefaultFontSetClass('mdi');

    iconRegistry.addSvgIcon(
      'app_icon',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/monitor-dashboard.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'account',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/account.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'account_multiple',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/account-multiple.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'ic_chevron_left',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_chevron_left.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'ic_chevron_right',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_chevron_right.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'ic_clear',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg-icons/ic_clear.svg')
    );
    iconRegistry.addSvgIcon(
      'ic_expand_more',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_expand_more.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'ic_magnify_search',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_magnify_glass.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'crucible-icon-gallery',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/crucible-icon-gallery.svg'
      )
    );
  }

  setTheme(theme: Theme) {
    const classList = this.overlayContainer.getContainerElement().classList;
    switch (theme) {
      case Theme.LIGHT:
        document.body.classList.toggle('darkMode', false);
        break;
      case Theme.DARK:
        document.body.classList.toggle('darkMode', true);
    }
  }
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }
}
