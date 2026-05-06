// Copyright 2023 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { XApiService as GeneratedXApiService } from '../../generated/api';
import { ComnSettingsService } from '@cmusei/crucible-common';

@Injectable({
  providedIn: 'root',
})
export class XApiService {
  private enabled: boolean;

  constructor(
    private generatedXApiService: GeneratedXApiService,
    private settingsService: ComnSettingsService
  ) {
    this.enabled = this.settingsService.settings.XApiEnabled ?? false;
  }

  /**
   * Logs xAPI viewed statement when user views an article
   */
  viewedArticle(exhibitId: string, articleId: string): Observable<any> {
    if (!this.enabled) {
      return of(null);
    }
    return this.generatedXApiService.viewedArticle(exhibitId, articleId).pipe(
      catchError((error) => {
        console.error('xAPI tracking error:', error);
        return of(null);
      })
    );
  }

  /**
   * Logs xAPI observed statement when user observes the archive
   */
  observedArchive(exhibitId: string, teamId: string): Observable<any> {
    if (!this.enabled) {
      return of(null);
    }
    return this.generatedXApiService.observedArchive(exhibitId, teamId).pipe(
      catchError((error) => {
        console.error('xAPI tracking error:', error);
        return of(null);
      })
    );
  }

  /**
   * Logs xAPI observed statement when user observes the wall
   */
  observedWall(exhibitId: string, teamId: string): Observable<any> {
    if (!this.enabled) {
      return of(null);
    }
    return this.generatedXApiService.observedWall(exhibitId, teamId).pipe(
      catchError((error) => {
        console.error('xAPI tracking error:', error);
        return of(null);
      })
    );
  }
}
