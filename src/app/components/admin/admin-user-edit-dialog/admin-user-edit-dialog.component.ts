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
  selector: 'app-admin-user-edit-dialog',
  templateUrl: './admin-user-edit-dialog.component.html',
  styleUrls: ['./admin-user-edit-dialog.component.scss'],
})

export class AdminUserEditDialogComponent {
  @Output() editComplete = new EventEmitter<any>();

  public userNameFormControl = new UntypedFormControl(
    this.data.user.name,
    [
      Validators.required,
      Validators.minLength(MIN_NAME_LENGTH),
    ]
  );
  public emailFormControl = new UntypedFormControl(
    this.data.user.email ,
    []
  );
  public idFormControl = new UntypedFormControl(
    this.data.user.id ,
    [
      Validators.required
    ]
  );

  constructor(
    public dialogService: DialogService,
    dialogRef: MatDialogRef<AdminUserEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
  }

  errorFree() {
    return !(
      this.userNameFormControl.hasError('required') ||
      this.userNameFormControl.hasError('minlength')
    );
  }

  trimInitialDescription() {
    if (
      this.idFormControl.value &&
      this.idFormControl.value.toString()[0] === ' '
    ) {
      this.idFormControl.setValue(
        this.idFormControl.value.toString().trim()
      );
    }
  }

  /**
   * Closes the edit screen
   */
  handleEditComplete(saveChanges: boolean): void {
    if (!saveChanges) {
      this.editComplete.emit({ saveChanges: false, user: null });
    } else {
      this.data.user.name = this.userNameFormControl.value
        .toString()
        .trim();
      this.data.user.id = this.idFormControl.value
        .toString()
        .trim();
      if (this.errorFree) {
        this.editComplete.emit({
          saveChanges: saveChanges,
          user: this.data.user,
        });
      }
    }
  }

  /**
   * Saves the current user
   */
  saveUser(changedField): void {
    switch (changedField) {
      case 'name':
        this.data.user.name = this.userNameFormControl.value.toString();
        break;
      case 'email':
        this.data.user.email = this.emailFormControl.value.toString();
        break;
      case 'id':
        this.data.user.id = this.idFormControl.value.toString();
        break;
      default:
        break;
    }
  }

}
