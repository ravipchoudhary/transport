import PageShell from '../components/PageShell';

export default function Booking() {
  return (
    <PageShell title="Quick Book | Choudhary Transport" description="Book a shipment and connect with Choudhary Transport dispatch support." mainClassName="page-shell">
      <section style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="grid-container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <span className="section-tag">Quick Book</span>
            <h2>Request a shipment dispatch</h2>
            <p>Share your route, cargo volume and destination details and our team will contact you promptly.</p>
          </div>
          <div className="tools-container" style={{ marginTop: 30 }}>
            <div className="tracker-wrapper">
              <div className="form-grid">
                <div className="input-group">
                  <label htmlFor="booking-customer-name">Customer Name</label>
                  <div className="input-with-icon">
                    <i className="fa-solid fa-user" />
                    <input id="booking-customer-name" type="text" placeholder="Enter customer name" />
                  </div>
                </div>
                <div className="input-group">
                  <label htmlFor="booking-mobile">Mobile Number</label>
                  <div className="input-with-icon">
                    <i className="fa-solid fa-phone" />
                    <input id="booking-mobile" type="tel" placeholder="9876543210" />
                  </div>
                </div>
                <div className="input-group">
                  <label htmlFor="booking-origin">Origin City</label>
                  <div className="input-with-icon">
                    <i className="fa-solid fa-map-pin" />
                    <input id="booking-origin" type="text" placeholder="Delhi" />
                  </div>
                </div>
                <div className="input-group">
                  <label htmlFor="booking-destination">Destination City</label>
                  <div className="input-with-icon">
                    <i className="fa-solid fa-location-dot" />
                    <input id="booking-destination" type="text" placeholder="Mumbai" />
                  </div>
                </div>
              </div>
              <button className="btn btn-primary btn-block btn-lg" type="button">Request Dispatch</button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
