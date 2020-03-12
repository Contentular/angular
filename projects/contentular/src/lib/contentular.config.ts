import { InjectionToken } from '@angular/core';
import { ContentularCachingStrategy } from './contentular-caching.strategy';


export interface ContentularConfig {
    componentMap: {
        [propName: string]: any
    };
    apiUrl?: string;
    apiKey: string;
    cachingStrategy?: ContentularCachingStrategy;
    persistentCache?: boolean;
}

export const CONTENTULAR_CONFIG = new InjectionToken<ContentularConfig>('contentular.config');
