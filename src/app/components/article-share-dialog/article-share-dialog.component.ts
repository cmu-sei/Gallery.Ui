// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { AngularEditorConfig } from '@kolkov/angular-editor';

@Component({
    selector: 'app-article-share-dialog',
    templateUrl: './article-share-dialog.component.html',
    styleUrls: ['./article-share-dialog.component.scss'],
    standalone: false
})
export class ArticleShareDialogComponent {
  @Output() editComplete = new EventEmitter<any>();
  shareTeamsControl = new UntypedFormControl();
  subjectFormControl = new UntypedFormControl(
    this.data.article.sourceName + ': ' + this.data.article.name
  );
  messageFormControl = new UntypedFormControl(
    '<p>FYSA</p><p>- - - - - -</p><p>' +
      this.data.article.sourceType +
      ' from ' +
      this.data.article.sourceName +
      '</p><p>' +
      this.data.article.name +
      '</p>&nbsp;<p>' +
      this.data.article.summary +
      '</p>&nbsp;<p>' +
      '<a href="' +
      location.origin +
      '/article/' +
      this.data.article.id +
      '" rel="noopener noreferrer" target="_blank">Article Text</a></p>'
  );
  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: 'auto',
    minHeight: '0',
    maxHeight: 'auto',
    width: 'auto',
    minWidth: '0',
    translate: 'yes',
    enableToolbar: true,
    showToolbar: true,
    placeholder: 'Enter text here...',
    defaultParagraphSeparator: '',
    defaultFontName: '',
    defaultFontSize: '',
    fonts: [
      { class: 'arial', name: 'Arial' },
      { class: 'times-new-roman', name: 'Times New Roman' },
      { class: 'calibri', name: 'Calibri' },
      { class: 'comic-sans-ms', name: 'Comic Sans MS' },
    ],
    uploadUrl: '',
    uploadWithCredentials: false,
    sanitize: true,
    toolbarPosition: 'top',
    toolbarHiddenButtons: [['backgroundColor']],
  };

  constructor(
    public dialogService: DialogService,
    dialogRef: MatDialogRef<ArticleShareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
    if (this.data.article.url) {
      this.messageFormControl.setValue(
        this.messageFormControl.value +
          '<a href="' +
          this.data.article.url +
          '" rel="noopener noreferrer" target="_blank">More Information</a>'
      );
    }
  }

  /**
   * Closes the dialog
   */
  handleShareIsComplete(shareIt: boolean): void {
    if (!shareIt) {
      this.editComplete.emit({ saveChanges: false, shareDetails: {} });
    } else {
      this.editComplete.emit({
        saveChanges: shareIt,
        shareDetails: {
          toTeamIdList: this.shareTeamsControl.value,
          subject: this.subjectFormControl.value,
          message: this.messageFormControl.value,
        },
      });
    }
  }
}
