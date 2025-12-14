# 🚀 Instruções Rápidas de Deploy

## ⚡ Quick Start (5 minutos)

### 1. Gerar Secret (30 segundos)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
📋 Copie o valor gerado

### 2. Configurar Render (1 minuto)
1. Acesse o dashboard do Render
2. Vá em Environment Variables
3. Adicione:
   ```
   KIWIFY_WEBHOOK_SECRET=<valor-copiado-acima>
   ```
4. Salve

### 3. Configurar Kiwify (2 minutos)
1. Acesse painel da Kiwify
2. Vá em Configurações → Webhooks
3. Configure:
   - **URL**: `https://seu-dominio.onrender.com/api/webhook/kiwify`
   - **Header customizado**:
     - Nome: `x-webhook-secret`
     - Valor: (mesmo valor do passo 1)
4. Salve

### 4. Deploy (1 minuto)
```bash
git checkout main
git merge fix/webhook-authentication
git push origin main
```

### 5. Testar (30 segundos)
```bash
# Substitua os valores
curl -X POST https://seu-dominio.onrender.com/api/webhook/kiwify \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: seu-secret-aqui" \
  -d '{"email":"teste@example.com","courseId":"id-do-curso"}'
```

✅ Deve retornar: `{"message":"Enrollment created successfully",...}`

---

## 🎯 O Que Foi Corrigido

### Bug Crítico
- ❌ **Antes**: Webhook retornava 401, matrículas não funcionavam
- ✅ **Agora**: Webhook funciona, matrículas automáticas

### Validações Adicionadas
- ✅ Email válido
- ✅ Curso existe
- ✅ Enrollment existe antes de completar aula
- ✅ Lesson pertence ao curso

---

## ⚠️ IMPORTANTE

**Sem configurar `KIWIFY_WEBHOOK_SECRET`**:
- ❌ Todos os webhooks serão rejeitados (401)
- ❌ Matrículas não funcionarão
- ❌ Clientes não receberão acesso

**Com configuração correta**:
- ✅ Webhooks funcionam automaticamente
- ✅ Matrículas criadas após compra
- ✅ Zero intervenção manual

---

## 📞 Problemas?

### Webhook retorna 401
```bash
# Verifique se o secret está configurado
echo $KIWIFY_WEBHOOK_SECRET  # No servidor

# Teste com secret correto
curl -H "x-webhook-secret: SEU_SECRET" ...
```

### Webhook retorna 404
```bash
# Verifique se o courseId existe
# Use um ID válido do banco de dados
```

### Webhook retorna 400
```bash
# Verifique o formato do email
# Deve ser: usuario@dominio.com
```

---

## 📚 Documentação Completa

- `BUGFIX_SUMMARY.md` - Resumo executivo
- `BUGFIX_WEBHOOK_AUTH.md` - Documentação técnica detalhada
- `server/__tests__/webhook.test.ts` - Estrutura de testes

---

## ✅ Checklist Final

- [ ] Secret gerado
- [ ] Secret configurado no Render
- [ ] Webhook configurado na Kiwify
- [ ] Deploy realizado
- [ ] Teste manual passou
- [ ] Compra de teste funcionou

---

**Tempo total estimado**: 5-10 minutos  
**Prioridade**: 🔴 CRÍTICA - Deploy imediatamente!
