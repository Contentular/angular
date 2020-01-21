import { HttpClientModule } from '@angular/common/http';
import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { ContentularComponent } from './components/contentular.component';

export interface ContentularConfig {
    componentMap: {
        [propName: string]: any
    };
    apiUrl?: string;
    apiKey: string;
}

export const CONTENTULAR_CONFIG = new InjectionToken<ContentularConfig>('contentular.config');

@NgModule({
    declarations: [ContentularComponent],
    imports: [
        HttpClientModule
    ],
    exports: [ContentularComponent]
})
export class ContentularModule {
    static forRoot(config: ContentularConfig): ModuleWithProviders<ContentularModule> {
        return {
            ngModule: ContentularModule,
            providers: [
                {
                    provide: CONTENTULAR_CONFIG,
                    useValue: config
                }
            ]
        }
    }

}
