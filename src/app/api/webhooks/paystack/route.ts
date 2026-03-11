import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paystackTransactions, revenueEntries } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { getMonthKey } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
    if (!secret) {
      console.error('PAYSTACK_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event !== 'charge.success') {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    const data = event.data;
    const reference = data.reference as string;
    const amountKobo = data.amount as number;
    const amount = amountKobo / 100;
    const fees = (data.fees as number) / 100;
    const netAmount = amount - fees;
    const customerEmail = data.customer?.email as string | undefined;
    const customerName = (data.customer?.first_name || '') + ' ' + (data.customer?.last_name || '');
    const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();
    const metadata = data.metadata || {};
    const channel = data.channel as string | undefined;

    // Determine hostelId from metadata
    const hostelId = metadata.hostel_id || metadata.hostelId;
    if (!hostelId) {
      console.error('Paystack webhook: no hostelId in metadata for reference', reference);
      return NextResponse.json({ error: 'No hostelId in metadata' }, { status: 400 });
    }

    // Insert paystack transaction
    const [txn] = await db
      .insert(paystackTransactions)
      .values({
        hostelId,
        reference,
        amount: amount.toString(),
        fees: fees.toString(),
        netAmount: netAmount.toString(),
        currency: data.currency || 'NGN',
        status: 'success',
        customerEmail: customerEmail || null,
        customerName: customerName.trim() || null,
        paidAt,
        metadata,
        channel: channel || null,
      })
      .returning();

    // Auto-create revenue entry
    const transactionDate = paidAt.toISOString().split('T')[0];
    const month = getMonthKey(paidAt);

    const [revenueEntry] = await db
      .insert(revenueEntries)
      .values({
        hostelId,
        amount: netAmount.toString(),
        source: 'paystack',
        description: `Paystack payment - ${reference}`,
        transactionDate,
        month,
        paystackReference: reference,
        status: 'pending',
        createdBy: hostelId, // system-generated; no user context in webhooks
      })
      .returning();

    // Link the transaction to the revenue entry
    await db
      .update(paystackTransactions)
      .set({
        reconciledRevenueEntryId: revenueEntry.id,
      })
      .where(eq(paystackTransactions.id, txn.id));

    return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
