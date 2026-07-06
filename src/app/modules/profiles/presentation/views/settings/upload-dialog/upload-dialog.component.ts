/*
  Este archivo es el componente Angular que muestra el diálogo (ventana emergente) que aparece
  cuando el administrador quiere subir un croquis (plano) de su estacionamiento.

  El componente hace dos cosas:
    1. Gestiona la subida del archivo de imagen: valida el tipo, el tamaño, y lo prepara
       para guardarlo en el almacenamiento local del navegador.
    2. Analiza la imagen automáticamente para detectar los espacios de estacionamiento (spots)
       que dibujó el administrador en el croquis, sin necesidad de ningún servidor externo.
       Todo el análisis ocurre dentro del navegador usando el Canvas API, que es una
       herramienta estándar de los navegadores para manipular imágenes. No se envía ningún
       dato a ningún servidor externo. No hay llamadas a ninguna API de pago. No hay ningún
       token de credenciales involucrado. El procesamiento es 100 % local en el dispositivo.

  La detección de spots usa el algoritmo BFS (Breadth-First Search, "búsqueda en anchura"),
  que es una forma de explorar una imagen pixel por pixel para encontrar regiones conectadas
  de color claro (los cuadros blancos de los spots en el croquis). Este mismo algoritmo
  fue validado previamente en un script de Node.js con Jimp que producía resultados correctos.
*/

import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

/*
  DetectedSpot es la interfaz (estructura de datos) que define cómo se representa
  un espacio de estacionamiento detectado en el análisis del croquis. Tiene:
    id: número único del spot
    row: fila en la que se encontró (0 = fila A, 1 = fila B, etc.)
    col: columna real dentro de la rejilla de 8 columnas (0 a 7)
    x_pct, y_pct: posición del spot expresada como porcentaje del ancho y alto de la imagen
    w_pct, h_pct: dimensiones del spot expresadas como porcentaje del tamaño de la imagen

  Se importa desde la capa de dominio del módulo "profiles" siguiendo la arquitectura DDD
  (Domain-Driven Design) del proyecto, donde las entidades viven en la carpeta "domain".
*/
import { DetectedSpot } from '../../../../domain/model/detected-spot.entity';


export interface UploadDialogData { existingNames: string[]; }
export interface UploadDialogResult { name: string; dataUrl: string; spots: DetectedSpot[]; }

/*
  RawSpot es una estructura interna, solo visible dentro de este archivo (no se exporta).
  Representa un rectángulo candidato a ser un spot de estacionamiento tal como lo devuelve
  el algoritmo BFS, antes de convertirlo al formato final DetectedSpot.
  Sus campos son coordenadas absolutas en píxeles dentro de la imagen:
    x: columna del píxel más a la izquierda de la región detectada
    y: fila del píxel más arriba de la región detectada
    w: ancho de la región en píxeles (maxX - minX)
    h: alto de la región en píxeles (maxY - minY)
*/
interface RawSpot { x: number; y: number; w: number; h: number; }


@Component({

  selector: 'app-upload-dialog',
  imports: [FormsModule, MatButton, MatIcon, NgClass, TranslatePipe],
  templateUrl: './upload-dialog.component.html',
  styleUrl: './upload-dialog.component.css',
})
export class UploadDialogComponent {

  private dialogRef = inject(MatDialogRef<UploadDialogComponent>);
  private data = inject<UploadDialogData>(MAT_DIALOG_DATA);

  /*
    selectedFile guarda el archivo de imagen que el usuario seleccionó o arrastró.
    Es una signal, así que el HTML puede reaccionar cuando cambia (por ejemplo, para
    mostrar u ocultar el botón de confirmar).
    Empieza en null porque todavía no se ha seleccionado ningún archivo.
  */
  selectedFile = signal<File | null>(null);

  /*
    previewUrl guarda la URL en formato Base64 de la imagen seleccionada.
    Esta URL se puede poner directamente en el atributo src de una etiqueta <img>
    para mostrar la vista previa sin necesidad de subir el archivo a un servidor.
    Empieza en null porque todavía no hay imagen.
  */
  previewUrl = signal<string | null>(null);

  /*
    imageName es el nombre que el administrador le dará al croquis.
    Se inicializa con el nombre del archivo sin extensión cuando el usuario selecciona
    el archivo, pero el administrador puede cambiarlo libremente en el campo de texto.
  */
  imageName = '';
  isDragging = signal(false);

  /*
    errorMessage guarda el mensaje de error que se muestra en el diálogo cuando algo
    va mal: tipo de archivo no permitido, archivo demasiado grande, nombre duplicado, etc.
    Es una clave de traducción (ejemplo: 'settings.blueprint.error-type') que el
    TranslatePipe convierte al texto en el idioma activo.
    Empieza vacío porque no hay error al inicio.
  */
  errorMessage = signal('');

  /*
    detecting indica si el algoritmo de detección de spots está en ejecución.
    Mientras es true se muestra un indicador de carga y el botón de confirmar
    permanece deshabilitado para que el usuario espere a que termine el análisis.
  */
  detecting = signal(false);

  /*
    detectedSpots guarda el array de spots que el algoritmo encontró en la imagen.
    Empieza vacío. Se llena automáticamente cuando el usuario selecciona un archivo
    y el análisis termina. El componente padre (settings.component.ts) recibirá este
    array cuando el administrador confirme la subida.
  */
  detectedSpots = signal<DetectedSpot[]>([]);

  /*
    spotsCount es una signal calculada que siempre contiene el número de spots detectados.
    Se recalcula automáticamente cada vez que detectedSpots cambia. Se usa en el HTML
    para mostrar algo como "Se detectaron 24 spots".
    computed() es equivalente a tener una propiedad get que lee otra propiedad reactiva,
    pero Angular la optimiza para no recalcular si la fuente no cambió.
  */
  spotsCount = computed(() => this.detectedSpots().length);

  /* Permite el tipo de archivos para las imagenes subidas.  */
  private readonly ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

  /*
    MAX_SIZE_BYTES es el tamaño máximo permitido para el archivo de imagen en bytes.
    El cálculo es: 1 (MB) × 1024 (KB/MB) × 1024 (bytes/KB) = 1 048 576 bytes = 1 MB.
  */
  private readonly MAX_SIZE_BYTES = 1 * 1024 * 1024;


  /*
    onFileSelected se ejecuta cuando el usuario hace clic en el área de subida y
    selecciona un archivo desde el explorador de archivos del sistema operativo.
    Si la lista está vacía (el usuario canceló el diálogo de selección), se retorna
    sin hacer nada. Si hay al menos un archivo, se procesa el primero.
  */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.processFile(input.files[0]);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragging.set(true); }
  onDragLeave(): void { this.isDragging.set(false); }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  private async processFile(file: File): Promise<void> {
    if (!this.ALLOWED_TYPES.has(file.type))    { this.errorMessage.set('settings.blueprint.error-type'); return; }
    if (file.size > this.MAX_SIZE_BYTES)        { this.errorMessage.set('settings.blueprint.error-size'); return; }
    if (!(await this.hasValidMagicBytes(file))) { this.errorMessage.set('settings.blueprint.error-type'); return; }

    this.selectedFile.set(file);

    /*
      file.name.replace(/\.[^/.]+$/, '') elimina la extensión del nombre del archivo.
      La expresión regular /\.[^/.]+$/ significa: encuentra un punto seguido de uno o
      más caracteres que no sean punto ni slash, al final de la cadena. Eso es la extensión.
      Ejemplo: "CROQUIS1.png" → "CROQUIS1"
    */
    this.imageName = file.name.replace(/\.[^/.]+$/, '');
    this.errorMessage.set('');
    this.detectedSpots.set([]);

    const dataUrl = await this.readFileAsDataUrl(file);
    this.previewUrl.set(dataUrl);

    this.detecting.set(true);
    try {
      this.detectedSpots.set(await this.detectSpots(dataUrl));
    } catch {
      /*
        Si el análisis falla por cualquier motivo (imagen corrupta, memoria insuficiente,
        etc.), se devuelve un array vacío en lugar de mostrar un error al usuario.
        El administrador podrá igualmente subir el croquis sin spots detectados.
      */
      this.detectedSpots.set([]);
    } finally {
      /*
        El bloque finally se ejecuta siempre, tanto si el try tuvo éxito como si el
        catch capturó un error. Esto garantiza que el indicador de carga desaparece
        sin importar qué ocurrió durante el análisis.
      */
      this.detecting.set(false);
    }
  }

  /*
    readFileAsDataUrl convierte un objeto File (el archivo que el usuario seleccionó)
    en una cadena de texto en formato Data URL. Un Data URL tiene la forma:
      "data:image/png;base64,iVBORw0KGgo..."
    donde después de la coma viene la imagen codificada en Base64 (texto ASCII que
    representa los bytes binarios de la imagen). Esta cadena se puede poner directamente
    en el src de un <img> o pasarla al Canvas para analizar los pixels.

    FileReader es la API estándar del navegador para leer archivos locales. Como la
    lectura es asíncrona (puede tardar), se envuelve en una Promise para poder usar
    await en el código que la llama.
  */
  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise(resolve => {
      /*
        Se crea una instancia de FileReader. No acepta el archivo directamente en el
        constructor; hay que llamar a uno de sus métodos de lectura.
      */
      const r = new FileReader();

      /*
        onload es el evento que FileReader dispara cuando termina de leer el archivo.
        En ese momento, r.result contiene el Data URL como string.
        El cast "as string" es necesario porque TypeScript sabe que r.result puede
        ser string o ArrayBuffer dependiendo del método de lectura que se usó.
        Como usamos readAsDataURL, siempre es string.
      */
      r.onload = () => resolve(r.result as string);

      /*
        readAsDataURL inicia la lectura. Es asíncrona: el método retorna inmediatamente
        y onload se llama cuando la lectura termina (puede ser milisegundos después).
      */
      r.readAsDataURL(file);
    });
  }

  /*
    hasValidMagicBytes verifica que el archivo realmente sea del formato que dice ser
    leyendo su firma binaria (los primeros bytes del archivo, llamados "magic bytes"
    o "file signature"). Cada formato de imagen tiene una secuencia única de bytes
    al inicio del archivo que lo identifica inequívocamente.

    Pasos:
      file.slice(0, 12) toma solo los primeros 12 bytes del archivo (no lo lee entero).
      .arrayBuffer() convierte esos bytes en un ArrayBuffer (bloque de memoria binaria).
      new Uint8Array(...) crea una vista del buffer como array de enteros de 8 bits (0-255).

    Firmas que se verifican:
      PNG: empieza con los bytes 0x89 0x50 0x4E 0x47 (en texto: "\x89PNG").
      JPEG: empieza con 0xFF 0xD8 0xFF (marca SOI de JPEG).
      WebP: empieza con "RIFF" (0x52 0x49 0x46 0x46) y tiene "WEBP" en bytes 8-11
            (0x57 0x45 0x42 0x50).

    Los valores en hexadecimal (0x) son la misma cosa que los números decimales pero
    escritos en base 16, que es como se representan convencionalmente los bytes.
  */
  private async hasValidMagicBytes(file: File): Promise<boolean> {
    const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    return (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47)
        || (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF)
        || (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
         && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50);
  }


  /*
    detectSpots es el método orquestador del análisis. Coordina los cuatro pasos
    del algoritmo en secuencia y devuelve el array final de DetectedSpot.

    El flujo completo es:
      1. loadBinary: decodifica la imagen y la convierte en una matriz de booleanos
                     donde true = pixel oscuro (borde) y false = pixel claro (interior de spot).
      2. findRectangles: recorre la matriz con el algoritmo BFS para encontrar todas las
                         regiones conectadas de pixels claros que tienen forma y tamaño de spot.
      3. dedup: elimina duplicados (regiones que se solapan más del 50 %) para no
                contar el mismo spot dos veces si el BFS encontró variantes del mismo rectángulo.
      4. groupAndSort: agrupa los spots detectados en filas horizontales y les asigna
                       el número de columna correcto dentro de la rejilla de 8 columnas.

    El parámetro "dataUrl" es la imagen en formato Base64 que viene de readFileAsDataUrl.
    El tipo de retorno Promise<DetectedSpot[]> indica que la función es asíncrona y cuando
    termina entrega un array de DetectedSpot.
  */
  private async detectSpots(dataUrl: string): Promise<DetectedSpot[]> {
    const { binary, w, h } = await this.loadBinary(dataUrl);
    const raw   = this.findRectangles(binary, w, h, w * h);
    const clean = this.dedup(raw);
    return this.groupAndSort(clean, w, h);
  }

  /*
    loadBinary toma el Data URL de la imagen y produce una matriz bidimensional de booleanos
    del mismo tamaño que la imagen en pixels (alto × ancho).

    Cada celda binary[y][x] vale:
      true  → ese pixel es oscuro (borde negro del cuadro del spot, líneas del croquis)
      false → ese pixel es claro (interior blanco del spot o fondo de la página)

    El algoritmo BFS que viene después solo necesita saber "oscuro o claro" para cada pixel.
    Convertir a booleanos aquí simplifica el código del BFS y reduce la memoria usada.

    Por qué se usa Canvas API en lugar de leer el archivo directamente:
    El archivo es binario comprimido (PNG, JPEG, WebP). Decodificarlo a pixels crudos
    requiere un decodificador. El Canvas API del navegador incluye ese decodificador
    de forma nativa y eficiente. Solo hay que dibujar la imagen en un canvas y luego
    leer los pixels con getImageData.

    El método devuelve una Promise porque cargar una imagen (<img> tag) es asíncrono:
    el navegador dispara el evento onload cuando la imagen está lista en memoria.
  */
  private loadBinary(dataUrl: string): Promise<{ binary: boolean[][]; w: number; h: number }> {
    return new Promise((resolve, reject) => {
      /*
        Se crea un elemento <img> en memoria (no se añade al DOM, no es visible).
        Solo se usa para que el navegador decodifique el Data URL de la imagen.
      */
      const img = new Image();

      img.onload = () => {
        /*
          Se crea un elemento <canvas> en memoria (tampoco visible en el DOM).
          El canvas tiene exactamente las mismas dimensiones en pixels que la imagen
          original para que no haya redimensionamiento ni interpolación que altere
          los valores de los pixels.
        */
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth;   // ancho real de la imagen en pixels
        canvas.height = img.naturalHeight;  // alto real de la imagen en pixels

        /*
          getContext('2d') obtiene el contexto 2D del canvas, que es el objeto con
          todos los métodos para dibujar. El signo "!" al final le dice a TypeScript
          que asumimos que getContext nunca retorna null (lo cual es correcto para '2d').
        */
        const ctx = canvas.getContext('2d')!;

        /*
          drawImage dibuja la imagen en el canvas comenzando desde la esquina superior
          izquierda (coordenadas 0, 0). A partir de este momento los pixels de la imagen
          están disponibles para leer en el canvas.
        */
        ctx.drawImage(img, 0, 0);

        /*
          getImageData extrae los datos crudos de los pixels del canvas.
          Devuelve un objeto ImageData cuya propiedad "data" es un Uint8ClampedArray
          (array de enteros de 0 a 255) con los valores RGBA de cada pixel en secuencia.
          El array tiene longitud = ancho × alto × 4 porque cada pixel ocupa 4 posiciones:
          [R, G, B, A, R, G, B, A, R, G, B, A, ...]
          donde R=rojo, G=verde, B=azul, A=alpha (transparencia).
        */
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const w = canvas.width;
        const h = canvas.height;

        /*
          Se crea la matriz de booleanos con dimensiones [h][w] (filas × columnas).
          Array.from({ length: h }, ...) crea un array de h filas.
          Para cada fila se crea un array de w valores, todos inicializados a false
          (asumimos que todo es claro hasta que calculemos el gris de cada pixel).
        */
        const binary = Array.from({ length: h }, () => new Array<boolean>(w).fill(false));

        /*
          Se recorre cada pixel de la imagen fila por fila (y) y columna por columna (x).
        */
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            /*
              Calcular el índice en el array "data" donde empieza el pixel (x, y).
              Cada fila tiene w pixels, y cada pixel ocupa 4 bytes (RGBA).
              Pixel en columna x, fila y → índice = (y × w + x) × 4
              Luego data[i] = R, data[i+1] = G, data[i+2] = B, data[i+3] = A.
            */
            const i = (y * w + x) * 4;

            /*
              Convertir el color RGB a escala de grises usando la fórmula de luminancia
              perceptual estándar ITU-R BT.601. Los tres coeficientes (0.299, 0.587, 0.114)
              corresponden al peso visual que el ojo humano le da a cada canal de color:
              verde se percibe más brillante que rojo, y rojo más que azul.
              El resultado "gray" es un número entre 0 (negro absoluto) y 255 (blanco puro).
            */
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

            /*
              Si el gris es menor que 200, el pixel se considera oscuro (borde del spot).
              El umbral de 200 (sobre 255) es deliberadamente alto para que los grises
              muy claros (como manchas de impresión o sombras leves del escaneo) no se
              clasifiquen como bordes oscuros y así el interior del spot quede limpio.
            */
            binary[y][x] = gray < 200;
          }
        }

        resolve({ binary, w, h });
      };

      /*
        Si la imagen no se puede cargar (Data URL inválido, imagen corrupta), onload
        nunca se dispara. onerror se dispara en su lugar y se rechaza la Promise para
        que el catch en processFile capture el error.
      */
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));

      /*
        Asignar el Data URL al src del elemento img dispara la carga de la imagen.
        El navegador decodifica el Base64, construye la imagen en memoria y luego
        dispara onload (o onerror si algo falla). Esto ocurre de forma asíncrona.
      */
      img.src = dataUrl;
    });
  }

  /*
    findRectangles implementa el algoritmo BFS (Breadth-First Search) para encontrar
    todas las regiones conectadas de pixels claros en la imagen binaria.

    La idea central es: un espacio de estacionamiento en un croquis es un rectángulo
    con borde oscuro (negro) e interior claro (blanco). Si exploramos todos los pixels
    claros que están conectados entre sí (tocan por los lados, no por diagonal), cada
    grupo de pixels claros conectados corresponde al interior de un espacio de estacionamiento.

    Luego se filtran esos grupos por:
      - Área mínima: descartar regiones muy pequeñas (ruido, manchas, letras del texto)
      - Área máxima: descartar regiones muy grandes (el fondo entero de la página)
      - Proporción aspecto (width/height): descartar formas muy alargadas que no son spots
      - Densidad de relleno: verificar que la región sea mayormente rectangular y no
        tenga demasiados huecos oscuros internos

    Parámetros:
      binary:  la matriz de booleanos producida por loadBinary
      w:       ancho de la imagen en pixels
      h:       alto de la imagen en pixels
      imgArea: área total de la imagen en pixels cuadrados (w × h), usada para calcular
               qué porcentaje del total ocupa cada región candidata

    Devuelve: array de RawSpot, cada uno con la posición y tamaño del rectángulo detectado
  */
  private findRectangles(binary: boolean[][], w: number, h: number, imgArea: number): RawSpot[] {
    /*
      visited es una matriz del mismo tamaño que binary. Cada celda visited[y][x] se
      pone en true cuando el BFS ya procesó ese pixel. Esto evita que el mismo pixel
      se procese varias veces y que se formen ciclos infinitos en el recorrido.
    */
    const visited: boolean[][] = Array.from({ length: h }, () => new Array<boolean>(w).fill(false));

    /*
      spots acumulará los rectángulos que pasen todos los filtros.
    */
    const spots: RawSpot[] = [];

    /*
      Doble bucle que recorre cada pixel de la imagen de arriba a abajo y de izquierda
      a derecha. Es el punto de partida para encontrar nuevas regiones no visitadas.
    */
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        /*
          Si el pixel ya fue visitado o es oscuro (borde), se salta.
          Solo se inicia un BFS desde pixels claros no visitados, que son el interior
          de potenciales spots que todavía no se han explorado.
        */
        if (binary[y][x] || visited[y][x]) continue;

        /*
          Se encontró un pixel claro no visitado: inicio del BFS para explorar toda
          la región conectada de pixels claros que incluye este pixel.

          queue es la cola de pixels pendientes de procesar. Se inicializa con el pixel
          actual. El BFS procesa pixels en orden FIFO (primero en entrar, primero en salir),
          lo que garantiza que explora la región de forma uniforme hacia afuera (en anchura).
        */
        const queue: [number, number][] = [[x, y]];

        /*
          minX, maxX, minY, maxY registran el rectángulo delimitador (bounding box)
          de todos los pixels de esta región. Se actualizan a medida que el BFS
          va encontrando más pixels. Al final, el bounding box define el spot candidato.
        */
        let minX = x, maxX = x, minY = y, maxY = y;

        /*
          Marcar el pixel inicial como visitado para que no vuelva a entrar en la cola.
        */
        visited[y][x] = true;

        /*
          size cuenta cuántos pixels claros hay en esta región. Se usa después para
          calcular la densidad de relleno (qué fracción del bounding box está realmente
          cubierta por pixels claros de la región, en lugar de huecos oscuros internos).
        */
        let size = 0;

        /*
          Bucle principal del BFS: procesa pixels de la cola uno por uno hasta que
          no quedan más pixels pendientes. Cuando la cola se vacía, se ha explorado
          toda la región conectada.
        */
        while (queue.length) {
          /*
            queue.shift() saca el primer elemento de la cola (FIFO). Desestructura la
            tupla [x, y] en las variables cx (current x) y cy (current y).
            El signo "!" al final le dice a TypeScript que shift() no retornará undefined
            aquí, porque verificamos queue.length antes del bucle.
          */
          const [cx, cy] = queue.shift()!;

          /*
            Contar este pixel como parte del área de la región.
          */
          size++;

          /*
            Actualizar el bounding box si este pixel está más a la izquierda, derecha,
            arriba o abajo que los pixels ya procesados.
          */
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          /*
            Explorar los 4 vecinos del pixel actual: derecha [1,0], izquierda [-1,0],
            abajo [0,1], arriba [0,-1]. No se exploran diagonales porque en un croquis
            impreso los bordes son líneas horizontales y verticales, y las diagonales
            podrían unir regiones que visualmente parecen separadas.
          */
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) {
            const nx = cx + dx;  // coordenada x del vecino
            const ny = cy + dy;  // coordenada y del vecino

            /*
              Descartar vecinos que están fuera de los límites de la imagen,
              que ya fueron visitados, o que son pixels oscuros (bordes del spot).
              Solo se añaden a la cola los pixels claros no visitados dentro de la imagen.
            */
            if (nx < 0 || nx >= w || ny < 0 || ny >= h || visited[ny][nx] || binary[ny][nx]) continue;

            /*
              Marcar como visitado antes de añadir a la cola para que otros pixels
              vecinos no vuelvan a añadirlo. Esto es crucial para la corrección del BFS.
            */
            visited[ny][nx] = true;
            queue.push([nx, ny]);
          }
        }

        /*
          Al terminar el BFS, se tienen las dimensiones del bounding box de esta región.
          rw (region width) y rh (region height) son el ancho y alto en pixels del
          rectángulo que encierra a todos los pixels de la región explorada.
        */
        const rw = maxX - minX;
        const rh = maxY - minY;

        /*
          area es el número de pixels que tendría el bounding box si fuera completamente
          sólido (rw × rh). Es diferente de "size", que solo cuenta los pixels claros
          reales de la región. Un spot perfecto tendría size ≈ area.
          Un spot con letras o marcas internas tendría size < area.
        */
        const area = rw * rh;

        /*
          Filtro 1: Tamaño del bounding box relativo al tamaño total de la imagen.

          Si area < imgArea × 0.004 (menos del 0.4 % del total): la región es demasiado
          pequeña para ser un spot. Probablemente es ruido de impresión, una letra, o
          un punto accidental.

          Si area > imgArea × 0.12 (más del 12 % del total): la región es demasiado grande
          para ser un spot individual. Probablemente es el fondo de la página o una zona
          muy grande sin bordes.

          "continue" salta a la siguiente iteración del bucle de pixels externo sin
          añadir esta región a la lista de candidatos.
        */
        if (area < imgArea * 0.004 || area > imgArea * 0.12) continue;

        /*
          Filtro 2: Proporción de aspecto (aspect ratio).
          aspect = ancho / alto. Un cuadrado tiene aspect = 1.
          Un rectángulo horizontal (más ancho que alto) tiene aspect > 1.
          Un rectángulo vertical (más alto que ancho) tiene aspect < 1.

          Se descartan regiones con aspect < 0.3 (demasiado altas y estrechas, como
          una franja vertical) o > 2.0 (demasiado anchas y bajas, como una franja
          horizontal). Los spots de estacionamiento típicos tienen proporciones en este rango.
        */
        const aspect = rw / rh;
        if (aspect < 0.3 || aspect > 2.0) continue;

        /*
          Filtro 3: Densidad de relleno.
          size / area indica qué fracción del bounding box está cubierta por pixels
          claros de la región. Si es < 0.6 (menos del 60 %), el interior tiene demasiados
          huecos oscuros para ser un spot estándar, posiblemente es texto, una zona con
          mucho sombreado, o una región mal formada. Un spot bien dibujado debería
          tener el interior mayormente blanco, dando densidad ≈ 0.9 o superior.
        */
        if (size / area < 0.6) continue;

        /*
          Esta región pasó todos los filtros: se registra como un spot candidato.
          Se guarda su posición (esquina superior izquierda) y dimensiones en pixels.
        */
        spots.push({ x: minX, y: minY, w: rw, h: rh });
      }
    }

    return spots;
  }

  /*
    dedup (abreviatura de "deduplication", eliminación de duplicados) recibe la lista
    de spots candidatos del BFS y elimina los que se solapan demasiado entre sí.

    ¿Por qué pueden haber duplicados? Porque el BFS puede encontrar múltiples regiones
    conectadas dentro del mismo spot visual, especialmente si el interior del spot tiene
    alguna zona oscura que lo divide. Esas sub-regiones darán bounding boxes que se
    solapan con el bounding box del spot completo.

    El criterio de solapamiento que se usa es IoU (Intersection over Union):
      IoU = Área de intersección / Área de unión
    Si IoU > 0.5 (más del 50 % de solapamiento), se considera que dos regiones
    detectan el mismo spot y se descarta la más grande.

    La estrategia es: ordenar las regiones de menor a mayor área, procesar las pequeñas
    primero, y descartar las grandes que se solapan con las pequeñas ya procesadas.
    Esto preserva la región más compacta (pequeña), que suele ser la más precisa.
  */
  private dedup(spots: RawSpot[]): RawSpot[] {
    /*
      Se crea una copia ordenada por área ascendente (más pequeñas primero).
      El spread [...spots] es necesario para no modificar el array original.
      a.w * a.h calcula el área del spot a. Si el resultado es negativo, a va antes que b.
    */
    const sorted = [...spots].sort((a, b) => a.w * a.h - b.w * b.h);

    /*
      used es un conjunto de índices de spots que ya fueron marcados como duplicados
      y deben descartarse. Usar un Set es eficiente para verificar membresía con .has().
    */
    const used = new Set<number>();

    /*
      keep acumulará los spots que sobreviven la deduplicación.
    */
    const keep: RawSpot[] = [];

    for (let i = 0; i < sorted.length; i++) {
      /*
        Si este spot ya fue marcado como duplicado por un spot anterior, se salta.
      */
      if (used.has(i)) continue;

      /*
        Este spot no es duplicado de ningún spot anterior: se conserva.
      */
      keep.push(sorted[i]);
      const s1 = sorted[i];

      /*
        Ahora se busca en todos los demás spots cuáles se solapan demasiado con s1.
      */
      for (let j = 0; j < sorted.length; j++) {
        if (i === j || used.has(j)) continue;

        const s2 = sorted[j];

        /*
          Calcular el rectángulo de intersección entre s1 y s2.
          La intersección empieza en (max de los inicios, max de los inicios) y termina
          en (min de los finales, min de los finales).

          ix, iy: esquina superior izquierda de la intersección
          ix2, iy2: esquina inferior derecha de la intersección

          Si ix2 <= ix o iy2 <= iy, la intersección tiene área cero (no se solapan).
        */
        const ix  = Math.max(s1.x, s2.x);
        const iy  = Math.max(s1.y, s2.y);
        const ix2 = Math.min(s1.x + s1.w, s2.x + s2.w);
        const iy2 = Math.min(s1.y + s1.h, s2.y + s2.h);

        if (ix2 > ix && iy2 > iy) {
          /*
            Hay intersección: calcular su área.
          */
          const inter = (ix2 - ix) * (iy2 - iy);

          /*
            Calcular el área de la unión de ambos rectángulos.
            La unión es la suma de las dos áreas menos la intersección (que se contaría
            dos veces si no se restara).
          */
          const union = s1.w * s1.h + s2.w * s2.h - inter;

          /*
            Si la fracción de solapamiento (IoU) supera el 50 %, se considera que
            s2 es un duplicado de s1 y se marca para descartarlo.
            Como s1 es más pequeño que s2 (los spots están ordenados por área),
            se prefiere quedarse con s1.
          */
          if (inter / union > 0.5) used.add(j);
        }
      }
    }

    return keep;
  }

  /*
    groupAndSort agrupa los spots candidatos en filas horizontales y les asigna
    el número de columna correcto dentro de una rejilla de 8 columnas (0 a 7).

    Por qué es necesario este paso:
    El BFS devuelve spots como coordenadas sueltas en píxeles, sin ninguna noción
    de fila o columna. Para mostrar el mapa de estacionamiento correctamente, necesitamos
    saber que un spot está en la "fila B" y la "columna 4". Este método hace esa
    conversión.

    La asignación de columna usa el espaciado relativo entre spots consecutivos en
    lugar de dividir la posición X por un ancho de columna fijo. Esto es más robusto
    porque:
      - El croquis puede tener márgenes de cualquier tamaño
      - Los spots en los bordes de la imagen no caen justo en los límites de las celdas
      - Dos spots muy juntos no colisionan en la misma columna como ocurría antes

    Parámetros:
      spots: los spots candidatos después de la deduplicación
      wImg:  ancho de la imagen en pixels
      hImg:  alto de la imagen en pixels

    Devuelve: array de DetectedSpot con row, col, y posiciones en porcentaje
  */
  private groupAndSort(spots: RawSpot[], wImg: number, hImg: number): DetectedSpot[] {
    if (!spots.length) return [];

    /*
      GRID_COLS es el número de columnas de la rejilla del estacionamiento.
      El croquis del administrador siempre tiene máximo 8 columnas por fila.
    */
    const GRID_COLS = 8;

    /*
      colWidth es el ancho teórico de cada columna si los spots estuvieran perfectamente
      distribuidos a lo largo de toda la imagen. Se usa como referencia para anclar
      el primer spot de cada fila y como valor de respaldo para el unitStep.
    */
    const colWidth = wImg / GRID_COLS;

    /*
      Calcular la altura promedio de todos los spots. Se usa para definir la "tolerancia"
      de agrupamiento en filas: dos spots pertenecen a la misma fila si sus centros
      verticales están a menos de (avgH × 0.5) pixels de distancia.
    */
    const avgH = spots.reduce((s, r) => s + r.h, 0) / spots.length;

    /*
      tolerance es la distancia vertical máxima entre los centros de dos spots para
      que se consideren de la misma fila. Si la diferencia vertical supera este valor,
      el segundo spot empieza una nueva fila. Usar la mitad de la altura promedio (0.5)
      funciona bien porque los spots de una fila estarán mucho más cerca entre sí
      verticalmente que los de filas diferentes.
    */
    const tolerance = avgH * 0.5;

    /*
      Ordenar todos los spots por su centro Y (vertical) de menor a mayor.
      El centro Y de un spot es su coordenada superior (s.y) más la mitad de su altura (s.h/2).
      Este orden es necesario para agrupar en filas de arriba hacia abajo.
      El spread [...spots] evita modificar el array original.
    */
    const byY = [...spots].sort((a, b) => (a.y + a.h / 2) - (b.y + b.h / 2));

    /*
      rows será un array de filas, donde cada fila es a su vez un array de spots.
      Al final tendrá tantos elementos como filas detectó el algoritmo (típicamente 4).
    */
    const rows: RawSpot[][] = [];

    /*
      Se inicia con la primera fila conteniendo el primer spot (el más alto de la imagen).
    */
    let currentRow = [byY[0]];

    /*
      Iterar sobre los spots restantes y decidir si cada uno pertenece a la misma fila
      que el spot anterior o empieza una nueva fila.
    */
    for (let i = 1; i < byY.length; i++) {
      /*
        Calcular el centro Y promedio de todos los spots que ya están en la fila actual.
        Se usa el promedio (no solo el último) para que la fila no "derive" gradualmente
        hacia arriba o abajo si los spots tienen ligeras variaciones de altura por el escaneo.
      */
      const cyPrev = currentRow.reduce((s, r) => s + r.y + r.h / 2, 0) / currentRow.length;

      /*
        Centro Y del spot que se está evaluando ahora.
      */
      const cyCurr = byY[i].y + byY[i].h / 2;

      if (Math.abs(cyCurr - cyPrev) < tolerance) {
        /*
          La diferencia vertical es menor que la tolerancia: este spot es de la misma
          fila horizontal que los anteriores. Se añade a la fila actual.
        */
        currentRow.push(byY[i]);
      } else {
        /*
          La diferencia vertical supera la tolerancia: este spot está en una fila distinta.
          Se guarda la fila actual y se empieza una nueva con este spot.
        */
        rows.push(currentRow);
        currentRow = [byY[i]];
      }
    }

    /*
      No olvidar añadir la última fila, que nunca se guarda dentro del bucle
      porque el bucle solo guarda una fila cuando encuentra la siguiente.
    */
    rows.push(currentRow);

    /*
      id es un contador que se incrementa por cada spot para asignarle un identificador
      numérico único. Se usa en el DetectedSpot.id que luego el store usa para crear
      los IDs de tipo "A1", "B3", etc.
    */
    let id = 1;

    /*
      result acumulará todos los DetectedSpot finales con su fila, columna y posición.
    */
    const result: DetectedSpot[] = [];

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      /*
        Ordenar los spots de esta fila de izquierda a derecha por su centro X.
        Esto es necesario para iterar los spots en orden y calcular el espaciado
        entre spots consecutivos.
      */
      const sorted  = [...rows[rowIdx]].sort((a, b) => (a.x + a.w / 2) - (b.x + b.w / 2));

      /*
        centers es un array con el centro X en pixels de cada spot, en orden izquierda a derecha.
        El centro X de un spot es su borde izquierdo (s.x) más la mitad de su ancho (s.w / 2).
      */
      const centers = sorted.map(s => s.x + s.w / 2);

      /*
        Calcular el "paso unitario de columna" (unitStep): la distancia en pixels entre
        los centros de dos spots adyacentes (sin hueco entre ellos).

        Estrategia: el espaciado mínimo entre cualquier par de spots consecutivos en
        esta fila es aproximadamente igual al ancho de una columna de la rejilla,
        porque dos spots adyacentes solo tienen el grosor del borde entre ellos.

        Si hay un hueco vacío entre dos spots (un espacio de estacionamiento ausente),
        el espaciado será ≈ 2× el unitStep. Si hay dos huecos, ≈ 3× el unitStep, etc.
        Math.round(distancia / unitStep) dará 1, 2 o 3, que es exactamente cuántas
        columnas de rejilla avanzar para el siguiente spot.

        Esta técnica resuelve el problema de colisión que existía antes: con la fórmula
        Math.floor(centerX / colWidth), dos spots al borde derecho de la imagen podían
        mapearse al mismo número de columna, y uno "pisaba" al otro en el Map del store.
      */
      let unitStep = colWidth;  // valor de respaldo si solo hay un spot en la fila

      if (centers.length > 1) {
        /*
          spacings es el array de distancias entre centros consecutivos.
          centers.slice(1) es todos los centros excepto el primero.
          Para cada elemento en esa lista, se resta el centro anterior (centers[i]).
          El índice i en el .map corresponde al índice en centers.slice(1), que es
          exactamente centers[i + 1] - centers[i].
        */
        const spacings   = centers.slice(1).map((c, i) => c - centers[i]);
        const minSpacing = Math.min(...spacings);

        /*
          Guardia de seguridad: si el espaciado mínimo es demasiado pequeño (menos
          de un cuarto de colWidth), probablemente dos spots del BFS se solaparon
          accidentalmente. En ese caso se usa colWidth como unitStep para no
          distorsionar el cálculo del resto de la fila.
        */
        unitStep = minSpacing > colWidth / 4 ? minSpacing : colWidth;
      }

      /*
        Anclar el primer spot de la fila usando su posición absoluta en la imagen.
        Math.floor(centers[0] / colWidth) devuelve el índice de columna (0-7) basándose
        en qué fracción de la imagen ocupa el centro del primer spot.
        Math.min(..., GRID_COLS - 1) asegura que el resultado no supere el índice máximo (7).

        El primer spot usa esta fórmula absoluta para que el resto de la fila se ancle
        en la posición correcta de la rejilla. Los spots siguientes usan el unitStep
        relativo para no depender del ancho de la imagen.
      */
      let col = Math.min(GRID_COLS - 1, Math.floor(centers[0] / colWidth));

      for (let i = 0; i < sorted.length; i++) {
        if (i > 0) {
          /*
            Calcular cuántas columnas de rejilla hay entre el spot anterior y este.
            Math.round devuelve el entero más cercano. Si la distancia es exactamente
            un unitStep, da 1 (spots adyacentes). Si es 2× unitStep, da 2 (hay un hueco).
            Math.max(1, ...) garantiza que siempre avanzamos al menos una columna
            (no puede haber dos spots en la misma columna dentro del mismo row).
            Math.min(..., GRID_COLS - 1) previene desbordarse más allá de la columna 7.
          */
          const steps = Math.max(1, Math.round((centers[i] - centers[i - 1]) / unitStep));
          col = Math.min(GRID_COLS - 1, col + steps);
        }

        const s = sorted[i];

        result.push({
          id:    crypto.randomUUID(),
          code:  id++,
          row:   rowIdx,
          col,
          /*
            Posición y dimensiones del spot expresadas como porcentaje del tamaño de la imagen.
            Esto hace que los datos sean independientes de la resolución de la imagen:
            un spot en el 25 % del ancho seguirá estando en el 25 % aunque la imagen sea
            de 800 px o de 3000 px.

            parseFloat(...toFixed(2)) redondea a 2 decimales y elimina los ceros innecesarios
            que dejaría toFixed() solo (ejemplo: 25.00 → 25, 12.57345 → 12.57).
          */
          x_pct: parseFloat((s.x / wImg * 100).toFixed(2)),
          y_pct: parseFloat((s.y / hImg * 100).toFixed(2)),
          w_pct: parseFloat((s.w / wImg * 100).toFixed(2)),
          h_pct: parseFloat((s.h / hImg * 100).toFixed(2)),
        });
      }
    }

    /*
      Ordenar el resultado final primero por fila (de arriba hacia abajo) y dentro de cada
      fila por columna (de izquierda a derecha). Esto produce la secuencia natural A1, A2,
      ..., A8, B1, B2, ..., D8 que espera el MonitoringStore.
    */
    return result.sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col);
  }


  /*
    canUpload es una propiedad calculada (getter) que devuelve true solo cuando
    se puede habilitar el botón de confirmar. Las tres condiciones que deben cumplirse:
      1. selectedFile() !== null: el usuario ya seleccionó un archivo de imagen
      2. imageName.trim().length > 0: el administrador escribió un nombre (no vacío)
      3. !this.detecting(): el análisis de detección de spots ya terminó
    El HTML usa [disabled]="!canUpload" para deshabilitar el botón cuando no se cumplen.
  */
  get canUpload(): boolean {
    return this.selectedFile() !== null && this.imageName.trim().length > 0 && !this.detecting();
  }

  /*
    confirm se ejecuta cuando el administrador hace clic en el botón de confirmar subida.

    Primero verifica que el nombre no sea un duplicado de uno ya existente (comparación
    sin distinción de mayúsculas con .toLowerCase() para que "Croquis1" y "croquis1"
    se consideren iguales).

    Si hay duplicado: muestra el error y no cierra el diálogo.

    Si no hay duplicado: cierra el diálogo con dialogRef.close() y entrega el resultado
    al componente padre. El "satisfies UploadDialogResult" es una verificación de tipo
    de TypeScript que confirma que el objeto tiene exactamente la forma correcta.

    El componente padre (settings.component.ts) recibe este objeto en el callback del
    afterClosed() del MatDialog y lo guarda en el BlueprintStorageService.
  */
  confirm(): void {
    const name = this.imageName.trim();
    if (this.data.existingNames.some(n => n.toLowerCase() === name.toLowerCase())) {
      this.errorMessage.set('settings.blueprint.error-duplicate');
      return;
    }
    this.dialogRef.close({ name, dataUrl: this.previewUrl()!, spots: this.detectedSpots() } satisfies UploadDialogResult);
  }

  /*
    cancel se ejecuta cuando el administrador hace clic en cancelar o cierra el diálogo
    sin confirmar. dialogRef.close() sin argumentos cierra el diálogo y el componente
    padre recibe undefined en el callback de afterClosed(), lo que indica que se canceló.
  */
  cancel(): void { this.dialogRef.close(); }
}
