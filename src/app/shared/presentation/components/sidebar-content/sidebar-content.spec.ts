/*
  Import testing utilities from Angular.

  - ComponentFixture: wraps a component for testing
  - TestBed: creates and configures the testing environment
*/
import { ComponentFixture, TestBed } from '@angular/core/testing';

/*
  Import the SidebarContent component that we want to test.
*/
import { SidebarContent } from './sidebar-content';

/*
  describe groups all tests related to the SidebarContent component.
*/
describe('SidebarContent', () => {
  /*
    component stores the instance of the SidebarContent class.
    fixture stores the testing wrapper around the component.
  */
  let component: SidebarContent;
  let fixture: ComponentFixture<SidebarContent>;

  /*
    beforeEach runs before each test.

    It prepares the Angular testing environment and creates
    a fresh SidebarContent component for every test.
  */
  beforeEach(async () => {
    /*
      configureTestingModule sets up the testing module.

      Since SidebarContent is a standalone component, it is added to imports.
      compileComponents prepares the component's template, styles, and dependencies.
    */
    await TestBed.configureTestingModule({
      imports: [SidebarContent],
    }).compileComponents();

    /*
      createComponent instantiates the SidebarContent component
      inside the testing environment.
    */
    fixture = TestBed.createComponent(SidebarContent);

    /*
      componentInstance gives access to the actual SidebarContent instance.
    */
    component = fixture.componentInstance;

    /*
      detectChanges triggers Angular's change detection
      after component initialization.
    */
    fixture.detectChanges();
  });

  /*
    This test verifies that the SidebarContent component
    can be created and initialized successfully.
  */
  it('should create', () => {
    /*
      toBeTruthy checks that the component exists and is not null or undefined.
    */
    expect(component).toBeTruthy();
  });
});
