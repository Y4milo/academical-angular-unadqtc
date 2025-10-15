import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventQuestionsWithCheckOutComponent } from './event-questions-with-check-out.component';

describe('EventQuestionsWithCheckOutComponent', () => {
  let component: EventQuestionsWithCheckOutComponent;
  let fixture: ComponentFixture<EventQuestionsWithCheckOutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventQuestionsWithCheckOutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventQuestionsWithCheckOutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
