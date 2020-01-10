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

export const ContentularConfigService = new InjectionToken<ContentularConfig>('ContentularConfig');

const defaultConfig: Partial<ContentularConfig> = {
    apiUrl: 'https://app.contentular.de/api'
};

@NgModule({
    declarations: [ContentularComponent],
    imports: [
        HttpClientModule
    ],
    exports: [ContentularComponent]
})
export class ContentularModule {
    static forRoot(customConfig: ContentularConfig): ModuleWithProviders {
        const config = {...defaultConfig, ...customConfig};

        return {
            ngModule: ContentularModule,
            providers: [
                {
                    provide: ContentularConfigService,
                    useValue: config
                }
            ]
        }
    }

}
