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
import { ArticleDataService } from 'src/app/data/article/article-data.service';
import { Card } from 'src/app/data/card/card.store';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionMembershipDataService } from '../data/collection/collection-membership-data.service';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { ExhibitMembershipDataService } from '../data/exhibit/exhibit-membership-data.service';
import { GroupMembershipDataService } from '../data/group/group-membership.service';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamCardDataService } from 'src/app/data/team-card/team-card-data.service';
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
    private collectionDataService: CollectionDataService,
    private collectionMembershipDataService: CollectionMembershipDataService,
    private exhibitDataService: ExhibitDataService,
    private exhibitMembershipDataService: ExhibitMembershipDataService,
    private groupMembershipDataService: GroupMembershipDataService,
    private teamDataService: TeamDataService,
    private teamCardDataService: TeamCardDataService,
    private teamUserDataService: TeamUserDataService,
    private userDataService: UserDataService,
    private userArticleDataService: UserArticleDataService
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

  private addTeamHandlers() {
    this.hubConnection.on('TeamUpdated', (team: Team) => {
      this.teamDataService.updateStore(team);
    });

    this.hubConnection.on('TeamCreated', (team: Team) => {
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

  private addCardHandlers() {
    this.hubConnection.on('CardUpdated', (card: Card) => {
      this.cardDataService.updateStore(card);
    });

    this.hubConnection.on('CardCreated', (card: Card) => {
      this.cardDataService.updateStore(card);
    });

    this.hubConnection.on('CardDeleted', (id: string) => {
      this.cardDataService.deleteFromStore(id);
    });
  }

  private addTeamCardHandlers() {
    this.hubConnection.on('TeamCardUpdated', (teamCard: TeamCard) => {
      this.teamCardDataService.updateStore(teamCard);
    });

    this.hubConnection.on('TeamCardCreated', (teamCard: TeamCard) => {
      this.teamCardDataService.updateStore(teamCard);
    });

    this.hubConnection.on('TeamCardDeleted', (id: string) => {
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

  private addUserArticleHandlers() {
    this.hubConnection.on('UserArticleUpdated', (userArticle: UserArticle) => {
      this.userArticleDataService.setAsDates(userArticle);
      this.userArticleDataService.updateStore(userArticle);
    });

    this.hubConnection.on('UserArticleCreated', (userArticle: UserArticle) => {
      this.userArticleDataService.setAsDates(userArticle);
      this.userArticleDataService.updateStore(userArticle);
    });

    this.hubConnection.on('UserArticleDeleted', (id: string) => {
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
