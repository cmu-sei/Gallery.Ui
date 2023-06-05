import { Component, EventEmitter, Input, Output, OnDestroy, OnInit } from '@angular/core';
import { Team } from 'src/app/generated/api/model/models';
import { TeamQuery } from 'src/app/data/team/team.query';
import { takeUntil, Subject } from 'rxjs';

@Component({
  selector: 'app-team-selector',
  templateUrl: './team-selector.component.html',
  styleUrls: ['./team-selector.component.scss']
})
export class TeamSelectorComponent implements OnDestroy, OnInit {
  @Input() myTeam: Team;
  @Output() changeTeam = new EventEmitter<string>();
  teamList: Team[];
  selectedTeamId = '';
  private unsubscribe$ = new Subject();

  constructor (
    private teamQuery: TeamQuery
  ) {
    this.teamQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(teams => {
      this.teamList = teams;
    });
  }

  ngOnInit() {
    setTimeout(() => this.selectedTeamId = this.myTeam.id, 1000);
  }

  getTeamShortName() {
    const myTeam = this.teamList.find(t => t.id === this.myTeam.id);
    return myTeam ? myTeam.shortName : '';
  }

  setActiveTeam(teamId: string) {
    this.selectedTeamId = teamId;
    this.changeTeam.emit(teamId);
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}
