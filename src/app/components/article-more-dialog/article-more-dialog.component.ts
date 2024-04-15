// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AngularEditorConfig } from '@kolkov/angular-editor';

@Component({
  selector: 'app-article-more-dialog',
  templateUrl: './article-more-dialog.component.html',
  styleUrls: ['./article-more-dialog.component.scss'],
})

export class ArticleMoreDialogComponent {
  @Output() editComplete = new EventEmitter<any>();
  safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.article.url);
  safeContent: SafeHtml = '';
  editorConfig: AngularEditorConfig = {
    editable: false,
    height: 'auto',
    minHeight: '1200px',
    width: '100%',
    minWidth: '0',
    translate: 'yes',
    enableToolbar: false,
    showToolbar: false,
    placeholder: '',
    defaultParagraphSeparator: '',
    defaultFontName: '',
    defaultFontSize: '',
    sanitize: true,
  };

  constructor(
    public dialogService: DialogService,
    private sanitizer: DomSanitizer,
    dialogRef: MatDialogRef<ArticleMoreDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
    if (this.data.useUrl) {
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.article.url);
    } else {
      const parser = new DOMParser();
      const document = parser.parseFromString(this.data.article.description, 'text/html');
      this.safeContent = this.sanitizer.bypassSecurityTrustHtml(document.body.outerHTML);
    }
  }

  /**
   * Closes the dialog
   */
  handleMoreIsComplete(openNewTab: boolean): void {
    this.editComplete.emit({
      openNewTab: openNewTab,
      useUrl: this.data.useUrl
    });
  }

}
