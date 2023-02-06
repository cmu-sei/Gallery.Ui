// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  OnDestroy,
  OnInit,
  Input,
  ViewChild,
} from '@angular/core';
import { LegacyPageEvent as PageEvent, MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { MatSort, MatSortable } from '@angular/material/sort';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { Team } from 'src/app/generated/api';
import { ExhibitTeamDataService } from 'src/app/data/team/exhibit-team-data.service';
import { ArticleTeamDataService } from 'src/app/data/team/article-team-data.service';
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
  @Input() teamList: Team[];
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
    private exhibitTeamDataService: ExhibitTeamDataService,
    private articleTeamDataService: ArticleTeamDataService
  ) {}

  ngOnInit() {
    this.sort.sort(<MatSortable>{ id: 'name', start: 'asc' });
    this.articleTeamDataService.teamArticles.pipe(takeUntil(this.unsubscribe$)).subscribe(teamArticles => {
      const teams: Team[] = [];
      if (this.teamList.length > 0) {
        teamArticles.filter(ta => ta.exhibitId === this.exhibitId && ta.articleId === this.articleId).forEach(ta => {
          const team = this.teamList.find(t => t.id === ta.teamId);
          if (team) {
            teams.push(team);
          }
        });
      }
      this.articleTeams = teams;
      this.setDataSources();
    });
    this.exhibitTeamDataService.exhibitTeams.pipe(takeUntil(this.unsubscribe$)).subscribe(exhibitTeams => {
      const teams: Team[] = [];
      if (this.teamList.length > 0) {
        exhibitTeams.filter(et => et.exhibitId === this.exhibitId).forEach(et => {
          const team = this.teamList.find(t => t.id === et.teamId);
          if (team) {
            teams.push(team);
          }
        });
      }
      this.exhibitTeams = teams;
      this.setDataSources();
    });
    this.articleTeamDataService.getTeamArticlesFromApi(this.exhibitId);
    this.exhibitTeamDataService.getExhibitTeamsFromApi(this.exhibitId);
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
      this.articleTeamDataService.addTeamToArticle(this.exhibitId, teamId, this.articleId);
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
