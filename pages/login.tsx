import Link from 'next/link';
import Head from 'next/head';

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login | Choudhary Transport</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg, rgba(3,82,255,0.08), rgba(6,188,132,0.08))' }}>
        <div className="auth-container" style={{ maxWidth: 440 }}>
          <div className="auth-header">
            <Link href="/" className="logo">
              <span className="logo-icon"><i className="fa-solid fa-truck-fast" /></span>
              <span className="logo-text">CHOUDHARY<span className="accent-text">TRANSPORT</span></span>
            </Link>
            <h2>Welcome Back</h2>
            <p>Secure Administrator & Dispatcher Portal</p>
          </div>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="input-group">
              <label htmlFor="email">Email Address / Mobile Number</label>
              <div className="input-with-icon">
                <i className="fa-solid fa-envelope" />
                <input id="email" type="text" placeholder="admin@choudhary.com" />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <i className="fa-solid fa-lock" />
                <input id="password" type="password" placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg">Authenticate & Enter</button>
          </form>
          <div className="auth-footer-links" style={{ justifyContent: 'space-between' }}>
            <a href="#">Forgot Password?</a>
            <Link href="/">Home Page</Link>
          </div>
          <div className="auth-redirect-text">
            New dispatcher or employee? <Link href="/register">Register Here</Link>
          </div>
        </div>
      </main>
    </>
  );
}
