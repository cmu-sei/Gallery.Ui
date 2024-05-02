// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable, OnDestroy } from '@angular/core';
import { ComnAuthService, ComnSettingsService } from '@cmusei/crucible-common';
import * as signalR from '@microsoft/signalr';
import { Article, Collection, Exhibit, Team, TeamCard, TeamUser, User, UserArticle } from 'src/app/generated/api';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { UserArticleDataService } from '../data/user-article/user-article-data.service';
import { ArticleDataService } from 'src/app/data/article/article-data.service';
import { Card } from 'src/app/data/card/card.store';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamCardDataService } from 'src/app/data/team-card/team-card-data.service';
import { TeamUserDataService } from '../data/team-user/team-user-data.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SignalRService implements OnDestroy {
  private hubConnection: signalR.HubConnection;
  private connectionPromise: Promise<void>;
  private token = '';
  private unsubscribe$ = new Subject();

  constructor(
    private authService: ComnAuthService,
    private settingsService: ComnSettingsService,
    private articleDataService: ArticleDataService,
    private cardDataService: CardDataService,
    private collectionDataService: CollectionDataService,
    private exhibitDataService: ExhibitDataService,
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

  public startConnection(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    const accessToken = this.authService.getAuthorizationToken();
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.getHubUrlWithAuth())
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
      this.hubConnection.invoke('Join');
    }
  }

  public leave() {
    this.hubConnection.invoke('Leave');
  }

  private addHandlers() {
    this.addArticleHandlers();
    this.addCardHandlers();
    this.addCollectionHandlers();
    this.addExhibitHandlers();
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
