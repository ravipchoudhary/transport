import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Admin Dashboard | Choudhary Transport</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="dash-layout">
        <aside className={`dash-sidebar${sidebarOpen ? ' active' : ''}`}>
          <div className="sidebar-brand">
            <Link href="/" className="logo" onClick={() => setSidebarOpen(false)}>
              <span className="logo-icon"><i className="fa-solid fa-truck-fast" /></span>
              <span className="logo-text">CHOUDHARY<span className="accent-text">PORTAL</span></span>
            </Link>
          </div>
          <nav className="sidebar-menu">
            <a href="#" className="menu-item active" onClick={() => setSidebarOpen(false)}><i className="fa-solid fa-file-invoice" /> Challan Module</a>
            <a href="#" className="menu-item" onClick={() => setSidebarOpen(false)}><i className="fa-solid fa-truck" /> Vehicle Profiles</a>
            <a href="#" className="menu-item" onClick={() => setSidebarOpen(false)}><i className="fa-solid fa-id-card-clip" /> Driver Profiles</a>
            <a href="#" className="menu-item" onClick={() => setSidebarOpen(false)}><i className="fa-solid fa-screwdriver-wrench" /> Mechanic Logs</a>
          </nav>
        </aside>
        <div className="dash-content-area">
          <div className={sidebarOpen ? 'dashboard-overlay active' : 'dashboard-overlay'} onClick={() => setSidebarOpen(false)} />
          <header className="dash-header">
            <div className="header-left">
              <button type="button" className="sidebar-toggle-btn" onClick={() => setSidebarOpen((prev) => !prev)}>
                <i className="fa-solid fa-bars" />
              </button>
              <h2 className="workspace-title">Challan System</h2>
            </div>
          </header>
          <main className="dash-main-scroll">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="card-inner">
                  <div>
                    <span className="card-title">Total Challans</span>
                    <h3>0</h3>
                  </div>
                  <div className="card-icon blue-bg"><i className="fa-solid fa-file-lines" /></div>
                </div>
              </div>
              <div className="stat-card">
                <div className="card-inner">
                  <div>
                    <span className="card-title">Total Amount</span>
                    <h3>₹ 0</h3>
                  </div>
                  <div className="card-icon green-bg"><i className="fa-solid fa-indian-rupee-sign" /></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
