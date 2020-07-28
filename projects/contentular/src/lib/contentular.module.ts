import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';

import { ContentularComponent } from './components/contentular.component';
import { ContentularCachingStrategy } from './contentular-caching.strategy';
import { CONTENTULAR_CONFIG, ContentularConfig } from './contentular.config';


@NgModule({
    declarations: [ContentularComponent],
    imports: [
        HttpClientModule,
    ],
    exports: [ContentularComponent]
})
export class ContentularModule {
    static forRoot(userConfig: ContentularConfig): ModuleWithProviders<ContentularModule> {
        const config: ContentularConfig = {
            cachingStrategy: ContentularCachingStrategy.networkOnly,
            persistentCache: false,
            ...userConfig
        };
        return {
            ngModule: ContentularModule,
            providers: [
                {
                    provide: CONTENTULAR_CONFIG,
                    useValue: config
                }
            ]
        };
    }
}
