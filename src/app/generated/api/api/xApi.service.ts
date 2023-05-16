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

import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';


@Injectable({
  providedIn: 'root'
})
export class XApiService {

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
     * Logs xAPI viewed statement for Article by id
     * Returns status
     * @param articleId The id of the Article
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public viewedArticle(articleId: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
  public viewedArticle(articleId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
  public viewedArticle(articleId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
  public viewedArticle(articleId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (articleId === null || articleId === undefined) {
      throw new Error('Required parameter articleId was null or undefined when calling viewedArticle.');
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

    return this.httpClient.get<any>(`${this.configuration.basePath}/api/xapi/viewed/article/${encodeURIComponent(String(articleId))}`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Logs xAPI viewed statement for Card by id
     * Returns status
     * @param exhibitId The id of the Exhibit
     * @param cardId The id of the Card
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public viewedCard(exhibitId: string, cardId: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
  public viewedCard(exhibitId: string, cardId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
  public viewedCard(exhibitId: string, cardId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
  public viewedCard(exhibitId: string, cardId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (exhibitId === null || exhibitId === undefined) {
      throw new Error('Required parameter exhibitId was null or undefined when calling viewedCard.');
    }
    if (cardId === null || cardId === undefined) {
      throw new Error('Required parameter cardId was null or undefined when calling viewedCard.');
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

    return this.httpClient.get<any>(`${this.configuration.basePath}/api/xapi/viewed/exhibit/${encodeURIComponent(String(exhibitId))}/card/${encodeURIComponent(String(cardId))}`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Logs xAPI viewed statement for Archive by Exhibit id
     * Returns status
     * @param id
     * @param exhibitId The id of the Exhibit
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public viewedExhibitArchive(id: string, exhibitId?: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
  public viewedExhibitArchive(id: string, exhibitId?: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
  public viewedExhibitArchive(id: string, exhibitId?: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
  public viewedExhibitArchive(id: string, exhibitId?: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling viewedExhibitArchive.');
    }

    let queryParameters = new HttpParams({encoder: new CustomHttpUrlEncodingCodec()});
    if (exhibitId !== undefined && exhibitId !== null) {
      queryParameters = queryParameters.set('exhibitId', <any>exhibitId);
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

    return this.httpClient.get<any>(`${this.configuration.basePath}/api/xapi/viewed/exhibit/${encodeURIComponent(String(id))}/archive`,
      {
        params: queryParameters,
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Logs xAPI viewed statement for Wall by Exhibit id
     * Returns status
     * @param exhibitId The id of the Exhibit
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public viewedExhibitWall(exhibitId: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
  public viewedExhibitWall(exhibitId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
  public viewedExhibitWall(exhibitId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
  public viewedExhibitWall(exhibitId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    if (exhibitId === null || exhibitId === undefined) {
      throw new Error('Required parameter exhibitId was null or undefined when calling viewedExhibitWall.');
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

    return this.httpClient.get<any>(`${this.configuration.basePath}/api/xapi/viewed/exhibit/${encodeURIComponent(String(exhibitId))}/wall`,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

}
