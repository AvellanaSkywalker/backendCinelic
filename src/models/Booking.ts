import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import User from "./User";
import Screening from "./Screening";

@Table({ 
  tableName: 'bookings' 
})
export default class Booking extends Model<Booking> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true
  })
  declare folio: string;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  declare bookingDate: Date; 

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
  declare seats: {row: string, column: string}[]; // arreglo de asientos seleccionados

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

  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => Screening)
  declare screening: Screening;
}
