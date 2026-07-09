/*
  Component, signal e inject son los bloques básicos de Angular moderno.
*/
import { Component, inject, signal, OnInit } from '@angular/core';

/*
  FormsModule permite usar [(ngModel)] para los campos del formulario
  de información personal.
*/
import { FormsModule } from '@angular/forms';

/*
  MatDialog es el servicio de Angular Material que permite abrir dialogs.
  Se usa para abrir el UploadDialogComponent y el DeleteDialogComponent.
*/
import { MatDialog } from '@angular/material/dialog';

import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

/*
  BlueprintStorageService gestiona los croquis del admin en la base de datos.
*/
import { BlueprintStorageService } from '../../../application/blueprint-storage.service';
import { ProfilesStore } from '../../../application/profiles.store';
import { Admin } from '../../../domain/model/admin.entity';
import { CurrentUserService } from '../../../../../shared/services/current-user.service';
import { UploadDialogComponent, UploadDialogResult } from './upload-dialog/upload-dialog.component';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';

/*
  EditBuffer contiene una copia temporal de los campos editables
  del administrador para usarla durante el modo edición.
*/
interface EditBuffer {
  firstName: string;
  lastName: string;
  email: string;
  parkingName: string;
  phone: string;
  city: string;
}

@Component({
  selector: 'app-settings',
  imports: [
    FormsModule,
    MatIcon,
    MatButton,
    TranslatePipe,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {

  /*
    dialog es el servicio de Angular Material para abrir modales.
  */
  private dialog = inject(MatDialog);

  blueprintStorage    = inject(BlueprintStorageService);
  readonly profilesStore  = inject(ProfilesStore);
  private currentUser     = inject(CurrentUserService);
  private snackBar        = inject(MatSnackBar);
  private translate       = inject(TranslateService);

  // ─── Estado de edición ────────────────────────────────────────────────────

  /*
    isEditing controla si la tarjeta de usuario está en modo lectura o edición.
  */
  isEditing = signal(false);

  /*
    editBuffer es la copia temporal que se modifica durante la edición.
    Si el admin cancela, los datos originales en el store no se tocan.
  */
  editBuffer: EditBuffer = {
    firstName:   '',
    lastName:    '',
    email:       '',
    parkingName: '',
    phone:       '',
    city:        '',
  };

  // ─── Inicialización ───────────────────────────────────────────────────────

  ngOnInit(): void {
    /*
      Carga el administrador con id fijo al inicializar el componente.
      El store actualiza su signal admin() cuando la respuesta llega.
    */
    this.profilesStore.loadAdmin(this.currentUser.adminId);

    /*
      Carga los croquis guardados en la base de datos para este admin.
    */
    this.blueprintStorage.load();
  }

  // ─── Helpers de lectura ───────────────────────────────────────────────────

  /*
    Devuelve el admin actual del store.
    La plantilla puede usar admin()?.fullName, admin()?.email, etc.
  */
  get admin(): Admin | null {
    return this.profilesStore.admin();
  }

  // ─── Métodos de edición de información personal ───────────────────────────

  startEditing(): void {
    const a = this.profilesStore.admin();
    if (!a) return;

    /*
      Copia los datos actuales al buffer para que el usuario
      pueda modificarlos sin afectar el estado del store.
    */
    this.editBuffer = {
      firstName:   a.firstName,
      lastName:    a.lastName,
      email:       a.email,
      parkingName: a.parkingName,
      phone:       a.phone,
      city:        a.city,
    };
    this.isEditing.set(true);
  }

  saveChanges(): void {
    const current = this.profilesStore.admin();
    if (!current) return;

    /*
      Construye una nueva entidad Admin con los datos del buffer
      y el id del admin actual, luego la envía al store.
    */
    const updated = new Admin({
      id:          current.id,
      parkingId:   current.parkingId,
      firstName:   this.editBuffer.firstName,
      lastName:    this.editBuffer.lastName,
      email:       this.editBuffer.email,
      phone:       this.editBuffer.phone,
      city:        this.editBuffer.city,
      parkingName: this.editBuffer.parkingName,
    });

    this.profilesStore.updateAdmin(updated, {
      onSuccess: () => this.isEditing.set(false),
      // En caso de error el modo edición se mantiene abierto
      // para que el usuario pueda corregir o reintentar.
    });
  }

  cancelEditing(): void {
    this.isEditing.set(false);
  }

  blueprintError = signal('');

  // ─── Croquis: abrir dialog de subida ─────────────────────────────────────

  openUploadDialog(): void {
    this.blueprintError.set('');
    const dialogRef = this.dialog.open(UploadDialogComponent, {
      data: { existingNames: this.blueprintStorage.getNames() },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: UploadDialogResult | undefined) => {
      if (!result) return;
      this.blueprintStorage.add(
        { name: result.name, dataUrl: result.dataUrl, spots: result.spots },
        { onError: (message) => this.blueprintError.set(message) }
      );
    });
  }

  // ─── Croquis: abrir dialog de borrado ────────────────────────────────────

  openDeleteDialog(): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: { existingNames: this.blueprintStorage.getNames() },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((name: string | undefined) => {
      if (!name) return;
      this.blueprintStorage.remove(name, {
        /*
          Se limpia la vista previa para que no siga mostrando la imagen
          de un croquis que ya fue eliminado.
        */
        onSuccess: () => this.selectedBlueprint.set(null),
        onError: (message) => {
          const close = this.translate.instant('shared.snackbar.close');
          this.snackBar.open(
            message || this.translate.instant('settings.blueprint.delete-active-reservations'),
            close,
            { duration: 5000, panelClass: ['snackbar', 'snackbar--error'] },
          );
        },
      });
    });
  }

  // ─── Ver imagen ───────────────────────────────────────────────────────────

  selectedBlueprint = signal<string | null>(null);

  viewBlueprint(dataUrl: string): void {
    if (this.selectedBlueprint() === dataUrl) {
      this.selectedBlueprint.set(null);
    } else {
      this.selectedBlueprint.set(dataUrl);
    }
  }
}
