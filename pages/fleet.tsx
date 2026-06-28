import PageShell from '../components/PageShell';

export default function FleetPage() {
  return (
    <PageShell title="Our Fleet | Choudhary Transport" description="Reliable fleet portfolio for FTL, express and cold chain transport." mainClassName="page-shell">
      <section style={{ paddingTop: 120, paddingBottom: 40 }}>
        <div className="grid-container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <span className="section-tag">Our Fleet</span>
            <h2>Fleet solutions built for reliable logistics operations</h2>
            <p>Heavy carriers, refrigerated haulers, express trailers and digital dispatch control built to keep goods moving on time.</p>
          </div>
        </div>
      </section>
      <section style={{ paddingBottom: 80 }}>
        <div className="grid-container">
          <div className="fleet-stats-grid">
            <div className="fleet-details" style={{ background: 'var(--bg-card)', padding: 32, borderRadius: 'var(--radius-lg)' }}>
              <span className="section-tag">Capabilities</span>
              <h3>Modern fleet for every cargo requirement</h3>
              <p>From high-capacity FTL convoys to refrigerated units and express load carriers, our fleet is sized to support industrial, retail and temperature-sensitive transport.</p>
              <ul className="fleet-checklist">
                <li><i className="fa-solid fa-check" /> 24/7 GPS-enabled monitoring</li>
                <li><i className="fa-solid fa-check" /> Heavy-duty multi-axle trailers</li>
                <li><i className="fa-solid fa-check" /> Integrated load planning & route optimization</li>
              </ul>
              <a href="/booking" className="btn btn-primary" style={{ marginTop: 24 }}>Book a Fleet Dispatch</a>
            </div>
            <div className="hero-visual">
              <div className="image-wrapper">
                <img src="/assets/fleet-truck.png" className="hero-image" alt="Choudhary Transport fleet showcase" style={{ maxHeight: 320, objectFit: 'contain' }} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
