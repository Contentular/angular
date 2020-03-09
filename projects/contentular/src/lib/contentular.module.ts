import { HttpClientModule } from '@angular/common/http';
import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { ContentularComponent } from './components/contentular.component';
import { CONTENTULAR_CONFIG, ContentularConfig } from './contentular.config';


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
        };
    }

}
