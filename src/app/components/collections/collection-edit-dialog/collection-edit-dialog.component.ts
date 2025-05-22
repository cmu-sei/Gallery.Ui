// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
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

/** Error when control isn't an integer */
export class NotIntegerErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: UntypedFormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const hours = parseInt(control.value, 10);
    let isNotAnInteger = Number.isNaN(hours) || hours <= 0;
    if (!isNotAnInteger && !!control.value) {
      isNotAnInteger = hours.toString() !== control.value.toString();
    }
    if (isNotAnInteger) {
      control.setErrors({ notAnInteger: true });
    }
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      (control.invalid || isNotAnInteger) &&
      (control.dirty || isSubmitted)
    );
  }
}

@Component({
  selector: 'app-collection-edit-dialog',
  templateUrl: './collection-edit-dialog.component.html',
  styleUrls: ['./collection-edit-dialog.component.scss'],
})
export class CollectionEditDialogComponent {
  @Output() editComplete = new EventEmitter<any>();

  collectionNameFormControl = new UntypedFormControl(
    this.data.collection.name,
    [Validators.required, Validators.minLength(4)]
  );
  descriptionFormControl = new UntypedFormControl(
    this.data.collection.description
      ? this.data.collection.description
      : ' ',
    [Validators.required, Validators.minLength(4)]
  );
  durationHoursFormControl = new UntypedFormControl(
    this.data.collection.durationHours,
    [Validators.required]
  );
  matcher = new UserErrorStateMatcher();
  notAnIntegerErrorState = new NotIntegerErrorStateMatcher();

  constructor(
    public dialogService: DialogService,
    dialogRef: MatDialogRef<CollectionEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
  }

  errorFree() {
    const hasError =
      this.collectionNameFormControl.hasError('required') ||
      this.collectionNameFormControl.hasError('minlength') ||
      this.descriptionFormControl.hasError('required') ||
      this.descriptionFormControl.hasError('minlength') ||
      this.durationHoursFormControl.hasError('required') ||
      this.durationHoursFormControl.hasError('notAnInteger');
    return !hasError;
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
      const modifiedCollection = {
        ...this.data.collection,
        id: this.data.collection.id,
      };
      modifiedCollection.name = this.collectionNameFormControl.value
        .toString()
        .trim();
      modifiedCollection.description = this.descriptionFormControl.value
        .toString()
        .trim();
      modifiedCollection.durationHours =
        this.durationHoursFormControl.value;
      if (this.errorFree) {
        this.editComplete.emit({
          saveChanges: saveChanges,
          collection: modifiedCollection,
        });
      }
    }
  }
}
