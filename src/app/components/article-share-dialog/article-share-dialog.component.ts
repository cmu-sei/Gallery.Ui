// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { DialogService } from 'src/app/services/dialog/dialog.service';

@Component({
  selector: 'app-article-share-dialog',
  templateUrl: './article-share-dialog.component.html',
  styleUrls: ['./article-share-dialog.component.scss'],
})

export class ArticleShareDialogComponent {
  @Output() editComplete = new EventEmitter<any>();
  shareTeamsControl = new UntypedFormControl();
  subjectFormControl = new UntypedFormControl(this.data.article.sourceName + ': ' + this.data.article.name);
  messageFormControl = new UntypedFormControl('<p>FYSA</p><p>- - - - - -</p><p>' +
    this.data.article.sourceType + ' from ' + this.data.article.sourceName + '</p><p>' +
    this.data.article.name + '</p>&nbsp;<p>' + this.data.article.summary + '</p>&nbsp;<p>' +
    '<a href="' + location.origin + '/article/' + this.data.article.id
          + '" rel="noopener noreferrer" target="_blank">Article Text</a></p>');

  editorStyle = {
    height: '200px'
  };

  constructor(
    public dialogService: DialogService,
    dialogRef: MatDialogRef<ArticleShareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
    if (this.data.article.url) {
      this.messageFormControl
        .setValue(this.messageFormControl.value + '<a href="' + this.data.article.url
          + '" rel="noopener noreferrer" target="_blank">More Information</a>');
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
          message: this.messageFormControl.value
        }
      });
    }
  }

}
