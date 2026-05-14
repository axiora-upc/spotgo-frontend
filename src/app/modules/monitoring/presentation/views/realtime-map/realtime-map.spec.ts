import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { RealtimeMap } from './realtime-map';

/*
  describe groups all tests related to the RealtimeMap component.
*/
describe('RealtimeMap', () => {
  /*
    component will store the instance of the RealtimeMap class.
    fixture will store the testing wrapper around the component.
  */
  let component: RealtimeMap;
  let fixture: ComponentFixture<RealtimeMap>;

  /*
    beforeEach runs before each test.

    It prepares the Angular testing environment and creates
    a fresh RealtimeMap component for every test.
  */
  beforeEach(async () => {
    /*
      configureTestingModule configures the Angular test environment.

      Since RealtimeMap is a standalone component, it is added to imports.
      providers replicate the global app config so router and translations
      work inside the test.
    */
    await TestBed.configureTestingModule({
      imports: [RealtimeMap],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
        provideTranslateHttpLoader({ prefix: './i18n/', suffix: '.json' }),
      ],
    }).compileComponents();

    /*
      createComponent creates an instance of the RealtimeMap component
      inside the testing environment.
    */
    fixture = TestBed.createComponent(RealtimeMap);

    /*
      componentInstance gives us access to the actual RealtimeMap class
      instance.
    */
    component = fixture.componentInstance;

    /*
      whenStable waits until Angular finishes pending asynchronous tasks
      before running the test.
    */
    await fixture.whenStable();
  });

  /*
    This test checks that the RealtimeMap component can be created.
  */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /*
    This test checks the three tabs are wired in the order shown in
    the design.
  */
  it('should declare the three tabs', () => {
    expect(component.tabs.map((t) => t.link)).toEqual([
      'overview',
      'reports',
      'employees',
    ]);
  });
});
