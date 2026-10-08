// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach, onTestFinished } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { screen } from '@testing-library/angular';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { Article, ArticleService } from 'src/app/generated/api';
import { ArticleQuery } from 'src/app/data/article/article.query';
import { XApiService } from 'src/app/services/xapi/xapi.service';
import { renderComponent } from 'src/app/test-utils/render-component';
import { activatedRouteStub } from 'src/app/test-utils/activated-route';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { ArticleComponent } from './article.component';

const ARTICLE: Article = {
  id: 'a1',
  name: 'Outage report',
  description: '<p>Power is out downtown.</p>',
};

async function renderArticle(params: Record<string, string>) {
  const articleApi = {
    getArticle: vi.fn(() => of(structuredClone(ARTICLE))),
  } satisfies ApiStub<ArticleService>;
  const viewedArticle = vi.fn(() => of(null));
  const rendered = await renderComponent(ArticleComponent, {
    imports: [AngularEditorModule],
    declarations: [ArticleComponent],
    providers: [
      // angular-editor injects HttpClient for image uploads; nothing is sent.
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ArticleService, useValue: articleApi },
      {
        provide: XApiService,
        useValue: { viewedArticle } satisfies Pick<
          XApiService,
          'viewedArticle'
        >,
      },
      {
        provide: ActivatedRoute,
        useValue: activatedRouteStub({}, params).route,
      },
    ],
  });
  return { ...rendered, articleApi, viewedArticle };
}

describe('ArticleComponent', () => {
  beforeEach(() => {
    // The constructor writes the window title into #appTitle (index.html).
    const title = document.createElement('span');
    title.id = 'appTitle';
    document.body.appendChild(title);
    onTestFinished(() => title.remove());
  });

  /**
   * Verifies: the article named in the route is loaded, made active, reported to xAPI, and its description rendered.
   * Interacts with: ArticleService.getArticle via the real ArticleDataService and ArticleQuery, XApiService.viewedArticle, angular-editor.
   * Data: route params articleId a1, exhibitId e1.
   */
  it('loads and shows the routed article', async () => {
    const { articleApi, viewedArticle } = await renderArticle({
      articleId: 'a1',
      exhibitId: 'e1',
    });

    expect(articleApi.getArticle).toHaveBeenCalledWith('a1');
    expect(viewedArticle).toHaveBeenCalledWith('e1', 'a1');
    expect(TestBed.inject(ArticleQuery).getActiveId()).toBe('a1');
    expect(document.getElementById('appTitle')).toHaveTextContent('Article');
    expect(
      await screen.findByText('Power is out downtown.'),
    ).toBeInTheDocument();
  });

  /**
   * Verifies: without an article id nothing is loaded and no article body renders.
   * Interacts with: ArticleService (unused), XApiService (unused).
   * Data: no route params.
   */
  it('renders no article without an article id', async () => {
    const { articleApi, viewedArticle, container } = await renderArticle({});

    expect(articleApi.getArticle).not.toHaveBeenCalled();
    expect(viewedArticle).not.toHaveBeenCalled();
    expect(container.querySelector('angular-editor')).toBeNull();
  });
});
