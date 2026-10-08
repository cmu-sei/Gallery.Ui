// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CRUCIBLE_DIALOG_IMPORTS } from '@cmusei/crucible-common';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { Article, ItemStatus, SourceType } from 'src/app/generated/api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { ArticleEditDialogComponent } from './article-edit-dialog.component';

const ARTICLE: Article = {
  id: 'a1',
  name: 'Outage',
  summary: 'Power is out',
  description: '<p>Downtown grid failure.</p>',
  status: ItemStatus.Critical,
  sourceType: SourceType.News,
  sourceName: 'Daily News',
  move: 1,
  inject: 2,
  datePosted: new Date('2026-01-02T10:00:00Z'),
  cardId: 'k1',
};

async function renderArticleDialog(article: Article) {
  const ref = dialogRefStub<ArticleEditDialogComponent>();
  const rendered = await renderComponent(ArticleEditDialogComponent, {
    imports: [
      ...CRUCIBLE_DIALOG_IMPORTS,
      AngularEditorModule,
      MatCheckboxModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatTooltipModule,
    ],
    declarations: [ArticleEditDialogComponent],
    providers: [
      // angular-editor injects HttpClient for image uploads; nothing is sent.
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MatDialogRef, useValue: ref.dialogRef },
      {
        provide: MAT_DIALOG_DATA,
        useValue: { article, cardList: [{ id: 'k1', name: 'Power' }] },
      },
    ],
  });
  const completions: unknown[] = [];
  rendered.fixture.componentInstance.editComplete.subscribe((e) =>
    completions.push(e),
  );
  return { ...rendered, completions };
}

// The angular-editor toolbar puts dozens of buttons and selects in the
// dialog, which makes unscoped role queries slow under coverage (README,
// "Testing Library with Material in jsdom"); scope them to the dialog actions
// and use label queries for the fields.
function actions() {
  return within(document.querySelector('mat-dialog-actions') as HTMLElement);
}

describe('ArticleEditDialogComponent', () => {
  /**
   * Verifies: an existing article opens as "Edit Article for Selected Teams" with its fields filled, and Save reports the trimmed edits.
   * Interacts with: crucible-dialog (real), angular-editor, editComplete output; user-event.
   * Data: article a1, '2 ' typed after its name (the trailing space is trimmed).
   */
  it('saves the edited article', async () => {
    const { completions } = await renderArticleDialog(structuredClone(ARTICLE));
    const user = userEvent.setup();

    expect(
      screen.getByText('Edit Article for Selected Teams', { selector: 'h2' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Summary')).toHaveValue('Power is out');
    const name = screen.getByLabelText('Name');
    // Focus instead of a click: user-event's pointer check walks the computed
    // style of every ancestor, which is slow in this large dialog.
    name.focus();
    await user.type(name, '2 ', { skipClick: true });
    await user.click(actions().getByRole('button', { name: 'Save' }));

    expect(completions).toEqual([
      {
        saveChanges: true,
        article: expect.objectContaining({
          id: 'a1',
          cardId: 'k1',
          name: 'Outage2',
          summary: 'Power is out',
          openInNewTab: false,
        }),
      },
    ]);
  });

  /**
   * Verifies: a new article opens as "Add Article for Selected Teams" with Save disabled; only the description error shows before the user edits.
   * Interacts with: the required validators, UserErrorStateMatcher, mat-error.
   * Data: an empty article.
   */
  it('opens a new article with Save disabled', async () => {
    const { container } = await renderArticleDialog({});

    expect(
      screen.getByText('Add Article for Selected Teams', { selector: 'h2' }),
    ).toBeInTheDocument();
    expect(
      Array.from(container.querySelectorAll('mat-error')).map((e) =>
        e.textContent?.trim(),
      ),
    ).toEqual(['Description is required']);
    expect(actions().getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  /**
   * Verifies: Save stays disabled while the article has no card, even after an edit.
   * Interacts with: errorFree (requires a card), crucible-dialog submitDisabled.
   * Data: article a1 without a card, name edited.
   */
  it('keeps Save disabled without a card', async () => {
    await renderArticleDialog({
      ...structuredClone(ARTICLE),
      cardId: undefined,
    });
    const user = userEvent.setup();

    const name = screen.getByLabelText('Name');
    name.focus();
    await user.type(name, '!', { skipClick: true });

    expect(actions().getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  /**
   * Verifies: Cancel reports saveChanges false with no article.
   * Interacts with: crucible-dialog Cancel, editComplete output.
   * Data: article a1.
   */
  it('reports a cancel', async () => {
    const { completions } = await renderArticleDialog(structuredClone(ARTICLE));

    await userEvent
      .setup()
      .click(actions().getByRole('button', { name: 'Cancel' }));

    expect(completions).toEqual([{ saveChanges: false, article: null }]);
  });
});
