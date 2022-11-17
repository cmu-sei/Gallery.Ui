// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { TeamArticleService } from 'src/app/generated/api/api/api';
import { TeamArticle } from 'src/app/generated/api/model/models';

@Injectable({
  providedIn: 'root',
})
export class ArticleTeamDataService implements OnDestroy {
  private _teamArticles: TeamArticle[] = [];
  readonly teamArticles = new BehaviorSubject<TeamArticle[]>(this._teamArticles);
  unsubscribe$: Subject<null> = new Subject<null>();

  constructor(
    private teamArticleService: TeamArticleService
  ) {}

  private updateTeamArticles(teamArticles: TeamArticle[]) {
    this._teamArticles = Object.assign([], teamArticles);
    this.teamArticles.next(this._teamArticles);
  }

  getTeamArticlesFromApi(exhibitId: string) {
    return this.teamArticleService
      .getExhibitTeamArticles(exhibitId)
      .pipe(take(1))
      .subscribe(
        (teams) => {
          this.updateTeamArticles(teams);
        },
        (error) => {
          this.updateTeamArticles([]);
        }
      );
  }

  addTeamToArticle(exhibitId: string, teamId: string, articleId: string) {
    this.teamArticleService.createTeamArticle({exhibitId: exhibitId, articleId: articleId, teamId: teamId}).subscribe(
      (et) => {
        this._teamArticles.unshift(et);
        this.updateTeamArticles(this._teamArticles);
      },
      (error) => {
        this.updateTeamArticles(this._teamArticles);
      }
    );
  }

  removeTeamArticle(teamId: string, articleId: string) {
    this.teamArticleService.deleteTeamArticleByIds(teamId, articleId).subscribe(
      (response) => {
        this._teamArticles = this._teamArticles.filter((u) => u.teamId !== teamId);
        this.updateTeamArticles(this._teamArticles);
      },
      (error) => {
        this.updateTeamArticles(this._teamArticles);
      }
    );
  }

  updateStore(teamArticle: TeamArticle) {
    const updatedTeamArticles = this._teamArticles.filter(tu => tu.id !== teamArticle.id);
    updatedTeamArticles.unshift(teamArticle);
    this.updateTeamArticles(updatedTeamArticles);
  }

  deleteFromStore(id: string) {
    const updatedTeamArticles = this._teamArticles.filter(tu => tu.id !== id);
    this.updateTeamArticles(updatedTeamArticles);
  }

  setAsDates(teamArticle: TeamArticle) {
    // set to a date object.
    teamArticle.dateCreated = new Date(teamArticle.dateCreated);
    teamArticle.dateModified = new Date(teamArticle.dateModified);
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
