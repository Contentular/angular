import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class LivePreviewService {

    constructor(
        private router: Router,
    ) {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd),
        ).subscribe(event => {
            if (window.parent) {
                window.parent.postMessage(JSON.stringify({
                    type: 'routed',
                    payload: event,
                }), 'https://app.contentular.io');
            }
        });
    }
}
