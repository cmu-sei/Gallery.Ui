// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { FormControl } from '@angular/forms';
import { articleUrlValidator, httpUrl } from './article-url';

describe('httpUrl', () => {
  /**
   * Verifies: an absolute http or https url is kept, as the browser reads it.
   * Data: http and https urls, a padded one and an upper-case scheme.
   */
  it.each([
    ['https://news.example/outage', 'https://news.example/outage'],
    [
      'http://news.example/outage?id=1#top',
      'http://news.example/outage?id=1#top',
    ],
    ['HTTPS://NEWS.EXAMPLE', 'https://news.example/'],
    [' https://news.example/padded ', 'https://news.example/padded'],
  ])('keeps %j', (url, expected) => {
    expect(httpUrl(url)).toBe(expected);
  });

  /**
   * Verifies: a quote cannot end an href attribute the url is written into, since the parsed url percent-encodes it.
   * Data: an https url with a quote and a tag in its query.
   */
  it('percent-encodes a quote', () => {
    expect(httpUrl('https://news.example/?q="><b>')).toBe(
      'https://news.example/?q=%22%3E%3Cb%3E',
    );
  });

  /**
   * Verifies: no url, a script-bearing url, another scheme and a relative url all give null.
   * Data: javascript: (with case, padding and a tab the browser strips), data:, vbscript:, blob:, file:, ftp:, relative and scheme-relative urls.
   */
  it.each([
    null,
    undefined,
    '',
    '   ',
    'javascript:alert(document.domain)',
    'JavaScript:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'blob:https://gallery.example/0b1c',
    'file:///etc/passwd',
    'ftp://files.example/a',
    '/assets/page.html',
    'news.example/outage',
    '//news.example/outage',
  ])('refuses %j', (url) => {
    expect(httpUrl(url)).toBeNull();
  });
});

describe('articleUrlValidator', () => {
  /**
   * Verifies: a url is optional, so an empty control is valid, as is an http or https url.
   * Data: null, empty, blank and an https url.
   */
  it.each([null, '', '  ', 'https://news.example/outage'])(
    'accepts %j',
    (value) => {
      expect(articleUrlValidator(new FormControl(value))).toBeNull();
    },
  );

  /**
   * Verifies: any other url is an httpUrl error.
   * Data: javascript:, data: and a relative url.
   */
  it.each(['javascript:alert(1)', 'data:text/html,hi', '/assets/page.html'])(
    'refuses %j',
    (value) => {
      expect(articleUrlValidator(new FormControl(value))).toEqual({
        httpUrl: true,
      });
    },
  );
});
