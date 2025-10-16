// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, OnDestroy, OnInit, Input, ViewChild } from '@angular/core';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortable } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Team } from 'src/app/generated/api';
import { ArticleTeamDataService } from 'src/app/data/team/article-team-data.service';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamQuery } from 'src/app/data/team/team.query';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-exhibit-article-teams',
  templateUrl: './admin-exhibit-article-teams.component.html',
  styleUrls: ['./admin-exhibit-article-teams.component.scss'],
})
export class AdminExhibitArticleTeamsComponent implements OnDestroy, OnInit {
  @Input() exhibitId: string;
  @Input() articleId: string;
  @Input() canEdit: boolean;
  articleTeams: Team[] = [];
  exhibitTeams: Team[] = [];

  displayedTeamColumns: string[] = ['name', 'id'];
  articleTeamDataSource = new MatTableDataSource<Team>(new Array<Team>());
  exhibitTeamDataSource = new MatTableDataSource<Team>(new Array<Team>());
  filterString = '';
  defaultPageSize = 100;
  pageEvent: PageEvent;
  private unsubscribe$ = new Subject();

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private teamQuery: TeamQuery,
    private articleTeamDataService: ArticleTeamDataService
  ) {}

  ngOnInit() {
    this.sort.sort(<MatSortable>{ id: 'name', start: 'asc' });
    this.articleTeamDataService.teamArticles
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((teamArticles) => {
        const teams: Team[] = [];
        if (this.exhibitTeams.length > 0) {
          teamArticles
            .filter(
              (ta) =>
                ta.exhibitId === this.exhibitId &&
                ta.articleId === this.articleId
            )
            .forEach((ta) => {
              const team = this.exhibitTeams.find((t) => t.id === ta.teamId);
              if (team) {
                teams.push(team);
              }
            });
        }
        this.articleTeams = teams;
        this.setDataSources();
      });
    this.teamQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((teams) => {
        this.exhibitTeams = teams;
        this.setDataSources();
      });
  }

  setDataSources() {
    // Now that all of the observables are returned, process accordingly.
    this.articleTeamDataSource.data = this.articleTeams.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      } else {
        return 0;
      }
    });
    const newAllTeams = this.exhibitTeams.slice(0);
    this.articleTeamDataSource.data.forEach((at) => {
      const index = newAllTeams.findIndex((u) => u.id === at.id);
      newAllTeams.splice(index, 1);
    });
    this.exhibitTeamDataSource = new MatTableDataSource(newAllTeams);
    this.exhibitTeamDataSource.sort = this.sort;
  }

  addTeamToArticle(teamId: string): void {
    const index = this.articleTeamDataSource.data.findIndex(
      (tu) => tu.id === teamId
    );
    if (index === -1) {
      this.articleTeamDataService.addTeamToArticle(
        this.exhibitId,
        teamId,
        this.articleId
      );
    }
  }

  /**
   * Removes a team from the current exhibit
   * @param teamId The team to remove from exhibit
   */
  removeTeamFromArticle(teamId: string): void {
    const index = this.articleTeamDataSource.data.findIndex(
      (et) => et.id === teamId
    );
    if (index !== -1) {
      this.articleTeamDataService.removeTeamArticle(teamId, this.articleId);
    }
  }

  compare(a: string, b: string, isAsc: boolean) {
    if (a === null || b === null) {
      return 0;
    } else {
      return (a.toLowerCase() < b.toLowerCase() ? -1 : 1) * (isAsc ? 1 : -1);
    }
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
