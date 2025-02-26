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
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent }                           from '@angular/common/http';
import { CustomHttpUrlEncodingCodec }                        from '../encoder';

import { Observable }                                        from 'rxjs';

import { ExhibitTeam } from '../model/exhibitTeam';
import { ProblemDetails } from '../model/problemDetails';

import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';


@Injectable({
  providedIn: 'root'
})
export class ExhibitTeamService {

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
     * Creates a new ExhibitTeam
     * Creates a new ExhibitTeam with the attributes specified  &lt;para /&gt;  Accessible only to a SuperTeam
     * @param ExhibitTeam The data to create the ExhibitTeam with
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public createExhibitTeam(ExhibitTeam?: ExhibitTeam, observe?: 'body', reportProgress?: boolean): Observable<ExhibitTeam>;
  public createExhibitTeam(ExhibitTeam?: ExhibitTeam, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<ExhibitTeam>>;
  public createExhibitTeam(ExhibitTeam?: ExhibitTeam, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<ExhibitTeam>>;
  public createExhibitTeam(ExhibitTeam?: ExhibitTeam, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

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

    return this.httpClient.post<ExhibitTeam>(`${this.configuration.basePath}/api/exhibitteams`,
      ExhibitTeam,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Deletes a ExhibitTeam
     * Deletes a ExhibitTeam with the specified id  &lt;para /&gt;  Accessible only to a SuperTeam
     * @param id The id of the ExhibitTeam to delete
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public deleteExhibitTeam(id: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
  public deleteExhibitTeam(id: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
  public deleteExhibitTeam(id: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
  public deleteExhibitTeam(id: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling deleteExhibitTeam.');
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

    return this.httpClient.delete<any>(`${this.configuration.basePath}/api/exhibitteams/${encodeURIComponent(String(id))}`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Deletes a ExhibitTeam by team ID and exhibit ID
     * Deletes a ExhibitTeam with the specified team ID and exhibit ID  &lt;para /&gt;  Accessible only to a SuperTeam
     * @param exhibitId ID of a exhibit.
     * @param teamId ID of a team.
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public deleteExhibitTeamByIds(exhibitId: string, teamId: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
  public deleteExhibitTeamByIds(exhibitId: string, teamId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
  public deleteExhibitTeamByIds(exhibitId: string, teamId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
  public deleteExhibitTeamByIds(exhibitId: string, teamId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (exhibitId === null || exhibitId === undefined) {
      throw new Error('Required parameter exhibitId was null or undefined when calling deleteExhibitTeamByIds.');
    }
    if (teamId === null || teamId === undefined) {
      throw new Error('Required parameter teamId was null or undefined when calling deleteExhibitTeamByIds.');
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

    return this.httpClient.delete<any>(`${this.configuration.basePath}/api/exhibits/${encodeURIComponent(String(exhibitId))}/teams/${encodeURIComponent(String(teamId))}`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Gets all ExhibitTeams for an exhibit
     * Returns a list of all of the ExhibitTeams for the exhibit.
     * @param exhibitId The id of the Exhibit
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getExhibitExhibitTeams(exhibitId: string, observe?: 'body', reportProgress?: boolean): Observable<Array<ExhibitTeam>>;
  public getExhibitExhibitTeams(exhibitId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<ExhibitTeam>>>;
  public getExhibitExhibitTeams(exhibitId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<ExhibitTeam>>>;
  public getExhibitExhibitTeams(exhibitId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (exhibitId === null || exhibitId === undefined) {
      throw new Error('Required parameter exhibitId was null or undefined when calling getExhibitExhibitTeams.');
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

    return this.httpClient.get<Array<ExhibitTeam>>(`${this.configuration.basePath}/api/exhibits/${encodeURIComponent(String(exhibitId))}/exhibitteams`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Gets a specific ExhibitTeam by id
     * Returns the ExhibitTeam with the id specified  &lt;para /&gt;  Only accessible to a SuperTeam
     * @param id The id of the ExhibitTeam
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getExhibitTeam(id: string, observe?: 'body', reportProgress?: boolean): Observable<ExhibitTeam>;
  public getExhibitTeam(id: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<ExhibitTeam>>;
  public getExhibitTeam(id: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<ExhibitTeam>>;
  public getExhibitTeam(id: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling getExhibitTeam.');
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

    return this.httpClient.get<ExhibitTeam>(`${this.configuration.basePath}/api/exhibitteams/${encodeURIComponent(String(id))}`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Gets all ExhibitTeams in the system
     * Returns a list of all of the ExhibitTeams in the system.  &lt;para /&gt;  Only accessible to a SuperTeam
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getExhibitTeams(observe?: 'body', reportProgress?: boolean): Observable<Array<ExhibitTeam>>;
  public getExhibitTeams(observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<ExhibitTeam>>>;
  public getExhibitTeams(observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<ExhibitTeam>>>;
  public getExhibitTeams(observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

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

    return this.httpClient.get<Array<ExhibitTeam>>(`${this.configuration.basePath}/api/exhibitteams`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

}
