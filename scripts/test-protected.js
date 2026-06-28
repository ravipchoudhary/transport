(async () => {
  try {
    const login = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ravi@encogix.com', password: '123456' })
    });
    const data = await login.json();
    if (!login.ok) return console.error('Login failed', data);
    const token = data.token;
    const res = await fetch('http://localhost:3001/api/challans', { headers: { Authorization: `Bearer ${token}` } });
    console.log('Challans status:', res.status);
    console.log('Challans body:', await res.json());
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
