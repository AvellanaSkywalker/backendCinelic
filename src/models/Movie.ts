// src/models/Movie.ts
import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import Screening from './Screening';

@Table({
  tableName: 'movies',
  timestamps: true // Genera automáticamente createdAt y updatedAt
})
export class Movie extends Model<Movie> {
  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  public title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  public description: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  public duration: number; // Duración en minutos

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  })
  public rating: number;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public posterurl: string | null;

  // Relación: Una película puede tener varios screenings asociados.
  @HasMany(() => Screening)
  public screenings: Screening[];
}

export default Movie;
