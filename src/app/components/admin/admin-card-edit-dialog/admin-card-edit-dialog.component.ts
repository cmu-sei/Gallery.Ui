// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Inject, Output } from '@angular/core';
import {
  UntypedFormControl,
  FormGroupDirective,
  NgForm,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ItemStatus } from 'src/app/generated/api';
import { DialogService } from 'src/app/services/dialog/dialog.service';

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

const MIN_NAME_LENGTH = 3;

@Component({
  selector: 'app-admin-card-edit-dialog',
  templateUrl: './admin-card-edit-dialog.component.html',
  styleUrls: ['./admin-card-edit-dialog.component.scss'],
})

export class AdminCardEditDialogComponent {
  @Output() editComplete = new EventEmitter<any>();

  public cardNameFormControl = new UntypedFormControl(
    this.data.card.name,
    [
      Validators.required,
      Validators.minLength(MIN_NAME_LENGTH),
    ]
  );
  public cardDescriptionFormControl = new UntypedFormControl(
    this.data.card.description,
    []
  );
  public collectionIdFormControl = new UntypedFormControl(
    this.data.card.collectionId ,
    [
      Validators.required
    ]
  );
  public collectionList = this.data.collectionList;

  constructor(
    public dialogService: DialogService,
    dialogRef: MatDialogRef<AdminCardEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
  }

  errorFree() {
    return !(
      this.cardNameFormControl.hasError('required') ||
      this.cardNameFormControl.hasError('minlength')
    );
  }

  /**
   * Closes the edit screen
   */
  handleEditComplete(saveChanges: boolean): void {
    if (!saveChanges) {
      this.editComplete.emit({ saveChanges: false, card: null });
    } else {
      this.data.card.name = this.cardNameFormControl.value
        .toString()
        .trim();
        this.data.card.description = this.cardDescriptionFormControl.value
        .toString()
        .trim();
        this.data.card.collectionId = this.collectionIdFormControl.value
        .toString()
        .trim();
      if (this.errorFree) {
        this.editComplete.emit({
          saveChanges: saveChanges,
          card: this.data.card,
        });
      }
    }
  }

  /**
   * Saves the current card
   */
  saveCard(changedField): void {
    switch (changedField) {
      case 'name':
        this.data.card.name = this.cardNameFormControl.value.toString();
        break;
      case 'description':
        this.data.card.description = this.cardDescriptionFormControl.value.toString();
        break;
      case 'collectionId':
        this.data.card.collectionId = this.collectionIdFormControl.value.toString();
        break;
      default:
        break;
    }
  }

}
