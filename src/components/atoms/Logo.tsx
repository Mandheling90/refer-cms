'use client';

import Link from 'next/link';

export function Logo() {
  return (
    <Link
      href="/cms/home"
      className="flex items-center justify-center h-[75px] bg-black px-4 border-b border-gray-600 shrink-0"
    >
      <span className="text-white font-bold text-xl tracking-wide">EHR CMS</span>
    </Link>
  );
}
