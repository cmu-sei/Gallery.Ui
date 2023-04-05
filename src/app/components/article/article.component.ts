// Copyright 2023 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Article } from 'src/app/generated/api/model/models';
import { ArticleDataService } from 'src/app/data/article/article-data.service';
import { ArticleQuery } from 'src/app/data/article/article.query';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ComnSettingsService } from '@cmusei/crucible-common';

@Component({
  selector: 'app-article-app',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
})
export class ArticleComponent implements OnDestroy {
  safeContent: SafeHtml = '';
  articleName = '';
  private unsubscribe$ = new Subject();

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleDataService: ArticleDataService,
    private articleQuery: ArticleQuery,
    private sanitizer: DomSanitizer,
    private settingsService: ComnSettingsService,
    @Inject(DOCUMENT) private _document: HTMLDocument
  ) {
    this._document.getElementById('appTitle').innerHTML = this.settingsService.settings.AppTitle + ' Article';
    // subscribe to route changes
    this.activatedRoute.paramMap.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const articleId = params.get('id');
      if (articleId) {
        this.articleDataService.loadById(articleId);
        this.articleDataService.setActive(articleId);
      } else {
        this.articleDataService.setActive('');
      }
    });
    // subscribe to the article
    (this.articleQuery.selectActive() as Observable<Article>).pipe(takeUntil(this.unsubscribe$)).subscribe(article => {
      if (article) {
        this.articleName = article.name;
        const parser = new DOMParser();
        const document = parser.parseFromString(article.description, 'text/html');
        this.safeContent = this.sanitizer.bypassSecurityTrustHtml(document.body.outerHTML);
      }
    });


  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
