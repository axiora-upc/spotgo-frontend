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
import { TranslatePipe } from '@ngx-translate/core';

/*
  DeleteDialogData son los datos que el padre envía al abrir este dialog.

  existingNames - lista de nombres de croquis que existen actualmente,
                  para validar si el nombre que escribe el admin es válido.
*/
export interface DeleteDialogData {
  existingNames: string[];
}

@Component({
  selector: 'app-delete-dialog',
  imports: [FormsModule, MatButton, TranslatePipe],
  templateUrl: './delete-dialog.component.html',
  styleUrl: './delete-dialog.component.css',
})
export class DeleteDialogComponent {

  /*
    dialogRef permite cerrar este dialog desde adentro.
    Devuelve el nombre a borrar si el admin confirma,
    o undefined si cancela.
  */
  private dialogRef = inject(MatDialogRef<DeleteDialogComponent>);

  /*
    data contiene la lista de nombres existentes enviada por el padre.
  */
  private data = inject<DeleteDialogData>(MAT_DIALOG_DATA);

  // ─── Estado interno ───────────────────────────────────────────────────────

  /*
    nameToDelete es el nombre que el admin escribe en el campo.
    Se enlaza con [(ngModel)] en el template.
  */
  nameToDelete = '';

  /*
    errorMessage contiene la clave de traducción del error a mostrar
    cuando el nombre no existe en la lista.
  */
  errorMessage = signal('');

  // ─── Acciones ─────────────────────────────────────────────────────────────

  /*
    confirm valida el nombre escrito y cierra el dialog si es válido.

    Si el nombre NO existe en la lista → muestra el mensaje de error.
    Si el nombre SÍ existe → cierra el dialog devolviendo el nombre al padre
    para que el padre llame al servicio de borrado.
  */
  confirm(): void {
    const trimmedName = this.nameToDelete.trim();

    /*
      Busca si existe algún croquis con ese nombre.
      La comparación ignora mayúsculas/minúsculas.
    */
    const exists = this.data.existingNames.some(
      (n) => n.toLowerCase() === trimmedName.toLowerCase()
    );

    if (!exists) {
      this.errorMessage.set('settings.blueprint.error-not-found');
      return;
    }

    /*
      Cierra el dialog devolviendo el nombre exacto (con el case original
      que tiene en la lista) para que el servicio pueda borrarlo.
    */
    const originalName = this.data.existingNames.find(
      (n) => n.toLowerCase() === trimmedName.toLowerCase()
    )!;

    this.dialogRef.close(originalName);
  }

  /*
    cancel cierra el dialog sin devolver nada.
    El padre recibe undefined y no realiza ningún borrado.
  */
  cancel(): void {
    this.dialogRef.close();
  }
}
