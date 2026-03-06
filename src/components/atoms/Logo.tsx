'use client';

import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link
      href="/cms/home"
      className="flex items-center justify-center h-[75px] bg-white px-4 border-b border-gray-200 shrink-0"
    >
      <Image
        src="/images/logo_pc_orgin.png"
        alt="고려대학교 진료협력센터"
        width={180}
        height={40}
        priority
      />
    </Link>
  );
}
