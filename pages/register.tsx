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
  const [role, setRole] = useState('Administrator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }
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
        body: JSON.stringify({ fullName: fullName.trim(), mobile: mobile.trim(), email: normalizedEmail, password, role })
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
        <title>Register | Choudhary Transport Portal</title>
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
            <p>Create Employee Account for Dispatch Portals</p>
          </div>

          {error && (
            <div className="auth-error-alert">
              <i className="fa-solid fa-triangle-exclamation" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="auth-success-alert">
              <i className="fa-solid fa-circle-check" />
              <span>{success}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
            <div className="input-group">
              <label htmlFor="reg-name">Full Name</label>
              <div className="input-with-icon">
                <i className="fa-solid fa-user" />
                <input
                  id="reg-name"
                  type="text"
                  placeholder="John Choudhary"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="reg-mobile">Mobile Number</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-phone" />
                  <input
                    id="reg-mobile"
                    type="tel"
                    placeholder="9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="reg-email">Email Address</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-envelope" />
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="john@choudhary.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="reg-password">Password</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-lock" />
                  <input
                    id="reg-password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="reg-confirm">Confirm Password</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-lock-open" />
                  <input
                    id="reg-confirm"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="reg-role">User Role / Assignment</label>
              <div className="input-with-icon">
                <i className="fa-solid fa-users-gear" />
                <select
                  id="reg-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="Administrator">Administrator (HQ)</option>
                  <option value="Dispatcher">Dispatcher (Station Manager)</option>
                  <option value="Data Entry Operator">Data Entry Operator</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Registering…' : 'Submit & Register Account'}
            </button>
          </form>

          <div className="auth-footer-links">
            <Link href="/login">Already have an account? Sign in</Link>
          </div>

          <div className="auth-redirect-text">
            Already have a dispatch account? <Link href="/login">Login Here</Link>
          </div>
        </div>
      </main>
    </>
  );
}
