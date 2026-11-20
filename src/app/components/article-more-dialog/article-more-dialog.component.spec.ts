// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CRUCIBLE_DIALOG_IMPORTS } from '@cmusei/crucible-common';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { renderComponent } from 'src/app/test-utils/render-component';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { ArticleMoreDialogComponent } from './article-more-dialog.component';

async function renderMore(
  useUrl: boolean,
  url = 'https://news.example/outage',
) {
  const ref = dialogRefStub<ArticleMoreDialogComponent>();
  const rendered = await renderComponent(ArticleMoreDialogComponent, {
    imports: [...CRUCIBLE_DIALOG_IMPORTS, AngularEditorModule],
    declarations: [ArticleMoreDialogComponent],
    providers: [
      // angular-editor injects HttpClient for image uploads; nothing is sent.
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MatDialogRef, useValue: ref.dialogRef },
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          useUrl,
          article: {
            name: 'Outage report',
            url,
            description: '<p>Power is out downtown.</p>',
          },
        },
      },
    ],
  });
  const completions: unknown[] = [];
  rendered.fixture.componentInstance.editComplete.subscribe((e) =>
    completions.push(e),
  );
  return { ...rendered, completions };
}

describe('ArticleMoreDialogComponent', () => {
  /**
   * Verifies: a URL article is shown in an iframe, and Open in New Tab reports openNewTab with useUrl.
   * Interacts with: crucible-dialog (real), editComplete output; user-event.
   * Data: useUrl true, article url https://news.example/outage.
   */
  it('shows the URL in a frame and asks to open it in a new tab', async () => {
    const { container, completions } = await renderMore(true);

    const frame = container.querySelector('iframe');
    expect(frame).toHaveAttribute('src', 'https://news.example/outage');
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Open in New Tab' }));

    expect(completions).toEqual([{ openNewTab: true, useUrl: true }]);
  });

  /**
   * Verifies: another site's page keeps its own origin and gets ordinary popups, but cannot navigate the Gallery tab.
   * Interacts with: the cross-origin iframe's static sandbox.
   * Data: useUrl true, article url https://news.example/outage.
   */
  it("sandboxes another site's page with its own origin", async () => {
    const { container } = await renderMore(true);

    const frames = container.querySelectorAll('iframe');
    expect(frames).toHaveLength(1);
    expect(frames[0].getAttribute('sandbox')?.split(' ').sort()).toEqual([
      'allow-forms',
      'allow-popups',
      'allow-popups-to-escape-sandbox',
      'allow-same-origin',
      'allow-scripts',
      'allow-storage-access-by-user-activation',
    ]);
  });

  /**
   * Verifies: a page on Gallery's own origin still loads, but without allow-same-origin or popups escaping the sandbox, so it cannot reach Gallery or lift its sandbox.
   * Interacts with: the same-origin iframe's static sandbox, window.location.origin.
   * Data: useUrl true, an article url on the test page's origin.
   */
  it("sandboxes a page on Gallery's own origin more strictly", async () => {
    const url = `${window.location.origin}/exhibit/e1/article/a1`;
    const { container } = await renderMore(true, url);

    const frames = container.querySelectorAll('iframe');
    expect(frames).toHaveLength(1);
    expect(frames[0]).toHaveAttribute('src', url);
    expect(frames[0].getAttribute('sandbox')?.split(' ').sort()).toEqual([
      'allow-forms',
      'allow-popups',
      'allow-scripts',
    ]);
  });

  /**
   * Verifies: a URL that is not http or https, such as one stored before URLs were checked, is not loaded in a frame, and Open in New Tab is disabled.
   * Interacts with: httpUrl, crucible-dialog submitDisabled.
   * Data: useUrl true with javascript:, data: and relative URLs.
   */
  it.each([
    'javascript:alert(document.domain)',
    'data:text/html,<script>alert(1)</script>',
    '/assets/page.html',
  ])('shows no frame for %j', async (url) => {
    const { container } = await renderMore(true, url);

    expect(container.querySelector('iframe')).toBeNull();
    expect(
      screen.getByText(
        "This article's URL is not an http or https address, so it cannot be shown.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open in New Tab' }),
    ).toBeDisabled();
  });

  /**
   * Verifies: an article without a URL shows its description read-only with no reserved page height, and Cancel reports openNewTab false.
   * Interacts with: angular-editor, crucible-dialog (real), editComplete output; user-event.
   * Data: useUrl false.
   */
  it('shows the description and reports a cancel', async () => {
    const { container, completions } = await renderMore(false);

    expect(container.querySelector('iframe')).toBeNull();
    const text = await screen.findByText('Power is out downtown.');
    // The read-only page grows with its text instead of reserving a tall page.
    const page = text.closest('[contenteditable]') as HTMLElement;
    expect(page).toHaveAttribute('contenteditable', 'false');
    expect(page.style.minHeight).toBe('0px');
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Cancel' }));

    expect(completions).toEqual([{ openNewTab: false, useUrl: false }]);
  });
});
