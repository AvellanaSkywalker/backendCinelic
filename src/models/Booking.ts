// src/models/Booking.ts
import { Table, Column, Model, DataType, ForeignKey } from "sequelize-typescript";
import User from "./User";
import Screening from "./Screening";

@Table({ tableName: 'bookings' })
export default class Booking extends Model<Booking> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true
  })
  declare folio: string; // Formato "XXXX-XXXX"

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  declare bookingDate: Date; // Fecha y hora de la reserva

  @Column({
    type: DataType.ENUM('ACTIVA', 'CANCELADA'),
    allowNull: false,
    defaultValue: 'ACTIVA'
  })
  declare status: 'ACTIVA' | 'CANCELADA';

  @Column({
    type: DataType.JSON,
    allowNull: false
  })
  declare seats: string[]; // Arreglo de asientos seleccionados

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  declare userId: number;

  @ForeignKey(() => Screening)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  declare screeningId: number;
}
