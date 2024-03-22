import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ComponentRef,
    HostBinding,
    Inject,
    Input,
    ViewChild,
    ViewContainerRef,
    WritableSignal,
} from '@angular/core';
import { CONTENTULAR_CONFIG, ContentularConfig } from '../contentular.config';
import { Content } from '../contentular.interfaces';

@Component({
    selector: 'contentular',
    template: `
        <ng-template #templateRef></ng-template>
    `,
    styleUrls: ['./contentular.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentularComponent {
    @ViewChild('templateRef', { read: ViewContainerRef, static: true }) templateRef!: ViewContainerRef;
    @Input() flowless = false;

    @HostBinding('style.display') get renderFlowLess() {
        return this.flowless ? 'contents' : null;
    }

    componentRef!: ComponentRef<unknown>;

    @Input() set content(content: Content) {
        if (!content) {
            return;
        }

        if (typeof this.config.componentMap[content.type] === 'undefined') {
            console.info(content.type, ' not found');
            return;
        }

        const viewContainerRef = this.templateRef;
        viewContainerRef.clear();

        this.componentRef = viewContainerRef.createComponent(this.config.componentMap[content.type]);

        if (typeof (this.componentRef.instance as {content: any}).content?.set === 'function') {
            (this.componentRef.instance as {content: WritableSignal<Content>}).content.set(content);
        } else {
            (this.componentRef.instance as {content: Content}).content = content;
        }

        this.cdr.markForCheck();
    }


    constructor(
        @Inject(CONTENTULAR_CONFIG) private config: ContentularConfig,
        private cdr: ChangeDetectorRef,
    ) {
    }
}
