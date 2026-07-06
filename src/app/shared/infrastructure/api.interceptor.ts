import { HttpInterceptorFn } from '@angular/common/http';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem('spotgo:accessToken');
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
