FROM nginx:stable-alpine

COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html comum.js comum.css autenticacao.js dados.js /usr/share/nginx/html/
COPY ["OmniOS - Main", "/usr/share/nginx/html/OmniOS - Main/"]
COPY ["OmniOS - Ordens", "/usr/share/nginx/html/OmniOS - Ordens/"]
COPY ["OmniOS - Nova Ordem", "/usr/share/nginx/html/OmniOS - Nova Ordem/"]
COPY ["OmniOS - Detalhes", "/usr/share/nginx/html/OmniOS - Detalhes/"]
COPY ["OmniOS - Vendas", "/usr/share/nginx/html/OmniOS - Vendas/"]
COPY ["OmniOS - Nova Venda", "/usr/share/nginx/html/OmniOS - Nova Venda/"]
COPY ["OmniOS - Login", "/usr/share/nginx/html/OmniOS - Login/"]
COPY ["OmniOS - Perfis", "/usr/share/nginx/html/OmniOS - Perfis/"]
COPY ["OmniOS - Configuracoes", "/usr/share/nginx/html/OmniOS - Configuracoes/"]

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-e", "stderr", "-g", "daemon off;"]
