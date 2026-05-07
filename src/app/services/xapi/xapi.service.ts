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
   * Logs xAPI previewed statement when user previews an article
   */
  previewedArticle(exhibitId: string, articleId: string): Observable<any> {
    if (!this.enabled) {
      return of(null);
    }
    return this.generatedXApiService.previewedArticle(exhibitId, articleId).pipe(
      catchError((error) => {
        console.error('xAPI tracking error:', error);
        return of(null);
      })
    );
  }

  /**
   * Logs xAPI viewed statement when user views a card
   */
  viewedCard(exhibitId: string, cardId: string): Observable<any> {
    if (!this.enabled) {
      return of(null);
    }
    return this.generatedXApiService.viewedCard(exhibitId, cardId).pipe(
      catchError((error) => {
        console.error('xAPI tracking error:', error);
        return of(null);
      })
    );
  }

  /**
   * Logs xAPI viewed statement when user views the exhibit wall
   */
  viewedExhibitWall(exhibitId: string): Observable<any> {
    if (!this.enabled) {
      return of(null);
    }
    return this.generatedXApiService.viewedExhibitWall(exhibitId).pipe(
      catchError((error) => {
        console.error('xAPI tracking error:', error);
        return of(null);
      })
    );
  }

  /**
   * Logs xAPI viewed statement when user views the exhibit archive
   */
  viewedExhibitArchive(exhibitId: string): Observable<any> {
    if (!this.enabled) {
      return of(null);
    }
    return this.generatedXApiService.viewedExhibitArchive(exhibitId).pipe(
      catchError((error) => {
        console.error('xAPI tracking error:', error);
        return of(null);
      })
    );
  }

  /**
   * Logs xAPI observed statement when user observes the archive
   */
  observedExhibitArchive(exhibitId: string, teamId: string): Observable<any> {
    if (!this.enabled) {
      return of(null);
    }
    return this.generatedXApiService.observedExhibitArchive(exhibitId, teamId).pipe(
      catchError((error) => {
        console.error('xAPI tracking error:', error);
        return of(null);
      })
    );
  }

  /**
   * Logs xAPI observed statement when user observes the wall
   */
  observedExhibitWall(exhibitId: string, teamId: string): Observable<any> {
    if (!this.enabled) {
      return of(null);
    }
    return this.generatedXApiService.observedExhibitWall(exhibitId, teamId).pipe(
      catchError((error) => {
        console.error('xAPI tracking error:', error);
        return of(null);
      })
    );
  }
}
