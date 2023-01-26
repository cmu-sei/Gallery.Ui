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
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
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
  selector: 'app-admin-collection-edit-dialog',
  templateUrl: './admin-collection-edit-dialog.component.html',
  styleUrls: ['./admin-collection-edit-dialog.component.scss'],
})

export class AdminCollectionEditDialogComponent {
  @Output() editComplete = new EventEmitter<any>();

  public collectionNameFormControl = new UntypedFormControl(
    this.data.collection.name,
    [
      Validators.required,
      Validators.minLength(MIN_NAME_LENGTH),
    ]
  );
  public descriptionFormControl = new UntypedFormControl(
    this.data.collection.description ,
    []
  );

  readonly MIN_NAME_LENGTH = MIN_NAME_LENGTH;

  constructor(
    public dialogService: DialogService,
    dialogRef: MatDialogRef<AdminCollectionEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
  }

  errorFree() {
    return !(
      this.collectionNameFormControl.hasError('required') ||
      this.collectionNameFormControl.hasError('minlength')
    );
  }

  trimInitialDescription() {
    if (
      this.descriptionFormControl.value &&
      this.descriptionFormControl.value.toString()[0] === ' '
    ) {
      this.descriptionFormControl.setValue(
        this.descriptionFormControl.value.toString().trim()
      );
    }
  }

  /**
   * Closes the edit screen
   */
  handleEditComplete(saveChanges: boolean): void {
    if (!saveChanges) {
      this.editComplete.emit({ saveChanges: false, collection: null });
    } else {
      this.data.collection.name = this.collectionNameFormControl.value
        .toString()
        .trim();
      this.data.collection.description = this.descriptionFormControl.value
        .toString()
        .trim();
      if (this.errorFree) {
        this.editComplete.emit({
          saveChanges: saveChanges,
          collection: this.data.collection,
        });
      }
    }
  }

  /**
   * Saves the current collection
   */
  saveCollection(changedField): void {
    switch (changedField) {
      case 'name':
        this.data.collection.name = this.collectionNameFormControl.value.toString();
        break;
      case 'description':
        this.data.collection.description = this.descriptionFormControl.value.toString();
        break;
      default:
        break;
    }
  }

}
