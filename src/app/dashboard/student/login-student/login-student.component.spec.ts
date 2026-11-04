import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { LoginStudentComponent } from './login-student.component';

describe('LoginStudentComponent', () => {
  let component: LoginStudentComponent;
  let fixture: ComponentFixture<LoginStudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginStudentComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
