/*
  In this case, we use interface instead of class because 
  we want to define a contract for the shape of the data, rather than 
  providing an implementation. 
  The BaseEntity interface defines a single property, id, which is a number. 
  This allows us to ensure that any entity that implements 
  this interface will have an id property, which can be used 
  for identification and referencing purposes throughout 
  the application.
*/
export interface BaseEntity {
  id: number;
}