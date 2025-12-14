// Primeiro fazer login
const loginRes = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'speakai.agency@gmail.com',
    password: 'Diamante2019'
  })
});

const cookies = loginRes.headers.get('set-cookie');
console.log('Login:', loginRes.status);

// Criar um curso de teste
const createRes = await fetch('http://localhost:5000/api/courses', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Cookie': cookies
  },
  body: JSON.stringify({
    title: 'Curso Teste',
    description: 'Descrição do curso',
    coverImage: 'https://via.placeholder.com/300',
    author: 'Admin'
  })
});

const course = await createRes.json();
console.log('Curso criado:', course.id);

// Adicionar módulo e aula
const updateRes = await fetch(`http://localhost:5000/api/courses/${course.id}`, {
  method: 'PUT',
  headers: { 
    'Content-Type': 'application/json',
    'Cookie': cookies
  },
  body: JSON.stringify({
    title: 'Curso Teste',
    description: 'Descrição do curso',
    coverImage: 'https://via.placeholder.com/300',
    author: 'Admin',
    modules: [
      {
        title: 'Módulo 1',
        order: 0,
        lessons: [
          {
            title: 'Aula 1',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration: '10:00',
            order: 0
          }
        ]
      }
    ]
  })
});

const updated = await updateRes.json();
console.log('Status:', updateRes.status);
console.log('Módulos:', updated.modules?.length || 0);
console.log('Aulas:', updated.modules?.[0]?.lessons?.length || 0);

if (updateRes.ok) {
  console.log('\n✅ FUNCIONOU! Módulo e aula criados!');
} else {
  console.log('\n❌ ERRO:', updated);
}
