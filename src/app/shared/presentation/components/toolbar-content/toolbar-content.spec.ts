/*
  Import testing utilities from Angular.

  - ComponentFixture: wraps a component for testing
  - TestBed: creates and configures the testing environment
*/
import { ComponentFixture, TestBed } from '@angular/core/testing';

/*
  Import the ToolbarContent component that we want to test.
*/
import { ToolbarContent } from './toolbar-content';

/*
  describe groups all tests related to the ToolbarContent component.
*/
describe('ToolbarContent', () => {
  /*
    component stores the instance of the ToolbarContent class.
    fixture stores the testing wrapper around the component.
  */
  let component: ToolbarContent;
  let fixture: ComponentFixture<ToolbarContent>;

  /*
    beforeEach runs before each test.

    It prepares the Angular testing environment and creates
    a fresh ToolbarContent component for every test.
  */
  beforeEach(async () => {
    /*
      configureTestingModule sets up the testing module.

      Since ToolbarContent is a standalone component, it is added to imports.
      compileComponents prepares the component's template, styles, and dependencies.
    */
    await TestBed.configureTestingModule({
      imports: [ToolbarContent],
    }).compileComponents();

    /*
      createComponent instantiates the ToolbarContent component
      inside the testing environment.
    */
    fixture = TestBed.createComponent(ToolbarContent);

    /*
      componentInstance gives access to the actual ToolbarContent instance.
    */
    component = fixture.componentInstance;

    /*
      detectChanges triggers Angular's change detection
      after component initialization.
    */
    fixture.detectChanges();
  });

  /*
    This test verifies that the ToolbarContent component
    can be created and initialized successfully.
  */
  it('should create', () => {
    /*
      toBeTruthy checks that the component exists and is not null or undefined.
    */
    expect(component).toBeTruthy();
  });
});
