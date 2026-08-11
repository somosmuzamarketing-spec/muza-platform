import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !sig) {
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return NextResponse.json({ error: `Firma inválida: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentRequestId = session.metadata?.paymentRequestId;
    if (paymentRequestId) {
      await prisma.paymentRequest.update({
        where: { id: paymentRequestId },
        data: {
          status: "PAID",
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
