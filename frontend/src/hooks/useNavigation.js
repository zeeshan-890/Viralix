'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { resolveNavigation } from '../config/navigation';

export function useNavigation() {
    const pathname = usePathname();

    return useMemo(() => resolveNavigation(pathname || '/dashboard'), [pathname]);
}
