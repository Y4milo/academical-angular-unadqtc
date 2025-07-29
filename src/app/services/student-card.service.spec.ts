import { TestBed } from '@angular/core/testing';

import { StudentCardService } from './student-card.service';

describe('StudentCardService', () => {
  let service: StudentCardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudentCardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
