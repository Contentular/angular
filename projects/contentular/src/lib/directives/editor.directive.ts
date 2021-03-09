import { ComponentFactoryResolver, Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import '../../../assets/redactorx/redactorx.js';
import { EditorComponent } from '../components/editor/editor.component';

@Directive({
    selector: '[appEditor]',
})
export class EditorDirective implements OnInit {
    @Input() appEditor: string;

    // @HostBinding('attr.contenteditable') contentEditable = true;

    constructor(
        private vcr: ViewContainerRef,
        private templateRef: TemplateRef<any>,
        // private renderer: Renderer2,
        private componentFactoryResolver: ComponentFactoryResolver,
    ) {
    }

    ngOnInit() {
        // const textarea: HTMLTextAreaElement = this.renderer.createElement('textarea');
        // const html = this.vcr.element.nativeElement.innerHTML;
        const factory = this.componentFactoryResolver.resolveComponentFactory(EditorComponent);
        const embeddedView = this.vcr.createEmbeddedView(this.templateRef);
        const html = this.templateRef.elementRef.nativeElement.previousElementSibling;
        // html.innerHTML = this.appEditor;
        const wrap = document.createElement('div');
        wrap.appendChild(html.cloneNode(true));

        this.vcr.clear();
        const component = this.vcr.createComponent(factory);
        console.log(wrap.innerHTML);
        // component.instance.templateRef = this.templateRef;
        component.instance.html = this.appEditor;
        component.instance.wrap = wrap.innerHTML;
    }
}
