import { type NextRequest, NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal";

export async function POST(request: NextRequest) {
  try {
    const { orderId } = (await request.json()) as { orderId: string };

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    const result = await capturePayPalOrder(orderId);

    if (result.success) {
      return NextResponse.json({
        message: "Payment captured successfully",
        credits: result.credits,
      });
    }

    return NextResponse.json(
      { error: "Payment capture failed" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    return NextResponse.json(
      { error: "Failed to capture PayPal order" },
      { status: 500 },
    );
  }
}
