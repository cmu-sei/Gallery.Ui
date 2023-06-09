/*
 Copyright 2023 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the
 project root for license information.
*/

import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { Team } from 'src/app/generated/api/model/models';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamQuery } from 'src/app/data/team/team.query';
import { takeUntil, Subject } from 'rxjs';

@Component({
  selector: 'app-team-selector',
  templateUrl: './team-selector.component.html',
  styleUrls: ['./team-selector.component.scss']
})
export class TeamSelectorComponent implements OnDestroy {
  @Output() changeTeam = new EventEmitter<string>();
  teamList: Team[];
  selectedTeamId = '';
  private unsubscribe$ = new Subject();

  constructor (
    private teamDataService: TeamDataService,
    private teamQuery: TeamQuery
  ) {
    this.teamQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(teams => {
      this.teamList = teams;
    });
    this.teamQuery.selectActiveId().pipe(takeUntil(this.unsubscribe$)).subscribe(id => {
      this.selectedTeamId = id ? id : this.selectedTeamId;
    });
    this.selectedTeamId = this.teamQuery.getActiveId();
  }

  getMyTeamShortName() {
    return this.teamDataService.getMyTeam().shortName;
  }

  setActiveTeam(teamId: string) {
    this.selectedTeamId = teamId;
    this.changeTeam.emit(teamId);
  }

  myTeamIsSelected(): boolean {
    return this.selectedTeamId === this.teamDataService.getMyTeamId();
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}
