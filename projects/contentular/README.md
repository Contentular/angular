#  :heart_eyes: Easy way to display your Contentular Content :mechanical_arm:

Our @contentular/angular package ist the easiest and most comfortable way to integrate content into your frontend.
Simply add the package to your Angular project:

```
npm i @contentular/angular
```

```
yarn add @contentular/angular
```

### The Contentular Module

Register the ContentularModule in your AppModule:

app.module.ts:

``` typescript
import {ContentularCachingStrategy, ContentularModule} from '@contentular/angular';
import {EmployeeComponent} from './shared/components/employee.component';

ContentularModule.forRoot({
   apiKey: 'yourApiKey',
   persistentCache: true,
   cachingStrategy: ContentularCachingStrategy.networkFirst,
   componentMap: {
       employeeProfile: EmployeeComponent,
   }
}),
```

<br><br>
The Contentular Package offers the following options:

| Property  | Type | Default | Description |
| ------------- | ------------- | ------------- | ------------- |
| apiKey  | string  | ''  | The key that is assigned to your Space. Copy it from the Space Overview and paste it here. We recommend saving your key as .env variable. |
| persistentCache | boolean | optional | Caches your content on the client side. | 
| cachingStrategy | ContentularCachingStrategy | optional | <ul><li>cacheFirst &#124;&#124; "cache-first"</li><li>networkFirst &#124;&#124; "network-first"</li><li>networkOnly &#124;&#124; "network-first"</li></ul>These are the three strategy types you can pass to the contentular/angular module. | 
| componentMap | contentModelType: CompentName | optional | To receive automatically rendered components according to your created Content Models, you can define these in the componentMap. This way, the contentular component knows which component to render for each content type. | 
<br><br>
### The Contentular Service

The ContentularService of the @contentular/angular package takes care of your applications's Contentular API requests.
Two central functions are available:

```
contentularService.getAll()
```

```
contentularService.findBySlug(slug: string)
```
<br>

app.component.ts:

``` typescript
import {ContentularService, Story} from '@contentular/angular';

@Component({
    selector: 'app-component',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class AppComponent implements OnInit {
    
    allStories$: Observable<Story[]>
    aboutUsStory$: Observable<Story>;
    
    constructor(
           private contentularService: ContentularService,
    ) { }
    
    ngOnInit(): void {
        this.aboutUsStory$ = this.contentularService.findBySlug('about-us').map([story] => story); // Delivers a Story array. In case you use unique slugs, we recommend a simple .map().
        this.allStories$ = this.contentularService.getAll() // Delivers an array with all Stories of your Space.
    }
}
``` 
<br><br>
### The Contentular Component
The @contentular/angular package's ContentularComponent uses the componentMap that is defined in the ContentularModule to automatically render the template assigned to the contentType.

app.component.html:
``` html
<contentular *ngFor="let content of (aboutUsContent$ | async)" [content]="content"></contentular>
``` 
<br>

app.component.ts:
``` typescript
import {Content, ContentularService} from '@contentular/angular';

@Component({
    selector: 'app-component',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class AppComponent implements OnInit {

    aboutUsContent$: Observable<Content[]>:
    
    constructor(
           private contentularService: ContentularService,
    ) { }
    
    ngOnInit(): void {
        this.aboutUsContent$ = this.contentularService.findBySlug('about-us')
            .map([story] => story)
            .map(story => story.contents)
    }
}
```
<br>

employee-profile.component.ts:
``` typescript
import { Content } from '@contentular/angular';

// Create an interface first to determine the properties of your Content.
export interface EmployeeProfile {
    employeeImage: string;
    firstName: string;
    lastName: string;
    description: any;
}

@Component({
    selector: 'app-employee-profile',
    templateUrl: './employee-profile.component.html',
    styleUrls: ['./employee-profile.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class EmployeeProfileComponent implements OnInit {

    // The content is added to your employee component as input.
    @Input() content: Content<EmployeeProfile>;
    
    constructor() {}
    
    ngOnInit(): void {
        console.log(‘employee profile content: ’, this.content)
    }
}
```
<br>

To display your content in the frontend, you only have to pass the template's variables to your employee-profile component.

employee-profile.component.html:
``` html
<div>
    <img [src]=”content.fields.employeeImage”>
    <div>
        {{content.fields.firstName}} {{content.fields.lastName}}
    </div>
    <div [innerHtml]=”content.fields.description”></div>
</div>
```

