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
            // console.log(window.parent);
            if (typeof window !== 'undefined' && window.parent !== window.top) {
                try {
                    window.parent.postMessage(JSON.stringify({
                        type: 'routed',
                        payload: event,
                    }), 'https://app.contentular.io');
                } catch (e) {

                }
            }
        });
    }
}
