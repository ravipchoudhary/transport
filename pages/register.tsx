import Link from 'next/link';
import Head from 'next/head';

export default function RegisterPage() {
  return (
    <>
      <Head>
        <title>Register | Choudhary Transport</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg, rgba(3,82,255,0.08), rgba(6,188,132,0.08))' }}>
        <div className="auth-container" style={{ maxWidth: 500 }}>
          <div className="auth-header">
            <Link href="/" className="logo">
              <span className="logo-icon"><i className="fa-solid fa-truck-fast" /></span>
              <span className="logo-text">CHOUDHARY<span className="accent-text">TRANSPORT</span></span>
            </Link>
            <h2>Dispatcher Register</h2>
            <p>Create Employee Account for Dispatch Portals</p>
          </div>
          <form>
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-with-icon">
                <i className="fa-solid fa-user" />
                <input id="name" type="text" placeholder="John Choudhary" />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="mobile">Mobile Number</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-phone" />
                  <input id="mobile" type="tel" placeholder="9876543210" />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-envelope" />
                  <input id="email" type="email" placeholder="john@choudhary.com" />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-lock" />
                  <input id="password" type="password" placeholder="Min 6 characters" />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="confirm">Confirm Password</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-lock-open" />
                  <input id="confirm" type="password" placeholder="Re-enter password" />
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg">Submit & Register Account</button>
          </form>
          <div className="auth-footer-links">
            <Link href="/login">Already have an account?</Link>
          </div>
        </div>
      </main>
    </>
  );
}
