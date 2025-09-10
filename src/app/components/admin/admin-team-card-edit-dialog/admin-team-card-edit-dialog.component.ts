// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Inject, Output } from '@angular/core';
import {
  UntypedFormControl,
  FormGroupDirective,
  NgForm,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { SystemMessageService } from 'src/app/services/system-message/system-message.service';

/** Error when invalid control is dirty, touched, or submitted. */
export class UserErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: UntypedFormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || isSubmitted));
  }
}

@Component({
  selector: 'app-admin-team-card-edit-dialog',
  templateUrl: './admin-team-card-edit-dialog.component.html',
  styleUrls: ['./admin-team-card-edit-dialog.component.scss'],
})

export class AdminTeamCardEditDialogComponent {
  @Output() editComplete = new EventEmitter<any>();

  public teamIdFormControl = new UntypedFormControl(
    [this.data.teamCard.teamId],
    []
  );
  public cardIdFormControl = new UntypedFormControl(
    this.data.teamCard.cardId,
    []
  );
  public moveFormControl = new UntypedFormControl(
    this.data.teamCard.move,
    []
  );
  public injectFormControl = new UntypedFormControl(
    this.data.teamCard.inject,
    []
  );
  public matcher = new UserErrorStateMatcher();
  private teamIdList: string[] = [];
  private allTeamsWasChecked = false;
  ALL_TEAMS = 'All Teams';

  constructor(
    public systemMessage: SystemMessageService,
    dialogRef: MatDialogRef<AdminTeamCardEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
    data.teamList.forEach((team) => {
      this.teamIdList.push(team.id);
    });
  }

  errorFree() {
    return !(
      !this.data.teamCard.teamId ||
      !this.data.teamCard.cardId
    );
  }

  isDuplicateTeamCard() {
    const existingTeamCard = this.data.teamCardList.find(
      tc => tc.teamId === this.data.teamCard.teamId  &&
      tc.cardId === this.data.teamCard.cardId
    );
    return (existingTeamCard && existingTeamCard.id !== this.data.teamCard.id);
  }

  /**
   * Closes the edit screen
   */
  handleEditComplete(saveChanges: boolean): void {
    if (!saveChanges) {
      this.editComplete.emit({ saveChanges: false, teamCard: null });
    } else {
      if (this.errorFree) {
        if (this.isDuplicateTeamCard()) {
          this.systemMessage
            .displayMessage(
              'This Team Card already exists!',
              'Please select a different combination of Team and Card.'
            );
        } else {
          this.editComplete.emit({
            saveChanges: saveChanges,
            teamCard: this.data.teamCard,
          });
        }
      }
    }
  }

  /**
   * Saves the current teamCard
   */
  saveTeamCard(changedField): void {
    switch (changedField) {
      case 'teamId': {
        let addAllTeams = false;
        const allTeamsIsChecked = this.teamIdFormControl.value.includes(this.ALL_TEAMS);
        // remove "All Teams" from the selected values
        if (allTeamsIsChecked) {
          const index = this.teamIdFormControl.value.indexOf(this.ALL_TEAMS, 0);
          if (index > -1) {
            this.teamIdFormControl.value.splice(index, 1);
          }
        }
        let newValue: string[] = null;
        if (!this.allTeamsWasChecked && allTeamsIsChecked) {
          // user selecteed All Teams
          newValue = Object.assign([], this.teamIdList);
          addAllTeams = true;
        } else if (this.allTeamsWasChecked && !allTeamsIsChecked) {
          // user unselected All Teams
          newValue = [];
        } else if (!allTeamsIsChecked && this.teamIdFormControl.value.length === this.teamIdList.length) {
          // all of the teams were selected individually
          newValue = Object.assign([], this.teamIdFormControl.value);
          addAllTeams = true;
        } else {
          newValue = Object.assign([], this.teamIdFormControl.value);
        }
        this.data.teamCard.teamId = newValue.join(',');
        if (addAllTeams) {
          newValue.push(this.ALL_TEAMS);
        }
        this.teamIdFormControl.setValue(newValue);
        this.allTeamsWasChecked = addAllTeams;
        break;
      }
      case 'cardId':
        this.data.teamCard.cardId = this.cardIdFormControl.value;
        break;
      case 'move':
        this.data.teamCard.move = this.moveFormControl.value;
        break;
      case 'inject':
        this.data.teamCard.inject = this.injectFormControl.value;
        break;
      default:
        break;
    }
  }

}
