let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  XLSX = require('./backend/node_modules/xlsx');
}
const fs = require('fs');
const path = require('path');

// 1. Excel Válido (Columnas en distinto orden, tildes, mayúsculas/minúsculas, inserciones y actualizaciones)
const datosValidos = [
  {
    "COLOR": "Rojo",
    "SKU": "ZAP-001",
    "Nombre Producto": "Zapatilla Runner Pro 2024",
    "Categoría": "Zapatillas",
    "CANTIDAD": 25,
    "Modelo": "Sport-2024",
    "Talla": "42",
    "Activo": "ACTIVO"
  },
  {
    "COLOR": "Azul",
    "SKU": "ZAP-002",
    "Nombre Producto": "Zapatilla Air Max Light",
    "Categoría": "Zapatillas",
    "CANTIDAD": 15,
    "Modelo": "Sport-2024",
    "Talla": "40",
    "Activo": "ACTIVO"
  },
  {
    "COLOR": "Verde",
    "SKU": "SAN-001",
    "Nombre Producto": "Sandalia Playera Summer",
    "Categoría": "Sandalias",
    "CANTIDAD": 30,
    "Modelo": "Urban-2024",
    "Talla": "38",
    "Activo": "ACTIVO"
  },
  {
    "COLOR": "Negro",
    "SKU": "BOT-001",
    "Nombre Producto": "Bota Cuero Trekking",
    "Categoría": "Botas",
    "CANTIDAD": 10,
    "Modelo": "Classic-2023",
    "Talla": "41",
    "Activo": "ACTIVO"
  },
  // Repetido SKU para probar UPDATE
  {
    "COLOR": "Rojo",
    "SKU": "ZAP-001",
    "Nombre Producto": "Zapatilla Runner Pro 2024",
    "Categoría": "Zapatillas",
    "CANTIDAD": 5, // debe sumar 25 + 5 = 30 en stock
    "Modelo": "Sport-2024",
    "Talla": "42",
    "Activo": "ACTIVO"
  }
];

const wbValido = XLSX.utils.book_new();
const wsValido = XLSX.utils.json_to_sheet(datosValidos);
XLSX.utils.book_append_sheet(wbValido, wsValido, "Inventario");
const pathValido = path.join(__dirname, "inventario_valido.xlsx");
XLSX.writeFile(wbValido, pathValido);
console.log(`✅ Creado: ${pathValido}`);

// 2. Excel con Errores (Categoría inexistente y Cantidad inválida)
const datosErrores = [
  {
    "Nombre Producto": "Zapatilla Test Errores",
    "SKU": "ERR-001",
    "Categoría": "Electrodomésticos", // No existe en BD
    "Cantidad": 10,
    "Color": "Blanco",
    "Modelo": "Test-2024"
  },
  {
    "Nombre Producto": "Sandalia Test Cantidad",
    "SKU": "ERR-002",
    "Categoría": "Sandalias",
    "Cantidad": -5, // Inválido (menor a 0)
    "Color": "Negro",
    "Modelo": "Test-2024"
  }
];

const wbErrores = XLSX.utils.book_new();
const wsErrores = XLSX.utils.json_to_sheet(datosErrores);
XLSX.utils.book_append_sheet(wbErrores, wsErrores, "Inventario");
const pathErrores = path.join(__dirname, "inventario_con_errores.xlsx");
XLSX.writeFile(wbErrores, pathErrores);
console.log(`✅ Creado: ${pathErrores}`);
