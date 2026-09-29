# Prueba Técnica Footloose - Procesamiento de Inventario desde Excel

Sistema de procesamiento de carga masiva de inventario en Excel (.xlsx) con **NestJS**, **Angular** y **SQL Server**.

---

## 📁 Estructura del Proyecto

```text
D:\EVALUACION\
├── database/
│   └── schema.sql                # Script de creación de BD, tablas e inserciones iniciales
├── backend/
│   ├── src/
│   │   ├── inventario/
│   │   │   ├── dto/
│   │   │   │   └── inventario-upload-response.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── categoria.entity.ts
│   │   │   │   └── producto.entity.ts
│   │   │   ├── inventario.controller.ts
│   │   │   ├── inventario.module.ts
│   │   │   └── inventario.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env                       # Configuración de variables de entorno
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.ts   # Componente standalone Angular con subida de archivo y reporte
│   │   │   ├── app.component.html
│   │   │   ├── app.component.css
│   │   │   └── app.config.ts
│   │   ├── main.ts
│   │   └── index.html
│   └── package.json
├── generar_excel_prueba.js        # Script para generar archivos Excel de prueba (.xlsx)
├── docker-compose.yml             # Despliegue en contenedores (Opcional)
└── README.md
```

---

## ⚙️ Pasos de Configuración y Ejecución (Windows + PowerShell + VS Code)

### 1️⃣ Base de Datos (SQL Server)
1. Abre **SQL Server Management Studio (SSMS)**.
2. Conéctate a tu servidor local `ASISTENTE-TEC`.
3. Ejecuta el script ubicado en `d:\EVALUACION\database\schema.sql`.
   * El script creará la base de datos `inventario_db`, las tablas `dbo.categoria` y `dbo.productos`, e insertará las 4 categorías base (`Zapatillas`, `Sandalias`, `Botas`, `Accesorios`).

---

### 2️⃣ Backend (NestJS)
1. Abre una terminal de **PowerShell** en VS Code.
2. Navega a la carpeta del backend:
   ```powershell
   cd D:\EVALUACION\backend
   ```
3. Instala las dependencias:
   ```powershell
   npm install
   ```
4. Inicia el servidor en modo desarrollo:
   ```powershell
   npm run start:dev
   ```
5. El backend estará corriendo en: **`http://localhost:3000/api`**

---

### 3️⃣ Frontend (Angular)
1. Abre una nueva pestaña de terminal en VS Code.
2. Navega a la carpeta del frontend:
   ```powershell
   cd D:\EVALUACION\frontend
   ```
3. Instala las dependencias:
   ```powershell
   npm install
   ```
4. Inicia la aplicación Angular:
   ```powershell
   npm start
   ```
5. Accede desde tu navegador web a: **`http://localhost:4200`**

---

### 4️⃣ Archivos Excel de Prueba
Para generar automáticamente archivos Excel de prueba con diferentes casos de prueba (inserción, actualización, orden dinámico de columnas y validación de errores), ejecuta:

```powershell
cd D:\EVALUACION\backend
node ..\generar_excel_prueba.js
```
Esto creará dos archivos en la raíz del proyecto:
- **`inventario_valido.xlsx`**: Mapeo dinámico de columnas, 4 productos nuevos (INSERT) y 1 producto con SKU existente (UPDATE de stock).
- **`inventario_con_errores.xlsx`**: Prueba de validaciones (categoría inexistente y stock negativo).

---

## 🎤 Respuestas Clave para la Entrevista

### 1. ¿Por qué es importante la Transacción y el uso de QueryRunner?
* **Atomicidad (Principio ACID):** La carga de un archivo de inventario debe tratarse como una unidad de trabajo única. Si un archivo contiene 100 productos y ocurre un fallo de red o error de BD en la fila 50, sin transacción la base de datos quedaría en un estado inconsistente (50 filas insertadas y 50 no).
* **Rollback en Fallos:** Con `QueryRunner` de TypeORM, envolvemos todo el lote dentro de `startTransaction()`. Si ocurre algún fallo no previsto, ejecutamos `rollbackTransaction()` y garantizamos que no se modifique ningún registro en la base de datos.
* **Commit Único:** Solo tras validar y procesar con éxito la totalidad del archivo se realiza el `commitTransaction()`.

### 2. Decisiones de Eficiencia Implementadas
* **Carga de Categorías en Memoria (`Map` Indexado):** En lugar de hacer una consulta SQL `SELECT` a la tabla `categoria` por cada fila del Excel (lo cual generaría N consultas a la base de datos), cargamos todas las categorías activas una sola vez al inicio en un `Map<string, Categoria>` indexado por el nombre normalizado. La búsqueda pasa de $O(N)$ consultas SQL I/O a $O(1)$ en memoria RAM.
* **Normalización de Encabezados (Mapeo Dinámico):** Se normalizan los títulos de las columnas (eliminando tildes, espacios y convirtiendo a minúsculas) antes de procesar las filas. Esto permite leer archivos Excel sin importar el orden ni las variaciones en los nombres de las columnas.
* **Consulta por Lotes de SKUs (`WHERE sku IN (...)`):** Se recolectan todos los SKUs del archivo Excel y se realiza una **única consulta masiva** a la base de datos para recuperar todos los productos existentes. Con esto se evita el problema de las N+1 consultas.
* **Reporte de Métricas por Subida:** Se lleva un registro preciso y segregado de `totalRegistrosLeidos`, `totalRegistrosInsertados`, `totalRegistrosActualizados` y métricas desglosadas por `insertadosPorColor` e `insertadosPorModelo` exclusivamente para los registros creados durante esa subida.
