/*
  Imports tools to make testing Angular components easier, 
  such as creating a test module and component fixture.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

/*
  My layout component, which is the one we want to test.
*/

import { Layout } from './layout';

/*
  describe groups all tests related to the Layout component.
*/

describe('Layout', () => {
  /*
    component will store the instance of the Layout class.
    fixture will store the testing wrapper around the component.
  */
  let component: Layout;
  let fixture: ComponentFixture<Layout>;

  /*
    beforeEach runs before each test.

    It prepares the Angular testing environment and creates
    a fresh Layout component for every test.
  */
  beforeEach(async () => {
    /*
      configureTestingModule configures the Angular test environment.

      Since Layout is a standalone component, it is added to imports.
      compileComponents prepares the component template, styles, and imports.
    */
    await TestBed.configureTestingModule({
      imports: [Layout],
    }).compileComponents();

    /*
      createComponent creates an instance of the Layout component
      inside the testing environment.
    */
    fixture = TestBed.createComponent(Layout);

    /*
      componentInstance gives us access to the actual Layout class instance.
    */
    component = fixture.componentInstance;

    /*
      whenStable waits until Angular finishes pending asynchronous tasks
      before running the test.
    */
    await fixture.whenStable();
  });

  /*
    This test checks that the Layout component can be created successfully.
  */
  it('should create', () => {
    /*
      toBeTruthy checks that component exists and is not null or undefined.
    */
    expect(component).toBeTruthy();
  });
});