'use client';

import Link from 'next/link';

interface LogoProps {
  collapsed?: boolean;
}

export function Logo({ collapsed }: LogoProps) {
  return (
    <Link href="/cms/home" className="flex items-center justify-center h-[60px] bg-black px-4">
      {collapsed ? (
        <span className="text-white font-bold text-lg">E</span>
      ) : (
        <span className="text-white font-bold text-xl tracking-wide">EHR CMS</span>
      )}
    </Link>
  );
}
