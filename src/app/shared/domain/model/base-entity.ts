/*
  In this case, we use interface instead of class because
  we want to define a contract for the shape of the data, rather than
  providing an implementation.

  The BaseEntity interface defines a single property, id.

  id can be either a string or a number because:
  - Some bounded contexts use numeric ids (auto-incremented by the DB).
  - Other bounded contexts use alphanumeric codes that encode business
    meaning, such as "EMP-001" for employees or "SPG-J3P9QR" for
    incidents.

  Any entity that implements this interface will therefore have an id
  property usable for identification and referencing purposes across
  the application.
*/
export interface BaseEntity {
  id: string | number;
}
