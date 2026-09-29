IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'inventario_db')
BEGIN
    CREATE DATABASE inventario_db;
END
GO

USE inventario_db;
GO

IF OBJECT_ID('dbo.productos', 'U') IS NOT NULL DROP TABLE dbo.productos;
IF OBJECT_ID('dbo.categoria', 'U') IS NOT NULL DROP TABLE dbo.categoria;

CREATE TABLE dbo.categoria (
    id_categoria INT IDENTITY(1,1) PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL UNIQUE,
    activo VARCHAR(20) DEFAULT 'ACTIVO'
);
GO

CREATE TABLE dbo.productos (
    id_producto INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    id_categoria INT NOT NULL,
    stock INT NOT NULL CONSTRAINT CHK_Productos_Stock CHECK (stock >= 0),
    color VARCHAR(50) NOT NULL,
    talla VARCHAR(20) NULL,
    modelo VARCHAR(50) NOT NULL,
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    CONSTRAINT FK_Productos_Categoria FOREIGN KEY (id_categoria) REFERENCES dbo.categoria(id_categoria)
);
GO

INSERT INTO dbo.categoria (nombre_categoria, activo) VALUES
('Zapatillas', 'ACTIVO'),
('Sandalias', 'ACTIVO'),
('Botas', 'ACTIVO'),
('Accesorios', 'ACTIVO');
GO

SELECT * FROM dbo.categoria;
GO
