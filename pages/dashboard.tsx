import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'challan' | 'vehicle' | 'driver-profile' | 'driver' | 'mechanic' | 'diesel'>('challan');

  const switchTab = (tab: 'challan' | 'vehicle' | 'driver-profile' | 'driver' | 'mechanic' | 'diesel') => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const renderHeaderTitle = () => {
    switch (activeTab) {
      case 'vehicle':
        return 'Vehicle Profiles';
      case 'driver-profile':
        return 'Driver Profiles';
      case 'driver':
        return 'Driver Section';
      case 'mechanic':
        return 'Mechanic Logs';
      case 'diesel':
        return 'Diesel Tracker';
      default:
        return 'Challan System';
    }
  };

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
          <div className="user-profile-sub">
            <div className="avatar"><i className="fa-solid fa-user-tie" /></div>
            <div className="user-info">
              <h4 id="user-full-name">Administrator</h4>
              <span id="user-role-badge">Administrator</span>
            </div>
          </div>
          <nav className="sidebar-menu">
            <button type="button" className={`menu-item${activeTab === 'challan' ? ' active' : ''}`} onClick={() => switchTab('challan')}>
              <i className="fa-solid fa-file-invoice" /> Challan Module
            </button>
            <button type="button" className={`menu-item${activeTab === 'vehicle' ? ' active' : ''}`} onClick={() => switchTab('vehicle')}>
              <i className="fa-solid fa-truck" /> Vehicle Profiles
            </button>
            <button type="button" className={`menu-item${activeTab === 'driver-profile' ? ' active' : ''}`} onClick={() => switchTab('driver-profile')}>
              <i className="fa-solid fa-id-card-clip" /> Driver Profiles
            </button>
            <button type="button" className={`menu-item${activeTab === 'driver' ? ' active' : ''}`} onClick={() => switchTab('driver')}>
              <i className="fa-solid fa-id-card" /> Driver Section
            </button>
            <button type="button" className={`menu-item${activeTab === 'mechanic' ? ' active' : ''}`} onClick={() => switchTab('mechanic')}>
              <i className="fa-solid fa-screwdriver-wrench" /> Mechanic Logs
            </button>
            <button type="button" className={`menu-item${activeTab === 'diesel' ? ' active' : ''}`} onClick={() => switchTab('diesel')}>
              <i className="fa-solid fa-gas-pump" /> Diesel Tracker
            </button>
          </nav>
          <div className="sidebar-footer">
            <button type="button" className="btn btn-secondary btn-block btn-sm" onClick={() => { localStorage.clear(); window.location.href = '/login'; }}>
              <i className="fa-solid fa-right-from-bracket" /> Log Out
            </button>
          </div>
        </aside>
        <div className="dash-content-area">
          <div className={sidebarOpen ? 'dashboard-overlay active' : 'dashboard-overlay'} onClick={() => setSidebarOpen(false)} />
          <header className="dash-header">
            <div className="header-left">
              <button type="button" className="sidebar-toggle-btn" onClick={() => setSidebarOpen((prev) => !prev)}>
                <i className="fa-solid fa-bars" />
              </button>
              <h2 className="workspace-title">{renderHeaderTitle()}</h2>
            </div>
          </header>
          <main className="dash-main-scroll">
            <section className={activeTab === 'challan' ? 'dash-tab-pane active' : 'dash-tab-pane'}>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Total Challans</span>
                      <h3 id="stat-total-challans">0</h3>
                    </div>
                    <div className="card-icon blue-bg"><i className="fa-solid fa-file-lines" /></div>
                  </div>
                  <div className="card-footer-desc">Cumulative Records</div>
                </div>
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Rice Bags</span>
                      <h3 id="stat-rice-bags">0</h3>
                    </div>
                    <div className="card-icon orange-bg"><i className="fa-solid fa-bowl-rice" /></div>
                  </div>
                  <div className="card-footer-desc">This Month</div>
                </div>
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Wheat Bags</span>
                      <h3 id="stat-wheat-bags">0</h3>
                    </div>
                    <div className="card-icon blue-bg"><i className="fa-solid fa-wheat-awn" /></div>
                  </div>
                  <div className="card-footer-desc">This Month</div>
                </div>
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Total Bags</span>
                      <h3 id="stat-total-bags">0</h3>
                    </div>
                    <div className="card-icon green-bg"><i className="fa-solid fa-boxes-stacked" /></div>
                  </div>
                  <div className="card-footer-desc">This Month</div>
                </div>
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Total Amount</span>
                      <h3 id="stat-total-amount">₹ 0</h3>
                    </div>
                    <div className="card-icon green-bg"><i className="fa-solid fa-indian-rupee-sign" /></div>
                  </div>
                  <div className="card-footer-desc">This Month (₹10/Bag)</div>
                </div>
              </div>

              <div className="workspace-grid">
                <div className="workspace-table-panel">
                  <div className="panel-header">
                    <h3>Live Challan Database</h3>
                    <div className="filter-row">
                      <div className="search-box">
                        <i className="fa-solid fa-magnifying-glass" />
                        <input type="text" id="challan-search" placeholder="Search Dealer / Challan No..." />
                      </div>
                      <div className="month-filter">
                        <select id="challan-month-filter">
                          <option value="all">All Months</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div id="challan-table-loader" className="table-spinner">
                    <i className="fa-solid fa-circle-notch fa-spin" /> Retrieving Records...
                  </div>

                  <div className="table-responsive">
                    <table className="dash-table" id="challans-data-table">
                      <thead>
                        <tr>
                          <th>Challan No.</th>
                          <th>Dealer Name</th>
                          <th>Vehicle Number</th>
                          <th>Driver Name</th>
                          <th>Date</th>
                          <th className="text-right">Rice Bags</th>
                          <th className="text-right">Wheat Bags</th>
                          <th className="text-right">Total Bags</th>
                          <th className="text-right">Rate</th>
                          <th className="text-right">Amount</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody id="challan-table-rows"></tbody>
                    </table>
                  </div>

                  <div className="table-empty-state hidden" id="challan-table-empty">
                    <i className="fa-solid fa-receipt" />
                    <p>No challan records found matching your filters.</p>
                  </div>
                </div>

                <div className="workspace-form-panel">
                  <div className="form-card">
                    <h3 id="form-panel-title"><i className="fa-solid fa-folder-plus" /> Add New Challan Entry</h3>
                    <p className="form-panel-subtitle">Create a cargo consignment log. Amount is calculated automatically.</p>
                    <div className="form-feedback-toast hidden" id="form-toast"></div>
                    <form id="challan-entry-form">
                      <input type="hidden" id="form-challan-id" value="" />

                      <div className="input-group">
                        <label htmlFor="form-challan-no">Challan Number</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-hashtag" />
                          <input type="text" id="form-challan-no" required placeholder="e.g. CH-2026-90" />
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-dealer-name">Dealer / Trader Name</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-building-flag" />
                          <input type="text" id="form-dealer-name" required placeholder="e.g. Krishna Grain Agencies" />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-challan-vehicle">Vehicle Number</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-truck" />
                            <input type="text" id="form-challan-vehicle" placeholder="e.g. RJ-14-GD-8921" />
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-challan-driver">Driver Name</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-user" />
                            <input type="text" id="form-challan-driver" placeholder="e.g. Ram Singh Choudhary" />
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-challan-date">Challan Date</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-calendar" />
                            <input type="date" id="form-challan-date" required />
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-qrcode-input">Scan Challan QR</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-qrcode" />
                            <input type="text" id="form-qrcode-input" placeholder="Click to scan QR or paste code" />
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-rice-bags">Rice Bags Qty</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-bowl-rice" />
                            <input type="number" id="form-rice-bags" required defaultValue={0} min={0} />
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-wheat-bags">Wheat Bags Qty</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-wheat-awn" />
                            <input type="number" id="form-wheat-bags" required defaultValue={0} min={0} />
                          </div>
                        </div>
                      </div>

                      <div className="form-row calculations-highlight">
                        <div className="calc-box">
                          <span className="calc-label">Total Bags</span>
                          <span className="calc-val" id="form-total-bags-display">0</span>
                        </div>
                        <div className="calc-box">
                          <span className="calc-label">Total Amount</span>
                          <span className="calc-val accent-val" id="form-amount-display">₹ 0</span>
                        </div>
                      </div>

                      <div className="form-actions-row">
                        <button type="button" className="btn btn-secondary" onClick={() => {}}>
                          <i className="fa-solid fa-camera" /> Scan QR Code
                        </button>
                        <button type="submit" className="btn btn-primary" id="btn-form-submit">
                          <i className="fa-solid fa-circle-check" /> Save Record
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="report-section-panel">
                <div className="panel-header">
                  <h3><i className="fa-solid fa-chart-pie" /> Monthly Consolidated Ledger Reports</h3>
                  <p>Filter challans and review aggregate bags weight, rates, and cash collections.</p>
                </div>

                <div className="report-filter-bar">
                  <div className="r-filters">
                    <div className="input-group-inline">
                      <label htmlFor="report-select-month">Select Month</label>
                      <select id="report-select-month" defaultValue="06">
                        <option value="01">January</option>
                        <option value="02">February</option>
                        <option value="03">March</option>
                        <option value="04">April</option>
                        <option value="05">May</option>
                        <option value="06">June</option>
                        <option value="07">July</option>
                        <option value="08">August</option>
                        <option value="09">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>
                    <div className="input-group-inline">
                      <label htmlFor="report-select-year">Select Year</label>
                      <select id="report-select-year" defaultValue="2026">
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                        <option value="2028">2028</option>
                      </select>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => {}}>
                      <i className="fa-solid fa-filter" /> Compile Ledger
                    </button>
                  </div>

                  <div className="r-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => {}}>
                      <i className="fa-solid fa-file-csv" /> Export CSV
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                      <i className="fa-solid fa-print" /> Print Report
                    </button>
                  </div>
                </div>

                <div className="report-results-grid hidden" id="report-results-container">
                  <div className="report-summary-stats">
                    <div className="r-stat">
                      <span className="r-label">Total Challans</span>
                      <span className="r-val" id="report-total-challans">0</span>
                    </div>
                    <div className="r-stat">
                      <span className="r-label">Total Rice Bags</span>
                      <span className="r-val" id="report-rice-total">0</span>
                    </div>
                    <div className="r-stat">
                      <span className="r-label">Total Wheat Bags</span>
                      <span className="r-val" id="report-wheat-total">0</span>
                    </div>
                    <div className="r-stat">
                      <span className="r-label">Total Bags</span>
                      <span className="r-val" id="report-total-bags">0</span>
                    </div>
                    <div className="r-stat">
                      <span className="r-label">Total Amount</span>
                      <span className="r-val" id="report-total-amount">₹ 0</span>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="dash-table min-table">
                      <thead>
                        <tr>
                          <th>Challan No.</th>
                          <th>Date</th>
                          <th>Rice Bags</th>
                          <th>Wheat Bags</th>
                          <th>Total Bags</th>
                          <th className="text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody id="report-table-rows"></tbody>
                    </table>
                  </div>
                </div>

                <div className="report-empty-state" id="report-empty-container">
                  <i className="fa-solid fa-calculator" />
                  <p>Select Month and Year above and click "Compile Ledger" to review monthly totals.</p>
                </div>
              </div>
            </section>
            <section className={activeTab === 'vehicle' ? 'dash-tab-pane active' : 'dash-tab-pane'}>
              <h3>Vehicle Profiles</h3>
              <p>View and manage the fleet profile list, registrations and vehicle details here.</p>
            </section>
            <section className={activeTab === 'driver-profile' ? 'dash-tab-pane active' : 'dash-tab-pane'}>
              <h3>Driver Profiles</h3>
              <p>Manage driver records, licenses, and profile information from this module.</p>
            </section>
            <section className={activeTab === 'driver' ? 'dash-tab-pane active' : 'dash-tab-pane'}>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Driver Transactions</span>
                      <h3 id="stat-driver-transactions">0</h3>
                    </div>
                    <div className="card-icon blue-bg"><i className="fa-solid fa-file-lines" /></div>
                  </div>
                  <div className="card-footer-desc">Cumulative Records</div>
                </div>
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Advances (This Month)</span>
                      <h3 id="stat-driver-advances-this-month">₹ 0</h3>
                    </div>
                    <div className="card-icon green-bg"><i className="fa-solid fa-hand-holding-dollar" /></div>
                  </div>
                  <div className="card-footer-desc">Given to Drivers</div>
                </div>
              </div>

              <div className="workspace-grid">
                <div className="workspace-table-panel">
                  <div className="panel-header">
                    <h3>Live Driver Ledger Database</h3>
                    <div className="filter-row">
                      <div className="search-box">
                        <i className="fa-solid fa-magnifying-glass" />
                        <input type="text" id="driver-search" placeholder="Search Driver / Vehicle..." />
                      </div>
                      <div className="month-filter">
                        <select id="driver-month-filter" defaultValue="all">
                          <option value="all">All Months</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div id="driver-table-loader" className="table-spinner">
                    <i className="fa-solid fa-circle-notch fa-spin" /> Retrieving Records...
                  </div>

                  <div className="table-responsive">
                    <table className="dash-table" id="driver-data-table">
                      <thead>
                        <tr>
                          <th>Driver Name</th>
                          <th>Mobile Number</th>
                          <th>Vehicle Number</th>
                          <th className="text-right">Amount Given</th>
                          <th>Date</th>
                          <th>Payment Type</th>
                          <th>Remarks</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody id="driver-table-rows"></tbody>
                    </table>
                  </div>

                  <div className="table-empty-state hidden" id="driver-table-empty">
                    <i className="fa-solid fa-id-card" />
                    <p>No driver payment records found matching your filters.</p>
                  </div>
                </div>

                <div className="workspace-form-panel">
                  <div className="form-card">
                    <h3 id="driver-form-panel-title"><i className="fa-solid fa-user-plus" /> Add Driver Advance</h3>
                    <p className="form-panel-subtitle">Record payment or advance given to carrier driver. Date defaults to today.</p>
                    <div className="form-feedback-toast hidden" id="driver-form-toast"></div>

                    <form id="driver-entry-form" onSubmit={(e) => e.preventDefault()}>
                      <input type="hidden" id="form-driver-id" value="" />
                      <div className="input-group">
                        <label htmlFor="form-driver-name">Driver Name</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-user" />
                          <input type="text" id="form-driver-name" required placeholder="e.g. Ram Singh Choudhary" />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-driver-mobile">Mobile Number</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-phone" />
                            <input type="tel" id="form-driver-mobile" required placeholder="e.g. 9876543210" pattern="[0-9]{10}" />
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-driver-vehicle">Vehicle Number</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-truck" />
                            <input type="text" id="form-driver-vehicle" required placeholder="e.g. RJ-14-GD-8921" />
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-driver-amount">Amount Given / Advance</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-indian-rupee-sign" />
                            <input type="number" id="form-driver-amount" required placeholder="e.g. 5000" min={1} />
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-driver-date">Payment Date</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-calendar" />
                            <input type="date" id="form-driver-date" required />
                          </div>
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-driver-type">Payment Type</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-credit-card" />
                          <select id="form-driver-type" required defaultValue="Cash">
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Bank">Bank Transfer</option>
                          </select>
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-driver-remarks">Remarks</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-comment-dots" />
                          <input type="text" id="form-driver-remarks" placeholder="e.g. Advance for highway tolls" />
                        </div>
                      </div>

                      <div className="form-actions-row">
                        <button type="submit" className="btn btn-primary" id="btn-driver-form-submit">
                          <i className="fa-solid fa-circle-check" /> Save Record
                        </button>
                        <button type="button" className="btn btn-secondary" id="btn-driver-form-cancel" onClick={() => {}}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="report-section-panel">
                <div className="panel-header">
                  <h3><i className="fa-solid fa-chart-pie" /> Monthly Driver Ledger Compilation</h3>
                  <p>Filter logs and compile totals given to drivers during selected duration.</p>
                </div>

                <div className="report-filter-bar">
                  <div className="r-filters">
                    <div className="input-group-inline">
                      <label htmlFor="driver-report-month">Select Month</label>
                      <select id="driver-report-month" defaultValue="06">
                        <option value="01">January</option>
                        <option value="02">February</option>
                        <option value="03">March</option>
                        <option value="04">April</option>
                        <option value="05">May</option>
                        <option value="06">June</option>
                        <option value="07">July</option>
                        <option value="08">August</option>
                        <option value="09">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>
                    <div className="input-group-inline">
                      <label htmlFor="driver-report-year">Select Year</label>
                      <select id="driver-report-year" defaultValue="2026">
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                      </select>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => {}}>
                      <i className="fa-solid fa-arrows-rotate" /> Compile Ledger
                    </button>
                  </div>

                  <div className="r-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => {}}>
                      <i className="fa-solid fa-file-csv" /> Export to CSV
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                      <i className="fa-solid fa-print" /> Print Report
                    </button>
                  </div>
                </div>

                <div className="report-results-grid hidden" id="driver-report-results-container">
                  <div className="report-summary-stats">
                    <div className="r-stat">
                      <span className="r-label">Compiled Month</span>
                      <span className="r-val" id="driver-rep-display-month">June 2026</span>
                    </div>
                    <div className="r-stat">
                      <span className="r-label">Total Amount Paid</span>
                      <span className="r-val green-text" id="driver-rep-total-amount">₹ 0</span>
                    </div>
                    <div className="r-stat">
                      <span className="r-label">Unique Drivers Paid</span>
                      <span className="r-val" id="driver-rep-unique-drivers">0</span>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="dash-table min-table">
                      <thead>
                        <tr>
                          <th>Driver Name</th>
                          <th>Mobile Number</th>
                          <th>Vehicle Number</th>
                          <th className="text-right">Total Advance Given</th>
                          <th className="text-right">Transaction Count</th>
                        </tr>
                      </thead>
                      <tbody id="driver-report-table-rows"></tbody>
                    </table>
                  </div>
                </div>

                <div className="report-empty-state" id="driver-report-empty-container">
                  <i className="fa-solid fa-calculator" />
                  <p>Select Month and Year above and click "Compile Ledger" to review driver payments.</p>
                </div>
              </div>
            </section>
            <section className={activeTab === 'mechanic' ? 'dash-tab-pane active' : 'dash-tab-pane'}>
              <h3>Mechanic Logs</h3>
              <p>Record workshop maintenance entries and service logs for vehicles.</p>
            </section>
            <section className={activeTab === 'diesel' ? 'dash-tab-pane active' : 'dash-tab-pane'}>
              <h3>Diesel Tracker</h3>
              <p>Track fuel purchases, litre usage, and diesel expenses here.</p>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
