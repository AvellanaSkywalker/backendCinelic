import bycrypt from "bcrypt";

export const hashPassword = async (password: string) => {
    const salt = await bycrypt.genSalt(10)
    return await bycrypt.hash(password, salt)
}

export const checkPassword = async (password: string, hash: string) => {
    return await bycrypt.compare(password, hash)
}