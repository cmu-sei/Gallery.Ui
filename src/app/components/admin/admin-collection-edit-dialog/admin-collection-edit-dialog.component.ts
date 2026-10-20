// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Output, inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, FormGroupDirective, NgForm, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CrucibleDialogComponent, CrucibleDialogContentDirective } from '@cmusei/crucible-common';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

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
    selector: 'app-admin-collection-edit-dialog',
    templateUrl: './admin-collection-edit-dialog.component.html',
    styleUrls: ['./admin-collection-edit-dialog.component.scss'],
    imports: [CrucibleDialogComponent, CrucibleDialogContentDirective, MatFormField, MatLabel, MatInput, FormsModule, ReactiveFormsModule, MatError]
})
export class AdminCollectionEditDialogComponent {
  data = inject(MAT_DIALOG_DATA);

  @Output() editComplete = new EventEmitter<any>();

  public collectionNameFormControl = new UntypedFormControl(
    this.data.collection.name,
    [Validators.required]
  );
  public descriptionFormControl = new UntypedFormControl(
    this.data.collection.description,
    []
  );
  public form = new UntypedFormGroup({
    name: this.collectionNameFormControl,
    description: this.descriptionFormControl,
  });

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
        this.data.collection.name =
          this.collectionNameFormControl.value.toString();
        break;
      case 'description':
        this.data.collection.description =
          this.descriptionFormControl.value.toString();
        break;
      default:
        break;
    }
  }
}
