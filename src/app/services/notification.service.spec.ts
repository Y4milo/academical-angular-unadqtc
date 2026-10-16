import {TestBed} from '@angular/core/testing';
import {HttpErrorResponse} from '@angular/common/http';
import {MessageService} from 'primeng/api';
import {NotificationService} from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let messages: jasmine.SpyObj<MessageService>;

  const response = (status: string) => ({status, payload: {title: 'Título', message: 'Detalle'}}) as any;

  beforeEach(() => {
    messages = jasmine.createSpyObj<MessageService>('MessageService', ['add']);
    TestBed.configureTestingModule({providers: [{provide: MessageService, useValue: messages}]});
    service = TestBed.inject(NotificationService);
  });

  it('notifyApiData shows a success response', () => {
    service.notifyApiData(response('success'));

    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({severity: 'success', summary: 'Título'}));
  });

  it('notifyApiFailure stays silent when the response succeeded', () => {
    service.notifyApiFailure(response('success'));

    expect(messages.add).not.toHaveBeenCalled();
  });

  it('notifyApiFailure shows warnings and errors', () => {
    service.notifyApiFailure(response('warning'));
    service.notifyApiFailure(response('error'));

    expect(messages.add).toHaveBeenCalledTimes(2);
    expect(messages.add.calls.argsFor(0)[0].severity).toBe('warn');
    expect(messages.add.calls.argsFor(1)[0].severity).toBe('error');
  });

  it('notifyApiFailure shows an HTTP error with an ApiData body', () => {
    const error = new HttpErrorResponse({status: 422, error: response('error')});

    service.notifyApiFailure(error);

    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({severity: 'error', detail: 'Detalle'}));
  });
});
