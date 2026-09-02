import crypto from "crypto";

// Contraseña temporal generada para cuentas nuevas (creación manual desde
// /admin o automatizada vía el webhook de inscripción). La miembra puede
// cambiarla luego desde su perfil.
export function generatePassword(length = 10) {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}
