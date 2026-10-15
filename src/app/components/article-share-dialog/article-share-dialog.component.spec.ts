// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectHarness } from '@angular/material/select/testing';
import { CRUCIBLE_DIALOG_IMPORTS } from '@cmusei/crucible-common';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { renderComponent } from 'src/app/test-utils/render-component';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { ArticleShareDialogComponent } from './article-share-dialog.component';

const ARTICLE = {
  id: 'a1',
  name: 'Outage',
  sourceName: 'Daily News',
  sourceType: 'News',
  summary: 'Power is out',
  url: '',
};

async function renderShare(isEmailActive: boolean) {
  const ref = dialogRefStub<ArticleShareDialogComponent>();
  const rendered = await renderComponent(ArticleShareDialogComponent, {
    imports: [
      ...CRUCIBLE_DIALOG_IMPORTS,
      AngularEditorModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
    ],
    declarations: [ArticleShareDialogComponent],
    providers: [
      // angular-editor injects HttpClient for image uploads; nothing is sent.
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MatDialogRef, useValue: ref.dialogRef },
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          article: ARTICLE,
          isEmailActive,
          teamList: [
            { id: 't1', name: 'Blue' },
            { id: 't2', name: 'Red' },
          ],
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

describe('ArticleShareDialogComponent', () => {
  /**
   * Verifies: Share stays disabled until a team is chosen, then reports the teams, subject and message.
   * Interacts with: MatSelectHarness (multiple), crucible-dialog (real), editComplete output.
   * Data: email off; Red chosen.
   */
  it('shares with the chosen teams', async () => {
    const { fixture, completions } = await renderShare(false);
    expect(screen.getByRole('button', { name: 'Share' })).toBeDisabled();

    const select =
      await TestbedHarnessEnvironment.loader(fixture).getHarness(
        MatSelectHarness,
      );
    await select.clickOptions({ text: 'Red' });
    await select.close();
    fixture.detectChanges();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Share' }));

    expect(completions).toEqual([
      {
        saveChanges: true,
        shareDetails: expect.objectContaining({
          toTeamIdList: ['t2'],
          subject: 'Daily News: Outage',
        }),
      },
    ]);
  });

  /**
   * Verifies: the email subject field is shown only when email is active, prefilled with source and name.
   * Interacts with: data.isEmailActive.
   * Data: email on, then off.
   */
  it.each([
    [true, 1],
    [false, 0],
  ])('with email active %s shows %i subject fields', async (active, count) => {
    await renderShare(active);

    const subject = screen.queryAllByRole('textbox', { name: 'Email Subject' });
    expect(subject).toHaveLength(count);
    if (active) expect(subject[0]).toHaveValue('Daily News: Outage');
  });

  /**
   * Verifies: Cancel reports saveChanges false with empty details.
   * Interacts with: crucible-dialog Cancel, editComplete output; user-event.
   * Data: email off.
   */
  it('reports a cancel', async () => {
    const { completions } = await renderShare(false);

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Cancel' }));

    expect(completions).toEqual([{ saveChanges: false, shareDetails: {} }]);
  });
});
