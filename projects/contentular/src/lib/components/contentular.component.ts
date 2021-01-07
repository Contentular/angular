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
import { fromEventPattern } from 'rxjs';
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
        let removeMessageEventListener: () => void;
        const messageEventListener = (handler: (e: Event) => boolean | void) => {
            removeMessageEventListener = this.renderer2.listen('window', 'message', handler);
        };

        fromEventPattern(messageEventListener).subscribe((event: any) => {
            const componentInstance = this.componentRef.instance as {content: Content};
            if (event.data.type && event.data.type === 'contentUpdate') {
                const contentsToUpdate: any[] = event.data.payload;

                contentsToUpdate.forEach(contentToUpdate => {
                    const content = contentToUpdate.update.changes;
                    console.log('content', content._id);
                    // console.log(componentInstance.content._id);
                    if (componentInstance.content && componentInstance.content._id === content._id) {
                        console.log('FOUND!');
                        componentInstance.content = {...componentInstance.content, ...content};
                        this.cdr.markForCheck();
                    }
                })
            }
        });
    }

}
