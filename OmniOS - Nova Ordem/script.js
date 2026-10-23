const CHAVE = 'omnios_ordens';

function carregarOrdens() {
    return lerLista(CHAVE);
}

function salvarOrdens(lista) {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
}

function codigo(id) {
    return 'OS-' + String(id).padStart(4, '0');
}

function aviso(msg, tipo) {
    mostrarAviso(msg, tipo);
}

// Usa a data local para evitar a mudança de dia em UTC.
function hojeISO() {
    return new Date().toLocaleDateString('sv-SE');
}

const telefone = document.getElementById("telefone");

const campos = {
    cliente:  { el: document.querySelector('.input-grande'),   nome: 'Nome do Cliente' },
    telefone: { el: telefone,                                  nome: 'Telefone de Contato' },
    tipo:     { el: document.querySelector('.input-aparelho'), nome: 'Tipo de Aparelho' },
    aparelho: { el: document.querySelector('.input-modelo'),   nome: 'Marca e Modelo' },
    valor:    { el: document.getElementById('valor'),          nome: 'Valor da Ordem' },
    problema: { el: document.querySelector('.descricao'),      nome: 'Descrição do Problema' },
    tecnico:  { el: document.querySelector('.input-tecnico'),  nome: 'Técnico Responsável' },
    previsao: { el: document.querySelector('.input-data'),     nome: 'Previsão de Entrega' }
};

function prioridadeSelecionada() {
    return document.querySelector('.prioridades .prioridade-ativa').textContent.trim();
}

function validar() {
    const invalidos = [];
    const marcar = (chave, ruim) => {
        campos[chave].el.classList.toggle('input-erro', ruim);
        if (ruim) invalidos.push(campos[chave].nome);
    };

    marcar('cliente', campos.cliente.el.value.trim() === '');

    const digitos = telefone.value.replace(/\D/g, '');
    marcar('telefone', digitos.length < 10 || digitos.length > 11);

    marcar('tipo', !campos.tipo.el.value);
    marcar('aparelho', campos.aparelho.el.value.trim() === '');
    marcar('problema', campos.problema.el.value.trim() === '');
    marcar('tecnico', !campos.tecnico.el.value);

    const valorTxt = campos.valor.el.value;
    const valor = Number(valorTxt);
    const valorInvalido = !Number.isFinite(valor) || valor < 0
        || !Number.isSafeInteger(Math.round(valor * 100));
    marcar('valor', campos.valor.el.validity.badInput || (valorTxt !== '' && valorInvalido));

    const previsao = campos.previsao.el.value;
    marcar('previsao', previsao !== '' && previsao < hojeISO());

    return invalidos;
}

function salvarOrdem() {
    if (!exigirPermissao('ordens')) return;
    const invalidos = validar();
    if (invalidos.length > 0) {
        aviso('Verifique: ' + invalidos.join(', ') + '.', 'erro');
        return;
    }

    let ordens;
    try {
        ordens = carregarOrdens();
    } catch (e) {
        aviso('Não foi possível ler as ordens salvas. Verifique o armazenamento do navegador.', 'erro');
        return;
    }

    const proximoId = ordens.reduce((maior, o) => Math.max(maior, o.id), 0) + 1;
    if (!Number.isSafeInteger(proximoId)) {
        aviso('Limite de registros atingido. A OS não foi salva.', 'erro');
        return;
    }

    const valorTxt = campos.valor.el.value;

    const agora = new Date().toISOString();

    const ordem = {
        id: proximoId,
        cliente: campos.cliente.el.value.trim(),
        telefone: telefone.value,
        tipo: campos.tipo.el.value,
        aparelho: campos.aparelho.el.value.trim(),
        valor: valorTxt === '' ? 0 : Math.round(Number(valorTxt) * 100) / 100,
        problema: campos.problema.el.value.trim(),
        prioridade: prioridadeSelecionada(),
        tecnico: campos.tecnico.el.value,
        previsaoEntrega: campos.previsao.el.value || null,
        status: 'Aberto',
        data: agora,
        finalizadaEm: null,
        pecas: [],
        historico: [{ status: 'Aberto', em: agora, descricao: 'Ordem registrada' }]
    };

    ordens.push(ordem);

    try {
        salvarOrdens(ordens);
    } catch (e) {
        aviso('Não foi possível salvar no navegador. A OS não foi salva.', 'erro');
        return;
    }

    aviso(`${codigo(ordem.id)} salva com sucesso!`, 'ok');
    limparFormulario();

    setTimeout(() => {
        location.href = '../OmniOS%20-%20Ordens/index.html';
    }, 1200);
}

function limparFormulario() {
    Object.values(campos).forEach(({ el }) => {
        el.value = '';
        el.classList.remove('input-erro');
    });

    campos.tipo.el.selectedIndex = 0;
    campos.tecnico.el.selectedIndex = 0;

    document.querySelectorAll('.prioridades button').forEach(b => {
        b.classList.toggle('prioridade-ativa', b.textContent.trim() === 'Média');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (!usuarioAtual() || !pode('ordens')) return;
    const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    document.querySelector('.data').textContent = '📅 ' + hoje;

    campos.previsao.el.min = hojeISO();

    const prioridades = document.querySelectorAll('.prioridades button');

    prioridades.forEach((prioridade) => {
        prioridade.addEventListener('click', () => {
            prioridades.forEach((opcao) => {
                opcao.classList.remove('prioridade-ativa');
            });

            prioridade.classList.add('prioridade-ativa');
        });
    });

    Object.values(campos).forEach(({ el }) => {
        el.addEventListener('input', () => el.classList.remove('input-erro'));
        el.addEventListener('change', () => el.classList.remove('input-erro'));
    });

    document.querySelector('.btn-salvar').addEventListener('click', salvarOrdem);
    document.querySelector('.btn-cancelar').addEventListener('click', limparFormulario);
});

telefone.addEventListener('input', () => {
    telefone.value = formatarTelefone(telefone.value);
});
