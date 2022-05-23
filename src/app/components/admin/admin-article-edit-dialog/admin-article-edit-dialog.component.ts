// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Inject, Output } from '@angular/core';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ItemStatus } from 'src/app/generated/api';
import { DialogService } from 'src/app/services/dialog/dialog.service';

/** Error when invalid control is dirty, touched, or submitted. */
export class UserErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || isSubmitted));
  }
}

const MIN_NAME_LENGTH = 3;

@Component({
  selector: 'app-admin-article-edit-dialog',
  templateUrl: './admin-article-edit-dialog.component.html',
  styleUrls: ['./admin-article-edit-dialog.component.scss'],
})

export class AdminArticleEditDialogComponent {
  @Output() editComplete = new EventEmitter<any>();

  public articleNameFormControl = new FormControl(
    this.data.article.name,
    [
      Validators.required,
      Validators.minLength(MIN_NAME_LENGTH),
    ]
  );
  public descriptionFormControl = new FormControl(
    this.data.article.description ,
    []
  );
  public cardIdFormControl = new FormControl(
    this.data.article.cardId,
    []
  );
  public moveFormControl = new FormControl(
    this.data.article.move,
    []
  );
  public injectFormControl = new FormControl(
    this.data.article.inject,
    []
  );
  public statusFormControl = new FormControl(
    this.data.article.status,
    []
  );
  public sourceTypeFormControl = new FormControl(
    this.data.article.sourceType,
    []
  );
  public sourceNameFormControl = new FormControl(
    this.data.article.sourceName,
    []
  );
  public urlFormControl = new FormControl(
    this.data.article.url,
    []
  );
  public datePostedFormControl = new FormControl(
    this.data.article.datePosted,
    []
  );
  public timePostedFormControl = new FormControl(
    this.data.article.datePosted.toTimeString().substr(0, 5),
    []
  );
  public matcher = new UserErrorStateMatcher();
  itemStatusList = [
    ItemStatus.Unused,
    ItemStatus.Open,
    ItemStatus.Affected,
    ItemStatus.Critical,
    ItemStatus.Closed
  ]

  constructor(
    public dialogService: DialogService,
    dialogRef: MatDialogRef<AdminArticleEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
  }

  errorFree() {
    return !(
      this.articleNameFormControl.hasError('required') ||
      this.articleNameFormControl.hasError('minlength') ||
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
        this.data.article.name = this.articleNameFormControl.value ? this.articleNameFormControl.value.toString() : '';
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
      case 'datePosted':
        const newPosted = new Date(this.datePostedFormControl.value);
        const oldPosted = new Date(this.data.article.datePosted);
        newPosted.setHours(oldPosted.getHours());
        newPosted.setMinutes(oldPosted.getMinutes());
        this.data.article.datePosted = newPosted;
        break;
      case 'timePosted':
        var timeParts: string[];
        var newTime = this.timePostedFormControl.value;
        if (newTime.length === 5) {
          timeParts = newTime.split(':');
        } else {
          timeParts = this.convertTime12to24(newTime);
        }
        this.data.article.datePosted.setHours(timeParts[0]);
        this.data.article.datePosted.setMinutes(timeParts[1]);
        break;
      default:
        break;
    }
  }

  private convertTime12to24(time12h: string) {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier.toUpperCase() === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }

    return [hours, minutes];
  };
}
