# 🎯 Kiwify - 3 Formas de Configurar

Escolha a opção que funcionar melhor para você!

---

## 🔵 OPÇÃO 1: Um Webhook por Produto (RECOMENDADO)

### Como Funciona:
Cada produto tem seu próprio webhook com o courseId na URL.

### Configuração:

**Webhook Produto 1:**
```
URL: https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=curso-123
Produtos: Selecione apenas Produto 1
```

**Webhook Produto 2:**
```
URL: https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=curso-456
Produtos: Selecione apenas Produto 2
```

### ✅ Vantagens:
- Simples de configurar
- Fácil de testar
- Não precisa de variáveis extras

### ❌ Desvantagens:
- Precisa criar um webhook para cada produto

---

## 🟢 OPÇÃO 2: Metadados no Produto (SE A KIWIFY SUPORTAR)

### Como Funciona:
Um webhook só, cada produto envia seu courseId nos metadados.

### Configuração:

**1. Criar UM webhook:**
```
URL: https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h
Produtos: Todos que sou produtor
```

**2. Em cada produto na Kiwify:**

Procure por "Metadados" ou "Campos Personalizados" e adicione:
```json
{
  "courseId": "curso-123"
}
```

### ✅ Vantagens:
- Um webhook só
- Fácil de adicionar novos produtos

### ❌ Desvantagens:
- Depende se a Kiwify suporta metadados customizados

---

## 🟡 OPÇÃO 3: Mapeamento Manual (ÚLTIMA OPÇÃO)

### Como Funciona:
Você mapeia manualmente cada produto Kiwify → Curso.

### Configuração:

**1. Criar UM webhook:**
```
URL: https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h
Produtos: Todos que sou produtor
```

**2. No Render, adicionar variável:**
```
Nome: KIWIFY_PRODUCT_MAPPING
Valor: {"PROD_KIWIFY_1":"curso-123","PROD_KIWIFY_2":"curso-456"}
```

**Como descobrir o ID do produto Kiwify:**
1. Faça uma compra de teste
2. Veja nos logs do Render qual `Product.id` foi enviado
3. Adicione no mapeamento

### ✅ Vantagens:
- Um webhook só
- Funciona sempre

### ❌ Desvantagens:
- Precisa atualizar variável toda vez que adicionar produto
- Precisa descobrir IDs dos produtos

---

## 🎯 Qual Escolher?

### Use OPÇÃO 1 se:
- ✅ Você tem poucos produtos (até 10)
- ✅ Quer simplicidade
- ✅ Não se importa de criar vários webhooks

### Use OPÇÃO 2 se:
- ✅ A Kiwify permite metadados customizados
- ✅ Você tem muitos produtos
- ✅ Quer gerenciar tudo pela Kiwify

### Use OPÇÃO 3 se:
- ✅ Opção 1 e 2 não funcionaram
- ✅ Você tem muitos produtos
- ✅ Não se importa de editar variáveis

---

## 🚀 Recomendação

**Comece com OPÇÃO 1** (um webhook por produto).

É a mais simples e funciona 100% garantido!

---

## 📝 Exemplo Prático - OPÇÃO 1

Você tem 3 cursos:
- Curso React: `curso-react-123`
- Curso Node: `curso-node-456`
- Curso Full: `curso-full-789`

### Na Kiwify, crie 3 webhooks:

**Webhook 1:**
```
Nome: Webhook - Curso React
URL: https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=curso-react-123
Produtos: Curso React
Eventos: Compra aprovada
```

**Webhook 2:**
```
Nome: Webhook - Curso Node
URL: https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=curso-node-456
Produtos: Curso Node
Eventos: Compra aprovada
```

**Webhook 3:**
```
Nome: Webhook - Curso Full
URL: https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=curso-full-789
Produtos: Curso Full Stack
Eventos: Compra aprovada
```

### Pronto! ✅

Agora:
- Cliente compra Curso React → Matriculado no curso-react-123
- Cliente compra Curso Node → Matriculado no curso-node-456
- Cliente compra Curso Full → Matriculado no curso-full-789

---

## 🧪 Como Testar

Clique em "Testar Webhook" em cada webhook na Kiwify.

Ou teste manualmente:
```bash
curl -X POST "https://area-de-membros-niuz.onrender.com/api/webhook/kiwify?token=zmf4nrsem5h&courseId=curso-react-123" \
  -H "Content-Type: application/json" \
  -d '{"Customer":{"email":"teste@example.com"}}'
```

---

## 📊 Resumo Visual

```
OPÇÃO 1: Um webhook por produto
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Produto 1    │────>│ Webhook 1    │────>│ Curso 1      │
│ (React)      │     │ ?courseId=1  │     │              │
└──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Produto 2    │────>│ Webhook 2    │────>│ Curso 2      │
│ (Node)       │     │ ?courseId=2  │     │              │
└──────────────┘     └──────────────┘     └──────────────┘


OPÇÃO 2: Metadados
┌──────────────┐     
│ Produto 1    │     
│ metadata:    │────>┐
│ courseId=1   │     │
└──────────────┘     │    ┌──────────────┐     ┌──────────────┐
                     ├───>│ Webhook      │────>│ Curso certo  │
┌──────────────┐     │    │ (único)      │     │              │
│ Produto 2    │     │    └──────────────┘     └──────────────┘
│ metadata:    │────>┘
│ courseId=2   │
└──────────────┘


OPÇÃO 3: Mapeamento
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Produto 1    │────>│ Webhook      │────>│ Mapeamento   │
│ id: PROD1    │     │ (único)      │     │ PROD1→Curso1 │
└──────────────┘     └──────────────┘     └──────────────┘
                                                    │
┌──────────────┐                                    v
│ Produto 2    │                           ┌──────────────┐
│ id: PROD2    │                           │ Curso certo  │
└──────────────┘                           └──────────────┘
```

---

## 🆘 Precisa de Ajuda?

Me avisa qual opção você quer usar e te ajudo a configurar! 🚀
