import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';

import { ContentularComponent } from './components/contentular.component';
import { ContentularCachingStrategy } from './contentular-caching.strategy';
import { CONTENTULAR_CONFIG, ContentularConfig } from './contentular.config';

const ROOT_OPTIONS = new InjectionToken<ContentularConfig>('ROOT_OPTIONS');

export function contentularConfigFactory (options: ContentularConfig) {
    return {
        cachingStrategy: ContentularCachingStrategy.networkOnly,
        persistentCache: false,
        ...options,
    };
}

@NgModule({
    declarations: [ContentularComponent],
    imports: [
        CommonModule,
        HttpClientModule,
    ],
    exports: [ContentularComponent],
})
export class ContentularModule {
    static forRoot(userConfig: ContentularConfig): ModuleWithProviders<ContentularModule> {
        return {
            ngModule: ContentularModule,
            providers: [
                {
                    provide: ROOT_OPTIONS,
                    useValue: userConfig,
                },
                {
                    provide: CONTENTULAR_CONFIG,
                    useFactory: contentularConfigFactory,
                    deps: [ROOT_OPTIONS],
                },
            ],
        };
    }
}
