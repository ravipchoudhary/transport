import PageShell from '../components/PageShell';

export default function ServicesPage() {
  return (
    <PageShell title="Services | Choudhary Transport" description="Premium freight handling, warehousing and express logistics services." mainClassName="page-shell" >
      <section style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="grid-container">
          <div className="section-header animate-slide-up">
            <span className="section-tag">Capabilities</span>
            <h2>Precision Freight Services</h2>
            <p>Custom tailored logistics solutions to power your enterprise cargo demands.</p>
          </div>

          <div className="services-grid animate-slide-up-delay">
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
            <div className="service-card">
              <div className="card-icon"><i className="fa-solid fa-shield-cat" /></div>
              <h3>Over Dimensional Cargo</h3>
              <p>Expert logistics management for heavy machinery, structural equipment, and out-of-gauge shipments.</p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
