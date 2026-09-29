export interface DetalleReporte {
  insertadosPorColor: Record<string, number>;
  insertadosPorModelo: Record<string, number>;
}

export interface InventarioUploadResponseDto {
  mensaje: string;
  totalRegistrosLeidos: number;
  totalRegistrosInsertados: number;
  totalRegistrosActualizados: number;
  erroresEncontrados: number;
  errores?: string[];
  detalle: DetalleReporte;
}
