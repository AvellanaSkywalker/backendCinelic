import {Table, Column, Model, DataType, ForeignKey, BelongsTo,} from 'sequelize-typescript';
import Movie from './Movie';
import Room from './Room';

@Table({
  tableName: 'screenings',
})
export class Screening extends Model<Screening> {
  // Relación con Movie: cada screening pertenece a una película
  @ForeignKey(() => Movie)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare movieId: number;

  // Relación con Room: cada screening se da en una sala
  @ForeignKey(() => Room)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare roomId: number;

  // Hora de inicio de la función (almacena la fecha y hora)
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare startTime: Date;

  // Hora de fin de la función
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare endTime: Date;

  // Precio del ticket para la función
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare price: number;

  // Relación para poder acceder a la película asociada
  @BelongsTo(() => Movie)
  declare movie: Movie;

  // Relación para poder acceder a la sala asociada
  @BelongsTo(() => Room)
  declare room: Room;
}

export default Screening;
