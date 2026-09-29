import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Producto } from './producto.entity';

@Entity({ name: 'categoria', schema: 'dbo' })
export class Categoria {
  @PrimaryGeneratedColumn({ name: 'id_categoria' })
  id_categoria: number;

  @Column({ name: 'nombre_categoria', unique: true, length: 100 })
  nombre_categoria: string;

  @Column({ name: 'activo', default: 'ACTIVO', length: 20 })
  activo: string;

  @OneToMany(() => Producto, (producto) => producto.categoria)
  productos: Producto[];
}
