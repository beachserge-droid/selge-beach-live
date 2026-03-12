import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Reservation } from '@/lib/db';

async function connect() {
  await dbConnect();
}

// GET /api/reservations — list all
export async function GET() {
  try {
    await connect();
    const data = await Reservation.find({}).lean();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST /api/reservations — create or update (upsert by id)
export async function POST(req: NextRequest) {
  try {
    await connect();
    const body = await req.json() as Record<string, unknown>;
    
    // Upsert logic: find by id and update, or create if not exists
    await Reservation.findOneAndUpdate(
      { id: body.id },
      { $set: body },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/reservations — partial update (for admin actions)
export async function PATCH(req: NextRequest) {
  try {
    await connect();
    const { id, ...updates } = await req.json() as Record<string, unknown>;
    
    const result = await Reservation.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true }
    );

    if (result) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/reservations?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    await connect();
    const id = req.nextUrl.searchParams.get('id');
    
    if (id) {
      await Reservation.deleteOne({ id });
    } else {
      await Reservation.deleteMany({});
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
