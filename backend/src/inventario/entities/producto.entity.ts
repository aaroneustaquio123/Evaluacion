import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Categoria } from './categoria.entity';

@Entity({ name: 'productos', schema: 'dbo' })
export class Producto {
  @PrimaryGeneratedColumn({ name: 'id_producto' })
  id_producto: number;

  @Column({ name: 'nombre', length: 150 })
  nombre: string;

  @Column({ name: 'sku', unique: true, length: 50 })
  sku: string;

  @Column({ name: 'id_categoria' })
  id_categoria: number;

  @Column({ name: 'stock' })
  stock: number;

  @Column({ name: 'color', length: 50 })
  color: string;

  @Column({ name: 'talla', nullable: true, length: 20 })
  talla: string;

  @Column({ name: 'modelo', length: 50 })
  modelo: string;

  @Column({ name: 'estado', default: 'ACTIVO', length: 20 })
  estado: string;

  @ManyToOne(() => Categoria, (cat) => cat.productos)
  @JoinColumn({ name: 'id_categoria' })
  categoria: Categoria;
}
