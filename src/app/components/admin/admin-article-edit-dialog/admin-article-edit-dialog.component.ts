// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the
// project root for license information.

import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import {
  UntypedFormControl,
  FormGroupDirective,
  NgForm,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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

@Component({
    selector: 'app-admin-article-edit-dialog',
    templateUrl: './admin-article-edit-dialog.component.html',
    styleUrls: ['./admin-article-edit-dialog.component.scss'],
    standalone: false
})
export class AdminArticleEditDialogComponent implements OnInit {
  @Output() editComplete = new EventEmitter<any>();
  showDescriptionError = false;
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
  public articleNameFormControl!: UntypedFormControl;
  public summaryFormControl!: UntypedFormControl;
  public descriptionFormControl!: UntypedFormControl;
  public cardIdFormControl!: UntypedFormControl;
  public moveFormControl!: UntypedFormControl;
  public injectFormControl!: UntypedFormControl;
  public statusFormControl!: UntypedFormControl;
  public sourceTypeFormControl!: UntypedFormControl;
  public sourceNameFormControl!: UntypedFormControl;
  public urlFormControl!: UntypedFormControl;
  public datePostedFormControl!: UntypedFormControl;

  public matcher = new UserErrorStateMatcher();
  itemStatusList: ItemStatus[] = [
    ItemStatus.Unused,
    ItemStatus.Affected,
    ItemStatus.Closed,
    ItemStatus.Critical,
    ItemStatus.Open,
  ];
  sourceTypeList: SourceType[] = [
    SourceType.Intel,
    SourceType.News,
    SourceType.Reporting,
    SourceType.Social,
    SourceType.Phone,
    SourceType.Email,
    SourceType.Orders,
  ];

  constructor(
    public dialogService: DialogService,
    dialogRef: MatDialogRef<AdminArticleEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
  }

  editorStyle = {
    'min-height': '100px',
    'max-height': '400px',
    overflow: 'auto',
  };

  ngOnInit() {
    // Ensure openInNewTab is defined
    if (this.data.article.openInNewTab === undefined) {
      this.data.article.openInNewTab = false;
    }

    // Initialize form controls after data is injected
    this.articleNameFormControl = new UntypedFormControl(
      this.data.article.name || '',
      [Validators.required]
    );
    this.summaryFormControl = new UntypedFormControl(
      this.data.article.summary || '',
      [Validators.required]
    );
    this.descriptionFormControl = new UntypedFormControl(
      this.data.article.description || '',
      [Validators.required]
    );
    this.cardIdFormControl = new UntypedFormControl(
      this.data.article.cardId || '',
      []
    );
    this.moveFormControl = new UntypedFormControl(this.data.article.move || 0, []);
    this.injectFormControl = new UntypedFormControl(
      this.data.article.inject || 0,
      []
    );
    this.statusFormControl = new UntypedFormControl(
      this.data.article.status || '',
      []
    );
    this.sourceTypeFormControl = new UntypedFormControl(
      this.data.article.sourceType || '',
      []
    );
    this.sourceNameFormControl = new UntypedFormControl(
      this.data.article.sourceName || '',
      []
    );
    this.urlFormControl = new UntypedFormControl(this.data.article.url || '', []);
    this.datePostedFormControl = new UntypedFormControl(
      this.data.article.datePosted || new Date(),
      []
    );

    this.articleNameFormControl.markAsTouched();
    this.summaryFormControl.markAllAsTouched();
    this.descriptionFormControl.markAllAsTouched();
  }

  errorFree() {
    return !(
      this.articleNameFormControl.hasError('required') ||
      this.summaryFormControl.hasError('required') ||
      this.descriptionFormControl.hasError('required')
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
          article: this.data.article,
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
        this.data.article.name = this.articleNameFormControl.value
          ? this.articleNameFormControl.value.toString()
          : '';
        break;
      case 'summary':
        this.data.article.summary = this.summaryFormControl.value
          ? this.summaryFormControl.value.toString()
          : '';
        break;
      case 'description':
        this.data.article.description = this.descriptionFormControl.value
          ? this.descriptionFormControl.value.toString()
          : '';
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
        this.data.article.sourceName = this.sourceNameFormControl.value
          ? this.sourceNameFormControl.value.toString()
          : '';
        break;
      case 'url':
        this.data.article.url = this.urlFormControl.value
          ? this.urlFormControl.value.toString()
          : '';
        break;
      case 'datePosted': {
        if (this.datePostedFormControl.value) {
          this.data.article.datePosted = new Date(this.datePostedFormControl.value);
        }
        break;
      }
      default:
        break;
    }
  }

  getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  getTimezoneAbbr(): string {
    try {
      const date = new Date();
      const timeZone = this.getUserTimezone();
      const formatted = date.toLocaleTimeString('en-US', {
        timeZoneName: 'short',
        timeZone
      });
      const parts = formatted.split(' ');
      return parts[parts.length - 1] || 'UTC';
    } catch (error) {
      return 'UTC';
    }
  }
}
