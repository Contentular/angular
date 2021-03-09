import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ComponentFactoryResolver,
    ComponentRef,
    Inject,
    Input,
    OnInit,
    Renderer2,
    ViewChild,
    ViewContainerRef,
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
export class ContentularComponent implements OnInit {
    @ViewChild('templateRef', {read: ViewContainerRef, static: true}) templateRef: ViewContainerRef;

    componentRef: ComponentRef<unknown>;

    @Input() set content(content: Content) {
        if (typeof this.config.componentMap[content.type] === 'undefined') {
            console.info(content.type, ' not found');
            return;
        }

        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
            this.config.componentMap[content.type],
        );

        const viewContainerRef = this.templateRef;
        viewContainerRef.clear();

        this.componentRef = viewContainerRef.createComponent(componentFactory);
        (this.componentRef.instance as {content: Content}).content = content;

        this.cdr.markForCheck();
    }


    constructor(
        @Inject(CONTENTULAR_CONFIG) private config: ContentularConfig,
        private viewContainerRef: ViewContainerRef,
        private componentFactoryResolver: ComponentFactoryResolver,
        private renderer2: Renderer2,
        private cdr: ChangeDetectorRef,
    ) {
    }

    ngOnInit() {
    }

}
