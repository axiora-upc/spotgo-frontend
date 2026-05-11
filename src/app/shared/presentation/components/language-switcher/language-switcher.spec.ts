/*
  Imports tools to make testing Angular components easier,
  such as creating a test module and component fixture.
*/
import { ComponentFixture, TestBed } from '@angular/core/testing';

/*
  My language switcher component, which is the one we want to test.
*/
import { LanguageSwitcher } from './language-switcher';

/*
  describe groups all tests related to the LanguageSwitcher component.
*/
describe('LanguageSwitcher', () => {
  /*
    component will store the instance of the LanguageSwitcher class.
    fixture will store the testing wrapper around the component.
  */
  let component: LanguageSwitcher;
  let fixture: ComponentFixture<LanguageSwitcher>;

  /*
    beforeEach runs before each test.

    It prepares the Angular testing environment and creates
    a fresh LanguageSwitcher component for every test.
  */
  beforeEach(async () => {
    /*
      configureTestingModule configures the Angular test environment.

      Since LanguageSwitcher is a standalone component, it is added to imports.
      compileComponents prepares the component template, styles, and imports.
    */
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcher],
    }).compileComponents();

    /*
      createComponent creates an instance of the LanguageSwitcher component
      inside the testing environment.
    */
    fixture = TestBed.createComponent(LanguageSwitcher);

    /*
      componentInstance gives us access to the actual LanguageSwitcher class instance.
    */
    component = fixture.componentInstance;

    /*
      whenStable waits until Angular finishes pending asynchronous tasks
      before running the test.
    */
    await fixture.whenStable();
  });

  /*
    This test checks that the LanguageSwitcher component can be created successfully.
  */
  it('should create', () => {
    /*
      toBeTruthy checks that component exists and is not null or undefined.
    */
    expect(component).toBeTruthy();
  });
});