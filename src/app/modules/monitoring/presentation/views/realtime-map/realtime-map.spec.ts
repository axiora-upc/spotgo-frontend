import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealtimeMap } from './realtime-map';

describe('RealtimeMap', () => {
  let component: RealtimeMap;
  let fixture: ComponentFixture<RealtimeMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RealtimeMap],
    }).compileComponents();

    fixture = TestBed.createComponent(RealtimeMap);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
