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
  declare duration: number; 

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

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'public_id'
  })
  declare publicId: string | null;

  //  una pelicula puede tener varios screenings 
  @HasMany(() => Screening)
  declare screenings: Screening[];
}

export default Movie;
