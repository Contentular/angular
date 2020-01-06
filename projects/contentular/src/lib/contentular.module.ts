import { HttpClientModule } from '@angular/common/http';
import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';

export interface ContentularConfig {
    componentMap: {
        [propName: string]: any
    };
    apiUrl: string;
    apiKey: string;
}

export const ContentularConfigService = new InjectionToken<ContentularConfig>('ContentularConfig');


@NgModule({
    declarations: [],
    imports: [
        HttpClientModule
    ],
    exports: []
})
export class ContentularModule {
    static forRoot(config: ContentularConfig): ModuleWithProviders {
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
