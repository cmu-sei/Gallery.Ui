// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Sort } from '@angular/material/sort';
import { Team, TeamCard } from 'src/app/generated/api/model/models';
import { Card } from 'src/app/data/card/card.store';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { CardQuery } from 'src/app/data/card/card.query';
import { TeamQuery } from 'src/app/data/team/team.query';
import { TeamCardDataService } from 'src/app/data/team-card/team-card-data.service';
import { TeamCardQuery } from 'src/app/data/team-card/team-card.query';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { AdminTeamCardEditDialogComponent } from 'src/app/components/admin/admin-team-card-edit-dialog/admin-team-card-edit-dialog.component';

@Component({
    selector: 'app-admin-team-cards',
    templateUrl: './admin-team-cards.component.html',
    styleUrls: ['./admin-team-cards.component.scss'],
    standalone: false
})
export class AdminTeamCardsComponent implements OnInit, OnDestroy {
  @Input() teamList: Team[];
  @Input() collectionId: string;
  @Input() exhibitId: string;
  @Input() canEdit: boolean;
  cardList: Card[] = [];
  teamCardList: TeamCard[] = [];
  selectedTeamId = '';
  selectedCardId = '';
  newTeamCard: TeamCard = {
    id: '',
    teamId: '',
    cardId: '',
    isShownOnWall: true,
    move: 0,
    inject: 0,
  };
  topbarColor = '#ef3a47';
  addingNewTeamCard = false;
  filteredTeamCardList: TeamCard[] = [];
  filterControl = new UntypedFormControl();
  filterString = '';
  sort: Sort = { active: 'team', direction: 'asc' };
  isLoading = false;
  private unsubscribe$ = new Subject();

  constructor(
    private settingsService: ComnSettingsService,
    private dialog: MatDialog,
    private cardDataService: CardDataService,
    private cardQuery: CardQuery,
    private teamQuery: TeamQuery,
    private teamCardDataService: TeamCardDataService,
    private teamCardQuery: TeamCardQuery
  ) {
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.teamCardQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((teamCards) => {
        this.teamCardList = [];
        teamCards.forEach((teamCard) => {
          this.teamCardList.push({ ...teamCard });
        });
      });
    this.cardQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((cards) => {
        this.cardList = cards;
      });
    this.teamQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((teams) => {
        this.teamList = teams;
      });
    this.teamCardQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((teamCards) => {
        this.teamCardList = teamCards;
        this.sortChanged(this.sort);
      });
  }

  ngOnInit() {
    this.cardDataService.loadByExhibit(this.exhibitId);
    this.teamCardDataService.loadByExhibit(this.exhibitId);
    this.filterControl.setValue(this.filterString);
    this.filterControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((term) => {
        this.applyFilter(term);
      });
    this.sortChanged(this.sort);
  }

  addOrEditTeamCard(teamCard: TeamCard) {
    if (!teamCard) {
      teamCard = {
        teamId: this.selectedTeamId,
        cardId: this.selectedCardId,
        move: 0,
        inject: 0,
        isShownOnWall: true,
        canPostArticles: false,
      };
    } else {
      teamCard = { ...teamCard };
    }
    const dialogRef = this.dialog.open(AdminTeamCardEditDialogComponent, {
      width: '480px',
      data: {
        teamCard: teamCard,
        cardList: this.cardList,
        teamList: this.teamList,
        teamCardList: this.teamCardList,
      },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.teamCard) {
        const teamIdList = result.teamCard.teamId.split(',');
        teamIdList.forEach((teamId) => {
          result.teamCard.teamId = teamId;
          this.saveTeamCard(result.teamCard);
        });
      }
      dialogRef.close();
    });
  }

  saveTeamCard(teamCard: TeamCard) {
    if (teamCard.id) {
      this.teamCardDataService.updateTeamCard(teamCard);
    } else {
      if (
        !this.teamCardList.some(
          (tc) => tc.teamId === teamCard.teamId && tc.cardId === teamCard.cardId
        )
      ) {
        this.teamCardDataService.add(teamCard);
      }
    }
  }

  deleteTeamCard(teamCard: TeamCard): void {
    this.teamCardDataService.delete(teamCard.id);
  }

  applyFilter(filterValue: string) {
    this.filterString = filterValue.trim().toLowerCase();
    this.filteredTeamCardList = this.teamCardList
      .filter((teamCard) => {
        const teamName = this.getTeamName(teamCard.teamId);
        const cardName = this.getCardName(teamCard.cardId);
        const teamNameLower = teamName ? teamName.toLowerCase() : '';
        const cardNameLower = cardName ? cardName.toLowerCase() : '';
        return (
          (this.selectedTeamId === '' ||
            teamCard.teamId === this.selectedTeamId) &&
          (this.selectedCardId === '' ||
            teamCard.cardId === this.selectedCardId) &&
          (teamNameLower.includes(this.filterString) ||
            cardNameLower.includes(this.filterString))
        );
      })
      .sort((a: TeamCard, b: TeamCard) =>
        this.sortTeamCards(a, b, this.sort.active, this.sort.direction)
      );
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    this.applyFilter(this.filterString);
  }

  private sortTeamCards(
    a: TeamCard,
    b: TeamCard,
    column: string,
    direction: string
  ) {
    const isAsc = direction !== 'desc';
    switch (column) {
      case 'teamId':
        const aTeamName = this.getTeamName(a.teamId);
        const bTeamName = this.getTeamName(b.teamId);
        const aTeamNameLower = aTeamName ? aTeamName.toLowerCase() : '';
        const bTeamNameLower = bTeamName ? bTeamName.toLowerCase() : '';
        return (aTeamNameLower < bTeamNameLower ? -1 : 1) * (isAsc ? 1 : -1);
      case 'cardId':
        const aCardName = this.getCardName(a.cardId);
        const bCardName = this.getCardName(b.cardId);
        const aCardNameLower = aCardName ? aCardName.toLowerCase() : '';
        const bCardNameLower = bCardName ? bCardName.toLowerCase() : '';
        return (aCardNameLower < bCardNameLower ? -1 : 1) * (isAsc ? 1 : -1);
      case 'move':
        return (a.move < b.move ? -1 : 1) * (isAsc ? 1 : -1);
      case 'inject':
        return (a.inject < b.inject ? -1 : 1) * (isAsc ? 1 : -1);
      case 'isShownOnWall':
        return (a.isShownOnWall < b.isShownOnWall ? -1 : 1) * (isAsc ? 1 : -1);
      default:
        return 0;
    }
  }

  getCardName(cardId: string) {
    const card = this.cardList?.find((t) => t.id === cardId);
    return card ? card.name : ' ';
  }

  getTeamName(teamId: string) {
    const team = this.teamList?.find((t) => t.id === teamId);
    return team ? team.name : ' ';
  }

  clearFilter() {
    this.filterControl.setValue('');
  }

  handleInput(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case 'Tab':
      case 'Escape':
        break;
      default:
        break;
    }
    event.stopPropagation();
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
