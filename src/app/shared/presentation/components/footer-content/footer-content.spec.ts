/*
  Imports tools to make testing Angular components easier,
  such as creating a test module and component fixture.
*/
import { ComponentFixture, TestBed } from '@angular/core/testing';

/*
  My footer content component, which is the one we want to test.
*/
import { FooterContent } from './footer-content';

/*
  describe groups all tests related to the FooterContent component.
*/
describe('FooterContent', () => {
  /*
    component will store the instance of the FooterContent class.
    fixture will store the testing wrapper around the component.
  */
  let component: FooterContent;
  let fixture: ComponentFixture<FooterContent>;

  /*
    beforeEach runs before each test.

    It prepares the Angular testing environment and creates
    a fresh FooterContent component for every test.
  */
  beforeEach(async () => {
    /*
      configureTestingModule configures the Angular test environment.

      Since FooterContent is a standalone component, it is added to imports.
      compileComponents prepares the component template, styles, and imports.
    */
    await TestBed.configureTestingModule({
      imports: [FooterContent],
    }).compileComponents();

    /*
      createComponent creates an instance of the FooterContent component
      inside the testing environment.
    */
    fixture = TestBed.createComponent(FooterContent);

    /*
      componentInstance gives us access to the actual FooterContent class instance.
    */
    component = fixture.componentInstance;

    /*
      whenStable waits until Angular finishes pending asynchronous tasks
      before running the test.
    */
    await fixture.whenStable();
  });

  /*
    This test checks that the FooterContent component can be created successfully.
  */
  it('should create', () => {
    /*
      toBeTruthy checks that component exists and is not null or undefined.
    */
    expect(component).toBeTruthy();
  });
});