// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable, OnDestroy } from '@angular/core';
import { ComnAuthService, ComnSettingsService } from '@cmusei/crucible-common';
import * as signalR from '@microsoft/signalr';
import {
  Article,
  Collection,
  CollectionMembership,
  GroupMembership,
  Exhibit,
  ExhibitMembership,
  Team,
  TeamCard,
  TeamUser,
  User,
  UserArticle
} from 'src/app/generated/api';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { UserArticleDataService } from '../data/user-article/user-article-data.service';
import { UserArticleQuery } from 'src/app/data/user-article/user-article.query';
import { ArticleDataService } from 'src/app/data/article/article-data.service';
import { Card } from 'src/app/data/card/card.store';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { CardQuery } from 'src/app/data/card/card.query';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionMembershipDataService } from '../data/collection/collection-membership-data.service';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { ExhibitMembershipDataService } from '../data/exhibit/exhibit-membership-data.service';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { GroupMembershipDataService } from '../data/group/group-membership.service';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamQuery } from 'src/app/data/team/team.query';
import { TeamCardDataService } from 'src/app/data/team-card/team-card-data.service';
import { TeamCardQuery } from 'src/app/data/team-card/team-card.query';
import { TeamUserDataService } from '../data/team-user/team-user-data.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export enum ApplicationArea {
  home = '',
  admin = 'Admin'
}
@Injectable({
  providedIn: 'root',
})
export class SignalRService implements OnDestroy {
  private hubConnection: signalR.HubConnection;
  private applicationArea: ApplicationArea;
  private connectionPromise: Promise<void>;
  private isJoined = false;
  private teamId = '';
  private token = '';
  private unsubscribe$ = new Subject();

  constructor(
    private authService: ComnAuthService,
    private settingsService: ComnSettingsService,
    private articleDataService: ArticleDataService,
    private cardDataService: CardDataService,
    private cardQuery: CardQuery,
    private collectionDataService: CollectionDataService,
    private collectionMembershipDataService: CollectionMembershipDataService,
    private exhibitDataService: ExhibitDataService,
    private exhibitMembershipDataService: ExhibitMembershipDataService,
    private exhibitQuery: ExhibitQuery,
    private groupMembershipDataService: GroupMembershipDataService,
    private teamDataService: TeamDataService,
    private teamQuery: TeamQuery,
    private teamCardDataService: TeamCardDataService,
    private teamCardQuery: TeamCardQuery,
    private teamUserDataService: TeamUserDataService,
    private userDataService: UserDataService,
    private userArticleDataService: UserArticleDataService,
    private userArticleQuery: UserArticleQuery
  ) {
    this.authService.user$.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.reconnect();
    });
  }

  public startConnection(applicationArea: ApplicationArea): Promise<void> {
    if (this.connectionPromise && this.applicationArea === applicationArea) {
      return this.connectionPromise;
    }

    this.applicationArea = applicationArea;
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.getHubUrlWithAuth())
      .withStatefulReconnect()
      .withAutomaticReconnect(new RetryPolicy(120, 0, 5))
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection.onreconnected(() => {
      this.join();
    });

    this.addHandlers();
    this.connectionPromise = this.hubConnection.start();
    this.connectionPromise.then(() => this.join());

    return this.connectionPromise;
  }

  private getHubUrlWithAuth(): string {
    const accessToken = this.authService.getAuthorizationToken();
    if (accessToken !== this.token) {
      this.token = accessToken;
      if (!this.token) {
        location.reload();
      }
    }
    const hubUrl = `${this.settingsService.settings.ApiUrl}/hubs/main?bearer=${accessToken}`;
    return hubUrl;
  }

  private reconnect() {
    if (this.hubConnection != null) {
      this.hubConnection.stop().then(() => {
        this.hubConnection.baseUrl = this.getHubUrlWithAuth();
        this.connectionPromise = this.hubConnection.start();
        this.connectionPromise.then(() => {
          if (this.hubConnection.state !== signalR.HubConnectionState.Connected) {
            setTimeout(() => this.reconnect(), 500);
          } else {
            this.join();
          }
        });
      });
    }
  }

  public join() {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('Join' + this.applicationArea).then(() => {
        this.isJoined = true;
        // on a reconnect, add back team subscriptions
        if (this.teamId && this.applicationArea !== ApplicationArea.admin) {
          this.hubConnection.invoke('switchTeam', [this.teamId, this.teamId]);
        }
      });
    }
  }

  public leave() {
    if (this.isJoined) {
      this.hubConnection.invoke('Leave' + this.applicationArea);
    }
    this.isJoined = false;
  }

  public switchTeam(oldTeamId: string, newTeamId: string) {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('switchTeam', [oldTeamId, newTeamId]);
    }
    this.teamId = newTeamId;
  }

  private addHandlers() {
    this.addArticleHandlers();
    this.addCardHandlers();
    this.addCollectionHandlers();
    this.addCollectionMembershipHandlers();
    this.addExhibitHandlers();
    this.addExhibitMembershipHandlers();
    this.addGroupMembershipHandlers();
    this.addTeamCardHandlers();
    this.addTeamHandlers();
    this.addTeamUserHandlers();
    this.addUserHandlers();
    this.addUserArticleHandlers();
  }

  private addUserHandlers() {
    this.hubConnection.on('UserUpdated', (user: User) => {
      this.userDataService.updateStore(user);
    });

    this.hubConnection.on('UserCreated', (user: User) => {
      this.userDataService.updateStore(user);
    });

    this.hubConnection.on('UserDeleted', (id: string) => {
      this.userDataService.deleteFromStore(id);
    });
  }

  // A Team carries exhibitId, so keep foreign teams out of the store that
  // isTeamCardInActiveExhibit resolves against. Accept when the exhibitId is
  // absent, so a team that predates the field is never dropped.
  private isTeamInActiveExhibit(team: Team): boolean {
    if (!this.isScopedToActiveExhibit() || !team.exhibitId) {
      return true;
    }
    return team.exhibitId === this.exhibitQuery.getActiveId();
  }

  private addTeamHandlers() {
    this.hubConnection.on('TeamUpdated', (team: Team) => {
      if (!this.isTeamInActiveExhibit(team)) {
        return;
      }
      this.teamDataService.updateStore(team);
    });

    this.hubConnection.on('TeamCreated', (team: Team) => {
      if (!this.isTeamInActiveExhibit(team)) {
        return;
      }
      this.teamDataService.updateStore(team);
    });

    this.hubConnection.on('TeamDeleted', (id: string) => {
      this.teamDataService.deleteFromStore(id);
    });
  }

  private addTeamUserHandlers() {
    this.hubConnection.on('TeamUserUpdated', (teamUser: TeamUser) => {
      this.teamUserDataService.updateStore(teamUser);
    });

    this.hubConnection.on('TeamUserCreated', (teamUser: TeamUser) => {
      this.teamUserDataService.updateStore(teamUser);
    });

    this.hubConnection.on('TeamUserDeleted', (id: string) => {
      this.teamUserDataService.deleteFromStore(id);
    });
  }

  // The hub addresses Card/TeamCard/UserArticle events to the recipient's *user*
  // group, so a user who belongs to teams in several exhibits receives events for
  // all of them. The Wall/Archive stores are flat and id-keyed, so an event from
  // another exhibit would otherwise be upserted into the exhibit currently open.
  // The admin area deliberately works across exhibits (it loads cards by
  // collection), so these filters only apply outside it.
  private isScopedToActiveExhibit(): boolean {
    return (
      this.applicationArea !== ApplicationArea.admin &&
      !!this.exhibitQuery.getActiveId()
    );
  }

  // A Card carries only collectionId, so it cannot be tied to a single exhibit.
  // Scope it by the active exhibit's collection instead. This is looser than the
  // Wall/Archive load, which goes through CardService.GetByExhibitTeamAsync and
  // filters tc.Card.CollectionId == exhibit.CollectionId && tc.TeamId == teamId,
  // but a card outside the collection can never belong in these stores, and one
  // inside it with no matching TeamCard is already invisible to both
  // wall.setShownCardList() and archive.setCardLists().
  private isCardInActiveExhibit(card: Card): boolean {
    if (!this.isScopedToActiveExhibit()) {
      return true;
    }
    const activeExhibit = this.exhibitQuery.getActive() as Exhibit;
    return !activeExhibit || card.collectionId === activeExhibit.collectionId;
  }

  // A TeamCard carries only teamId, but a Team carries exhibitId, so resolve the
  // team and compare that. Bare store membership is not safe on its own: the team
  // store is shared with the admin Exhibits view (loadByExhibitId) and is never
  // cleared on exhibit exit, so between setActive(B) and loadMine(B) resolving it
  // can still hold exhibit A's teams. When the team cannot be resolved, defer to
  // TeamDataService.loadedExhibitId, which records which exhibit the store's
  // contents were actually loaded for, rather than inferring it from them.
  private isTeamCardInActiveExhibit(teamCard: TeamCard): boolean {
    if (!this.isScopedToActiveExhibit()) {
      return true;
    }
    const activeExhibitId = this.exhibitQuery.getActiveId();
    const team = this.teamQuery.getEntity(teamCard.teamId);
    if (team && team.exhibitId) {
      // Authoritative: the team itself says which exhibit it belongs to.
      return team.exhibitId === activeExhibitId;
    }
    // The team is unknown, or predates exhibitId. Absence only means "foreign" if
    // the store's contents are known to be exactly the active exhibit's teams,
    // which is what loadedExhibitId records. Any other value - a different
    // exhibit, or null while a load is in flight, failed or never ran - means the
    // store cannot answer, so accept rather than drop a legitimate event.
    return this.teamDataService.loadedExhibitId !== activeExhibitId;
  }

  private addCardHandlers() {
    this.hubConnection.on('CardUpdated', (card: Card) => {
      if (!this.isCardInActiveExhibit(card)) {
        return;
      }
      this.cardDataService.updateStore(card);
    });

    this.hubConnection.on('CardCreated', (card: Card) => {
      if (!this.isCardInActiveExhibit(card)) {
        return;
      }
      this.cardDataService.updateStore(card);
    });

    // A delete carries only an id. Removing an id the store never held is
    // already a no-op, but Akita still emits a new state and every Wall/Archive
    // subscriber recomputes, so skip it.
    this.hubConnection.on('CardDeleted', (id: string) => {
      if (!this.cardQuery.hasEntity(id)) {
        return;
      }
      this.cardDataService.deleteFromStore(id);
    });
  }

  private addTeamCardHandlers() {
    this.hubConnection.on('TeamCardUpdated', (teamCard: TeamCard) => {
      if (!this.isTeamCardInActiveExhibit(teamCard)) {
        return;
      }
      this.teamCardDataService.updateStore(teamCard);
    });

    this.hubConnection.on('TeamCardCreated', (teamCard: TeamCard) => {
      if (!this.isTeamCardInActiveExhibit(teamCard)) {
        return;
      }
      this.teamCardDataService.updateStore(teamCard);
    });

    this.hubConnection.on('TeamCardDeleted', (id: string) => {
      if (!this.teamCardQuery.hasEntity(id)) {
        return;
      }
      this.teamCardDataService.deleteFromStore(id);
    });
  }

  private addArticleHandlers() {
    this.hubConnection.on('ArticleUpdated', (article: Article) => {
      this.articleDataService.setAsDates(article);
      this.articleDataService.updateStore(article);
    });

    this.hubConnection.on('ArticleCreated', (article: Article) => {
      this.articleDataService.setAsDates(article);
      this.articleDataService.updateStore(article);
    });

    this.hubConnection.on('ArticleDeleted', (id: string) => {
      this.articleDataService.deleteFromStore(id);
    });
  }

  private addCollectionHandlers() {
    this.hubConnection.on('CollectionUpdated', (collection: Collection) => {
      this.collectionDataService.updateStore(collection);
    });

    this.hubConnection.on('CollectionCreated', (collection: Collection) => {
      this.collectionDataService.updateStore(collection);
    });

    this.hubConnection.on('CollectionDeleted', (id: string) => {
      this.collectionDataService.deleteFromStore(id);
    });
  }

  private addExhibitHandlers() {
    this.hubConnection.on('ExhibitUpdated', (exhibit: Exhibit) => {
      this.exhibitDataService.setAsDates(exhibit);
      this.exhibitDataService.updateStore(exhibit);
    });

    this.hubConnection.on('ExhibitCreated', (exhibit: Exhibit) => {
      this.exhibitDataService.setAsDates(exhibit);
      this.exhibitDataService.updateStore(exhibit);
    });

    this.hubConnection.on('ExhibitDeleted', (id: string) => {
      this.exhibitDataService.deleteFromStore(id);
    });
  }

  // A UserArticle carries its own exhibitId, so it can be scoped directly.
  private isUserArticleInActiveExhibit(userArticle: UserArticle): boolean {
    if (!this.isScopedToActiveExhibit()) {
      return true;
    }
    return userArticle.exhibitId === this.exhibitQuery.getActiveId();
  }

  private addUserArticleHandlers() {
    this.hubConnection.on('UserArticleUpdated', (userArticle: UserArticle) => {
      if (!this.isUserArticleInActiveExhibit(userArticle)) {
        return;
      }
      this.userArticleDataService.setAsDates(userArticle);
      this.userArticleDataService.updateStore(userArticle);
    });

    this.hubConnection.on('UserArticleCreated', (userArticle: UserArticle) => {
      if (!this.isUserArticleInActiveExhibit(userArticle)) {
        return;
      }
      this.userArticleDataService.setAsDates(userArticle);
      this.userArticleDataService.updateStore(userArticle);
    });

    this.hubConnection.on('UserArticleDeleted', (id: string) => {
      if (!this.userArticleQuery.hasEntity(id)) {
        return;
      }
      this.userArticleDataService.deleteFromStore(id);
    });
  }

  private addCollectionMembershipHandlers() {
    this.hubConnection.on(
      'CollectionMembershipCreated',
      (collectionMembership: CollectionMembership) => {
        this.collectionMembershipDataService.updateStore(collectionMembership);
      }
    );

    this.hubConnection.on(
      'CollectionMembershipUpdated',
      (collectionMembership: CollectionMembership) => {
        this.collectionMembershipDataService.updateStore(collectionMembership);
      }
    );

    this.hubConnection.on('CollectionMembershipDeleted', (id: string) => {
      this.collectionMembershipDataService.deleteFromStore(id);
    });
  }

  private addExhibitMembershipHandlers() {
    this.hubConnection.on(
      'ExhibitMembershipCreated',
      (exhibitMembership: ExhibitMembership) => {
        this.exhibitMembershipDataService.updateStore(exhibitMembership);
      }
    );

    this.hubConnection.on(
      'ExhibitMembershipUpdated',
      (exhibitMembership: ExhibitMembership) => {
        this.exhibitMembershipDataService.updateStore(exhibitMembership);
      }
    );

    this.hubConnection.on('ExhibitMembershipDeleted', (id: string) => {
      this.exhibitMembershipDataService.deleteFromStore(id);
    });
  }

  private addGroupMembershipHandlers() {
    this.hubConnection.on(
      'GroupMembershipCreated',
      (groupMembership: GroupMembership) => {
        this.groupMembershipDataService.updateStore(groupMembership);
      }
    );

    this.hubConnection.on(
      'GroupMembershipUpdated',
      (groupMembership: GroupMembership) => {
        this.groupMembershipDataService.updateStore(groupMembership);
      }
    );

    this.hubConnection.on('GroupMembershipDeleted', (id: string) => {
      this.groupMembershipDataService.deleteFromStore(id);
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}

class RetryPolicy {
  constructor(
    private maxSeconds: number,
    private minJitterSeconds: number,
    private maxJitterSeconds: number
  ) {}

  nextRetryDelayInMilliseconds(
    retryContext: signalR.RetryContext
  ): number | null {
    let nextRetrySeconds = Math.pow(2, retryContext.previousRetryCount + 1);

    if (retryContext.elapsedMilliseconds / 1000 > this.maxSeconds) {
      location.reload();
    }

    nextRetrySeconds +=
      Math.floor(
        Math.random() * (this.maxJitterSeconds - this.minJitterSeconds + 1)
      ) + this.minJitterSeconds; // Add Jitter

    return nextRetrySeconds * 1000;
  }
}
