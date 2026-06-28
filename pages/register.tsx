import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullName.trim(), mobile: mobile.trim(), email: normalizedEmail, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      setSuccess('Registration successful. Redirecting to login...');
      setTimeout(() => router.push('/login'), 1200);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Register | Choudhary Transport</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <Link href="/" className="logo">
              <span className="logo-icon"><i className="fa-solid fa-truck-fast" /></span>
              <span className="logo-text">CHOUDHARY<span className="accent-text">TRANSPORT</span></span>
            </Link>
            <h2>Dispatcher Register</h2>
            <p>Create employee access for the transport portal.</p>
          </div>
          <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
            <div className="input-group">
              <label htmlFor="fullName">Full Name</label>
              <div className="input-with-icon">
                <i className="fa-solid fa-user" />
                <input id="fullName" type="text" placeholder="John Choudhary" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="mobile">Mobile Number</label>
              <div className="input-with-icon">
                <i className="fa-solid fa-phone" />
                <input id="mobile" type="tel" placeholder="9876543210" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <i className="fa-solid fa-envelope" />
                <input id="email" type="email" placeholder="john@choudhary.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-lock" />
                  <input id="password" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-lock-open" />
                  <input id="confirmPassword" type="password" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
                </div>
              </div>
            </div>
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </form>
          <div className="auth-footer-links">
            <Link href="/login">Already have an account? Sign in</Link>
          </div>
        </div>
      </main>
    </>
  );
}
