/*
 Copyright 2023 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the
 project root for license information.
*/

/**
 * Gallery API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * OpenAPI spec version: v1
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */

import { Inject, Injectable, Optional }                      from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams,
  HttpResponse, HttpEvent }                           from '@angular/common/http';
import { CustomHttpUrlEncodingCodec }                        from '../encoder';

import { Observable }                                        from 'rxjs';

import { ProblemDetails } from '../model/problemDetails';
import { TeamCard } from '../model/teamCard';

import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';


@Injectable({
  providedIn: 'root'
})
export class TeamCardService {

  protected basePath = 'http://localhost';
  public defaultHeaders = new HttpHeaders();
  public configuration = new Configuration();

  constructor(protected httpClient: HttpClient, @Optional()@Inject(BASE_PATH) basePath: string, @Optional() configuration: Configuration) {

    if (configuration) {
      this.configuration = configuration;
      this.configuration.basePath = configuration.basePath || basePath || this.basePath;

    } else {
      this.configuration.basePath = basePath || this.basePath;
    }
  }

  /**
     * @param consumes string[] mime-types
     * @return true: consumes contains 'multipart/form-data', false: otherwise
     */
  private canConsumeForm(consumes: string[]): boolean {
    const form = 'multipart/form-data';
    for (const consume of consumes) {
      if (form === consume) {
        return true;
      }
    }
    return false;
  }


  /**
     * Creates a new TeamCard
     * Creates a new TeamCard with the attributes specified  &lt;para /&gt;  Accessible only to a SuperCard
     * @param TeamCard The data to create the TeamCard with
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public createTeamCard(TeamCard?: TeamCard, observe?: 'body', reportProgress?: boolean): Observable<TeamCard>;
  public createTeamCard(TeamCard?: TeamCard, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<TeamCard>>;
  public createTeamCard(TeamCard?: TeamCard, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<TeamCard>>;
  public createTeamCard(TeamCard?: TeamCard, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

    let headers = this.defaultHeaders;

    // authentication (oauth2) required
    if (this.configuration.accessToken) {
      const accessToken = typeof this.configuration.accessToken === 'function'
        ? this.configuration.accessToken()
        : this.configuration.accessToken;
      headers = headers.set('Authorization', 'Bearer ' + accessToken);
    }

    // to determine the Accept header
    const httpHeaderAccepts: string[] = [
      'text/plain',
      'application/json',
      'text/json'
    ];
    const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }

    // to determine the Content-Type header
    const consumes: string[] = [
      'application/json',
      'text/json',
      'application/_*+json'
    ];
    const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
    if (httpContentTypeSelected !== undefined) {
      headers = headers.set('Content-Type', httpContentTypeSelected);
    }

    return this.httpClient.post<TeamCard>(`${this.configuration.basePath}/api/teamcards`,
      TeamCard,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Deletes a TeamCard
     * Deletes a TeamCard with the specified id  &lt;para /&gt;  Accessible only to a SuperCard
     * @param id The id of the TeamCard to delete
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public deleteTeamCard(id: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
  public deleteTeamCard(id: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
  public deleteTeamCard(id: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
  public deleteTeamCard(id: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling deleteTeamCard.');
    }

    let headers = this.defaultHeaders;

    // authentication (oauth2) required
    if (this.configuration.accessToken) {
      const accessToken = typeof this.configuration.accessToken === 'function'
        ? this.configuration.accessToken()
        : this.configuration.accessToken;
      headers = headers.set('Authorization', 'Bearer ' + accessToken);
    }

    // to determine the Accept header
    const httpHeaderAccepts: string[] = [
      'application/json'
    ];
    const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }

    // to determine the Content-Type header
    const consumes: string[] = [
    ];

    return this.httpClient.delete<any>(`${this.configuration.basePath}/api/teamcards/${encodeURIComponent(String(id))}`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Deletes a TeamCard by card ID and team ID
     * Deletes a TeamCard with the specified card ID and team ID  &lt;para /&gt;  Accessible only to a SuperCard
     * @param teamId ID of a team.
     * @param cardId ID of a card.
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public deleteTeamCardByIds(teamId: string, cardId: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
  public deleteTeamCardByIds(teamId: string, cardId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
  public deleteTeamCardByIds(teamId: string, cardId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
  public deleteTeamCardByIds(teamId: string, cardId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (teamId === null || teamId === undefined) {
      throw new Error('Required parameter teamId was null or undefined when calling deleteTeamCardByIds.');
    }
    if (cardId === null || cardId === undefined) {
      throw new Error('Required parameter cardId was null or undefined when calling deleteTeamCardByIds.');
    }

    let headers = this.defaultHeaders;

    // authentication (oauth2) required
    if (this.configuration.accessToken) {
      const accessToken = typeof this.configuration.accessToken === 'function'
        ? this.configuration.accessToken()
        : this.configuration.accessToken;
      headers = headers.set('Authorization', 'Bearer ' + accessToken);
    }

    // to determine the Accept header
    const httpHeaderAccepts: string[] = [
      'application/json'
    ];
    const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }

    // to determine the Content-Type header
    const consumes: string[] = [
    ];

    return this.httpClient.delete<any>(`${this.configuration.basePath}/api/teams/${encodeURIComponent(String(teamId))}/cards/${encodeURIComponent(String(cardId))}`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Gets all TeamCards for a card
     * Returns a list of all of the TeamCards for the card.
     * @param cardId The id of the TeamCard
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getCardTeamCards(cardId: string, observe?: 'body', reportProgress?: boolean): Observable<Array<TeamCard>>;
  public getCardTeamCards(cardId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<TeamCard>>>;
  public getCardTeamCards(cardId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<TeamCard>>>;
  public getCardTeamCards(cardId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (cardId === null || cardId === undefined) {
      throw new Error('Required parameter cardId was null or undefined when calling getCardTeamCards.');
    }

    let headers = this.defaultHeaders;

    // authentication (oauth2) required
    if (this.configuration.accessToken) {
      const accessToken = typeof this.configuration.accessToken === 'function'
        ? this.configuration.accessToken()
        : this.configuration.accessToken;
      headers = headers.set('Authorization', 'Bearer ' + accessToken);
    }

    // to determine the Accept header
    const httpHeaderAccepts: string[] = [
      'text/plain',
      'application/json',
      'text/json'
    ];
    const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }

    // to determine the Content-Type header
    const consumes: string[] = [
    ];

    return this.httpClient.get<Array<TeamCard>>(`${this.configuration.basePath}/api/cards/${encodeURIComponent(String(cardId))}/teamcards`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Gets all TeamCards for an exhibit
     * Returns a list of all of the TeamCards for the exhibit.
     * @param exhibitId The id of the Exhibit
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getExhibitTeamCards(exhibitId: string, observe?: 'body', reportProgress?: boolean): Observable<Array<TeamCard>>;
  public getExhibitTeamCards(exhibitId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<TeamCard>>>;
  public getExhibitTeamCards(exhibitId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<TeamCard>>>;
  public getExhibitTeamCards(exhibitId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (exhibitId === null || exhibitId === undefined) {
      throw new Error('Required parameter exhibitId was null or undefined when calling getExhibitTeamCards.');
    }

    let headers = this.defaultHeaders;

    // authentication (oauth2) required
    if (this.configuration.accessToken) {
      const accessToken = typeof this.configuration.accessToken === 'function'
        ? this.configuration.accessToken()
        : this.configuration.accessToken;
      headers = headers.set('Authorization', 'Bearer ' + accessToken);
    }

    // to determine the Accept header
    const httpHeaderAccepts: string[] = [
      'text/plain',
      'application/json',
      'text/json'
    ];
    const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }

    // to determine the Content-Type header
    const consumes: string[] = [
    ];

    return this.httpClient.get<Array<TeamCard>>(`${this.configuration.basePath}/api/exhibits/${encodeURIComponent(String(exhibitId))}/teamcards`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

    /**
     * Gets all TeamCards for an exhibit for the team
     * Returns a list of all of the TeamCards for the exhibit for the team.
     * @param exhibitId The id of the Exhibit
     * @param teamId The id of the Team
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public GetByExhibitTeam(exhibitId: string, teamId: string, observe?: 'body', reportProgress?: boolean): Observable<Array<TeamCard>>;
    public GetByExhibitTeam(exhibitId: string, teamId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<TeamCard>>>;
    public GetByExhibitTeam(exhibitId: string, teamId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<TeamCard>>>;
    public GetByExhibitTeam(exhibitId: string, teamId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (exhibitId === null || exhibitId === undefined) {
            throw new Error('Required parameter exhibitId was null or undefined when calling getByExhibitTeam.');
        }

        if (teamId === null || teamId === undefined) {
          throw new Error('Required parameter teamId was null or undefined when calling getByExhibitTeam.');
      }

      let headers = this.defaultHeaders;

    // authentication (oauth2) required
    if (this.configuration.accessToken) {
      const accessToken = typeof this.configuration.accessToken === 'function'
        ? this.configuration.accessToken()
        : this.configuration.accessToken;
      headers = headers.set('Authorization', 'Bearer ' + accessToken);
    }

    // to determine the Accept header
    const httpHeaderAccepts: string[] = [
      'text/plain',
      'application/json',
      'text/json'
    ];
    const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }

    // to determine the Content-Type header
    const consumes: string[] = [
    ];

        return this.httpClient.get<Array<TeamCard>>(`${this.configuration.basePath}/api/exhibits/${encodeURIComponent(String(exhibitId))}/teams/${encodeURIComponent(String(teamId))}/teamcards`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

  /**
     * Gets a specific TeamCard by id
     * Returns the TeamCard with the id specified  &lt;para /&gt;  Only accessible to a SuperCard
     * @param id The id of the TeamCard
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getTeamCard(id: string, observe?: 'body', reportProgress?: boolean): Observable<TeamCard>;
  public getTeamCard(id: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<TeamCard>>;
  public getTeamCard(id: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<TeamCard>>;
  public getTeamCard(id: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling getTeamCard.');
    }

    let headers = this.defaultHeaders;

    // authentication (oauth2) required
    if (this.configuration.accessToken) {
      const accessToken = typeof this.configuration.accessToken === 'function'
        ? this.configuration.accessToken()
        : this.configuration.accessToken;
      headers = headers.set('Authorization', 'Bearer ' + accessToken);
    }

    // to determine the Accept header
    const httpHeaderAccepts: string[] = [
      'text/plain',
      'application/json',
      'text/json'
    ];
    const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }

    // to determine the Content-Type header
    const consumes: string[] = [
    ];

    return this.httpClient.get<TeamCard>(`${this.configuration.basePath}/api/teamcards/${encodeURIComponent(String(id))}`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Gets all TeamCards in the system
     * Returns a list of all of the TeamCards in the system.  &lt;para /&gt;  Only accessible to a SuperCard
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getTeamCards(observe?: 'body', reportProgress?: boolean): Observable<Array<TeamCard>>;
  public getTeamCards(observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<TeamCard>>>;
  public getTeamCards(observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<TeamCard>>>;
  public getTeamCards(observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

    let headers = this.defaultHeaders;

    // authentication (oauth2) required
    if (this.configuration.accessToken) {
      const accessToken = typeof this.configuration.accessToken === 'function'
        ? this.configuration.accessToken()
        : this.configuration.accessToken;
      headers = headers.set('Authorization', 'Bearer ' + accessToken);
    }

    // to determine the Accept header
    const httpHeaderAccepts: string[] = [
      'text/plain',
      'application/json',
      'text/json'
    ];
    const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }

    // to determine the Content-Type header
    const consumes: string[] = [
    ];

    return this.httpClient.get<Array<TeamCard>>(`${this.configuration.basePath}/api/teamcards`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Updates an TeamCard
     * Updates a TeamCard with the attributes specified.  The ID from the route MUST MATCH the ID contained in the teamCard parameter  &lt;para /&gt;  Accessible only to a ContentDeveloper or an Administrator
     * @param id The Id of the TeamCard to update
     * @param TeamCard The updated TeamCard values
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public updateTeamCard(id: string, TeamCard?: TeamCard, observe?: 'body', reportProgress?: boolean): Observable<TeamCard>;
  public updateTeamCard(id: string, TeamCard?: TeamCard, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<TeamCard>>;
  public updateTeamCard(id: string, TeamCard?: TeamCard, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<TeamCard>>;
  public updateTeamCard(id: string, TeamCard?: TeamCard, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling updateTeamCard.');
    }

    let headers = this.defaultHeaders;

    // authentication (oauth2) required
    if (this.configuration.accessToken) {
      const accessToken = typeof this.configuration.accessToken === 'function'
        ? this.configuration.accessToken()
        : this.configuration.accessToken;
      headers = headers.set('Authorization', 'Bearer ' + accessToken);
    }

    // to determine the Accept header
    const httpHeaderAccepts: string[] = [
      'text/plain',
      'application/json',
      'text/json'
    ];
    const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }

    // to determine the Content-Type header
    const consumes: string[] = [
      'application/json',
      'text/json',
      'application/_*+json'
    ];
    const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
    if (httpContentTypeSelected !== undefined) {
      headers = headers.set('Content-Type', httpContentTypeSelected);
    }

    return this.httpClient.put<TeamCard>(`${this.configuration.basePath}/api/teamcards/${encodeURIComponent(String(id))}`,
      TeamCard,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

}
