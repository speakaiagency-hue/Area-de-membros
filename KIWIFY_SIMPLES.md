# 🚀 Configuração Kiwify - Modo Simples

## ✅ Solução: Um Webhook por Curso

Cada produto da Kiwify terá seu próprio webhook com o ID do curso na URL!

---

## 📋 Passo a Passo

### 1️⃣ Configurar Token no Render (1 vez só)

No Render, adicione **apenas 1 variável**:

```
Nome: KIWIFY_WEBHOOK_SECRET
Valor: zmf4nrsem5h
```

✅ Salve e aguarde o redeploy

---

### 2️⃣ Descobrir IDs dos Cursos

Você precisa saber o ID de cada curso no seu sistema.

**Como descobrir:**
1. Faça login como admin
2. Acesse: `https://area-de-membros-niuz.onrender.com/admin`
3. Veja a lista de cursos
4. Copie o ID de cada curso

**Exemplo:**
- Curso de React: `abc-123-def`
- Curso de Node: `xyz-789-uvw`
- Curso Full Stack: `qwe-456-rty`

---

### 3️⃣ Criar Um Webhook Para Cada Curso na Kiwify

Para **cada produto/curso**, crie um webhook separado:

#### 📘 Webhook do Curso 1 (React)

**Nome:** `Webhook - Curso React`

**URL:**
```
https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=abc-123-def
```

**Token:** `zmf4nrsem5h`

**Produtos:** Selecione apenas o produto "Curso React"

**Eventos:** ✅ Compra aprovada

---

#### 📗 Webhook do Curso 2 (Node)

**Nome:** `Webhook - Curso Node`

**URL:**
```
https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=xyz-789-uvw
```

**Token:** `zmf4nrsem5h`

**Produtos:** Selecione apenas o produto "Curso Node"

**Eventos:** ✅ Compra aprovada

---

#### 📕 Webhook do Curso 3 (Full Stack)

**Nome:** `Webhook - Curso Full Stack`

**URL:**
```
https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=qwe-456-rty
```

**Token:** `zmf4nrsem5h`

**Produtos:** Selecione apenas o produto "Curso Full Stack"

**Eventos:** ✅ Compra aprovada

---

## 🎯 Como Funciona

```
Cliente compra "Curso React" na Kiwify
         ↓
Kiwify chama webhook com courseId=abc-123-def
         ↓
Sistema cria/encontra usuário pelo email
         ↓
Sistema matricula no curso abc-123-def
         ↓
Cliente recebe acesso ao Curso React
```

---

## 📝 Template da URL

Para cada curso, use este formato:

```
https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=ID_DO_CURSO
```

**Substitua:**
- `ID_DO_CURSO` pelo ID real do curso no seu banco

---

## ✅ Vantagens Desta Abordagem

- ✅ Não precisa de mapeamento JSON
- ✅ Fácil de configurar
- ✅ Fácil de adicionar novos cursos
- ✅ Cada webhook é independente
- ✅ Fácil de testar individualmente

---

## 🧪 Como Testar

Para cada webhook, você pode testar assim:

```bash
# Teste do Curso React
curl -X POST "https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=abc-123-def" \
  -H "Content-Type: application/json" \
  -d '{"Customer":{"email":"teste@example.com"}}'

# Teste do Curso Node
curl -X POST "https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=xyz-789-uvw" \
  -H "Content-Type: application/json" \
  -d '{"Customer":{"email":"teste@example.com"}}'
```

**Resposta esperada:**
```json
{
  "message": "Enrollment created successfully",
  "enrollment": { ... }
}
```

---

## 📊 Exemplo Visual

```
Kiwify                           Seu Sistema
┌──────────────────┐            ┌──────────────┐
│ Produto: React   │            │ Curso React  │
│ Webhook 1        │ ────────>  │ abc-123-def  │
└──────────────────┘            └──────────────┘

┌──────────────────┐            ┌──────────────┐
│ Produto: Node    │            │ Curso Node   │
│ Webhook 2        │ ────────>  │ xyz-789-uvw  │
└──────────────────┘            └──────────────┘

┌──────────────────┐            ┌──────────────┐
│ Produto: Full    │            │ Curso Full   │
│ Webhook 3        │ ────────>  │ qwe-456-rty  │
└──────────────────┘            └──────────────┘
```

---

## 🔍 Ver Logs

No Render → Logs, você verá:

```
Kiwify webhook received: {
  "Customer": {
    "email": "cliente@example.com"
  },
  ...
}
courseId: abc-123-def
Enrollment created successfully
```

---

## ⚠️ Importante

1. **Cada produto = 1 webhook** na Kiwify
2. **Cada webhook = URL diferente** (com courseId diferente)
3. **Token é o mesmo** para todos: `zmf4nrsem5h`

---

## 🆘 Troubleshooting

### Erro: "Missing courseId in URL"
❌ Você esqueceu de adicionar `&courseId=XXX` na URL

✅ URL correta:
```
...webhook/kiwify?token=zmf4nrsem5h&courseId=abc-123
```

### Erro: "Course not found"
❌ O courseId na URL não existe no banco

✅ Verifique o ID em `/admin`

### Webhook não chama
❌ Produto não está vinculado ao webhook

✅ Na Kiwify, selecione o produto correto em cada webhook

---

## 📋 Checklist

- [ ] Token configurado no Render
- [ ] IDs dos cursos copiados
- [ ] Webhook 1 criado (Curso 1)
- [ ] Webhook 2 criado (Curso 2)
- [ ] Webhook 3 criado (Curso 3)
- [ ] Deploy feito
- [ ] Testes manuais OK
- [ ] Compra de teste OK

---

## 🎉 Pronto!

Agora cada compra na Kiwify matricula automaticamente no curso correto! 🚀
