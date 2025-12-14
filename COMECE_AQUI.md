# 🚀 COMECE AQUI - Configuração Kiwify

## ⚡ 3 Passos Simples

### 1️⃣ No Render (1 minuto)

Adicione **apenas 1 variável**:

```
Nome: KIWIFY_WEBHOOK_SECRET
Valor: zmf4nrsem5h
```

✅ Pronto! Aguarde o redeploy (2-3 min)

---

### 2️⃣ Descubra os IDs dos Cursos (2 minutos)

Acesse como admin:
```
https://area-de-membros-niuz.onrender.com/admin
```

Copie o ID de cada curso. Exemplo:
- Curso 1: `abc-123-def`
- Curso 2: `xyz-789-uvw`

---

### 3️⃣ Crie os Webhooks na Kiwify (2 min por curso)

Para **cada curso**, crie um webhook:

#### Curso 1:
**URL:**
```
https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=abc-123-def
```

**Produtos:** Selecione o produto do Curso 1

**Eventos:** ✅ Compra aprovada

---

#### Curso 2:
**URL:**
```
https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=xyz-789-uvw
```

**Produtos:** Selecione o produto do Curso 2

**Eventos:** ✅ Compra aprovada

---

## 📝 Template

Para cada curso novo, use:

```
https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=ID_DO_CURSO
```

Substitua `ID_DO_CURSO` pelo ID real.

---

## ✅ Pronto!

Agora quando alguém comprar:
1. Kiwify chama o webhook
2. Sistema cria o usuário (se não existir)
3. Sistema matricula no curso correto
4. Cliente recebe acesso imediato

---

## 🧪 Testar

Na Kiwify, clique em **"Testar Webhook"** em cada webhook criado.

Ou teste manualmente:
```bash
curl -X POST "https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=SEU_CURSO_ID" \
  -H "Content-Type: application/json" \
  -d '{"Customer":{"email":"teste@example.com"}}'
```

---

## 📚 Mais Detalhes

- **KIWIFY_SIMPLES.md** ← Guia completo passo a passo
- **BUGFIX_SUMMARY.md** ← O que foi corrigido

---

## 🆘 Problemas?

**Erro 401:** Token errado ou não configurado
**Erro 404:** courseId não existe no banco
**Não chama:** Produto não vinculado ao webhook

---

**Dúvidas?** Me avise! 🚀
