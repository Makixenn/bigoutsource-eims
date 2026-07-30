async function test() {
  const res = await fetch('http://localhost:8025/api/v1/messages');
  const data = await res.json();
  const msgs = data.messages.slice(0, 10).map(m => ({ subject: m.Subject, to: m.To.map(t=>t.Address) }));
  console.log(msgs);
}
test().catch(console.error);
