// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, inject, output } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  DomSanitizer,
  SafeHtml,
  SafeResourceUrl,
} from '@angular/platform-browser';
import {
  AngularEditorConfig,
  AngularEditorModule,
} from '@kolkov/angular-editor';
import {
  CrucibleDialogComponent,
  CrucibleDialogContentDirective,
} from '@cmusei/crucible-common';
import { FormsModule } from '@angular/forms';
import { httpUrl } from 'src/app/utilities/article-url';

@Component({
  selector: 'app-article-more-dialog',
  templateUrl: './article-more-dialog.component.html',
  styleUrls: ['./article-more-dialog.component.scss'],
  imports: [
    CrucibleDialogComponent,
    CrucibleDialogContentDirective,
    AngularEditorModule,
    FormsModule,
  ],
})
export class ArticleMoreDialogComponent {
  private sanitizer = inject(DomSanitizer);
  data = inject(MAT_DIALOG_DATA);

  readonly editComplete = output<any>();
  /** Only an http or https url is trusted for the frame; any other leaves it null, and no frame is shown. */
  safeUrl: SafeResourceUrl | null = null;
  /** Whether the url is on Gallery's own origin, which gets the stricter sandbox. */
  sameOrigin = false;
  safeContent: SafeHtml = '';
  editorConfig: AngularEditorConfig = {
    editable: false,
    height: 'auto',
    minHeight: '0',
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

  constructor() {
    if (this.data.useUrl) {
      const url = httpUrl(this.data.article.url);
      if (url) {
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.sameOrigin = new URL(url).origin === window.location.origin;
      }
    } else {
      const parser = new DOMParser();
      const document = parser.parseFromString(
        this.data.article.description,
        'text/html',
      );
      this.safeContent = this.sanitizer.bypassSecurityTrustHtml(
        document.body.outerHTML,
      );
    }
  }

  /**
   * Closes the dialog
   */
  handleMoreIsComplete(openNewTab: boolean): void {
    this.editComplete.emit({
      openNewTab: openNewTab,
      useUrl: this.data.useUrl,
    });
  }
}
