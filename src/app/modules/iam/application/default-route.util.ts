import { Role } from '../domain/model/user.entity';

/*
  defaultRouteForRole centralizes the "where should this role land after
  authenticating" decision.

  It used to live in ToolbarContent as a hardcoded map the user picked
  manually (User View / Admin View). Now that the role comes from a real
  login/register instead of a manual toggle, both Login/Register (after a
  successful attempt) and RoleRedirect (when an already-authenticated user
  hits "/") call this same helper, so the mapping only exists in one place.
*/
export function defaultRouteForRole(role: Role): string {
  return role === 'admin' ? '/realtime-map/overview' : '/dashboard';
}
