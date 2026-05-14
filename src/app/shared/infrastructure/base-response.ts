/*
  The BaseResponse interface does not have any properties or methods
  defined, so responses from APIs don't need to follow a specific
  structure.

  The BaseResource interface defines a single property, id, which is
  a string or a number. We allow both because our backend uses
  alphanumeric ids (EMP-001, SPG-J3P9QR) while typical examples use
  numeric ids.
*/

export interface BaseResponse {}

export interface BaseResource {
  id: string | number;
}
