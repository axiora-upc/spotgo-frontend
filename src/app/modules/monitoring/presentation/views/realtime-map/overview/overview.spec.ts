import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { Overview } from './overview';

/*
  describe groups all tests related to the Overview component.
*/
describe('Overview', () => {
  let component: Overview;
  let fixture: ComponentFixture<Overview>;

  beforeEach(async () => {
    /*
      Overview reads parking data through HttpClient and uses the
      | translate pipe in its template, so we provide both services in
      the test module.
    */
    await TestBed.configureTestingModule({
      imports: [Overview],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
        provideTranslateHttpLoader({ prefix: './i18n/', suffix: '.json' }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Overview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  /*
    This test checks that the Overview component can be created.
  */
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
