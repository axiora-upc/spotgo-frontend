/*
  Component e inject son los bloques básicos de Angular moderno.
*/
import { Component, inject } from '@angular/core';

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
                  mostrada como opciones seleccionables en el template.
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

  /*
    existingNames es la lista de croquis subidos que se muestra como
    opciones seleccionables en el template.
  */
  existingNames = this.data.existingNames;

  // ─── Estado interno ───────────────────────────────────────────────────────

  /*
    nameToDelete es el nombre del croquis elegido en la lista.
    Se enlaza con [(ngModel)] en el template.
  */
  nameToDelete = '';

  // ─── Acciones ─────────────────────────────────────────────────────────────

  /*
    confirm cierra el dialog devolviendo el nombre elegido al padre
    para que el padre llame al servicio de borrado.
  */
  confirm(): void {
    if (!this.nameToDelete) return;
    this.dialogRef.close(this.nameToDelete);
  }

  /*
    cancel cierra el dialog sin devolver nada.
    El padre recibe undefined y no realiza ningún borrado.
  */
  cancel(): void {
    this.dialogRef.close();
  }
}
