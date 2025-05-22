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

@Component({
  selector: 'app-admin-exhibit-edit-dialog',
  templateUrl: './admin-exhibit-edit-dialog.component.html',
  styleUrls: ['./admin-exhibit-edit-dialog.component.scss'],
})
export class AdminExhibitEditDialogComponent {
  @Output() editComplete = new EventEmitter<any>();

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

  constructor(
    public dialogService: DialogService,
    dialogRef: MatDialogRef<AdminExhibitEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
  }

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
          this.exhibitIdFormControl.value.toString();
        break;
      case 'currentMove':
        this.data.exhibit.currentMove =
          this.currentMoveFormControl.value.toString();
        break;
      case 'currentInject':
        this.data.exhibit.currentInject =
          this.currentInjectFormControl.value.toString();
        break;
      default:
        break;
    }
  }

  getUserName(userId: string) {
    return this.data.userList.find((u) => u.id === userId).name;
  }
}
