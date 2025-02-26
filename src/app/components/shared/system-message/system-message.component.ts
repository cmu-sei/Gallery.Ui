// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, Inject } from '@angular/core';
import {
  MatBottomSheetRef,
  MAT_BOTTOM_SHEET_DATA,
} from '@angular/material/bottom-sheet';

@Component({
    selector: 'app-system-message',
    templateUrl: './system-message.component.html',
    styleUrls: ['./system-message.component.scss'],
    standalone: false
})
export class SystemMessageComponent {
  public displayTitle: string;
  public displayMessage: string;

  constructor(
    public messageSheet: MatBottomSheetRef<SystemMessageComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any
  ) {
    this.displayTitle = data.title;
    this.displayMessage = data.message;
  }

  close() {
    this.messageSheet.dismiss();
  }
}
