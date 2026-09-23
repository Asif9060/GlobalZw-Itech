import About from '@/components/About';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - GlobalZwItech',
  description: 'Learn about GlobalZwItech, an energy and engineering company specializing in solar systems, smart signals, and electrical infrastructure.',
};

export default function AboutPage() {
  return (
    <main>
      <About />
    </main>
  );
}