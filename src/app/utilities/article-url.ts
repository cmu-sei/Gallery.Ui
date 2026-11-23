/*
Copyright 2026 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * The article url to load in a frame or open in a new tab: the browser's own reading of the url, when it is an
 * absolute http or https url. Anything else, such as a javascript: or data: url or a relative path, gives null.
 * The url must spell out "http://" or "https://" followed by the host, as the API requires: the browser would also
 * read forms such as "https:news.example", "https:\\news.example", "https:///news.example" or
 * "https://\\news.example" as https urls, but the API refuses them.
 */
export function httpUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed || !/^https?:\/\/[^/\\]/i.test(trimmed)) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  return (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
    parsed.hostname
    ? parsed.href
    : null;
}

/** An article's url is optional, so an empty one is valid; any other must be an http or https url. */
export const articleUrlValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value: unknown = control.value;
  const url = typeof value === 'string' ? value : '';
  return !url.trim() || httpUrl(url) ? null : { httpUrl: true };
};
