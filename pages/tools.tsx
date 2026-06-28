import PageShell from '../components/PageShell';

export default function ToolsPage() {
  return (
    <PageShell title="Client Portal | Choudhary Transport" description="Freight estimator and shipment tracker for portal users." mainClassName="page-shell">
      <section style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="grid-container">
          <div className="section-header animate-slide-up">
            <span className="section-tag">Digital Hub</span>
            <h2>Real-time logistical tools</h2>
            <p>Estimate shipping costs or track your live consignment in seconds.</p>
          </div>
          <div className="tools-container animate-slide-up-delay">
            <div className="tabs-header">
              <button className="tab-btn active" type="button"><i className="fa-solid fa-location-crosshairs" /> Consignment Tracker</button>
              <button className="tab-btn" type="button"><i className="fa-solid fa-calculator" /> Freight Estimator</button>
            </div>
            <div className="tab-content active">
              <div className="tracker-wrapper">
                <div className="input-inline">
                  <div className="input-group">
                    <label>Consignment Number</label>
                    <div className="input-with-icon">
                      <i className="fa-solid fa-hashtag" />
                      <input type="text" defaultValue="CT-5281-IN" placeholder="e.g., CT-9048-IN" />
                    </div>
                  </div>
                  <button className="btn btn-primary btn-search" type="button">Search Shipment</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
