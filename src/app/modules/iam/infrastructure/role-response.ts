/*
  These two interfaces describe the join tables used to resolve which role
  a user has. They are intentionally NOT modeled as full domain entities
  (no assembler, no BaseApiEndpoint) because they only exist to answer one
  question: "what role does this userId have?". IamApi reads them directly.
*/

export interface RoleResource {
  id: string;
  name: 'admin' | 'client';
  description: string;
}

export interface UserRoleResource {
  id: string;
  userId: string;
  roleId: string;
}
