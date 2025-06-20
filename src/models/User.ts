import { Table, Column, Model, DataType } from "sequelize-typescript";
import bcrypt from "bcrypt";

@Table({ 
  tableName: 'users' 
})
export default class User extends Model<User> {
  @Column({
    type: DataType.STRING, 
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare password: string;

  @Column({
    type: DataType.ENUM('admin', 'user', 'guest'), // Agrega 'guest'
    allowNull: false,
    defaultValue: 'user',
  })
  declare role: 'admin' | 'user' | 'guest';

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isVerified: boolean;

  // metodo para hashear la contrasenia antes de guardarla
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }
}