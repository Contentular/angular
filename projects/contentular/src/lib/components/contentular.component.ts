import {
    Component,
    ComponentFactoryResolver,
    Inject,
    Input,
    OnInit,
    Renderer2,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import { Content } from '../contentular.interfaces';
import { ContentularConfigService } from '../contentular.module';

@Component({
    selector: 'contentular',
    template: `
        <ng-template #templateRef></ng-template>
    `,
    styleUrls: ['./contentular.component.scss']
})
export class ContentularComponent implements OnInit {
    @ViewChild('templateRef', {read: ViewContainerRef, static: true}) templateRef: ViewContainerRef;

    @Input() set content(content: Content) {
        if (typeof this.config.componentMap[content.type] === 'undefined') {
            console.info(content.type, ' not found');
            return;
        }

        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
            this.config.componentMap[content.type]
        );

        const viewContainerRef = this.templateRef;
        viewContainerRef.clear();

        const componentRef = viewContainerRef.createComponent(componentFactory);
        (<{ content: Content }>componentRef.instance).content = content;

        // add classes to fields then adding this classes to component wrapper
        if (content.fields && content.fields.class !== '' && content.fields.class !== undefined) {
            const classArray = content.fields.class.split(/[ ,]+/);
            classArray.forEach((className) => this.renderer2.addClass(componentRef.location.nativeElement, className));
        }
    }


    constructor(
        @Inject(ContentularConfigService) private config,
        private viewContainerRef: ViewContainerRef,
        private componentFactoryResolver: ComponentFactoryResolver,
        private renderer2: Renderer2,
    ) {
    }

    ngOnInit() {
    }

}
