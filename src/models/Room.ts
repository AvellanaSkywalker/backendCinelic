// src/models/Room.ts
import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import Screening from './Screening';

@Table({
  tableName: 'rooms',
  timestamps: true // Genera automáticamente createdAt y updatedAt
})
export class Room extends Model<Room> {
  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  public name: string; // Nombre de la sala

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  public capacity: number | null; // Capacidad, puede ser nula

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  public layout: number; // Identificador o código del layout, obligatorio

  // Relación: Una sala puede tener múltiples screenings (funciones) asignados.
  @HasMany(() => Screening)
  public screenings: Screening[];
}

export default Room;
