import { Component, ElementRef, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';

declare const RedactorX;

@Component({
    selector: 'lib-editor',
    templateUrl: './editor.component.html',
    styleUrls: ['./editor.component.css'],
})
export class EditorComponent implements OnInit {
    @ViewChild('container', { static: true }) container: ElementRef<any>;

    public templateRef: TemplateRef<any>;
    public html: string;
    public wrap: string;

    constructor(
        private renderer: Renderer2,
    ) {
    }

    ngOnInit(): void {
        this.container.nativeElement.innerHTML = this.wrap;
        const textarea = this.renderer.createElement('textarea');
        this.container.nativeElement.children[0].appendChild(textarea);
        RedactorX(textarea, {
            control: true,
            context: true,
            toolbar: false,
            content: this.html,
        });

    }

}
