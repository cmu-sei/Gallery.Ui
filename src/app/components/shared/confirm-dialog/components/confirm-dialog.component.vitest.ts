// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { renderComponent } from 'src/app/test-utils/render-component';

async function renderConfirmDialog(overrides: {
  title?: string;
  message?: string;
  buttonTrueText?: string;
  buttonFalseText?: string;
} = {}) {
  const {
    title = 'Confirm Action',
    message = 'Are you sure?',
    buttonTrueText,
    buttonFalseText,
  } = overrides;

  const dialogData: any = {};
  if (buttonTrueText !== undefined) dialogData.buttonTrueText = buttonTrueText;
  if (buttonFalseText !== undefined) dialogData.buttonFalseText = buttonFalseText;

  const closeSpy = vi.fn();

  const result = await renderComponent(ConfirmDialogComponent, {
    declarations: [ConfirmDialogComponent],
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: dialogData },
      { provide: MatDialogRef, useValue: { close: closeSpy, disableClose: false } },
    ],
    componentProperties: {
      title,
      message,
    },
  });

  return { ...result, closeSpy };
}

describe('ConfirmDialogComponent', () => {
  it('should create', async () => {
    const { fixture } = await renderConfirmDialog();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display dialog title', async () => {
    await renderConfirmDialog({ title: 'Delete Item' });
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
  });

  it('should display dialog message', async () => {
    await renderConfirmDialog({ message: 'This cannot be undone.' });
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  it('should display confirm button text from data', async () => {
    await renderConfirmDialog({ buttonTrueText: 'Delete' });
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should display cancel button text from data', async () => {
    await renderConfirmDialog({ buttonFalseText: 'Cancel' });
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should use default button texts when not provided', async () => {
    await renderConfirmDialog();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('should close dialog with confirm=true when confirm clicked', async () => {
    const user = userEvent.setup();
    const { closeSpy } = await renderConfirmDialog();
    await user.click(screen.getByText('Yes'));
    expect(closeSpy).toHaveBeenCalledTimes(1);
    const callArg = closeSpy.mock.calls[0][0];
    expect(callArg.confirm).toBe(true);
    expect(callArg.wasCancelled).toBe(false);
  });

  it('should close dialog with wasCancelled=true when cancel clicked', async () => {
    const user = userEvent.setup();
    const { closeSpy } = await renderConfirmDialog();
    await user.click(screen.getByText('No'));
    expect(closeSpy).toHaveBeenCalledTimes(1);
    const callArg = closeSpy.mock.calls[0][0];
    expect(callArg.wasCancelled).toBe(true);
  });
});
