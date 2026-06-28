import PageShell from '../components/PageShell';

export default function Home() {
  return (
    <PageShell title="Choudhary Transport | Premium Logistics & Freight Solutions" description="Premium logistics, freight forwarding and fleet dispatch solutions." mainClassName="page-shell">
      <section id="hero">
        <div className="hero-bg-wrapper">
          <img src="/assets/choudhary-truck.jpg" className="hero-bg-image" alt="Choudhary Transport truck fleet" />
          <div className="hero-bg-overlay" />
        </div>
        <div className="grid-container hero-grid">
          <div className="hero-content">
            <div className="badge animate-fade-in"><i className="fa-solid fa-circle-check" /> India&apos;s Trusted Logistics Network</div>
            <h1 className="hero-title animate-slide-up">Reliable Logistics, <span className="accent-text">Redefined For Speed.</span></h1>
            <p className="hero-description animate-slide-up-delay">Choudhary Transport delivers end-to-end supply chain excellence with GPS-enabled fleets and real-time dispatch monitoring.</p>
            <div className="hero-actions animate-slide-up-delay-more">
              <a href="/tools" className="btn btn-secondary"><i className="fa-solid fa-location-crosshairs" /> Client Portal</a>
              <a href="/booking" className="btn btn-primary"><i className="fa-solid fa-truck-ramp-box" /> Book Shipment</a>
            </div>
          </div>
        </div>
      </section>

      <section id="services-preview" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="grid-container">
          <div className="section-header">
            <span className="section-tag">Capabilities</span>
            <h2>Enterprise Logistics Solutions</h2>
            <p>Custom-tailored services designed to deliver safety, punctuality, and efficiency across India.</p>
          </div>
          <div className="services-grid">
            <div className="service-card">
              <div className="card-icon"><i className="fa-solid fa-truck-moving" /></div>
              <h3>Full Truck Load (FTL)</h3>
              <p>Direct door-to-door transportation for bulk goods with dedicated high-capacity container fleets.</p>
            </div>
            <div className="service-card">
              <div className="card-icon"><i className="fa-solid fa-boxes-packing" /></div>
              <h3>Warehousing & Storage</h3>
              <p>Secure, climate-controlled, and highly organized warehouses strategized across core logistics nodes.</p>
            </div>
            <div className="service-card">
              <div className="card-icon"><i className="fa-solid fa-clock-rotate-left" /></div>
              <h3>Express Logistics</h3>
              <p>Time-critical supply chain solutions ensuring your high-priority consignments arrive ahead of schedule.</p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
