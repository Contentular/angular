import { InjectionToken } from '@angular/core';

export interface ContentularConfig {
    componentMap: {
        [propName: string]: any
    };
    apiUrl?: string;
    apiKey: string;
}

export const CONTENTULAR_CONFIG = new InjectionToken<ContentularConfig>('contentular.config');
