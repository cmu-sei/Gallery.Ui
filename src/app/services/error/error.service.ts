// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable, Injector, ErrorHandler } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { SystemMessageService } from '../system-message/system-message.service';

@Injectable({
  providedIn: 'root',
})
export class ErrorService implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(err: any) {
    const messageService = this.injector.get(SystemMessageService);
    // Http failure response for (unknown url): 0 Unknown Error
    if (err instanceof HttpErrorResponse) {
      if (
        err.message.startsWith('Http failure response for') &&
        err.message.endsWith('0 Unknown Error')
      ) {
        messageService.displayMessage(
          'Gallery API Error',
          'The Gallery API could not be reached.'
        );
        console.log('Gallery API Error', 'The Gallery API could not be reached.');
      } else if (err.error && err.error.title) {
        messageService.displayMessage(err.statusText, err.error.title);
        console.log(err.statusText + ' ==> ' + err.error.title);
      } else {
        messageService.displayMessage(err.statusText, err.message);
        console.log(err.statusText + ' ==> ' + err.message);
      }
    } else if (err.message.startsWith('Uncaught (in promise)')) {
      if (err.rejection.message === 'Network Error') {
        messageService.displayMessage(
          'Identity Server Error',
          'The Identity Server could not be reached for user authentication.'
        );
        console.log(
          'Identity Server Error',
          'The Identity Server could not be reached for user authentication.'
        );
      } else {
        messageService.displayMessage('Error', err.rejection.message);
        console.log(err.rejection.message);
      }
    } else {
      messageService.displayMessage(err.name, err.message);
      console.log(err.name + ' ==> ' + err.message);
    }
  }
}
