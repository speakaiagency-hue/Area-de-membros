const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'speakai.agency@gmail.com',
    password: 'Diamante2019'
  })
});

const data = await response.json();
console.log('Status:', response.status);
console.log('Response:', JSON.stringify(data, null, 2));

if (response.ok) {
  console.log('\n✅ LOGIN FUNCIONOU!');
  console.log('👤 Usuário:', data.name);
  console.log('🔑 Role:', data.role);
} else {
  console.log('\n❌ LOGIN FALHOU!');
}
