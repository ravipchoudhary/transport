import Link from 'next/link';

export default function Home() {
  return (
    <main style={{padding:40,fontFamily:'Inter, system-ui, -apple-system'}}>
      <h1>Choudhary Transport (Next.js)</h1>
      <p>Welcome — basic Next.js scaffold. Use the navigation links below to open legacy pages or API endpoints.</p>
      <ul>
        <li><Link href="/booking">Booking (Next route)</Link></li>
        <li><a href="/booking.html">Legacy booking.html</a></li>
        <li><a href="/api/auth/verify">Auth verify (API)</a></li>
      </ul>
    </main>
  );
}
