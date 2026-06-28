import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    let data: any = null;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password })
      });
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        throw new Error((data && data.error) || 'Login failed');
      }
      if (data?.token) {
        localStorage.setItem('authToken', data.token);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Login | Choudhary Transport</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="login-page">
        <div className="login-card">
          <div className="login-side">
            <div className="login-side-content">
              <div className="logo login-logo">
                <span className="logo-icon"><i className="fa-solid fa-truck-fast" /></span>
                <span className="logo-text">CHOUDHARY<span className="accent-text">TRANSPORT</span></span>
              </div>
              <h1>Welcome back</h1>
              <p>Sign in securely to access your administration panel, create challans, and manage fleet operations from the dispatch portal.</p>
            </div>
          </div>
          <div className="login-form-panel">
            <div className="login-form-inner">
              <div className="login-header">
                <div className="logo login-logo-sm">
                  <span className="logo-icon"><i className="fa-solid fa-truck-fast" /></span>
                  <span className="logo-text">CHOUDHARY<span className="accent-text">TRANSPORT</span></span>
                </div>
                <h2>Administrator Login</h2>
                <p>Enter your email/mobile and password to continue.</p>
              </div>
              <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
                <div className="input-group">
                  <label htmlFor="email">Email Address / Mobile Number</label>
                  <div className="input-with-icon">
                    <i className="fa-solid fa-envelope" />
                    <input id="email" type="text" placeholder="admin@choudhary.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="input-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-with-icon">
                    <i className="fa-solid fa-lock" />
                    <input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </div>
                {error && <div className="form-error">{error}</div>}
                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                  {loading ? 'Signing in…' : 'Authenticate & Enter'}
                </button>
              </form>
              <div className="auth-footer-links">
                <a href="#">Forgot Password?</a>
                <Link href="/">Home Page</Link>
              </div>
              <div className="auth-redirect-text">
                New dispatcher or employee? <Link href="/register">Register Here</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
