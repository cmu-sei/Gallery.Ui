// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  OnDestroy,
  OnInit,
  Input,
  Output,
  ViewChild,
  EventEmitter,
} from '@angular/core';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortable } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Team } from 'src/app/generated/api';
import { TeamQuery } from 'src/app/data/team/team.query';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-article-teams',
  templateUrl: './article-teams.component.html',
  styleUrls: ['./article-teams.component.scss'],
})
export class ArticleTeamsComponent implements OnDestroy, OnInit {
  @Input() exhibitId: string;
  @Output() articleTeamsChange = new EventEmitter<Team[]>();
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

  constructor(private teamQuery: TeamQuery) {}

  ngOnInit() {
    this.sort.sort(<MatSortable>{ id: 'name', start: 'asc' });
    this.teamQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((teams) => {
        this.exhibitTeams = teams;
        this.setDataSources();
      });
  }

  setDataSources() {
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

  addTeamToArticle(team: Team): void {
    this.articleTeams.push({ ...team });
    this.setDataSources();
    this.articleTeamsChange.emit(this.articleTeams);
  }

  removeTeamFromArticle(team: Team): void {
    this.articleTeams = this.articleTeams.filter((t) => t.id !== team.id);
    this.setDataSources();
    this.articleTeamsChange.emit(this.articleTeams);
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
