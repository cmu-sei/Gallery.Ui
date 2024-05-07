/*
 Copyright 2024 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the
 project root for license information.
*/

import { Injectable } from '@angular/core';

export class UIState {
  selectedTheme = '';
  selectedCollection = '';
  selectedExhibit = '';
  expandedItems: string[] = [];
  exhibitSection: {[ key: string ]: string} = {};
  exhibitTeam: {[ key: string ]: string} = {};
}

@Injectable({
  providedIn: 'root',
})
export class UIDataService {
  private uiState = new UIState();

  constructor() {
    const savedState = JSON.parse(localStorage.getItem('uiState'));
    this.uiState = Object.assign(this.uiState, savedState);
  }

  //
  // Item Expansion
  isItemExpanded(id: string): boolean {
    return this.uiState.expandedItems.some(ei => ei === id);
  }

  setItemExpanded(id: string) {
    this.uiState.expandedItems.push(id);
    this.saveChanges();
  }

  setItemCollapsed(id: string) {
    const index = this.uiState.expandedItems.indexOf(id, 0);
    this.uiState.expandedItems.splice(index, 1);
    this.saveChanges();
  }
  // end item expansion

  //
  // Collection selection
  setCollection(collectionId: string) {
    collectionId = collectionId ? collectionId : 'blank';
    this.uiState.selectedCollection = collectionId;
    this.saveChanges();
  }

  getCollection(): string {
    return this.uiState.selectedCollection;
  }
  // end Exhibit selection

  //
  // Exhibit selection
  setExhibit(exhibitId: string) {
    exhibitId = exhibitId ? exhibitId : 'blank';
    this.uiState.selectedExhibit = exhibitId;
    this.saveChanges();
  }

  getExhibit(): string {
    return this.uiState.selectedExhibit;
  }
  // end Exhibit selection

  //
  // section selection
  setSection(exhibitId: string, section: string) {
    this.uiState.exhibitSection[exhibitId] = section;
    this.saveChanges();
  }

  getSection(exhibitId: string): string {
    return this.uiState.exhibitSection[exhibitId];
  }
  // end section selection

  //
  // Team selection
  setTeam(exhibitId: string, team: string) {
    this.uiState.exhibitTeam[exhibitId] = team;
    this.saveChanges();
  }

  getTeam(exhibitId: string): string {
    return this.uiState.exhibitTeam[exhibitId];
  }
  // end Team selection

  // end Exhibit selection

  //
  // theme section
  setTheme(theme: string) {
    this.uiState.selectedTheme = theme;
    this.saveChanges();
  }

  getTheme(): string {
    return this.uiState.selectedTheme;
  }
  // end theme

  saveChanges() {
    localStorage.setItem('uiState', JSON.stringify(this.uiState));
  }
}
