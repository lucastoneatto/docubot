import { NextResponse } from 'next/server';
import { api } from '@/lib/api';

/**
 * Forwards the detail of an uploaded document to the client. api.getDocument()
 * is server-only (it uses the httpOnly session cookie), so the detail modal
 * in the browser goes through this route instead of calling the API directly.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  const { id, documentId } = await params;
  try {
    const doc = await api.getDocument(id, documentId);
    return NextResponse.json(doc);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 502 },
    );
  }
}
