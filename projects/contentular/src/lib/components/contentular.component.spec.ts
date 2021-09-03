import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ContentularComponent } from './contentular.component';

describe('ContentularComponent', () => {
  let component: ContentularComponent;
  let fixture: ComponentFixture<ContentularComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ContentularComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
