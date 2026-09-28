import { redirect } from "next/navigation";

// La entrada a Muza es curada: postulación + conversación de 15 minutos.
// Esta ruta histórica enviaba directamente a Stripe y contradecía el flujo
// actual. Se conserva como redirección para no romper enlaces antiguos.
export default function RegistroPage() {
  redirect("https://somosmuza.com/conversemos/");
}
