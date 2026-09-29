import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';
import { Categoria } from './entities/categoria.entity';
import { Producto } from './entities/producto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Categoria, Producto])],
  controllers: [InventarioController],
  providers: [InventarioService],
  exports: [InventarioService],
})
export class InventarioModule {}
