import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideHttpClient } from '@angular/common/http';
import { EmployeeForm, EmployeeFormData } from './employee-form';

/*
  describe groups all tests related to the EmployeeForm component.
*/
describe('EmployeeForm', () => {
  let component: EmployeeForm;
  let fixture: ComponentFixture<EmployeeForm>;

  /*
    Minimal fake for MatDialogRef so the component can call close()
    without a real overlay in place.
  */
  const dialogRefSpy = { close: () => undefined };

  /*
    Default dialog data: create mode.
  */
  const dialogData: EmployeeFormData = { mode: 'create', spotOptions: [] };

  beforeEach(async () => {
    /*
      The dialog uses Material form fields and selects (which require
      animations), reactive forms and translations. We provide all of
      them in the testing module.
    */
    await TestBed.configureTestingModule({
      imports: [EmployeeForm, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        provideHttpClient(),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
        provideTranslateHttpLoader({ prefix: './i18n/', suffix: '.json' }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  /*
    This test checks that the EmployeeForm component can be created.
  */
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
