import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, of, ReplaySubject } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { ContentularCachingStrategy } from './contentular-caching.strategy';
import { CONTENTULAR_CONFIG, ContentularConfig } from './contentular.config';
import { Story } from './contentular.interfaces';

interface ContentularCache {
    loadedAllOnce: boolean;
    cacheFiles: Story[];
}

interface ContentularRequestOptions {
    cachingStrategy?: ContentularCachingStrategy;
}

@Injectable({
    providedIn: 'root'
})
export class ContentularService {
    private cache$ = new ReplaySubject<ContentularCache>(1);
    private currentCache$ = this.cache$.asObservable();
    config: ContentularConfig;
    private loadedAllOnce = false;
    private defaultCache: ContentularCache = {
        loadedAllOnce: false,
        cacheFiles: [],
    };

    private defaultRequestOptions: ContentularRequestOptions;

    constructor(
        @Inject(CONTENTULAR_CONFIG) private contentularConfig,
        private http: HttpClient,
    ) {
        this.config = {
            apiUrl: 'https://app.contentular.de/api',
            ...contentularConfig
        };

        this.defaultRequestOptions = {
            cachingStrategy: this.config.cachingStrategy
        };

        this.setupInitialCache();
        if (this.config.persistentCache) {
            this.persistCache();
        }
    }

    public getAll(options?: ContentularRequestOptions): Observable<Story[]> {
        const requestOptions = {
            ...this.defaultRequestOptions,
            ...options
        };
        // console.log('current-strategy', requestOptions.cachingStrategy);

        switch (requestOptions.cachingStrategy) {
            case ContentularCachingStrategy.networkOnly:
                return this.loadAllNetworkOnly();

            case ContentularCachingStrategy.networkFirst:
                return this.loadAllNetworkFirst();

            case ContentularCachingStrategy.cacheFirst:
                return this.loadAllCacheFirst();
        }
    }

    private loadAllNetworkOnly() {
        const apiCall = this.createApiCall() as Observable<Story[]>;
        return apiCall
            .pipe(
                tap(() => this.loadedAllOnce = true),
                catchError(err => {
                    // console.log('cant get stories');
                    throw err
                })
            );
    };

    private loadAllNetworkFirst(): Observable<Story[]> {
        const apiCall = this.createApiCall() as Observable<Story[]>;
        return apiCall.pipe(
            tap(stories => {
                this.loadedAllOnce = true;
                this.updateCache(stories)
            }),
            catchError(err => {
                    // console.log('cant get stories');
                    // console.log('return cache');
                    return this.currentCache$
                        .pipe(
                            take(1),
                            map(cache => cache.cacheFiles),
                            map(cachedStories => {
                                if (cachedStories.length === 0) {
                                    throw {msg: 'No Data available'}
                                }
                                return cachedStories
                            })
                        )
                }
            )
        );
    }

    private loadAllCacheFirst(): Observable<Story[]> {
        const apiCall = this.createApiCall() as Observable<Story[]>;
        return this.currentCache$.pipe(
            take(1),
            switchMap(cache => {
                if (cache.cacheFiles.length === 0 || !cache.loadedAllOnce) {
                    // console.log('cache empty, try to load');
                    return apiCall.pipe(
                        tap(stories => {
                            this.loadedAllOnce = true;
                            this.updateCache(stories)
                        }),
                        catchError(err => {
                                // console.log('cant get stories');
                                throw {msg: 'No Data available', err};
                            }
                        )
                    )
                }
                return of(cache.cacheFiles)
            })
        )
    }

    public findBySlug(slug: string, options?: ContentularRequestOptions): Observable<Story[]> {
        const requestOptions = {
            ...this.defaultRequestOptions,
            ...options
        };
        // console.log('current-strategy', requestOptions.cachingStrategy);


        switch (requestOptions.cachingStrategy) {
            case ContentularCachingStrategy.networkOnly:
                return this.loadBySlugNetworkOnly(slug);

            case ContentularCachingStrategy.networkFirst:
                return this.loadBySlugNetworkFirst(slug);

            case ContentularCachingStrategy.cacheFirst:
                return this.loadBySlugCacheFirst(slug);
        }
    }

    private loadBySlugNetworkOnly(slug: string): Observable<Story[]> {
        const apiCall = this.createApiCall(slug);
        return apiCall
            .pipe(
                catchError(err => {
                    // console.log('cant get stories with slug');
                    throw err
                }));
    }

    private loadBySlugCacheFirst(slug: string): Observable<Story[]> {
        const apiCall = this.createApiCall(slug);
        return this.cache$.pipe(
            take(1),
            map(cache => cache.cacheFiles),
            map(cache => cache.filter(story => story.slug === slug)),
            switchMap(cache => {
                if (cache.length === 0) {
                    // console.log('cache empty, try to load');
                    return apiCall.pipe(
                        tap(loadedStories => {
                            this.updateCache(loadedStories);
                        }),
                        catchError(err => {
                                // console.log('cant get stories');
                                throw {msg: 'No Data available', err};
                            }
                        )
                    )
                }
                return of(cache)
            })
        )
    }

    private loadBySlugNetworkFirst(slug: string): Observable<Story[]> {
        const apiCall = this.createApiCall(slug);
        return apiCall.pipe(
            tap(stories => {
                this.updateCache(stories)
            }),
            catchError(err => {
                    // console.log('cant get stories with slug');
                    // console.log('return cache');
                    return this.cache$
                        .pipe(
                            take(1),
                            map(cache => cache.cacheFiles),
                            map(cache => cache.filter(story => story.slug === slug)),
                            map(cacheMap => {
                                if (cacheMap.length === 0) {
                                    throw {msg: 'No Data available'}
                                }
                                return cacheMap
                            })
                        )
                }
            )
        );
    }

    private setupInitialCache() {
        const cacheExists = localStorage.getItem(this.config.apiKey);
        if (cacheExists && this.config.persistentCache) {
            const cache = {
                ...this.defaultCache,
                ...JSON.parse(cacheExists)
            };
            this.cache$.next(cache);
        } else {
            localStorage.removeItem(this.config.apiKey);
            this.cache$.next(this.defaultCache);
        }
    }

    private persistCache() {
        this.cache$.subscribe(cache => {
                localStorage.setItem(this.config.apiKey, JSON.stringify(cache))
            }
        )
    }

    private updateCache(stories: Story[]) {
        // console.log('update Cache');
        this.cache$.pipe(
            take(1),
        ).subscribe(currentCache => {
            const cachedFiles: Story[] = [...currentCache.cacheFiles];
            stories.forEach((story: Story) => {
                const cacheIndex: number = cachedFiles.findIndex(cache => cache._id === story._id);
                if (cacheIndex > -1) {
                    cachedFiles[cacheIndex] = story;
                } else {
                    cachedFiles.push(story)
                }
            });
            const updatedCache: ContentularCache = {
                loadedAllOnce: this.loadedAllOnce,
                cacheFiles: cachedFiles,
            };
            this.cache$.next(updatedCache);
        });
    }

    private createApiCall(slug?: string): Observable<Story[]> {
        const baseUrl = `${this.config.apiUrl}/stories/frontend`;
        const url = slug ? baseUrl + '?slug=' + slug : baseUrl;
        const options = {
            headers: {'x-api-key': this.config.apiKey}
        };
        return this.http.get<Story[]>(url, options);
    }
}
