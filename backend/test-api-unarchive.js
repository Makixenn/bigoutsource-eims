async function run() {
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'eims@bigoutsource.ph', password: 'password123' })
  });
  const loginData = await loginRes.json();
  console.log('Login:', loginData);
}
run().catch(console.error);
