import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import type { ReactNode } from 'react';

type PageShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  mainClassName?: string;
};

export default function PageShell({ title, description, children, mainClassName }: PageShellProps) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={description || 'Choudhary Transport portal'} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossOrigin="anonymous" />
      </Head>

      <header id="site-header">
        <div className="header-container">
          <Link href="/" className="logo" id="header-logo" onClick={() => setNavOpen(false)}>
            <span className="logo-icon"><i className="fa-solid fa-truck-fast" /></span>
            <span className="logo-text">CHOUDHARY<span className="accent-text">TRANSPORT</span></span>
          </Link>
          <button
            className="mobile-nav-toggle"
            aria-expanded={navOpen}
            aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => setNavOpen((prev) => !prev)}
          >
            <i className={navOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'} />
          </button>
          <nav id="main-nav" className={navOpen ? 'active' : ''}>
            <Link href="/" className="nav-link" onClick={() => setNavOpen(false)}>Home</Link>
            <Link href="/services" className="nav-link" onClick={() => setNavOpen(false)}>Services</Link>
            <Link href="/fleet" className="nav-link" onClick={() => setNavOpen(false)}>Our Fleet</Link>
            <Link href="/booking" className="nav-link" onClick={() => setNavOpen(false)}>Quick Book</Link>
            <Link href="/tools" className="nav-link" onClick={() => setNavOpen(false)}>Client Portal</Link>
            <Link href="/login" className="nav-link" onClick={() => setNavOpen(false)}>Admin Portal</Link>
          </nav>
          <div className="header-actions">
            <Link href="/booking" className="btn btn-primary" id="nav-btn-book">Book Now</Link>
          </div>
        </div>
      </header>

      <main className={mainClassName}>{children}</main>

      <footer id="site-footer">
        <div className="footer-top">
          <div className="grid-container footer-grid">
            <div className="footer-brand">
              <div className="logo">
                <span className="logo-icon"><i className="fa-solid fa-truck-fast" /></span>
                <span className="logo-text">CHOUDHARY<span className="accent-text">TRANSPORT</span></span>
              </div>
              <p>Delivering high-capacity cargo forwarding and customized storage solutions across key industrial zones in India since 2011.</p>
              <div className="social-links">
                <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
                <a href="#" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in" /></a>
                <a href="#" aria-label="Twitter"><i className="fa-brands fa-twitter" /></a>
              </div>
            </div>
            <div className="footer-links">
              <h4>Useful Links</h4>
              <ul>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/services">Our Services</Link></li>
                <li><Link href="/tools">Digital Tracker</Link></li>
                <li><Link href="/booking">Consignment Dispatch</Link></li>
              </ul>
            </div>
            <div className="footer-branches">
              <h4>Core Transit Stations</h4>
              <ul>
                <li><i className="fa-solid fa-map-pin" /> Head Office: Benipatti, Bihar, 847222</li>
                <li><i className="fa-solid fa-map-pin" /> Delhi NCR: Sector 5, Dwarka Cargo Complex</li>
                <li><i className="fa-solid fa-map-pin" /> Mumbai: Kalamboli Transport Nagar</li>
                <li><i className="fa-solid fa-map-pin" /> Ahmedabad: Aslali Bypass Logistics Zone</li>
              </ul>
            </div>
            <div className="footer-contact">
              <h4>Customer Care</h4>
              <p><i className="fa-solid fa-phone" /> +91 9473441414, +91 9006544220</p>
              <p><i className="fa-solid fa-envelope" /> choudharytransport@gmail.com</p>
              <p><i className="fa-solid fa-clock" /> Mon - Sat: 9:00 AM - 7:00 PM</p>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-bottom-container">
            <p>Designed and Developed by Encogix Technology Pvt Ltd</p>
            <div className="footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Carriage</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
