import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { environment } from '../../../../environments/environment';
import { IamApi } from './iam-api';

describe('IamApi', () => {
  let api: IamApi;
  const httpStub = {
    post: vi.fn(),
    patch: vi.fn(),
  };

  beforeEach(() => {
    httpStub.post.mockReset();
    httpStub.patch.mockReset();
    api = new IamApi(httpStub as any);
  });

  it('register should omit role from the sign-up request body', () => {
    httpStub.post.mockReturnValue(of({
      id: 'usr-123',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '',
      role: 'client',
      parkingId: null,
      parkingName: '',
      token: 'token-123',
    }));

    api.register({
      firstName: '  Ada ',
      lastName: ' Lovelace ',
      phone: ' +51 999 111 222 ',
      email: ' ADA@EXAMPLE.COM ',
      password: 'secret123',
      role: 'admin',
    }).subscribe();

    expect(httpStub.post).toHaveBeenCalledTimes(1);
    expect(httpStub.post.mock.calls[0][0]).toBe(`${environment.apiUrl}/authentication/sign-up`);
    expect(httpStub.post.mock.calls[0][1]).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '+51 999 111 222',
      email: 'ada@example.com',
      password: 'secret123',
    });
    expect(httpStub.post.mock.calls[0][1].role).toBeUndefined();
  });

  it('requestPasswordReset should call the new request endpoint with normalized email', () => {
    httpStub.post.mockReturnValue(of(void 0));

    api.requestPasswordReset(' ADA@EXAMPLE.COM ').subscribe();

    expect(httpStub.post).toHaveBeenCalledWith(
      `${environment.apiUrl}/authentication/password-reset/request`,
      { email: 'ada@example.com' }
    );
  });

  it('confirmPasswordReset should call the new confirm endpoint with email, code and password', () => {
    httpStub.post.mockReturnValue(of(void 0));

    api.confirmPasswordReset({
      email: ' ADA@EXAMPLE.COM ',
      code: ' 123456 ',
      newPassword: 'secret123',
    }).subscribe();

    expect(httpStub.post).toHaveBeenCalledWith(
      `${environment.apiUrl}/authentication/password-reset/confirm`,
      {
        email: 'ada@example.com',
        code: '123456',
        newPassword: 'secret123',
      }
    );
  });
});
