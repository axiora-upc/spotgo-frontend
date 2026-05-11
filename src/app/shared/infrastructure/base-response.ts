
/*
  The BaseResponse interface do not have any properties or methods 
  defined,so response from APIs dont need to have a specific structure.
  
  The BaseResource interface defines a single property, id, which is 
  a number. This means that resources need to follow a specific structure, 
  where they must have an id property that is a number.
*/

export interface BaseResponse {

}

export interface BaseResource {
  id: number;
}
