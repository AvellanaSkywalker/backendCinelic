// src/models/Screening.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import Movie from './Movie';
import Room from './Room';

@Table({
  tableName: 'screenings',
  timestamps: true // Crea automáticamente createdAt y updatedAt
})
export class Screening extends Model<Screening> {
  // Relación con Movie: cada screening pertenece a una película
  @ForeignKey(() => Movie)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  public movieId: number;

  // Relación con Room: cada screening se da en una sala
  @ForeignKey(() => Room)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  public roomId: number;

  // Hora de inicio de la función (almacena la fecha y hora)
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  public startTime: Date;

  // Hora de fin de la función
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  public endTime: Date;

  // Precio del ticket para la función
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  public price: number;

  // Relación para poder acceder a la película asociada
  @BelongsTo(() => Movie)
  public movie: Movie;

  // Relación para poder acceder a la sala asociada
  @BelongsTo(() => Room)
  public room: Room;
}

export default Screening;
