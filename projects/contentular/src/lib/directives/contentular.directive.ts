import {
    ChangeDetectorRef,
    ComponentRef,
    Directive,
    Inject,
    Input,
    ViewContainerRef,
    WritableSignal,
} from '@angular/core';
import { CONTENTULAR_CONFIG, ContentularConfig } from '../contentular.config';
import { Content } from '../contentular.interfaces';

@Directive({
    selector: '[contentular]',
    standalone: true,
})
export class ContentularDirective {
    componentRef!: ComponentRef<unknown>;

    @Input() set content(content: Content) {
        if (!content) {
            return;
        }

        if (typeof this.config.componentMap[content.type] === 'undefined') {
            console.info(content.type, ' not found');
            return;
        }

        this.viewContainerRef.clear();

        this.componentRef = this.viewContainerRef.createComponent(this.config.componentMap[content.type]);

        if (typeof (this.componentRef.instance as {content: any}).content?.set === 'function') {
            (this.componentRef.instance as {content: WritableSignal<Content>}).content.set(content);
        } else {
            (this.componentRef.instance as {content: Content}).content = content;
        }

        this.cdr.markForCheck();
    }


    constructor(
        @Inject(CONTENTULAR_CONFIG) private config: ContentularConfig,
        private viewContainerRef: ViewContainerRef,
        private cdr: ChangeDetectorRef,
    ) {
    }
}
