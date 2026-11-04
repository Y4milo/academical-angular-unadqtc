import {canReopenCalls, DEGREES_TITLES_REOPEN} from './degree-call-permissions';

describe('canReopenCalls', () => {
  it('lets the permission decide when the session carries permissions', () => {
    expect(canReopenCalls({role: {value: 'degrees_titles'}, permissions: [DEGREES_TITLES_REOPEN]})).toBeTrue();
    expect(canReopenCalls({role: {value: 'admin'}, permissions: ['degrees_titles.manage']})).toBeFalse();
  });

  it('falls back to the administrator role for a session started before permissions existed', () => {
    expect(canReopenCalls({role: {value: 'admin'}})).toBeTrue();
    expect(canReopenCalls({role: {value: 'degrees_titles'}})).toBeFalse();
  });

  it('is false without a session', () => {
    expect(canReopenCalls(null)).toBeFalse();
    expect(canReopenCalls(undefined)).toBeFalse();
  });
});
