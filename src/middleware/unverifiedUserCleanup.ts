import { Op } from "sequelize";
import User from "../models/User"; 

export async function cleanUnverifiedUsers(): Promise<number> {
  try {
    // calcula la fecha 24 horas a
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() - 24);
    
    // elimina usuarios no verificados creados hace mas de 24 hrs
    const deletedCount = await User.destroy({
      where: {
        isVerified: false,
        createdAt: {
          [Op.lt]: expirationDate // creados antes de la fecha limite
        }
      }
    });
    
    console.log(`🧹 Eliminados ${deletedCount} usuarios no verificados`);
    return deletedCount;
  } catch (error) {
    console.error("❌ Error en limpieza de usuarios:", error);
    return 0;
  }
}