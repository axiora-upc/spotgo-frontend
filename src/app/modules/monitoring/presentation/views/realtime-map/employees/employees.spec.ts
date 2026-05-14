import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { Employees } from './employees';

/*
  describe groups all tests related to the Employees component.
*/
describe('Employees', () => {
  let component: Employees;
  let fixture: ComponentFixture<Employees>;

  beforeEach(async () => {
    /*
      Employees uses HttpClient to load employees.json and the | translate
      pipe in its template, so we provide both services here.
    */
    await TestBed.configureTestingModule({
      imports: [Employees],
      providers: [
        provideHttpClient(),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
        provideTranslateHttpLoader({ prefix: './i18n/', suffix: '.json' }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Employees);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  /*
    This test checks that the Employees component can be created.
  */
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
