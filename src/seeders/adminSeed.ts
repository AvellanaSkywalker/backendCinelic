// adminSeed.ts
import dotenv from 'dotenv'
dotenv.config()

import { db } from "../config/db";
import { hashPassword } from "../utils/auth";
import User from "../models/User";

async function createAdmin() {
  try {
    // Inicializa la conexión a la base de datos usando tu instancia "db"
    await db.authenticate();
    console.log("Conexión a la base de datos establecida correctamente.");

    // Sincroniza los modelos para asegurarnos que User esté registrado
    await db.sync();
    console.log("Modelos sincronizados correctamente.");

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASS;
    const adminName = process.env.ADMIN_NAME || "Administrador";

    if (!adminEmail || !adminPassword) {
      console.error("Faltan definir las variables de entorno ADMIN_EMAIL o ADMIN_PASS.");
      process.exit(1);
    }

    // Verificar si el administrador ya existe
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (existingAdmin) {
      console.log("El administrador ya existe.");
      process.exit(0);
    }

    const passwordHashed = await hashPassword(adminPassword);
    await User.create({
      name: adminName,
      email: adminEmail,
      password: passwordHashed,
      role: "admin"
    });
    console.log("Cuenta de administrador creada correctamente.");
  } catch (error) {
    console.error("Error al crear la cuenta de administrador:", error);
    process.exit(1);
  }
  process.exit(0);
}

createAdmin();