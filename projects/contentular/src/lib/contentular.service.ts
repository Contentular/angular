import { isPlatformServer } from '@angular/common';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID, Renderer2, RendererFactory2 } from '@angular/core';
import { fromEventPattern, Observable, of, ReplaySubject } from 'rxjs';
import { catchError, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { ContentularCachingStrategy } from './contentular-caching.strategy';
import { CONTENTULAR_CONFIG, ContentularConfig } from './contentular.config';
import { Content, Story } from './contentular.interfaces';
import { ContentularModule } from './contentular.module';

interface ContentularCache {
    loadedAllOnce: boolean;
    cacheFiles: Story[];
}

interface ContentularRequestOptions {
    apiUrl?: string;
    apiKey: string;
    cachingStrategy: ContentularCachingStrategy;
}

@Injectable({
    providedIn: ContentularModule,
})
export class ContentularService {
    private cache$ = new ReplaySubject<ContentularCache>(1);
    private currentCache$ = this.cache$.asObservable();
    cachedStories$ = this.cache$.asObservable().pipe(map(contentularCache => contentularCache.cacheFiles));
    config: ContentularConfig;
    private loadedAllOnce = false;
    private defaultCache: ContentularCache = {
        loadedAllOnce: false,
        cacheFiles: [],
    };

    private readonly localStorageAvailable: boolean;
    private readonly defaultRequestOptions: ContentularRequestOptions;
    private readonly http: HttpClient;
    private readonly renderer2: Renderer2;

    constructor(
        @Inject(CONTENTULAR_CONFIG) private contentularConfig,
        @Inject(PLATFORM_ID) private platformId,
        private httpHandler: HttpBackend,
        private rendererFactory: RendererFactory2,
    ) {
        this.renderer2 = rendererFactory.createRenderer(null, null);
        this.http = new HttpClient(httpHandler);

        this.localStorageAvailable = this.checkForStorage();
        if (isPlatformServer(this.platformId)) {
            console.log('Storage available:', this.localStorageAvailable);
        }

        this.config = {
            apiUrl: 'https://app.contentular.de/api',
            ...contentularConfig,
        };

        this.defaultRequestOptions = {
            ...this.config,
            cachingStrategy: this.config.cachingStrategy,
        };

        this.setupInitialCache();
        if (this.config.persistentCache) {
            this.persistCache();
        }

        this.listenForContentUpdates();
    }

    findAndReplaceContent(contents: Content[], newContent: Content) {
        return contents.map(content => {
            if (content._id === newContent._id) {
                const fieldKeys = Object.keys(newContent.fields);

                for (let i = 0; i < fieldKeys.length; i++) {
                    if (!Array.isArray(newContent.fields[fieldKeys[i]])) {
                        content.fields[fieldKeys[i]] = newContent.fields[fieldKeys[i]];
                    }
                }

                return {...content};
            }

            const fieldKeys = Object.keys(content.fields);

            for (let i = 0; i < fieldKeys.length; i++) {
                if (Array.isArray(content.fields[fieldKeys[i]])) {
                    const replacedFieldContent = this.findAndReplaceContent(content.fields[fieldKeys[i]], newContent);
                    if (replacedFieldContent !== content.fields[fieldKeys[i]]) {
                        content.fields[fieldKeys[i]] = replacedFieldContent;
                        // Return a copy to change the reference and fix *ngFor issues
                        return {...content};
                    }
                }
            }

            return content;
        })
    }

    listenForContentUpdates() {
        let removeMessageEventListener: () => void;
        const messageEventListener = (handler: (e: Event) => boolean | void) => {
            removeMessageEventListener = this.renderer2.listen('window', 'message', handler);
        };

        fromEventPattern(messageEventListener).subscribe((event: any) => {
            if (event.data.type && event.data.type === 'contentUpdate') {
                this.cache$.pipe(
                    take(1),
                    map(cache => cache.cacheFiles),
                    )
                    .subscribe(stories => {
                        const contentsToUpdate: any[] = event.data.payload;
                        contentsToUpdate.forEach(contentToUpdate => {
                            const story = stories.find(story => story._id === contentToUpdate.story);

                            if (story) {
                                story.contents = this.findAndReplaceContent(story.contents, contentToUpdate);
                                this.updateCache([story]);
                            }
                        });
                    });
            }
        });
    }

    private checkForStorage(): boolean {
        const test = 'test';
        try {
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    public getAll(options?: ContentularRequestOptions): Observable<Story[]> {
        const requestOptions = {
            ...this.defaultRequestOptions,
            ...options,
        };
        // console.log('current-strategy', requestOptions.cachingStrategy);

        let responseStream: Observable<Story[]>;

        switch (requestOptions.cachingStrategy) {
            case ContentularCachingStrategy.networkOnly:
                responseStream = this.loadAllNetworkOnly(requestOptions);
                break;

            case ContentularCachingStrategy.networkFirst:
                responseStream = this.loadAllNetworkFirst(requestOptions);
                break;

            case ContentularCachingStrategy.cacheFirst:
                responseStream = this.loadAllCacheFirst(requestOptions);
                break;
        }

        const stream = responseStream.pipe(
            switchMap(stories => this.cachedStories$.pipe(
                map(cachedStories => cachedStories.filter(cachedStory => stories.some(story => story._id === cachedStory._id))),
            )),
            shareReplay(1),
        );

        stream.subscribe();
        return stream;
    }

    private loadAllNetworkOnly(requestOptions: ContentularRequestOptions) {
        const apiCall = this.createApiCall(requestOptions) as Observable<Story[]>;
        return apiCall
            .pipe(
                tap(stories => {
                    this.loadedAllOnce = true;
                    this.updateCache(stories);
                }),
                catchError(err => {
                    // console.log('cant get stories');
                    throw err;
                }),
            );
    }

    private loadAllNetworkFirst(requestOptions: ContentularRequestOptions): Observable<Story[]> {
        const apiCall = this.createApiCall(requestOptions) as Observable<Story[]>;
        return apiCall.pipe(
            tap(stories => {
                this.loadedAllOnce = true;
                this.updateCache(stories);
            }),
            catchError(err => {
                    // console.log('cant get stories');
                    // console.log('return cache');
                    if (err.status === 404) {
                        this.removeAllFromCache();
                    }
                    return this.currentCache$
                        .pipe(
                            take(1),
                            map(cache => cache.cacheFiles),
                            map(cachedStories => {
                                if (cachedStories.length === 0) {
                                    throw {msg: 'No Data available'};
                                }
                                return cachedStories;
                            }),
                        );
                },
            ),
        );
    }

    private loadAllCacheFirst(requestOptions: ContentularRequestOptions): Observable<Story[]> {
        const apiCall = this.createApiCall(requestOptions) as Observable<Story[]>;
        return this.currentCache$.pipe(
            take(1),
            switchMap(cache => {
                if (cache.cacheFiles.length === 0 || !cache.loadedAllOnce) {
                    // console.log('cache empty, try to load');
                    return apiCall.pipe(
                        tap(stories => {
                            this.loadedAllOnce = true;
                            this.updateCache(stories);
                        }),
                        catchError(err => {
                                // console.log('cant get stories');

                                if (err.status === 404) {
                                    this.removeAllFromCache();
                                }
                                throw {msg: 'No Data available', err};
                            },
                        ),
                    );
                }
                return of(cache.cacheFiles);
            }),
        );
    }

    public findBySlug(slug: string, options?: ContentularRequestOptions): Observable<Story[]> {
        const requestOptions = {
            ...this.defaultRequestOptions,
            ...options,
        };
        // console.log('current-strategy', requestOptions.cachingStrategy);

        let responseStream: Observable<Story[]>;

        switch (requestOptions.cachingStrategy) {
            case ContentularCachingStrategy.networkOnly:
                responseStream = this.loadBySlugNetworkOnly(requestOptions, slug);
                break;

            case ContentularCachingStrategy.networkFirst:
                responseStream = this.loadBySlugNetworkFirst(requestOptions, slug);
                break;

            case ContentularCachingStrategy.cacheFirst:
                responseStream = this.loadBySlugCacheFirst(requestOptions, slug);
                break;
        }

        return responseStream.pipe(
            switchMap(stories => this.cachedStories$.pipe(
                map(cachedStories => cachedStories.filter(cachedStory => stories.some(story => story._id === cachedStory._id))),
            )),
        );
    }

    private loadBySlugNetworkOnly(requestOptions: ContentularRequestOptions, slug: string): Observable<Story[]> {
        const apiCall = this.createApiCall(requestOptions, slug);
        return apiCall
            .pipe(
                tap(stories => this.updateCache(stories)),
                catchError(err => {
                    // console.log('cant get stories with slug');
                    throw err;
                }));
    }

    private loadBySlugCacheFirst(requestOptions: ContentularRequestOptions, slug: string): Observable<Story[]> {
        const apiCall = this.createApiCall(requestOptions, slug);
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
                                if (err.status === 404) {
                                    this.removeFromCache(slug);
                                }
                                // console.log('cant get stories');
                                throw {msg: 'No Data available', err};
                            },
                        ),
                    );
                }
                return of(cache);
            }),
        );
    }

    private loadBySlugNetworkFirst(requestOptions: ContentularRequestOptions, slug: string): Observable<Story[]> {
        const apiCall = this.createApiCall(requestOptions, slug);
        return apiCall.pipe(
            tap(stories => {
                this.updateCache(stories);
            }),
            catchError(err => {
                    // console.log('cant get stories with slug');
                    // console.log('return cache');
                    if (err.status === 404) {
                        this.removeFromCache(slug);
                    }
                    return this.cache$
                        .pipe(
                            take(1),
                            map(cache => cache.cacheFiles),
                            map(cache => cache.filter(story => story.slug === slug)),
                            map(cacheMap => {
                                if (cacheMap.length === 0) {
                                    throw {msg: 'No Data available'};
                                }
                                return cacheMap;
                            }),
                        );
                },
            ),
        );
    }

    private setupInitialCache() {
        let existingCache;
        if (this.localStorageAvailable) {
            existingCache = localStorage.getItem(this.config.apiKey);
        }
        if (existingCache && this.localStorageAvailable && this.config.persistentCache) {
            const cache = {
                ...this.defaultCache,
                ...JSON.parse(existingCache),
            };
            this.cache$.next(cache);
        } else {
            if (this.localStorageAvailable) {
                localStorage.removeItem(this.config.apiKey);
            }
            this.cache$.next(this.defaultCache);
        }
    }

    private persistCache() {
        this.cache$.subscribe(cache => {
                if (this.localStorageAvailable) {
                    localStorage.setItem(this.config.apiKey, JSON.stringify(cache));
                }
            },
        );
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
                    cachedFiles.push(story);
                }
            });
            const updatedCache: ContentularCache = {
                loadedAllOnce: this.loadedAllOnce,
                cacheFiles: cachedFiles,
            };
            this.cache$.next(updatedCache);
        });
    }

    private removeFromCache(slug: string) {
        // console.log('remove from Cache');
        this.cache$.pipe(
            take(1),
        ).subscribe(currentCache => {
            const cachedFiles: Story[] = [...currentCache.cacheFiles];
            const updatedCachedFiles = cachedFiles.filter(story => story.slug !== slug);
            const updatedCache: ContentularCache = {
                loadedAllOnce: this.loadedAllOnce,
                cacheFiles: updatedCachedFiles,
            };
            this.cache$.next(updatedCache);
        });
    }

    private removeAllFromCache() {
        // console.log('remove all from Cache');
        const updatedCache: ContentularCache = {
            loadedAllOnce: this.loadedAllOnce,
            cacheFiles: [],
        };
        this.cache$.next(updatedCache);
    }

    private createApiCall(requestOptions: ContentularRequestOptions, slug?: string): Observable<Story[]> {
        const baseUrl = `${requestOptions.apiUrl}/stories/frontend`;
        const url = slug ? baseUrl + '?slug=' + slug : baseUrl;

        // const headers = ne({'x-api-key': this.config.apiKey});

        const options = {params: {'api_key': requestOptions.apiKey || this.config.apiKey}};
        return this.http.get<Story[]>(url, options);
    }
}
