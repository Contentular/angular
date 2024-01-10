import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';

import { ContentularComponent } from './components/contentular.component';
import { EditorComponent } from './components/editor/editor.component';
import { ContentularCachingStrategy } from './contentular-caching.strategy';
import { CONTENTULAR_CONFIG, ContentularConfig } from './contentular.config';
import { EditorDirective } from './directives/editor.directive';
import { LivePreviewService } from './services/live-preview.service';

const ROOT_OPTIONS = new InjectionToken<ContentularConfig>('ROOT_OPTIONS');

export function contentularConfigFactory (options: ContentularConfig) {
    return {
        cachingStrategy: ContentularCachingStrategy.networkOnly,
        persistentCache: false,
        ...options,
    };
}

@NgModule({
    declarations: [ContentularComponent, EditorDirective, EditorComponent],
    imports: [
        CommonModule,
        HttpClientModule,
    ],
    exports: [ContentularComponent, EditorDirective, EditorComponent]
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

    constructor(private livePreviewService: LivePreviewService) {
    }
}
