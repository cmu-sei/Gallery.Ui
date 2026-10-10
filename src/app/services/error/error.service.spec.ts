// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { SystemMessageService } from '../system-message/system-message.service';
import { ErrorService } from './error.service';

function setup() {
  const displayMessage = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      ErrorService,
      {
        provide: SystemMessageService,
        useValue: { displayMessage } satisfies Pick<
          SystemMessageService,
          'displayMessage'
        >,
      },
    ],
  });
  return { service: TestBed.inject(ErrorService), displayMessage };
}

describe('ErrorService', () => {
  beforeEach(() => {
    // handleError also logs each message with console.log.
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  /**
   * Verifies: each kind of error is shown to the user with its own title and message.
   * Interacts with: SystemMessageService.displayMessage stub.
   * Data: an unreachable API (status 0), a problem-details response, a plain HTTP error, a rejected network promise, another rejection, and a plain Error.
   */
  it.each<[string, unknown, [string, string]]>([
    [
      'an unreachable API',
      new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' }),
      ['Gallery API Error', 'The Gallery API could not be reached.'],
    ],
    [
      'a problem-details response',
      new HttpErrorResponse({
        status: 403,
        statusText: 'Forbidden',
        url: '/api/x',
        error: { title: 'Not allowed' },
      }),
      ['Forbidden', 'Not allowed'],
    ],
    [
      'a plain HTTP error',
      new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        url: '/api/x',
      }),
      ['Server Error', 'Http failure response for /api/x: 500 Server Error'],
    ],
    [
      'a network rejection',
      {
        message: 'Uncaught (in promise): Error',
        rejection: { message: 'Network Error' },
      },
      [
        'Identity Server Error',
        'The Identity Server could not be reached for user authentication.',
      ],
    ],
    [
      'another rejection',
      {
        message: 'Uncaught (in promise): Error',
        rejection: { message: 'boom' },
      },
      ['Error', 'boom'],
    ],
    ['a plain Error', new TypeError('bad value'), ['TypeError', 'bad value']],
  ])('shows %s', (_label, error, expected) => {
    const { service, displayMessage } = setup();

    service.handleError(error);

    expect(displayMessage).toHaveBeenCalledWith(...expected);
  });

  /**
   * Verifies: an error value without a message (a thrown string) makes handleError itself throw, so nothing is shown (current behavior).
   * Interacts with: SystemMessageService.displayMessage stub.
   * Data: the string 'oops'.
   */
  it('throws on an error without a message', () => {
    const { service, displayMessage } = setup();

    // Current behavior; see agent-docs/ui-test-bugs/gallery.ui.md.
    expect(() => service.handleError('oops')).toThrow(TypeError);
    expect(displayMessage).not.toHaveBeenCalled();
  });
});
