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

import { Exhibit } from '../model/exhibit';
import { ProblemDetails } from '../model/problemDetails';

import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';


@Injectable({
  providedIn: 'root'
})
export class ExhibitService {

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
     * Creates a new Exhibit
     * Creates a new Exhibit with the attributes specified  &lt;para /&gt;  Accessible only to a ContentDeveloper or an Administrator
     * @param Exhibit The data used to create the Exhibit
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public createExhibit(Exhibit?: Exhibit, observe?: 'body', reportProgress?: boolean): Observable<Exhibit>;
  public createExhibit(Exhibit?: Exhibit, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Exhibit>>;
  public createExhibit(Exhibit?: Exhibit, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Exhibit>>;
  public createExhibit(Exhibit?: Exhibit, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

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

    return this.httpClient.post<Exhibit>(`${this.configuration.basePath}/api/exhibits`,
      Exhibit,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Deletes an Exhibit
     * Deletes an Exhibit with the specified id  &lt;para /&gt;  Accessible only to a ContentDeveloper or an Administrator
     * @param id The id of the Exhibit to delete
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public deleteExhibit(id: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
  public deleteExhibit(id: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
  public deleteExhibit(id: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
  public deleteExhibit(id: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling deleteExhibit.');
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

    return this.httpClient.delete<any>(`${this.configuration.basePath}/api/exhibits/${encodeURIComponent(String(id))}`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Gets Exhibits for a Collection
     * Returns a list of Exhibits based on the collection ID
     * @param collectionId The id of the Collection
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getCollectionExhibits(collectionId: string, observe?: 'body', reportProgress?: boolean): Observable<Array<Exhibit>>;
  public getCollectionExhibits(collectionId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<Exhibit>>>;
  public getCollectionExhibits(collectionId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<Exhibit>>>;
  public getCollectionExhibits(collectionId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (collectionId === null || collectionId === undefined) {
      throw new Error('Required parameter collectionId was null or undefined when calling getCollectionExhibits.');
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

    return this.httpClient.get<Array<Exhibit>>(`${this.configuration.basePath}/api/collections/${encodeURIComponent(String(collectionId))}/exhibits`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Gets a specific Exhibit by id
     * Returns the Exhibit with the id specified
     * @param id The id of the Exhibit
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getExhibit(id: string, observe?: 'body', reportProgress?: boolean): Observable<Exhibit>;
  public getExhibit(id: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Exhibit>>;
  public getExhibit(id: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Exhibit>>;
  public getExhibit(id: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling getExhibit.');
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

    return this.httpClient.get<Exhibit>(`${this.configuration.basePath}/api/exhibits/${encodeURIComponent(String(id))}`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Gets Exhibits
     * Returns a list of Exhibits.
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getExhibits(observe?: 'body', reportProgress?: boolean): Observable<Array<Exhibit>>;
  public getExhibits(observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<Exhibit>>>;
  public getExhibits(observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<Exhibit>>>;
  public getExhibits(observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

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

    return this.httpClient.get<Array<Exhibit>>(`${this.configuration.basePath}/api/exhibits`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Gets User&#39;s Exhibits for a Collection
     * Returns a list of Exhibits based on the user and collection ID
     * @param collectionId The id of the Collection
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getMyCollectionExhibits(collectionId: string, observe?: 'body', reportProgress?: boolean): Observable<Array<Exhibit>>;
  public getMyCollectionExhibits(collectionId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<Exhibit>>>;
  public getMyCollectionExhibits(collectionId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<Exhibit>>>;
  public getMyCollectionExhibits(collectionId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (collectionId === null || collectionId === undefined) {
      throw new Error('Required parameter collectionId was null or undefined when calling getMyCollectionExhibits.');
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

    return this.httpClient.get<Array<Exhibit>>(`${this.configuration.basePath}/api/collections/${encodeURIComponent(String(collectionId))}/my-exhibits`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Get User&#39;s Exhibits
     * Returns a list of Exhibits.
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getMyExhibits(observe?: 'body', reportProgress?: boolean): Observable<Array<Exhibit>>;
  public getMyExhibits(observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<Exhibit>>>;
  public getMyExhibits(observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<Exhibit>>>;
  public getMyExhibits(observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

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

    return this.httpClient.get<Array<Exhibit>>(`${this.configuration.basePath}/api/my-exhibits`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Updates an Exhibit&#39;s current move and inject
     * Updates an Exhibit with the move and inject numbers specified.
     * @param id The Id of the Exhibit to update
     * @param move The move value to set
     * @param inject The inject value to set
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public setExhibitMoveAndInject(id: string, move: number, inject: number, observe?: 'body', reportProgress?: boolean): Observable<Exhibit>;
  public setExhibitMoveAndInject(id: string, move: number, inject: number, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Exhibit>>;
  public setExhibitMoveAndInject(id: string, move: number, inject: number, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Exhibit>>;
  public setExhibitMoveAndInject(id: string, move: number, inject: number, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling setExhibitMoveAndInject.');
    }
    if (move === null || move === undefined) {
      throw new Error('Required parameter move was null or undefined when calling setExhibitMoveAndInject.');
    }
    if (inject === null || inject === undefined) {
      throw new Error('Required parameter inject was null or undefined when calling setExhibitMoveAndInject.');
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

    return this.httpClient.put<Exhibit>(`${this.configuration.basePath}/api/exhibits/${encodeURIComponent(String(id))}/move/${encodeURIComponent(String(move))}/inject/${encodeURIComponent(String(inject))}`,
      null,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Updates an Exhibit
     * Updates an Exhibit with the attributes specified.  The ID from the route MUST MATCH the ID contained in the exhibit parameter  &lt;para /&gt;  Accessible only to a ContentDeveloper or an Administrator
     * @param id The Id of the Exhibit to update
     * @param Exhibit The updated Exhibit values
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public updateExhibit(id: string, Exhibit?: Exhibit, observe?: 'body', reportProgress?: boolean): Observable<Exhibit>;
  public updateExhibit(id: string, Exhibit?: Exhibit, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Exhibit>>;
  public updateExhibit(id: string, Exhibit?: Exhibit, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Exhibit>>;
  public updateExhibit(id: string, Exhibit?: Exhibit, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling updateExhibit.');
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

    return this.httpClient.put<Exhibit>(`${this.configuration.basePath}/api/exhibits/${encodeURIComponent(String(id))}`,
      Exhibit,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

}
