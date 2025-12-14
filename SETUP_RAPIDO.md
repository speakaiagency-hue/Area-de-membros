# ⚡ Setup Rápido - 5 Minutos

## 1️⃣ No Render (2 min)

Adicione 2 variáveis de ambiente:

```
KIWIFY_WEBHOOK_SECRET = zmf4nrsem5h
```

```
KIWIFY_PRODUCT_MAPPING = {"ID_PRODUTO_KIWIFY":"ID_CURSO_SEU_BANCO"}
```

**Exemplo real:**
```
KIWIFY_PRODUCT_MAPPING = {"ABC123":"curso-123-abc"}
```

---

## 2️⃣ Na Kiwify (2 min)

**URL do Webhook:**
```
https://SEU-APP.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h
```

**Eventos:**
- ✅ Compra aprovada

---

## 3️⃣ Deploy (1 min)

```bash
git checkout main
git merge fix/webhook-authentication
git push origin main
```

---

## ✅ Pronto!

Agora quando alguém comprar na Kiwify:
1. Webhook é chamado automaticamente
2. Usuário é criado (se não existir)
3. Matrícula é feita automaticamente
4. Cliente recebe acesso imediato

---

## 🆘 Precisa de Ajuda?

Veja o guia completo: **KIWIFY_SETUP.md**

---

## 🔍 Como Descobrir os IDs?

### ID do Curso (seu banco):
- Vá em `/admin` logado como admin
- Ou rode: `curl https://seu-app.onrender.com/api/courses`

### ID do Produto (Kiwify):
- Vá no produto na Kiwify
- Veja a URL: `kiwify.com.br/products/ABC123`
- O ID é `ABC123`

---

## 📝 Exemplo Completo

Se você tem:
- Produto Kiwify: `PROD789`
- Curso no sistema: `curso-xyz-456`
- App no Render: `minha-area`

**No Render:**
```
KIWIFY_WEBHOOK_SECRET = zmf4nrsem5h
KIWIFY_PRODUCT_MAPPING = {"PROD789":"curso-xyz-456"}
```

**Na Kiwify:**
```
https://minha-area.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h
```

✅ Pronto!
