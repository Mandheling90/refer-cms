import { NextRequest, NextResponse } from 'next/server';

const STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  'https://kr.object.ncloudstorage.com/obj-refer-cc-prd-bucket';

export async function GET(req: NextRequest) {
  const storedPath = req.nextUrl.searchParams.get('path');
  const fileName = req.nextUrl.searchParams.get('name') || 'download';

  if (!storedPath) {
    return NextResponse.json({ error: 'path is required' }, { status: 400 });
  }

  const url = storedPath.startsWith('http')
    ? storedPath
    : `${STORAGE_URL}/${storedPath}`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: res.status },
    );
  }

  const headers = new Headers();
  headers.set(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(fileName)}"`,
  );
  headers.set(
    'Content-Type',
    res.headers.get('Content-Type') || 'application/octet-stream',
  );

  return new NextResponse(res.body, { status: 200, headers });
}
