# OmniOS

Projeto acadêmico de gerenciamento de ordens de serviço e vendas, feito com HTML, CSS e JavaScript.

## Executar

Entre na pasta que contém este README e inicie um servidor estático:

```bash
python3 -m http.server 8080
```

Abra `http://localhost:8080`. Use localhost ou HTTPS; o cadastro de senhas utiliza a API de criptografia do navegador.

Com Docker:

```bash
docker build -t omnios .
docker run --rm -p 8080:80 omnios
```

## Primeiro acesso

1. Abra a página inicial e escolha **Criar conta**.
2. A primeira conta criada será **Administradora**.
3. As contas criadas depois recebem o cargo **Atendente**.
4. Em **Perfis**, um administrador pode adicionar usuários, editar nomes, e-mails, cargos, senhas, permissões e ativar ou desativar contas.
5. Em **Configurações**, cada usuário pode alterar a própria conta usando sua senha atual.

As contas, as ordens e as vendas ficam no `localStorage` do navegador. A sessão fica no `sessionStorage` e termina ao sair. As senhas são guardadas como resumos PBKDF2 com salt individual.

Este login demonstra o fluxo de usuários para o trabalho. Não há servidor de autenticação: alguém com acesso às ferramentas do navegador pode alterar os dados e permissões locais. Os dados não são compartilhados entre computadores, navegadores ou domínios. Para uso comercial seriam necessários autenticação e banco de dados no servidor. Faça a apresentação com dados fictícios e use a mesma janela para demonstrar a troca de perfis.

## Funcionalidades

- Visão geral com indicadores de ordens e gráfico semanal.
- Cadastro de ordens, busca, filtros, paginação e alteração de status.
- Detalhes da ordem, peças, cálculo de custo e lucro, histórico e impressão.
- Cadastro e edição de vendas, busca, filtros por status e período, paginação, cancelamento e exclusão.
- Login, registro, gerenciamento de perfis e permissões.
- Configurações da assistência usadas na ficha impressa.
- Exportação e importação de backups de ordens e vendas.

## Permissões iniciais

| Função | Administrador | Atendente | Técnico |
| --- | --- | --- | --- |
| Ordens de serviço | Sim | Sim | Sim |
| Vendas | Sim | Sim | Não |
| Excluir registros | Sim | Não | Não |
| Exportar e importar | Sim | Não | Não |
| Gerenciar perfis | Sim | Não | Não |
| Alterar dados da assistência | Sim | Não | Não |
| Alterar a própria conta | Sim | Sim | Sim |

O administrador pode personalizar as permissões dos demais perfis. Sempre deve existir pelo menos um administrador ativo. O sistema impede excluir ou desativar a própria conta.

## Backup

Em **Configurações**, exporte as ordens e vendas para um arquivo JSON. Contas e senhas não são exportadas.

Na importação, escolha:

- **Adicionar sem substituir números existentes**: mantém os registros atuais e adiciona os números novos. Os conflitos são informados no resumo e ignorados.
- **Substituir os dados presentes no arquivo**: substitui somente as listas que existem no backup. Se um backup antigo tiver apenas ordens, as vendas atuais serão mantidas.

O arquivo é validado antes da confirmação. Backups antigos exportados pela tela de ordens continuam aceitos. O limite por arquivo é de 5 MB.

## Hospedagem

Para publicar com o template Cloudflare Containers:

```bash
npm install
npx wrangler login
npm run deploy
```

É necessário ter Node.js 22 ou superior, Docker em execução e uma conta com acesso ao Cloudflare Containers. O deploy informa o endereço HTTPS em `workers.dev`.

## Nomes
- **Jose Gustavo Rodrigues Simoncini**
- **Daniel Goncalves Araujo**
- **Renan Andre Gomes**
