# Roteiro da apresentação

Duração sugerida: 8 a 10 minutos. Ajustem a divisão conforme a participação de cada integrante.

## Preparação

- Abram o domínio HTTPS ou `http://localhost:8080` antes da aula.
- Criem uma conta administradora e um perfil Técnico com e-mails e senhas fictícios.
- Separem uma ordem, uma venda e uma peça para a demonstração.
- Guardem um backup JSON fora da pasta do site.
- Confirmem que conhecem os dados de acesso e que estão usando o mesmo navegador.

## 1. Introdução — Daniel — 1 minuto

“Nosso projeto é o OmniOS, um sistema para organizar ordens de serviço e vendas de uma assistência técnica. O objetivo é facilitar o registro do atendimento, o acompanhamento dos serviços e a consulta das vendas.”

Mostre a visão geral e apresente rapidamente o menu.

## 2. Ordens de serviço — responsável pela parte — 2 minutos

1. Abra **Nova OS** e preencha um cliente fictício.
2. Escolha o aparelho, o técnico e a prioridade.
3. Salve e localize a ordem usando a busca.
4. Abra os detalhes e lance uma peça, por exemplo, 2 unidades de R$ 30,10 em um serviço de R$ 200,00.
5. Explique o resultado: custo de R$ 60,20 e lucro de R$ 139,80.
6. Altere o status e mostre o histórico.
7. Abra a impressão da ficha e cancele a impressão.

Explique: “Os dados do formulário viram um objeto JavaScript. Guardamos a lista em JSON no localStorage e usamos essa lista para montar as tabelas.”

## 3. Vendas — Jefferson — 2 minutos

1. Abra **Nova Venda** e registre um produto fictício.
2. Na aba **Vendas**, mostre a busca, os filtros e a paginação, se houver registros suficientes.
3. Edite o valor ou as observações da venda.
4. Cancele uma venda e mostre que ela deixa de entrar no total concluído.
5. Explique que o cancelamento mantém o registro e que a exclusão exige permissão.

## 4. Login, perfis e permissões — responsável pela parte — 2 minutos

1. Mostre o perfil conectado na barra lateral.
2. Abra **Perfis**, edite um usuário e explique os cargos.
3. Mostre que a primeira conta é administradora e que as demais começam como Atendente.
4. Saia e entre como Técnico na mesma janela.
5. Mostre que Vendas e Perfis não aparecem para esse usuário.
6. Entre novamente como administrador.

Explique: “A sessão identifica o usuário conectado. O sistema consulta as permissões para mostrar os menus e permitir as ações. As senhas ficam guardadas como resumos com salt.”

## 5. Configurações e backup — responsável pela parte — 1 minuto

1. Altere o nome da assistência em **Configurações**.
2. Exporte os dados para JSON.
3. Importe o mesmo arquivo no modo de adicionar.
4. Mostre que os números existentes são ignorados para evitar duplicação.
5. Explique que backups antigos contendo apenas ordens também são aceitos.

## 6. Hospedagem e encerramento — Jefferson — 1 minuto

“O Nginx serve os arquivos dentro de um contêiner Docker. O Dokploy inicia os serviços. O cloudflared conecta a aplicação ao domínio pelo Cloudflare Tunnel.”

Mostre o endereço do site, quando a hospedagem estiver ativa.

“Esta versão é um protótipo acadêmico com dados locais. Os próximos passos seriam implementar um servidor de autenticação e um banco de dados para compartilhar os registros entre computadores.”

## Perguntas que podem aparecer

**Por que usar localStorage?**

Para persistir os dados no navegador e praticar formulários, objetos, listas e JSON sem depender de um servidor de aplicação.

**Os dados ficam iguais em todos os computadores?**

Não. Cada navegador tem seus próprios dados. O backup permite transportar ordens e vendas manualmente.

**O login protege dados como um sistema comercial?**

Não. Ele demonstra o fluxo de acesso. A validação real de segurança precisaria acontecer no servidor.

**Como o lucro é calculado?**

Valor da ordem menos a quantidade de cada peça multiplicada pelo seu valor unitário. Os valores são arredondados para centavos.

**Como evitam duplicações na importação?**

O modo de adicionar compara os números dos registros. Os que já existem são mantidos e os novos são adicionados.

**Por que usar Docker e Cloudflare Tunnel?**

O Docker prepara o mesmo servidor Nginx para a execução. O túnel conecta esse servidor ao domínio sem publicar uma porta da aplicação diretamente na máquina.
