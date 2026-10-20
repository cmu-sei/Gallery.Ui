// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, inject, output } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, FormGroupDirective, NgForm, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CrucibleDialogComponent, CrucibleDialogContentDirective } from '@cmusei/crucible-common';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatCheckbox } from '@angular/material/checkbox';

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
    selector: 'app-admin-exhibit-edit-dialog',
    templateUrl: './admin-exhibit-edit-dialog.component.html',
    styleUrls: ['./admin-exhibit-edit-dialog.component.scss'],
    imports: [CrucibleDialogComponent, CrucibleDialogContentDirective, MatFormField, MatLabel, MatInput, FormsModule, ReactiveFormsModule, MatError, MatCheckbox]
})
export class AdminExhibitEditDialogComponent {
  data = inject(MAT_DIALOG_DATA);

  readonly editComplete = output<any>();

  public nameFormControl = new UntypedFormControl(this.data.exhibit.name, []);
  public descriptionFormControl = new UntypedFormControl(
    this.data.exhibit.description,
    []
  );
  public exhibitIdFormControl = new UntypedFormControl(
    this.data.exhibit.exhibitId,
    []
  );
  public currentMoveFormControl = new UntypedFormControl(
    this.data.exhibit.currentMove,
    [Validators.required]
  );
  public currentInjectFormControl = new UntypedFormControl(
    this.data.exhibit.currentInject,
    [Validators.required]
  );
  public showAdvanceButtonFormControl = new UntypedFormControl(
    this.data.exhibit.showAdvanceButton ?? false
  );
  public form = new UntypedFormGroup({
    name: this.nameFormControl,
    description: this.descriptionFormControl,
    exhibitId: this.exhibitIdFormControl,
    currentMove: this.currentMoveFormControl,
    currentInject: this.currentInjectFormControl,
    showAdvanceButton: this.showAdvanceButtonFormControl,
  });

  errorFree() {
    return !(
      this.nameFormControl.hasError('required') ||
      this.descriptionFormControl.hasError('required') ||
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
      this.data.exhibit.showAdvanceButton =
        this.showAdvanceButtonFormControl.value;
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
      case 'name':
        this.data.exhibit.name = this.nameFormControl.value;
        break;
      case 'description':
        this.data.exhibit.description = this.descriptionFormControl.value;
        break;
      case 'exhibitId':
        this.data.exhibit.exhibitId =
          this.exhibitIdFormControl.value?.toString() || '';
        break;
      case 'currentMove':
        this.data.exhibit.currentMove =
          this.currentMoveFormControl.value?.toString() || '';
        break;
      case 'currentInject':
        this.data.exhibit.currentInject =
          this.currentInjectFormControl.value?.toString() || '';
        break;
      default:
        break;
    }
  }

  getUserName(userId: string) {
    return this.data.userList.find((u) => u.id === userId).name;
  }
}
