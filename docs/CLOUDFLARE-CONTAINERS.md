# OmniOS no Cloudflare Containers

Configuração adaptada do [template oficial de contêineres](https://github.com/cloudflare/templates/tree/main/containers-template), criado pelo comando:

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/containers-template
```

Os arquivos necessários já foram integrados a este projeto. Não é preciso gerar outro projeto para publicar o OmniOS.

## Publicar

Na pasta que contém `wrangler.jsonc`, com Node.js 22 ou superior e Docker em execução:

```bash
docker info
npm install
npx wrangler login
npx wrangler whoami
npm run check
npm run deploy
```

A conta autenticada precisa ter acesso ao Cloudflare Containers. Se a conta ainda não tiver o produto habilitado, siga as instruções exibidas pelo Wrangler e pelo painel da Cloudflare.

O Wrangler compila e envia o Worker e a imagem Docker. Ao terminar, ele informa a URL HTTPS, no formato `https://omnios.<subdominio-da-conta>.workers.dev`. O primeiro provisionamento do contêiner pode levar alguns minutos.

Para consultar o estado:

```bash
npm run containers:status
```

Para publicar alterações, execute novamente `npm run deploy`.

## Como funciona

- `Dockerfile` empacota o site com Nginx na porta 80.
- `nginx-main.conf` envia erros diretamente para `stderr`, inclusive na inicialização com `nginx -e stderr`. Os links padrão da imagem para `/dev/stderr` e `/dev/stdout` podem falhar com `No such device or address` no Cloudflare Containers. O log de acesso do Nginx fica desativado; as requisições continuam registradas pela observabilidade do Worker.
- `cloudflare/index.js` encaminha todas as requisições ao mesmo contêiner, preservando os caminhos das páginas, arquivos e parâmetros da URL.
- `wrangler.jsonc` define o Worker `omnios`, o vínculo com o contêiner e o armazenamento SQLite exigido pelo Durable Object. Esse armazenamento não é um banco de dados do site.
- A configuração limita a aplicação a uma instância `lite`, que adormece após dois minutos sem requisições e volta a iniciar no próximo acesso.

Este fluxo usa diretamente Cloudflare Containers. O arquivo `docker-compose.yml` é utilizado pelo fluxo alternativo com Dokploy e Cloudflare Tunnel. O token `CLOUDFLARE_TUNNEL_TOKEN` não autentica o deploy com Wrangler.

As contas, ordens e vendas continuam no navegador. Antes de mudar de domínio, exporte os dados necessários pelo site.

## Desenvolvimento local

```bash
npm run dev
```

Abra `http://localhost:8787`. O Docker também precisa estar acessível para o Wrangler iniciar o contêiner local.

## Verificar a publicação

1. Abra a URL HTTPS informada pelo deploy.
2. Confira o carregamento da tela de login, dos estilos e das imagens.
3. Crie a primeira conta e entre no sistema.
4. Crie uma ordem e uma venda fictícias e atualize a página.

## Referências

- [Primeiro deploy de Cloudflare Containers](https://developers.cloudflare.com/containers/get-started/)
- [Configuração de contêineres no Wrangler](https://developers.cloudflare.com/workers/wrangler/configuration/#containers)
