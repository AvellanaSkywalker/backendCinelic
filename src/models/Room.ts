import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import Screening from './Screening';
import layout from '../config/layout.json';

@Table({
  tableName: 'rooms',
})

export class Room extends Model<Room> {
  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  declare name: string; 

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  declare capacity: number | null; 

@Column({
  type: DataType.JSONB,
  allowNull: false,
  defaultValue: () => ({
    rows: ["A", "B", "C", "D", "E", "F", "G"],
    columns: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    seats: Object.fromEntries(
      ["A", "B", "C", "D", "E", "F", "G"].map(row => [
        row,
        Object.fromEntries(
          Array.from({ length: 13 }, (_, i) => [`${i + 1}`, "available"])
        )
      ])
    )
  })
})
declare layout: any;
 // identificador del layout obligatorio

  @HasMany(() => Screening)
  declare screenings: Screening[];
}

export default Room;
