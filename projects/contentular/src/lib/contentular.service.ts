import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { catchError, filter, mergeMap, take, tap } from 'rxjs/operators';
import { Story } from './contentular.interfaces';
import { CONTENTULAR_CONFIG, ContentularConfig } from './contentular.module';

@Injectable({
    providedIn: 'root'
})
export class ContentularService {
    stories$ = new ReplaySubject<Story[]>(1);
    config: ContentularConfig;

    constructor(
        @Inject(CONTENTULAR_CONFIG) private contentularConfig,
        private http: HttpClient,
    ) {
        this.config = {
            apiUrl: 'https://app.contentular.de/api',
            ...contentularConfig
        };
    }

    getAll() {
        this.http.get(`${this.config.apiUrl}/stories/frontend`, {
            headers: {'x-api-key': this.config.apiKey}
        })
            .pipe(
                tap((stories: Story[]) => this.cacheStories(stories)),
                catchError(async e => {
                    const stories = JSON.parse(localStorage.getItem('stories'));

                    if (stories) {
                        return stories;
                    }

                    throw e;
                }),
            )
            .subscribe((stories: Story[]) => this.stories$.next(stories));
    }

    findBySlug(slug: string): Observable<Story> {
        return this.stories$.pipe(
            mergeMap( x => x),
            filter(story => story.slug === slug),
            take(1)
        );
    }


    async cacheStories(stories: Story[]) {
        localStorage.setItem('stories', JSON.stringify(stories));
    }
}
