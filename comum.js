// Estas funções são usadas pelas telas de ordens e de vendas.
function lerLista(chave) {
    const dados = localStorage.getItem(chave);
    if (dados === null) return [];

    const lista = JSON.parse(dados);
    validarLista(lista, chave);
    return lista;
}

function validarLista(lista, chave) {
    if (!Array.isArray(lista)) {
        throw new Error('A lista salva está em um formato inválido.');
    }

    const ids = [];
    for (const registro of lista) {
        if (!registro || !Number.isSafeInteger(registro.id) || registro.id < 1) {
            throw new Error('Registro inválido.');
        }
        if (ids.includes(registro.id)) {
            throw new Error('Existem registros com o mesmo número.');
        }
        ids.push(registro.id);

        if (chave === 'omnios_ordens') validarOrdemSalva(registro);
        if (chave === 'omnios_vendas') validarVendaSalva(registro);
        if (chave === 'omnios_usuarios') validarUsuarioSalvo(registro);
    }
    return lista;
}

function validarOrdemSalva(ordem) {
    for (const campo of ['cliente', 'aparelho', 'status', 'data']) {
        if (typeof ordem[campo] !== 'string') {
            throw new Error('Campo inválido na ordem.');
        }
    }
    if (!['Aberto', 'Em Andamento', 'Concluído', 'Cancelado'].includes(ordem.status)
        || Number.isNaN(new Date(ordem.data).getTime())) {
        throw new Error('Status ou data inválida na ordem.');
    }
    if (ordem.previsaoEntrega && !dataValida(ordem.previsaoEntrega)) {
        throw new Error('Previsão de entrega inválida.');
    }
    if (ordem.valor != null && !Number.isFinite(Number(ordem.valor))) {
        throw new Error('Valor inválido na ordem.');
    }
    for (const campo of ['tecnico', 'previsaoEntrega']) {
        if (ordem[campo] != null && typeof ordem[campo] !== 'string') {
            throw new Error('Campo inválido na ordem.');
        }
    }

    if (ordem.pecas != null) {
        if (!Array.isArray(ordem.pecas)) throw new Error('Lista de peças inválida.');
        for (const peca of ordem.pecas) {
            if (!peca || !Number.isSafeInteger(peca.id) || peca.id < 1
                || typeof peca.nome !== 'string'
                || !Number.isSafeInteger(peca.qtd) || peca.qtd < 1
                || !Number.isFinite(peca.valorUnit) || peca.valorUnit < 0) {
                throw new Error('Peça inválida na ordem.');
            }
        }
    }
    if (ordem.historico != null) {
        if (!Array.isArray(ordem.historico)) throw new Error('Histórico inválido.');
        for (const evento of ordem.historico) {
            if (!evento || typeof evento.status !== 'string' || typeof evento.em !== 'string') {
                throw new Error('Evento inválido no histórico.');
            }
        }
    }
}

function formatarTelefone(valor) {
    const digitos = valor.replace(/\D/g, '').slice(0, 11);
    if (!digitos) return '';
    if (digitos.length <= 2) return '(' + digitos;
    if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;

    let corte = 6;
    if (digitos.length === 11) corte = 7;
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, corte)}-${digitos.slice(corte)}`;
}

function mostrarAviso(mensagem, tipo) {
    const avisos = document.querySelectorAll('.aviso');
    for (const aviso of avisos) aviso.remove();

    const elemento = document.createElement('div');
    elemento.className = 'aviso ' + (tipo || '');
    elemento.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
    elemento.textContent = mensagem;
    document.body.appendChild(elemento);
    setTimeout(() => elemento.remove(), 5000);
}

function proximoNumero(lista) {
    let maior = 0;
    for (const registro of lista) {
        if (registro.id > maior) maior = registro.id;
    }
    if (!Number.isSafeInteger(maior + 1)) throw new Error('Limite de registros atingido.');
    return maior + 1;
}

function escaparHTML(texto) {
    const elemento = document.createElement('div');
    elemento.textContent = String(texto ?? '');
    return elemento.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatarDinheiro(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dataValida(texto) {
    if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
    const data = new Date(texto + 'T12:00:00Z');
    return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === texto;
}

function validarVendaSalva(venda) {
    for (const campo of ['cliente', 'item', 'modelo', 'responsavel']) {
        if (typeof venda[campo] !== 'string' || !venda[campo].trim()) {
            throw new Error('Campo inválido na venda.');
        }
    }
    if (!Number.isFinite(venda.valor) || venda.valor < 0.01
        || !Number.isSafeInteger(Math.round(venda.valor * 100)) || !dataValida(venda.data)) {
        throw new Error('Valor ou data inválida na venda.');
    }
    if (venda.status != null && !['Concluída', 'Cancelada'].includes(venda.status)) {
        throw new Error('Status inválido na venda.');
    }
}

function configuracoesSalvas() {
    const dados = JSON.parse(localStorage.getItem('omnios_configuracoes') || '{}');
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
        throw new Error('Configurações inválidas.');
    }
    return {
        nome: typeof dados.nome === 'string' ? dados.nome : 'OmniOS',
        telefone: typeof dados.telefone === 'string' ? dados.telefone : '',
        endereco: typeof dados.endereco === 'string' ? dados.endereco : ''
    };
}

function validarUsuarioSalvo(usuario) {
    for (const campo of ['nome', 'email', 'salt', 'senhaHash']) {
        if (typeof usuario[campo] !== 'string' || !usuario[campo]) {
            throw new Error('Os dados de um perfil estão inválidos.');
        }
    }
    if (!['Administrador', 'Atendente', 'Técnico'].includes(usuario.cargo)
        || typeof usuario.ativo !== 'boolean' || !usuario.permissoes
        || typeof usuario.permissoes !== 'object' || Array.isArray(usuario.permissoes)) {
        throw new Error('As permissões de um perfil estão inválidas.');
    }
}
