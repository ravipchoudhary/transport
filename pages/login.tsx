import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();

      if (!trimmedUsername || !trimmedPassword) {
        setError('Email/mobile and password are required.');
        setLoading(false);
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('Login payload:', { emailOrMobile: trimmedUsername, password: trimmedPassword });
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrMobile: trimmedUsername, password: trimmedPassword })
      }

      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      if (data.user) {
        localStorage.setItem('authUser', JSON.stringify(data.user));
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Login | Choudhary Transport Portal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <Link href="/" className="logo">
              <span className="logo-icon"><i className="fa-solid fa-truck-fast" /></span>
              <span className="logo-text">CHOUDHARY<span className="accent-text">TRANSPORT</span></span>
            </Link>
            <h2>Welcome Back</h2>
            <p>Secure Administrator & Dispatcher Portal</p>
          </div>

          {error && (
            <div className="auth-error-alert">
              <i className="fa-solid fa-triangle-exclamation" />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
            <div className="input-group">
              <label htmlFor="login-username">Email Address / Mobile Number</label>
              <div className="input-with-icon">
                <i className="fa-solid fa-envelope" />
                <input
                  id="login-username"
                  type="text"
                  required
                  placeholder="e.g., admin@choudhary.com"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-with-icon">
                <i className="fa-solid fa-lock" />
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Authenticating…' : 'Authenticate & Enter'}
            </button>
          </form>

          <div className="auth-footer-links">
            <a href="#" onClick={(e) => e.preventDefault()}>
              Forgot Password?
            </a>
            <Link href="/">Home Page</Link>
          </div>

          <div className="auth-redirect-text">
            New dispatcher or employee? <Link href="/register">Register Here</Link>
          </div>

          <div className="auth-redirect-text">
            Don't have an account yet? <Link href="/register">Create one now</Link>
          </div>
        </div>
      </main>
    </>
  );
}
