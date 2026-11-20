/*
Copyright 2026 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * The article url to load in a frame or open in a new tab: the browser's own reading of the url, when it is an
 * absolute http or https url. Anything else, such as a javascript: or data: url or a relative path, gives null.
 */
export function httpUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) {
    return null;
  }
  let parsed: URL;
  try {
    // with no base, a relative url throws
    parsed = new URL(url);
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
