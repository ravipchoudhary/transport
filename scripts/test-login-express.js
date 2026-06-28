(async () => {
  try {
    const res = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ravi@encogix.com', password: '123456' })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Body:', data);
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
