// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';

@Component({
    selector: 'confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    standalone: false
})
export class ConfirmDialogComponent {
  public title: string;
  public message: string;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ConfirmDialogComponent>
  ) {
    this.dialogRef.disableClose = true;
  }
  onClick(confirm: boolean): void {
    this.data.confirm = confirm;
    this.dialogRef.close(this.data);
  }
}
