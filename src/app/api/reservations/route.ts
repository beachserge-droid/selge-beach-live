import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Reservation } from '@/lib/db';

async function connect() {
  await dbConnect();
}

// GET /api/reservations — list all
export async function GET() {
  try {
    console.log('GET /api/reservations - Connecting to DB...');
    await connect();
    console.log('GET /api/reservations - Fetching reservations...');
    const data = await Reservation.find({}).lean();
    console.log(`GET /api/reservations - Found ${data.length} reservations.`);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GET /api/reservations - Error:', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST /api/reservations — create or update (upsert by id)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    console.log(`POST /api/reservations - Entry for ID: ${body.id}`);
    
    await connect();
    
    // Upsert logic: find by id and update, or create if not exists
    const result = await Reservation.findOneAndUpdate(
      { id: body.id },
      { $set: body },
      { upsert: true, new: true }
    );
    
    console.log(`POST /api/reservations - Success for ID: ${body.id}`);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('POST /api/reservations - Error:', error.message);
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
