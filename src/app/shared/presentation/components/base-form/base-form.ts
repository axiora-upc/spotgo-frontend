/*
  FormGroup is imported from Angular Forms.

  A FormGroup represents a complete form.

  Example:
  A form can have fields such as:
  - name
  - email
  - password
  - plateNumber

  Each field inside the form is called a form control.
*/
import { FormGroup } from '@angular/forms';

/*
  BaseForm is a reusable base class for form validation logic.

  This class is not a visual component.
  It does not have HTML or CSS.

  Its purpose is to avoid repeating the same validation methods
  in every component that uses a form.
*/
export class BaseForm {
  /*
    Checks if a specific form control is invalid and has been touched.

    Parameters:
    - form: the complete form that contains the control.
    - controlName: the name of the field we want to check.

    Example:
    If the form has a field called "email", then controlName would be "email".

    invalid means the field does not pass its validations.
    touched means the user already clicked or entered that field and then left it.

    This is useful because we usually do not want to show errors
    before the user interacts with the field.
  */
  protected isInvalidControl(form: FormGroup, controlName: string): boolean {
    return form.controls[controlName].invalid && form.controls[controlName].touched;
  }

  /*
    Creates an error message for one specific validation error.

    Parameters:
    - controlName: the name of the field that has the error.
    - errorKey: the type of validation error.

    Example error keys:
    - required
    - email
    - minlength
    - maxlength

    Right now, this method only has a custom message for "required".
    Any other error will use the default message.
  */
  private errorMessageForControl(controlName: string, errorKey: string): string {
    switch (errorKey) {
      case 'required':
        return `The field ${controlName} is required.`;

      default:
        return `The field ${controlName} is invalid.`;
    }
  }

  /*
    Gets all error messages for a specific form control.

    Parameters:
    - form: the complete form that contains the control.
    - controlName: the name of the field we want to validate.

    First, it gets the control from the form.
    Then, it checks if the control has errors.
    If there are no errors, it returns an empty string.

    If there are errors, it goes through each error key
    and creates the corresponding error message.
  */
  protected errorMessagesForControl(form: FormGroup, controlName: string): string {
    const control = form.controls[controlName];

    let errorMessages = '';

    const errors = control.errors;

    if (!errors) return errorMessages;

    Object.keys(errors).forEach(
      (errorKey) => (errorMessages += this.errorMessageForControl(controlName, errorKey)),
    );

    return errorMessages;
  }
}
