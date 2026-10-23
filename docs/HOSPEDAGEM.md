# Hospedagem no Dokploy com Cloudflare Tunnel

Os arquivos `Dockerfile`, `nginx.conf` e `docker-compose.yml` ficam na raiz do projeto, junto ao `index.html`.

## Preparar o repositório

Quando a conta do grupo estiver pronta, envie esta pasta para o GitHub. O commit e o push ainda não foram feitos.

## Dokploy com o túnel incluído

1. Crie um serviço **Docker Compose** no projeto do Dokploy e conecte o repositório do grupo.
2. Selecione `docker-compose.yml`. O diretório de trabalho deve ser a pasta que contém esse arquivo. Se o repositório contiver a pasta `OmniOS-main`, use essa subpasta como contexto.
3. Nas variáveis de ambiente do serviço, defina `CLOUDFLARE_TUNNEL_TOKEN` com o token do seu túnel. Não coloque o token no código nem no GitHub.
4. No painel do Cloudflare, abra o túnel e adicione uma rota de aplicação publicada para o domínio escolhido.
5. Na rota, selecione **HTTP** e informe o serviço `web:80` (equivalente a `http://web:80`).
6. Faça o deploy no Dokploy. O Compose inicia o Nginx, aguarda a verificação de saúde e depois inicia o `cloudflared`.
7. Acesse o domínio por **HTTPS** e crie a primeira conta administradora.

Não é necessário publicar a porta do contêiner na máquina. O `cloudflared` acessa o serviço `web` pela rede interna do Compose. Use um túnel dedicado para esta aplicação; se houver outros conectores do mesmo túnel em redes diferentes, todos precisam conseguir resolver o destino configurado.

O token usado é o token de execução do túnel, não uma chave de API da conta Cloudflare.

## Subir o Compose manualmente

```bash
cp .env.example .env
```

Edite `.env` e preencha o token. Depois:

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=50 web cloudflared
```

A rota no Cloudflare também precisa apontar para `http://web:80`.

## Dokploy sem o cloudflared deste projeto

Se o túnel já estiver instalado na mesma rede do Dokploy, você pode criar uma aplicação com o tipo de build **Dockerfile**, arquivo `Dockerfile` e contexto desta pasta. A porta interna do Nginx é **80**. Configure o destino do seu conector para um endereço que ele consiga alcançar; o nome `web` só vale dentro da rede do Compose fornecido aqui.

## Verificação

- Confirme que `web` está saudável e que `cloudflared` conectou ao túnel.
- Abra o endereço HTTPS e teste cadastro e login.
- Crie uma ordem e uma venda fictícias.
- Atualize a página e confira que os registros continuam no mesmo navegador.
- Exporte o backup e teste sua importação.
- O servidor hospeda os arquivos; os cadastros e registros continuam no navegador. Mudar de domínio não transfere os dados automaticamente.

## Referências

- [Docker Compose no Dokploy](https://docs.dokploy.com/docs/core/docker-compose)
- [Configuração do Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/get-started/)
- [Parâmetro TUNNEL_TOKEN](https://developers.cloudflare.com/tunnel/reference/run-parameters/#token)
- [Imagem oficial do Nginx](https://hub.docker.com/_/nginx)
