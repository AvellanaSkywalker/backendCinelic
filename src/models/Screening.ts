import {Table, Column, Model, DataType, ForeignKey, BelongsTo,} from 'sequelize-typescript';
import Movie from './Movie';
import Room from './Room';

@Table({
  tableName: 'screenings',
})
export class Screening extends Model<Screening> {
  // relacion con Movie cada screening pertenece a una pelicula
  @ForeignKey(() => Movie)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare movieId: number;

  // relacion con Room cada screening se da en una sala
  @ForeignKey(() => Room)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare roomId: number;

  // hora  inicio de la funcn
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare startTime: Date;

  // hora fin de la funcn
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare endTime: Date;

  // precio de ticket para la funcn
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare price: number;

  // relacion para poder acceder a la pelicula asociada
  @BelongsTo(() => Movie)
  declare movie: Movie;

  // relacion para poder acceder a la sala asociada
  @BelongsTo(() => Room)
  declare room: Room;
}

export default Screening;
