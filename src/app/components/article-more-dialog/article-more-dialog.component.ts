// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-article-more-dialog',
  templateUrl: './article-more-dialog.component.html',
  styleUrls: ['./article-more-dialog.component.scss'],
})

export class ArticleMoreDialogComponent {
  @Output() editComplete = new EventEmitter<any>();
  safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.article.url);

  constructor(
    public dialogService: DialogService,
    private sanitizer: DomSanitizer,
    dialogRef: MatDialogRef<ArticleMoreDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
  }

  /**
   * Closes the dialog
   */
  handleMoreIsComplete(openNewTab: boolean): void {
    this.editComplete.emit({ openNewTab: openNewTab });
  }

}
