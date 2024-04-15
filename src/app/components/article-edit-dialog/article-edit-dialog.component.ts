// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the
// project root for license information.

import { Component, EventEmitter, Inject, Output } from '@angular/core';
import {
  UntypedFormControl,
  FormGroupDirective,
  NgForm,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { ItemStatus, SourceType } from 'src/app/generated/api';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { AngularEditorConfig } from '@kolkov/angular-editor';

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
const MAX_SUMMARY_LENGTH = 300;

@Component({
  selector: 'app-article-edit-dialog',
  templateUrl: './article-edit-dialog.component.html',
  styleUrls: ['./article-edit-dialog.component.scss'],
})

export class ArticleEditDialogComponent {
  @Output() editComplete = new EventEmitter<any>();
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
      {class: 'arial', name: 'Arial'},
      {class: 'times-new-roman', name: 'Times New Roman'},
      {class: 'calibri', name: 'Calibri'},
      {class: 'comic-sans-ms', name: 'Comic Sans MS'}
    ],
    uploadUrl: '',
    uploadWithCredentials: false,
    sanitize: true,
    toolbarPosition: 'top',
    toolbarHiddenButtons: [
      ['backgroundColor']
    ]
  };
  public articleNameFormControl = new UntypedFormControl(
    this.data.article.name,
    [
      Validators.required,
      Validators.minLength(MIN_NAME_LENGTH),
    ]
  );
  public summaryFormControl = new UntypedFormControl(
    this.data.article.summary ,
    [
      Validators.required,
      Validators.minLength(MIN_NAME_LENGTH),
      Validators.maxLength(MAX_SUMMARY_LENGTH)
    ]
  );
  public descriptionFormControl = new UntypedFormControl(
    this.data.article.description ,
    []
  );
  public cardIdFormControl = new UntypedFormControl(
    this.data.article.cardId,
    []
  );
  public moveFormControl = new UntypedFormControl(
    this.data.article.move,
    []
  );
  public injectFormControl = new UntypedFormControl(
    this.data.article.inject,
    []
  );
  public statusFormControl = new UntypedFormControl(
    this.data.article.status,
    []
  );
  public sourceTypeFormControl = new UntypedFormControl(
    this.data.article.sourceType,
    []
  );
  public sourceNameFormControl = new UntypedFormControl(
    this.data.article.sourceName,
    []
  );
  public urlFormControl = new UntypedFormControl(
    this.data.article.url,
    []
  );
  public datePostedFormControl = new UntypedFormControl(
    this.data.article.datePosted,
    []
  );

  public matcher = new UserErrorStateMatcher();
  itemStatusList: ItemStatus[] = [
    ItemStatus.Unused,
    ItemStatus.Affected,
    ItemStatus.Closed,
    ItemStatus.Critical,
    ItemStatus.Open
  ];
  sourceTypeList: SourceType[] = [
    SourceType.Intel,
    SourceType.News,
    SourceType.Reporting,
    SourceType.Social,
    SourceType.Phone,
    SourceType.Email,
    SourceType.Orders
  ];
  readonly MIN_NAME_LENGTH = MIN_NAME_LENGTH;
  readonly MAX_SUMMARY_LENGTH = MAX_SUMMARY_LENGTH;
  teamIdList: string[] = [];

  constructor(
    public dialogService: DialogService,
    dialogRef: MatDialogRef<ArticleEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
  }

  editorStyle = {
    'min-height': '100px',
    'max-height': '400px',
    'overflow': 'auto'
  };

  errorFree() {
    return !(
      this.articleNameFormControl.hasError('required') ||
      this.articleNameFormControl.hasError('minlength') ||
      this.summaryFormControl.hasError('required') ||
      this.summaryFormControl.hasError('minlength') ||
      this.summaryFormControl.hasError('maxlength') ||
      !this.data.article.cardId
    );
  }

  trimInitialDescription() {
    if (
      this.descriptionFormControl.value &&
      this.descriptionFormControl.value.toString()[0] === ' '
    ) {
      this.descriptionFormControl.setValue(
        this.descriptionFormControl.value.toString().trim()
      );
    }
  }

  /**
   * Closes the edit screen
   */
  handleEditComplete(saveChanges: boolean): void {
    if (!saveChanges) {
      this.editComplete.emit({ saveChanges: false, article: null });
    } else {
      this.data.article.name = this.articleNameFormControl.value
        .toString()
        .trim();
      this.data.article.description = this.descriptionFormControl.value
        .toString()
        .trim();
      this.data.article.summary = this.summaryFormControl.value
        .toString()
        .trim();
      if (this.errorFree) {
        this.editComplete.emit({
          saveChanges: saveChanges,
          article: this.data.article
        });
      }
    }
  }

  /**
   * Saves the current article
   */
  saveArticle(changedField): void {
    switch (changedField) {
      case 'name':
        this.data.article.name = this.articleNameFormControl.value ? this.articleNameFormControl.value.toString() : '';
        break;
      case 'summary':
        this.data.article.summary = this.summaryFormControl.value ? this.summaryFormControl.value.toString() : '';
        break;
      case 'description':
        this.data.article.description = this.descriptionFormControl.value ? this.descriptionFormControl.value.toString() : '';
        break;
      case 'cardId':
        this.data.article.cardId = this.cardIdFormControl.value;
        break;
      case 'status':
        this.data.article.status = this.statusFormControl.value;
        break;
      case 'move':
        this.data.article.move = this.moveFormControl.value;
        break;
      case 'inject':
        this.data.article.inject = this.injectFormControl.value;
        break;
      case 'sourceType':
        this.data.article.sourceType = this.sourceTypeFormControl.value;
        break;
      case 'sourceName':
        this.data.article.sourceName = this.sourceNameFormControl.value ? this.sourceNameFormControl.value.toString() : '';
        break;
      case 'url':
        this.data.article.url = this.urlFormControl.value ? this.urlFormControl.value.toString() : '';
        break;
      case 'datePosted': {
        const newPosted = new Date(this.datePostedFormControl.value);
        const oldPosted = new Date(this.data.article.datePosted);
        newPosted.setHours(oldPosted.getHours());
        newPosted.setMinutes(oldPosted.getMinutes());
        this.data.article.datePosted = newPosted;
        break;
      }
      default:
        break;
    }
  }

}
