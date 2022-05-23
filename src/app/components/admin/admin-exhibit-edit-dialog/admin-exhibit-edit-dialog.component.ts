// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Inject, Output } from '@angular/core';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog/dialog.service';

/** Error when invalid control is dirty, touched, or submitted. */
export class UserErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || isSubmitted));
  }
}

@Component({
  selector: 'app-admin-exhibit-edit-dialog',
  templateUrl: './admin-exhibit-edit-dialog.component.html',
  styleUrls: ['./admin-exhibit-edit-dialog.component.scss'],
})

export class AdminExhibitEditDialogComponent {
  @Output() editComplete = new EventEmitter<any>();

  public scenarioIdFormControl = new FormControl(
    this.data.exhibit.scenarioId,
    []
  );
  public currentMoveFormControl = new FormControl(
    this.data.exhibit.currentMove,
    [
      Validators.required
    ]
  );
  public currentInjectFormControl = new FormControl(
    this.data.exhibit.currentInject,
    [
      Validators.required
    ]
  );

  constructor(
    public dialogService: DialogService,
    dialogRef: MatDialogRef<AdminExhibitEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
  }

  errorFree() {
    return !(
      this.currentMoveFormControl.hasError('required') ||
      this.currentInjectFormControl.hasError('required')
    );
  }

  /**
   * Closes the edit screen
   */
  handleEditComplete(saveChanges: boolean): void {
    if (!saveChanges) {
      this.editComplete.emit({ saveChanges: false, exhibit: null });
    } else {
      this.data.exhibit.name = this.currentMoveFormControl.value
        .toString()
        .trim();
      this.data.exhibit.shortName = this.currentInjectFormControl.value
        .toString()
        .trim();
      if (this.errorFree) {
        this.editComplete.emit({
          saveChanges: saveChanges,
          exhibit: this.data.exhibit,
        });
      }
    }
  }

  /**
   * Saves the current exhibit
   */
  saveExhibit(changedField): void {
    switch (changedField) {
      case 'scenarioId':
        this.data.exhibit.scenarioId = this.scenarioIdFormControl.value.toString();
        break;
      case 'currentMove':
        this.data.exhibit.currentMove = this.currentMoveFormControl.value.toString();
        break;
      case 'currentInject':
        this.data.exhibit.currentInject = this.currentInjectFormControl.value.toString();
        break;
      default:
        break;
    }
  }

  getUserName(userId: string) {
    return this.data.userList.find(u => u.id === userId).name;
  }

}
