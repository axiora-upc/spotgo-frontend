import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { SettingsComponent } from './settings.component';
import { ProfilesStore } from '../../../application/profiles.store';
import { Admin } from '../../../domain/model/admin.entity';
import { BlueprintsApi } from '../../../infrastructure/blueprints-api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a minimal Admin entity with sensible defaults.
 * Individual tests can override any field they care about.
 */
function makeAdmin(overrides: Partial<{
  id: string; firstName: string; lastName: string;
  email: string; phone: string; parkingName: string; parkingId: string | null;
}> = {}): Admin {
  return new Admin({
    id:          overrides.id          ?? 'usr-001',
    firstName:   overrides.firstName   ?? 'Piero',
    lastName:    overrides.lastName    ?? 'Quiroz Montoya',
    email:       overrides.email       ?? 'piero.quiroz@spotgo.com',
    phone:       overrides.phone       ?? '+51 999 111 222',
    parkingName: overrides.parkingName ?? 'Parking Central Lima',
    parkingId:   overrides.parkingId   ?? 'park-001',
  });
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  // ── Store mock ─────────────────────────────────────────────────────────────

  /*
    We create a minimal fake for ProfilesStore so tests never touch
    the real HTTP layer. Each signal is writable here so individual
    tests can set whatever state they need.
  */
  const adminSignal    = signal<Admin | null>(null);
  const loadingSignal  = signal(false);
  const errorSignal    = signal<string | null>(null);

  const storeStub = {
    admin:       adminSignal.asReadonly(),
    loading:     loadingSignal.asReadonly(),
    error:       errorSignal.asReadonly(),
    loadAdmin:   vi.fn(),
    updateAdmin: vi.fn(),
  };

  // ── Dialog mock ────────────────────────────────────────────────────────────

  const dialogStub = {
    open: vi.fn().mockReturnValue({
      afterClosed: () => of(undefined),
    }),
  };

  const blueprintsApiStub = {
    getParking: vi.fn().mockReturnValue(of({ id: 'park-001', city: 'Lima', pricePerHour: 5 })),
    updateParkingStats: vi.fn().mockReturnValue(of(null)),
  };

  // ── Setup ──────────────────────────────────────────────────────────────────

  beforeEach(async () => {
    storeStub.loadAdmin.mockReset();
    storeStub.updateAdmin.mockReset();
    dialogStub.open.mockClear();
    blueprintsApiStub.getParking.mockReset();
    blueprintsApiStub.updateParkingStats.mockReset();
    blueprintsApiStub.getParking.mockReturnValue(of({ id: 'park-001', city: 'Lima', pricePerHour: 5 }));
    blueprintsApiStub.updateParkingStats.mockReturnValue(of(null));
    localStorage.setItem('spotgo:authUser', JSON.stringify({ id: 'usr-001', role: 'admin', parkingId: 'park-001' }));

    // Start every test with a loaded admin and no pending state.
    adminSignal.set(makeAdmin());
    loadingSignal.set(false);
    errorSignal.set(null);

    await TestBed.configureTestingModule({
      imports: [SettingsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
        provideTranslateHttpLoader({ prefix: './i18n/', suffix: '.json' }),
        { provide: ProfilesStore, useValue: storeStub },
        { provide: MatDialog,     useValue: dialogStub },
        { provide: BlueprintsApi,  useValue: blueprintsApiStub },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 1. Creación del componente
  // ══════════════════════════════════════════════════════════════════════════

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. Carga inicial
  // ══════════════════════════════════════════════════════════════════════════

  it('should call profilesStore.loadAdmin with "usr-001" on init', () => {
    expect(storeStub.loadAdmin).toHaveBeenCalledOnce();
    expect(storeStub.loadAdmin).toHaveBeenCalledWith('usr-001');
  });

  it('should expose the admin from the store via the admin getter', () => {
    const a = makeAdmin({ firstName: 'Juan', lastName: 'Quispe' });
    adminSignal.set(a);
    expect(component.admin).toBe(a);
  });

  it('should expose null when the store has no admin yet', () => {
    adminSignal.set(null);
    expect(component.admin).toBeNull();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. Modo lectura (estado inicial)
  // ══════════════════════════════════════════════════════════════════════════

  it('should start in read mode (isEditing = false)', () => {
    expect(component.isEditing()).toBe(false);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. startEditing
  // ══════════════════════════════════════════════════════════════════════════

  it('startEditing should set isEditing to true', () => {
    component.startEditing();
    expect(component.isEditing()).toBe(true);
  });

  it('startEditing should copy current admin fields into editBuffer', () => {
    const a = makeAdmin({
      firstName: 'Carlos', lastName: 'Mendoza',
      email: 'carlos@test.com', phone: '+51 900 000 000',
      parkingName: 'Mi Parking',
    });
    adminSignal.set(a);
    component.parkingCity.set('Miraflores');

    component.startEditing();

    expect(component.editBuffer.firstName).toBe('Carlos');
    expect(component.editBuffer.lastName).toBe('Mendoza');
    expect(component.editBuffer.email).toBe('carlos@test.com');
    expect(component.editBuffer.phone).toBe('+51 900 000 000');
    expect(component.editBuffer.parkingName).toBe('Mi Parking');
    expect(component.editBuffer.parkingCity).toBe('Miraflores');
  });

  it('startEditing should do nothing when admin is null', () => {
    adminSignal.set(null);
    component.startEditing();
    // isEditing must remain false: no data to populate the buffer.
    expect(component.isEditing()).toBe(false);
  });

  it('startEditing should reset editBuffer with latest data on repeated calls', () => {
    component.startEditing();
    component.editBuffer.firstName = 'Modificado';
    component.cancelEditing();

    // Admin data is unchanged; start editing again.
    component.startEditing();
    expect(component.editBuffer.firstName).toBe('Piero'); // original value
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. cancelEditing
  // ══════════════════════════════════════════════════════════════════════════

  it('cancelEditing should set isEditing to false', () => {
    component.startEditing();
    component.cancelEditing();
    expect(component.isEditing()).toBe(false);
  });

  it('cancelEditing should NOT call store.updateAdmin', () => {
    component.startEditing();
    component.cancelEditing();
    expect(storeStub.updateAdmin).not.toHaveBeenCalled();
  });

  it('cancelEditing should leave the store admin signal unchanged', () => {
    const original = component.admin;
    component.startEditing();
    component.editBuffer.firstName = 'Otro nombre';
    component.cancelEditing();
    expect(component.admin).toBe(original);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. saveChanges
  // ══════════════════════════════════════════════════════════════════════════

  it('saveChanges should call store.updateAdmin with an Admin built from editBuffer', () => {
    component.startEditing();
    component.editBuffer.firstName   = 'Nuevo';
    component.editBuffer.lastName    = 'Apellido';
    component.editBuffer.email       = 'nuevo@test.com';
    component.editBuffer.phone       = '+51 111 222 333';
    component.editBuffer.parkingName = 'Nuevo Parking';
    component.editBuffer.parkingCity = 'San Isidro';
    component.editBuffer.pricePerHour = 7.5;

    component.saveChanges();

    expect(storeStub.updateAdmin).toHaveBeenCalledOnce();

    const [updatedAdmin] = storeStub.updateAdmin.mock.calls.at(-1) as [Admin, unknown];
    expect(updatedAdmin.firstName).toBe('Nuevo');
    expect(updatedAdmin.lastName).toBe('Apellido');
    expect(updatedAdmin.email).toBe('nuevo@test.com');
    expect(updatedAdmin.phone).toBe('+51 111 222 333');
    expect(updatedAdmin.parkingName).toBe('Nuevo Parking');
    expect(updatedAdmin.id).toBe('usr-001'); // id must be preserved
    expect(blueprintsApiStub.updateParkingStats).toHaveBeenCalledWith('park-001', {
      city: 'San Isidro',
      pricePerHour: 7.5,
    });
  });

  it('saveChanges should pass onSuccess callback that sets isEditing to false', () => {
    component.startEditing();
    component.saveChanges();

    // Simulate the store calling onSuccess.
    const callbacks = storeStub.updateAdmin.mock.calls.at(-1)?.[1] as {
      onSuccess?: () => void;
    };
    callbacks.onSuccess?.();

    expect(component.isEditing()).toBe(false);
  });

  it('saveChanges should keep isEditing true when no onSuccess is invoked (API pending)', () => {
    component.startEditing();
    component.saveChanges();
    // onSuccess has not been called yet → still editing.
    expect(component.isEditing()).toBe(true);
  });

  it('saveChanges should do nothing when admin is null', () => {
    adminSignal.set(null);
    component.saveChanges();
    expect(storeStub.updateAdmin).not.toHaveBeenCalled();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. viewBlueprint (toggle)
  // ══════════════════════════════════════════════════════════════════════════

  it('viewBlueprint should set selectedBlueprint to the given dataUrl', () => {
    component.viewBlueprint('data:image/png;base64,abc123');
    expect(component.selectedBlueprint()).toBe('data:image/png;base64,abc123');
  });

  it('viewBlueprint should deselect when the same dataUrl is selected twice (toggle)', () => {
    const url = 'data:image/png;base64,abc123';
    component.viewBlueprint(url);
    component.viewBlueprint(url);
    expect(component.selectedBlueprint()).toBeNull();
  });

  it('viewBlueprint should switch to a different blueprint', () => {
    component.viewBlueprint('data:image/png;base64,aaa');
    component.viewBlueprint('data:image/png;base64,bbb');
    expect(component.selectedBlueprint()).toBe('data:image/png;base64,bbb');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 8. Admin entity – fullName helper
  // ══════════════════════════════════════════════════════════════════════════

  it('Admin.fullName should concatenate firstName and lastName', () => {
    const a = makeAdmin({ firstName: 'María', lastName: 'López Paredes' });
    expect(a.fullName).toBe('María López Paredes');
  });
});
