/*
 Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the
 project root for license information.
*/

import { HttpParameterCodec } from '@angular/common/http';

/**
 * Custom HttpParameterCodec
 * Workaround for https://github.com/angular/angular/issues/18261
 */
export class CustomHttpParameterCodec implements HttpParameterCodec {
    encodeKey(k: string): string {
        return encodeURIComponent(k);
    }
    encodeValue(v: string): string {
        return encodeURIComponent(v);
    }
    decodeKey(k: string): string {
        return decodeURIComponent(k);
    }
    decodeValue(v: string): string {
        return decodeURIComponent(v);
    }
}
