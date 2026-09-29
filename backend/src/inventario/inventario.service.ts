import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import { Categoria } from './entities/categoria.entity';
import { Producto } from './entities/producto.entity';
import { InventarioUploadResponseDto } from './dto/inventario-upload-response.dto';

interface RawRowData {
  rowNum: number;
  nombre: string;
  sku: string;
  categoriaNombre: string;
  stock: number;
  color: string;
  talla: string | null;
  modelo: string;
  estado: string;
}

@Injectable()
export class InventarioService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Normaliza encabados o cadenas quitando tildes, espacios extras y convirtiendo a minúsculas
   */
  private normalizeText(text: string): string {
    if (!text) return '';
    return text
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Procesa el archivo Excel cargado en memoria
   */
  async procesarExcel(file: Express.Multer.File): Promise<InventarioUploadResponseDto> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Debe proporcionar un archivo Excel válido (.xlsx).');
    }

    // 1. Leer el archivo Excel desde el buffer
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer' });
    } catch (err) {
      throw new BadRequestException('El archivo proporcionado no es un Excel válido.');
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new BadRequestException('El archivo Excel no contiene hojas de trabajo.');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    // Obtener los datos como array de arrays de cualquier tipo
    const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!rawMatrix || rawMatrix.length <= 1) {
      return {
        mensaje: 'El archivo Excel está vacío o solo contiene encabezados.',
        totalRegistrosLeidos: 0,
        totalRegistrosInsertados: 0,
        totalRegistrosActualizados: 0,
        erroresEncontrados: 0,
        errores: [],
        detalle: {
          insertadosPorColor: {},
          insertadosPorModelo: {},
        },
      };
    }

    // 2. Identificar indices de columnas según los encabezados (Fila 0)
    const headerRow = rawMatrix[0];
    const columnIndices = {
      nombre: -1,
      sku: -1,
      categoria: -1,
      stock: -1,
      color: -1,
      talla: -1,
      modelo: -1,
      estado: -1,
    };

    headerRow.forEach((colName: any, idx: number) => {
      const normalized = this.normalizeText(colName);
      if (['nombreproducto', 'nombre', 'producto'].includes(normalized)) {
        columnIndices.nombre = idx;
      } else if (['sku'].includes(normalized)) {
        columnIndices.sku = idx;
      } else if (['categoria', 'nombrecategoria', 'id_categoria'].includes(normalized)) {
        columnIndices.categoria = idx;
      } else if (['cantidad', 'stock'].includes(normalized)) {
        columnIndices.stock = idx;
      } else if (['color'].includes(normalized)) {
        columnIndices.color = idx;
      } else if (['talla'].includes(normalized)) {
        columnIndices.talla = idx;
      } else if (['modelo'].includes(normalized)) {
        columnIndices.modelo = idx;
      } else if (['activo', 'estado'].includes(normalized)) {
        columnIndices.estado = idx;
      }
    });

    // Validar encabezados requeridos
    const missingHeaders: string[] = [];
    if (columnIndices.nombre === -1) missingHeaders.push('Nombre Producto');
    if (columnIndices.sku === -1) missingHeaders.push('SKU');
    if (columnIndices.categoria === -1) missingHeaders.push('Categoría');
    if (columnIndices.stock === -1) missingHeaders.push('Cantidad');
    if (columnIndices.color === -1) missingHeaders.push('Color');
    if (columnIndices.modelo === -1) missingHeaders.push('Modelo');

    if (missingHeaders.length > 0) {
      throw new BadRequestException(
        `El archivo Excel no contiene las columnas requeridas: ${missingHeaders.join(', ')}`,
      );
    }

    // 3. EFICIENCIA: Cargar todas las categorías una sola vez en memoria (Map)
    const categoriaRepo = this.dataSource.getRepository(Categoria);
    const categoriasBd = await categoriaRepo.find();
    const mapCategorias = new Map<string, Categoria>();
    categoriasBd.forEach((cat) => {
      mapCategorias.set(this.normalizeText(cat.nombre_categoria), cat);
    });

    // 4. Mapear y validar filas
    const errores: string[] = [];
    const filasValidas: RawRowData[] = [];
    const skusEnExcel = new Set<string>();

    const dataRows = rawMatrix.slice(1);
    const totalRegistrosLeidos = dataRows.length;

    dataRows.forEach((row, index) => {
      const rowNum = index + 2; // Fila 1 es el encabezado en Excel

      // Si la fila está completamente vacía, la ignoramos
      if (!row || row.length === 0 || row.every((val) => val === null || val === undefined || val === '')) {
        return;
      }

      const nombre = row[columnIndices.nombre]?.toString().trim() || '';
      const sku = row[columnIndices.sku]?.toString().trim() || '';
      const categoriaNombre = row[columnIndices.categoria]?.toString().trim() || '';
      const stockRaw = row[columnIndices.stock];
      const color = row[columnIndices.color]?.toString().trim() || '';
      const talla = columnIndices.talla !== -1 && row[columnIndices.talla] ? row[columnIndices.talla].toString().trim() : null;
      const modelo = row[columnIndices.modelo]?.toString().trim() || '';
      const estadoRaw = columnIndices.estado !== -1 && row[columnIndices.estado] ? row[columnIndices.estado].toString().trim() : 'ACTIVO';
      const estado = estadoRaw ? estadoRaw.toUpperCase() : 'ACTIVO';

      // Validaciones por fila
      if (!nombre) {
        errores.push(`Fila ${rowNum}: El 'Nombre Producto' es requerido.`);
      }
      if (!sku) {
        errores.push(`Fila ${rowNum}: El 'SKU' es requerido.`);
      }

      // Validar existencia de categoría en Map
      const catNorm = this.normalizeText(categoriaNombre);
      if (!categoriaNombre || !mapCategorias.has(catNorm)) {
        errores.push(`Fila ${rowNum}: La categoría '${categoriaNombre}' no existe en la base de datos.`);
      }

      // Validar stock (número positivo/entero >= 0)
      const stockNum = Number(stockRaw);
      if (stockRaw === undefined || stockRaw === null || stockRaw === '' || isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
        errores.push(`Fila ${rowNum}: La 'Cantidad' debe ser un número entero mayor o igual a 0.`);
      }

      if (!color) {
        errores.push(`Fila ${rowNum}: El 'Color' es requerido.`);
      }
      if (!modelo) {
        errores.push(`Fila ${rowNum}: El 'Modelo' es requerido.`);
      }

      if (sku) {
        skusEnExcel.add(sku);
      }

      filasValidas.push({
        rowNum,
        nombre,
        sku,
        categoriaNombre,
        stock: stockNum,
        color,
        talla,
        modelo,
        estado,
      });
    });

    // Si existen errores de validación, cancelar y devolver reporte con los errores
    if (errores.length > 0) {
      return {
        mensaje: 'Carga cancelada. Se encontraron errores en el archivo Excel.',
        totalRegistrosLeidos,
        totalRegistrosInsertados: 0,
        totalRegistrosActualizados: 0,
        erroresEncontrados: errores.length,
        errores,
        detalle: {
          insertadosPorColor: {},
          insertadosPorModelo: {},
        },
      };
    }

    // 5. EFICIENCIA: Consulta de SKUs existentes por lote (WHERE sku IN ...)
    const arraySkus = Array.from(skusEnExcel);
    const productosRepo = this.dataSource.getRepository(Producto);
    
    const productosExistentes = arraySkus.length > 0 
      ? await productosRepo.createQueryBuilder('p')
          .where('p.sku IN (:...skus)', { skus: arraySkus })
          .getMany()
      : [];

    const mapProductosExistentes = new Map<string, Producto>();
    productosExistentes.forEach((prod) => {
      mapProductosExistentes.set(prod.sku, prod);
    });

    // 6. ATOMICIDAD: Transacción con QueryRunner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let totalInsertados = 0;
    let totalActualizados = 0;
    const insertadosPorColor: Record<string, number> = {};
    const insertadosPorModelo: Record<string, number> = {};

    try {
      for (const fila of filasValidas) {
        const catNorm = this.normalizeText(fila.categoriaNombre);
        const categoriaObj = mapCategorias.get(catNorm);
        if (!categoriaObj) continue;

        if (mapProductosExistentes.has(fila.sku)) {
          // UPDATE: Si el SKU ya existe, actualizar stock y datos requeridos
          const prodExistente = mapProductosExistentes.get(fila.sku);
          if (prodExistente) {
            prodExistente.stock = prodExistente.stock + fila.stock;
            prodExistente.nombre = fila.nombre;
            prodExistente.id_categoria = categoriaObj.id_categoria;
            prodExistente.color = fila.color;
            prodExistente.talla = fila.talla;
            prodExistente.modelo = fila.modelo;
            prodExistente.estado = fila.estado;

            await queryRunner.manager.save(Producto, prodExistente);
            totalActualizados++;
          }
        } else {
          // INSERT: Si no existe, insertar nuevo producto
          const nuevoProducto = queryRunner.manager.create(Producto, {
            nombre: fila.nombre,
            sku: fila.sku,
            id_categoria: categoriaObj.id_categoria,
            stock: fila.stock,
            color: fila.color,
            talla: fila.talla,
            modelo: fila.modelo,
            estado: fila.estado,
          });

          await queryRunner.manager.save(Producto, nuevoProducto);
          totalInsertados++;

          // Agregar a la memoria local por si viene el mismo SKU repetido en el mismo Excel
          mapProductosExistentes.set(fila.sku, nuevoProducto);

          // Conteo para reporte solo de los INSERTADOS en esta subida
          insertadosPorColor[fila.color] = (insertadosPorColor[fila.color] || 0) + 1;
          insertadosPorModelo[fila.modelo] = (insertadosPorModelo[fila.modelo] || 0) + 1;
        }
      }

      // Si todo fue exitoso, confirmar la transacción (Commit)
      await queryRunner.commitTransaction();
    } catch (dbError) {
      // En caso de error inesperado de base de datos, revertir todo (Rollback)
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Error al procesar la transacción en la BD: ${dbError.message}`);
    } finally {
      // Liberar el QueryRunner
      await queryRunner.release();
    }

    return {
      mensaje: 'Carga de inventario completada.',
      totalRegistrosLeidos,
      totalRegistrosInsertados: totalInsertados,
      totalRegistrosActualizados: totalActualizados,
      erroresEncontrados: 0,
      detalle: {
        insertadosPorColor,
        insertadosPorModelo,
      },
    };
  }
}
