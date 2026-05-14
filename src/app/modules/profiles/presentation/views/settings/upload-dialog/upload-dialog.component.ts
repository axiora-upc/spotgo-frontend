/*
  Component, signal e inject son los bloques básicos de Angular moderno.
*/
import { Component, inject, signal } from '@angular/core';

/*
  FormsModule permite usar [(ngModel)] para el campo de nombre.
*/
import { FormsModule } from '@angular/forms';

/*
  MatDialogRef cierra este dialog y devuelve un resultado al padre.
  MAT_DIALOG_DATA recibe los datos que el padre envió al abrir el dialog.
*/
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

/*
  UploadDialogData son los datos que el padre (SettingsComponent)
  envía al abrir este dialog.

  existingNames - lista de nombres ya usados, para validar duplicados.
*/
export interface UploadDialogData {
  existingNames: string[];
}

/*
  UploadDialogResult son los datos que este dialog devuelve al padre
  cuando el admin confirma la subida.

  name    - nombre asignado al croquis.
  dataUrl - imagen en base64 lista para guardar y mostrar.
*/
export interface UploadDialogResult {
  name: string;
  dataUrl: string;
}

@Component({
  selector: 'app-upload-dialog',
  imports: [FormsModule, MatButton, MatIcon, NgClass, TranslatePipe],
  templateUrl: './upload-dialog.component.html',
  styleUrl: './upload-dialog.component.css',
})
export class UploadDialogComponent {

  /*
    dialogRef permite cerrar este dialog desde adentro.
    El tipo genérico indica qué tipo de resultado puede devolver.
  */
  private dialogRef = inject(MatDialogRef<UploadDialogComponent>);

  /*
    data contiene los datos que el padre envió: la lista de nombres existentes.
  */
  private data = inject<UploadDialogData>(MAT_DIALOG_DATA);

  // ─── Estado interno ───────────────────────────────────────────────────────

  /*
    selectedFile guarda el archivo que el admin seleccionó.
    Mientras sea null, el botón Subir está deshabilitado.
  */
  selectedFile = signal<File | null>(null);

  /*
    previewUrl guarda la imagen en base64 para mostrar vista previa
    dentro del dialog antes de confirmar.
  */
  previewUrl = signal<string | null>(null);

  /*
    imageName es el nombre del croquis.
    Se rellena automáticamente con el nombre del archivo al seleccionarlo,
    pero el admin puede cambiarlo antes de subir.
  */
  imageName = '';

  /*
    isDragging controla el resaltado visual de la zona de drop
    mientras el admin arrastra un archivo encima.
  */
  isDragging = signal(false);

  /*
    errorMessage contiene la clave de traducción del error a mostrar.
    Se limpia cada vez que el admin escribe en el campo de nombre.
  */
  errorMessage = signal('');

  private readonly ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
  private readonly MAX_SIZE_BYTES = 1 * 1024 * 1024;

  // ─── Manejo de archivos ───────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.processFile(input.files[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  private async processFile(file: File): Promise<void> {
    if (!this.ALLOWED_TYPES.has(file.type)) {
      this.errorMessage.set('settings.blueprint.error-type');
      return;
    }

    if (file.size > this.MAX_SIZE_BYTES) {
      this.errorMessage.set('settings.blueprint.error-size');
      return;
    }

    if (!(await this.hasValidMagicBytes(file))) {
      this.errorMessage.set('settings.blueprint.error-type');
      return;
    }

    this.selectedFile.set(file);
    this.imageName = file.name.replace(/\.[^/.]+$/, '');
    this.errorMessage.set('');

    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  private async hasValidMagicBytes(file: File): Promise<boolean> {
    const buf = await file.slice(0, 12).arrayBuffer();
    const b = new Uint8Array(buf);
    const isPng  = b[0]===0x89 && b[1]===0x50 && b[2]===0x4E && b[3]===0x47;
    const isJpeg = b[0]===0xFF && b[1]===0xD8 && b[2]===0xFF;
    const isWebP = b[0]===0x52 && b[1]===0x49 && b[2]===0x46 && b[3]===0x46 &&
                   b[8]===0x57 && b[9]===0x45 && b[10]===0x42 && b[11]===0x50;
    return isPng || isJpeg || isWebP;
  }

  // ─── Acciones ─────────────────────────────────────────────────────────────

  /*
    canUpload indica si el botón Subir debe estar habilitado.
    Requiere imagen seleccionada Y nombre no vacío.
  */
  get canUpload(): boolean {
    return this.selectedFile() !== null && this.imageName.trim().length > 0;
  }

  /*
    confirm valida el nombre y cierra el dialog con el resultado.

    Si el nombre ya existe → muestra el error y no cierra.
    Si el nombre es nuevo  → cierra el dialog y devuelve name + dataUrl al padre.
  */
  confirm(): void {
    const trimmedName = this.imageName.trim();

    const nameExists = this.data.existingNames.some(
      (n) => n.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameExists) {
      this.errorMessage.set('settings.blueprint.error-duplicate');
      return;
    }

    const result: UploadDialogResult = {
      name: trimmedName,
      dataUrl: this.previewUrl()!,
    };

    this.dialogRef.close(result);
  }

  /*
    cancel cierra el dialog sin devolver ningún resultado.
    El padre recibe undefined en afterClosed() y no hace nada.
  */
  cancel(): void {
    this.dialogRef.close();
  }
}
