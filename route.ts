import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { fullName, email } = await req.json();
  if (!fullName || !email) {
    return NextResponse.json({ error: "Nombre y email son obligatorios." }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
    return NextResponse.json(
      { error: "Los pagos todavía no están configurados. Contáctanos directamente." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const paymentRequest = await prisma.paymentRequest.create({
    data: { fullName, email, status: "PENDING" },
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment", // cámbialo a "subscription" si es una membresía recurrente
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    metadata: { paymentRequestId: paymentRequest.id },
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/registro/gracias`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/registro`,
  });

  await prisma.paymentRequest.update({
    where: { id: paymentRequest.id },
    data: { stripeSessionId: checkoutSession.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
