import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import Screening from './Screening';

@Table({
  tableName: 'movies',
})
export class Movie extends Model<Movie> {
  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  declare description: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  declare duration: number; // Duración en minutos

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  })
  declare rating: number;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  declare posterurl: string | null;

  // Relación: Una película puede tener varios screenings asociados.
  @HasMany(() => Screening)
  declare screenings: Screening[];
}

export default Movie;
