import { Plus_Jakarta_Sans } from 'next/font/google';
import LandingPage from '@/components/landing/LandingPage';

const display = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-display',
});

export default function Page() {
    return (
        <div className={`${display.variable} font-[family-name:var(--font-display)]`}>
            <LandingPage />
        </div>
    );
}
