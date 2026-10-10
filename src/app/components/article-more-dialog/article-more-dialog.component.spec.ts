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

async function renderMore(useUrl: boolean) {
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
            url: 'https://news.example/outage',
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

    expect(container.querySelector('iframe')).toHaveAttribute(
      'src',
      'https://news.example/outage',
    );
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Open in New Tab' }));

    expect(completions).toEqual([{ openNewTab: true, useUrl: true }]);
  });

  /**
   * Verifies: an article without a URL shows its description, and Cancel reports openNewTab false.
   * Interacts with: angular-editor, crucible-dialog (real), editComplete output; user-event.
   * Data: useUrl false.
   */
  it('shows the description and reports a cancel', async () => {
    const { container, completions } = await renderMore(false);

    expect(container.querySelector('iframe')).toBeNull();
    expect(
      await screen.findByText('Power is out downtown.'),
    ).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Cancel' }));

    expect(completions).toEqual([{ openNewTab: false, useUrl: false }]);
  });
});
