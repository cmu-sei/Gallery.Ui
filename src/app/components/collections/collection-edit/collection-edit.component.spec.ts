// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { renderComponent } from 'src/app/test-utils/render-component';
import { CollectionEditComponent } from './collection-edit.component';

describe('CollectionEditComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers and renders its body for a collection.
   * Interacts with: getDefaultProviders (real CollectionQuery).
   * Data: collection c1.
   */
  it('renders with the default test providers', async () => {
    const { fixture, container } = await renderComponent(
      CollectionEditComponent,
      {
        declarations: [CollectionEditComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        componentInputs: { collection: { id: 'c1', name: 'Exercise' } },
      },
    );

    expect(fixture.componentInstance).toBeInstanceOf(CollectionEditComponent);
    expect(container.querySelector('app-tasks')).not.toBeNull();
  });

  /**
   * Verifies: returnToCollectionList emits editComplete.
   * Interacts with: editComplete output.
   * Data: no collection.
   */
  it('emits editComplete when returning to the list', async () => {
    const { fixture } = await renderComponent(CollectionEditComponent, {
      declarations: [CollectionEditComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    const emitted: boolean[] = [];
    fixture.componentInstance.editComplete.subscribe((v) => emitted.push(v));

    fixture.componentInstance.returnToCollectionList();

    expect(emitted).toEqual([true]);
  });
});
