# Bug Fix: Webhook Authentication & Validation

## 🐛 Bugs Corrigidos

### 1. **Webhook Kiwify Inacessível** (CRÍTICO)
**Problema**: O endpoint `/api/webhook/kiwifi` estava protegido com `requireAdmin`, impedindo que a Kiwify chamasse o webhook em produção.

**Impacto**: 
- Webhooks da Kiwify falhavam com 401 Unauthorized
- Usuários que compravam cursos não eram matriculados automaticamente
- Necessidade de matrícula manual para todos os alunos

**Solução**:
- Removida autenticação de sessão do endpoint
- Implementada autenticação via header `x-webhook-secret`
- Adicionada variável de ambiente `KIWIFY_WEBHOOK_SECRET`

### 2. **Falta de Validação de Dados no Webhook** (ALTO)
**Problema**: O webhook não validava os dados recebidos, permitindo requisições malformadas.

**Impacto**:
- Possibilidade de criar matrículas inválidas
- Erros 500 difíceis de debugar
- Dados corrompidos no banco

**Solução**:
- Validação de campos obrigatórios (email, courseId)
- Validação de formato de email
- Verificação de existência do curso
- Mensagens de erro específicas (400, 404)

### 3. **Endpoint de Conclusão Sem Validação** (ALTO)
**Problema**: `/api/enrollments/complete-lesson` não validava se o enrollment existia antes de tentar atualizar.

**Impacto**:
- Erros 500 quando usuário não matriculado tentava completar aula
- Mensagens de erro genéricas
- Experiência ruim para o usuário

**Solução**:
- Validação de campos obrigatórios
- Verificação de existência do enrollment
- Retorno 404 com mensagem clara quando não matriculado

### 4. **Falta de Validação Lesson-Course** (MÉDIO)
**Problema**: Usuário podia marcar como completa uma lesson de qualquer curso, mesmo que não pertencesse ao courseId informado.

**Impacto**:
- Corrupção de dados de progresso
- Progresso incorreto exibido
- Integridade de dados comprometida

**Solução**:
- Validação no `markLessonComplete` que verifica se a lesson pertence ao course
- Retorno undefined (404) se lesson não pertencer ao course

### 5. **Typo no Nome do Endpoint** (BAIXO)
**Problema**: Endpoint estava como `/api/webhook/kiwifi` (com 'i') ao invés de `/api/webhook/kiwify` (com 'y').

**Solução**:
- Corrigido para `/api/webhook/kiwify`

## 🔧 Mudanças Técnicas

### Arquivos Modificados

1. **server/routes.ts**
   - Removido `requireAdmin` do webhook
   - Adicionada autenticação via header secret
   - Adicionadas validações de dados
   - Melhoradas mensagens de erro
   - Corrigido typo no nome do endpoint

2. **server/storage.ts**
   - Adicionada validação lesson-course em `markLessonComplete`
   - Melhorada lógica de verificação

### Arquivos Criados

1. **.env.example**
   - Documentação de variáveis de ambiente necessárias
   - Incluindo nova variável `KIWIFY_WEBHOOK_SECRET`

2. **server/__tests__/webhook.test.ts**
   - Estrutura de testes para validar correções
   - Casos de teste para todos os cenários

3. **BUGFIX_WEBHOOK_AUTH.md** (este arquivo)
   - Documentação completa das correções

## 🚀 Como Aplicar

### 1. Configurar Variável de Ambiente

No Render, adicione a variável de ambiente:

```
KIWIFY_WEBHOOK_SECRET=seu-secret-aqui-use-valor-forte
```

**Importante**: Use um valor forte e aleatório. Exemplo:
```bash
# Gerar secret seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configurar Webhook na Kiwify

Na configuração do webhook da Kiwify:

- **URL**: `https://seu-dominio.com/api/webhook/kiwify`
- **Header customizado**: 
  - Nome: `x-webhook-secret`
  - Valor: (mesmo valor configurado no Render)

### 3. Testar o Webhook

```bash
# Teste local (substitua os valores)
curl -X POST http://localhost:5000/api/webhook/kiwify \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: seu-secret-aqui" \
  -d '{
    "email": "teste@example.com",
    "courseId": "id-do-curso"
  }'
```

### 4. Deploy

```bash
git add .
git commit -m "fix: webhook authentication and validation"
git push origin fix/webhook-authentication
```

## ✅ Validação

Após o deploy, verifique:

1. ✅ Webhook da Kiwify recebe 200 OK
2. ✅ Usuário é criado automaticamente
3. ✅ Matrícula é criada corretamente
4. ✅ Tentativas sem secret retornam 401
5. ✅ Dados inválidos retornam 400/404
6. ✅ Usuário não pode completar lesson de curso não matriculado
7. ✅ Usuário não pode completar lesson de outro curso

## 📊 Impacto Esperado

### Antes
- ❌ Webhooks falhando 100%
- ❌ Matrículas manuais necessárias
- ❌ Dados corrompidos possíveis
- ❌ Erros 500 frequentes

### Depois
- ✅ Webhooks funcionando automaticamente
- ✅ Matrículas automáticas via Kiwify
- ✅ Validação robusta de dados
- ✅ Mensagens de erro claras
- ✅ Integridade de dados garantida

## 🔒 Segurança

As mudanças melhoram a segurança:

1. **Autenticação via Secret**: Apenas requisições com secret correto são aceitas
2. **Validação de Dados**: Previne injeção de dados maliciosos
3. **Verificação de Relacionamentos**: Garante integridade referencial
4. **Rate Limiting**: Considere adicionar no futuro para prevenir abuse

## 📝 Próximos Passos Recomendados

1. Implementar os testes em `webhook.test.ts`
2. Adicionar logging estruturado para webhooks
3. Implementar retry mechanism para falhas temporárias
4. Adicionar monitoramento de webhooks (ex: Sentry)
5. Considerar rate limiting no endpoint do webhook
6. Documentar formato esperado do payload da Kiwify

## 🤝 Suporte

Se encontrar problemas:

1. Verifique logs no Render
2. Confirme que `KIWIFY_WEBHOOK_SECRET` está configurado
3. Teste o endpoint manualmente com curl
4. Verifique se o secret no header está correto
5. Confirme que o courseId existe no banco

## 📚 Referências

- [Kiwify Webhook Documentation](https://kiwify.com.br/docs/webhooks)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Render Environment Variables](https://render.com/docs/environment-variables)
