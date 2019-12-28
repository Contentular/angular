import { TestBed } from '@angular/core/testing';

import { ContentularService } from './contentular.service';

describe('ContentularService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ContentularService = TestBed.get(ContentularService);
    expect(service).toBeTruthy();
  });
});
