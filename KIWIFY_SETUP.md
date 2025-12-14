# 🚀 Configuração Kiwify - Guia Completo

## 📋 Passo a Passo

### 1️⃣ Configurar Variáveis no Render

Acesse o Render e adicione estas variáveis de ambiente:

#### Variável 1: Token da Kiwify
- **Key**: `KIWIFY_WEBHOOK_SECRET`
- **Value**: `zmf4nrsem5h`

#### Variável 2: Mapeamento Produto → Curso
- **Key**: `KIWIFY_PRODUCT_MAPPING`
- **Value**: (veja abaixo como montar)

---

### 2️⃣ Descobrir IDs dos Seus Cursos

Você precisa saber os IDs dos cursos no seu banco de dados.

**Opção A: Via Admin Dashboard**
1. Faça login como admin
2. Vá em `/admin`
3. Veja a lista de cursos
4. Copie os IDs

**Opção B: Via API (se tiver acesso)**
```bash
# Substitua pela URL do seu app
curl https://seu-app.onrender.com/api/courses
```

**Exemplo de resposta:**
```json
[
  {
    "id": "abc123-def456-ghi789",
    "title": "Curso de React",
    ...
  },
  {
    "id": "xyz789-uvw456-rst123",
    "title": "Curso de Node.js",
    ...
  }
]
```

---

### 3️⃣ Descobrir IDs dos Produtos na Kiwify

1. Acesse o painel da Kiwify
2. Vá em **Produtos**
3. Clique em cada produto
4. Na URL você verá algo como: `kiwify.com.br/products/ABC123`
5. O ID é `ABC123`

Ou procure no código fonte da página do produto.

---

### 4️⃣ Montar o Mapeamento

Agora você vai criar um JSON que mapeia:
- **Produto da Kiwify** → **Curso no seu sistema**

**Formato:**
```json
{"PRODUTO_KIWIFY_1":"CURSO_ID_1","PRODUTO_KIWIFY_2":"CURSO_ID_2"}
```

**Exemplo Real:**
```json
{"ABC123":"abc123-def456-ghi789","XYZ789":"xyz789-uvw456-rst123"}
```

⚠️ **IMPORTANTE**: 
- Tudo em uma linha só
- Sem espaços
- Sem quebras de linha

**Cole isso no Render** na variável `KIWIFY_PRODUCT_MAPPING`

---

### 5️⃣ Criar Webhook na Kiwify

1. Acesse: https://dashboard.kiwify.com.br
2. Vá em **Configurações** → **Webhooks**
3. Clique em **"Criar webhook"**
4. Preencha:

**Nome:**
```
Area de Membros - Matriculas
```

**URL do Webhook:**
```
https://seu-app.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h
```
⚠️ **Substitua** `seu-app` pelo nome real do seu app no Render

**Token:**
```
zmf4nrsem5h
```
(já está preenchido automaticamente)

**Produtos:**
- ✅ Marque **"Todos que sou produtor"**
- Ou selecione produtos específicos

**Eventos:**
- ✅ **Compra aprovada** (obrigatório)
- ✅ **Assinatura renovada** (se tiver assinaturas)
- Pode marcar outros se quiser

5. Clique em **"Salvar"** ou **"Criar"**

---

### 6️⃣ Fazer Deploy

No terminal do projeto:

```bash
# Voltar para main
git checkout main

# Fazer merge
git merge fix/webhook-authentication

# Enviar para o Render
git push origin main
```

Aguarde o deploy terminar (2-3 minutos).

---

### 7️⃣ Testar

#### Teste 1: Webhook Manual

Na Kiwify, clique em **"Testar Webhook"** no webhook que você criou.

Vá nos **Logs do Render** e procure por:
```
Kiwify webhook received: { ... }
```

#### Teste 2: Compra Real

1. Faça uma compra de teste na Kiwify
2. Verifique se o usuário foi criado
3. Tente fazer login com o email da compra

---

## 🔍 Exemplo Completo

### Cenário:
- **Produto Kiwify**: ID `PROD123`
- **Curso no Sistema**: ID `course-abc-123`
- **App no Render**: `minha-area-membros`

### Configuração no Render:

**KIWIFY_WEBHOOK_SECRET:**
```
zmf4nrsem5h
```

**KIWIFY_PRODUCT_MAPPING:**
```json
{"PROD123":"course-abc-123"}
```

### URL do Webhook na Kiwify:
```
https://minha-area-membros.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h
```

---

## 🐛 Troubleshooting

### Erro 401 (Unauthorized)
```
❌ Token inválido ou não configurado
```

**Solução:**
1. Verifique se `KIWIFY_WEBHOOK_SECRET` está no Render
2. Confirme que o token na URL está correto
3. Verifique se não há espaços extras

### Erro 400 (Missing courseId)
```
❌ Produto não mapeado
```

**Solução:**
1. Verifique o `KIWIFY_PRODUCT_MAPPING`
2. Confirme que o ID do produto está correto
3. Veja os logs para saber qual `productId` a Kiwify está enviando

### Erro 404 (Course not found)
```
❌ Curso não existe no banco
```

**Solução:**
1. Verifique se o curso existe: `/admin`
2. Confirme que o ID no mapeamento está correto
3. Crie o curso se necessário

### Webhook não chama
```
❌ URL incorreta ou app offline
```

**Solução:**
1. Verifique se o app está rodando no Render
2. Teste a URL manualmente:
```bash
curl https://seu-app.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"Customer":{"email":"teste@example.com"},"Product":{"id":"PROD123"}}'
```

---

## 📊 Ver Logs

### No Render:
1. Dashboard → Seu serviço
2. Aba **"Logs"**
3. Procure por: `Kiwify webhook received:`

### Exemplo de log bem-sucedido:
```
Kiwify webhook received: {
  "Customer": {
    "email": "cliente@example.com"
  },
  "Product": {
    "id": "PROD123"
  }
}
Enrollment created successfully
```

---

## ✅ Checklist Final

- [ ] `KIWIFY_WEBHOOK_SECRET` configurado no Render
- [ ] `KIWIFY_PRODUCT_MAPPING` configurado no Render
- [ ] IDs dos cursos copiados
- [ ] IDs dos produtos da Kiwify copiados
- [ ] Mapeamento criado corretamente
- [ ] Webhook criado na Kiwify
- [ ] URL do webhook correta (com `?token=...`)
- [ ] Deploy feito
- [ ] Teste manual funcionou
- [ ] Compra de teste funcionou

---

## 🎯 Formato do Payload da Kiwify

A Kiwify envia dados neste formato:

```json
{
  "order_id": "KIW123456",
  "order_status": "paid",
  "Customer": {
    "email": "cliente@example.com",
    "full_name": "João Silva"
  },
  "Product": {
    "id": "PROD123",
    "name": "Meu Curso"
  },
  "commissions": [...],
  "created_at": "2024-01-01T10:00:00Z"
}
```

O código extrai automaticamente:
- Email: `Customer.email`
- Product ID: `Product.id`
- Mapeia para o curso usando `KIWIFY_PRODUCT_MAPPING`

---

## 📞 Precisa de Ajuda?

Se algo não funcionar:

1. ✅ Verifique os logs no Render
2. ✅ Teste o webhook manualmente
3. ✅ Confirme as variáveis de ambiente
4. ✅ Verifique se os IDs estão corretos

Me avise qual erro está aparecendo! 🚀
