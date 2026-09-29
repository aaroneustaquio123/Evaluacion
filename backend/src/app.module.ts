import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventarioModule } from './inventario/inventario.module';
import { Categoria } from './inventario/entities/categoria.entity';
import { Producto } from './inventario/entities/producto.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mssql',
        host: configService.get<string>('DB_HOST', 'ASISTENTE-TEC'),
        port: parseInt(configService.get<string>('DB_PORT', '1433'), 10),
        username: configService.get<string>('DB_USER', 'Aaron'),
        password: configService.get<string>('DB_PASS', '12345678'),
        database: configService.get<string>('DB_NAME', 'inventario_db'),
        entities: [Categoria, Producto],
        synchronize: false,
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }),
    }),
    InventarioModule,
  ],
})
export class AppModule {}
