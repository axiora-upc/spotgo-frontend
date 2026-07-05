import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../application/auth.store';
import { defaultRouteForRole } from '../../../application/default-route.util';

/*
  RoleRedirect is the landing component for the empty path ('') under the
  protected Layout route in app.routes.ts.

  It only exists to answer: "the user is authenticated and hit '/', which
  page should they land on?" It reuses the exact same defaultRouteForRole()
  helper that Login/Register use right after a successful attempt, so the
  destination is always consistent with the user's real role.

  This component never renders any content — authGuard already guarantees
  a user exists by the time this runs, so a redirect always happens.
*/
@Component({
  selector: 'app-role-redirect',
  template: '',
})
export class RoleRedirect implements OnInit {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);

  ngOnInit(): void {
    const user = this.authStore.currentUser();
    this.router.navigateByUrl(user ? defaultRouteForRole(user.role) : '/iam/login');
  }
}
