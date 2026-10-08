// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { renderComponent } from 'src/app/test-utils/render-component';
import { bottomSheetRefStub } from 'src/app/test-utils/dialog-refs';
import { SystemMessageComponent } from './system-message.component';

async function renderMessage() {
  const sheet = bottomSheetRefStub<SystemMessageComponent>();
  await renderComponent(SystemMessageComponent, {
    imports: [MatButtonModule, MatIconModule],
    declarations: [SystemMessageComponent],
    providers: [
      { provide: MatBottomSheetRef, useValue: sheet.sheetRef },
      {
        provide: MAT_BOTTOM_SHEET_DATA,
        useValue: { title: 'Offline', message: 'The API is unreachable' },
      },
    ],
  });
  return sheet;
}

describe('SystemMessageComponent', () => {
  /**
   * Verifies: the sheet shows the title and message it was opened with.
   * Interacts with: MAT_BOTTOM_SHEET_DATA.
   * Data: title 'Offline', message 'The API is unreachable'.
   */
  it('shows the title and message', async () => {
    await renderMessage();

    expect(
      screen.getByRole('heading', { name: 'Offline' }),
    ).toBeInTheDocument();
    expect(screen.getByText('The API is unreachable')).toBeInTheDocument();
  });

  /**
   * Verifies: the close button dismisses the bottom sheet.
   * Interacts with: MatBottomSheetRef.dismiss stub; user-event.
   * Data: default message.
   */
  it('dismisses the sheet from the close button', async () => {
    const { dismiss } = await renderMessage();

    await userEvent.setup().click(screen.getByRole('button'));

    expect(dismiss).toHaveBeenCalledOnce();
  });
});
