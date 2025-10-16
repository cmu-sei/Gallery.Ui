// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  EventEmitter,
  NgZone,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { UntypedFormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { Collection } from 'src/app/generated/api';

/** Error when invalid control is dirty, touched, or submitted. */
export class UserErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: UntypedFormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || isSubmitted));
  }
}

@Component({
  selector: 'app-collections',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss'],
})
export class CollectionsComponent {
  @Input() adminMode = false;
  @Output() editComplete = new EventEmitter<boolean>();
  @ViewChild(CollectionsComponent) child;
  @ViewChild('stepper') stepper: MatStepper;

  matcher = new UserErrorStateMatcher();
  isLinear = false;
  collectionList = this.collectionDataService.collectionList;
  selectedCollection = this.collectionDataService.selected;
  collectionPageEvent = this.collectionDataService.pageEvent;
  isLoading = this.collectionQuery.selectLoading();
  filterControl: UntypedFormControl = this.collectionDataService.filterControl;
  filterString: Observable<string>;
  pageSize: Observable<number>;
  pageIndex: Observable<number>;

  constructor(
    public zone: NgZone,
    private collectionDataService: CollectionDataService,
    private collectionQuery: CollectionQuery,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.collectionDataService.load();
    this.filterString = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('collectionmask') || '')
    );
    this.pageSize = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get('pagesize') || '20', 10))
    );
    this.pageIndex = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get('pageindex') || '0', 10))
    );
  }

  setActive(id: any) {
    this.collectionDataService.setActive(id);
    if (this.adminMode) {
      this.router.navigate([`collections/${id}/memberships`], {});
    }
  }

  sortChangeHandler(sort: Sort) {
    this.router.navigate([], {
      queryParams: { sorton: sort.active, sortdir: sort.direction },
      queryParamsHandling: 'merge',
    });
  }

  pageChangeHandler(page: PageEvent) {
    this.router.navigate([], {
      queryParams: { pageindex: page.pageIndex, pagesize: page.pageSize },
      queryParamsHandling: 'merge',
    });
  }

  saveCollection(collection: Collection) {
    if (!collection.id) {
      this.collectionDataService.add(collection);
    } else {
      this.collectionDataService.updateCollection(collection);
    }
  }
} // End Class
