const CHAVE = 'omnios_ordens';

function carregarOrdens() {
    return lerLista(CHAVE);
}

function salvarOrdens(lista) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(lista));
        return true;
    } catch (e) {
        aviso('Não foi possível salvar no navegador. A alteração não foi gravada.', 'erro');
        return false;
    }
}

function codigo(id) {
    return 'OS-' + String(id).padStart(4, '0');
}

function dinheiro(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Valores monetários são arredondados para centavos.
function arredondar(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
}

function custoPecas(o) {
    return arredondar((o.pecas || []).reduce(
        (total, p) => total + (Number(p.qtd) || 0) * (Number(p.valorUnit) || 0), 0
    ));
}

// Lucro = valor do serviço menos o custo das peças.
function lucro(o) {
    return arredondar((Number(o.valor) || 0) - custoPecas(o));
}

function dinheiroSinal(valor) {
    return (valor >= 0 ? '+' : '-') + dinheiro(Math.abs(valor));
}

function lucroHtml(o) {
    if (!(o.pecas && o.pecas.length) || o.status === 'Cancelado') return '';
    const l = lucro(o);
    return ` <span class="lucro ${l >= 0 ? 'positivo' : 'negativo'}">${dinheiroSinal(l)}</span>`;
}

function aviso(msg, tipo) {
    mostrarAviso(msg, tipo);
}

function esc(txt) {
    const div = document.createElement('div');
    div.textContent = txt;
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function normalizar(txt) {
    return String(txt).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const STATUS = ['Aberto', 'Em Andamento', 'Concluído', 'Cancelado'];
const POR_PAGINA = 6;

let busca, filtroStatus, filtroPrioridade;
let paginaAtual = 1;

function classeStatus(status) {
    if (status === 'Aberto') return 'aberto';
    if (status === 'Em Andamento') return 'andamento';
    if (status === 'Concluído') return 'concluido';
    return 'cancelado';
}

function classePrioridade(prioridade) {
    return normalizar(prioridade || 'baixa');
}

function dataCompleta(iso) {
    return new Date(iso).toLocaleDateString('pt-BR');
}

function filtrar(ordens) {
    const termo = normalizar(busca.value.trim());

    return ordens.filter(o => {
        if (filtroStatus.value !== 'Todos' && o.status !== filtroStatus.value) return false;
        if (filtroPrioridade.value !== 'Todas' && o.prioridade !== filtroPrioridade.value) return false;

        if (termo) {
            const texto = normalizar(
                `${codigo(o.id)} #${o.id} ${o.cliente} ${o.aparelho} ${o.problema} ${o.tecnico}`
            );
            if (!texto.includes(termo)) return false;
        }
        return true;
    });
}

function montarTabela() {
    if (!exigirPermissao('ordens')) return;
    const tbody = document.querySelector('.ordens tbody');
    let todas;
    try {
        todas = carregarOrdens();
    } catch (e) {
        tbody.innerHTML = '<tr class="tabela-vazia"><td colspan="9">Não foi possível carregar as ordens.</td></tr>';
        aviso('Verifique os dados e o armazenamento do navegador.', 'erro');
        return;
    }
    const lista = filtrar(todas).sort((a, b) => b.id - a.id);

    const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

    const inicio = (paginaAtual - 1) * POR_PAGINA;
    const visiveis = lista.slice(inicio, inicio + POR_PAGINA);

    if (lista.length === 0) {
        const msg = todas.length === 0
            ? 'Nenhuma ordem de serviço cadastrada.'
            : 'Nenhuma OS encontrada com esses filtros.';
        tbody.innerHTML = `<tr class="tabela-vazia"><td colspan="9">${msg}</td></tr>`;
    } else {
        tbody.innerHTML = visiveis.map(o => `
            <tr data-id="${o.id}">
                <td>${codigo(o.id)}</td>
                <td>${esc(o.cliente)}</td>
                <td>${esc(o.aparelho)}</td>
                <td>${esc(o.problema || '')}</td>
                <td>${esc((o.tecnico || '').split(' ')[0])}</td>
                <td><span class="prioridade ${esc(classePrioridade(o.prioridade))}">${esc(o.prioridade || '')}</span></td>
                <td>
                    <select class="status trocar-status ${classeStatus(o.status)}">
                        ${STATUS.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </td>
                <td>${dataCompleta(o.data)}</td>
                <td>
                    ${dinheiro(o.valor)}${lucroHtml(o)}
                    ${pode('excluir') ? '<button class="btn-excluir" title="Excluir" aria-label="Excluir ordem">✕</button>' : ''}
                </td>
            </tr>
        `).join('');
    }

    montarRodape(visiveis.length, lista.length, totalPaginas);
}

function montarRodape(qtdVisivel, total, totalPaginas) {
    document.querySelector('.contagem').textContent =
        `Mostrando ${qtdVisivel} de ${total} ${total === 1 ? 'ordem' : 'ordens'}`;

    let de = Math.max(1, paginaAtual - 2);
    let ate = Math.min(totalPaginas, de + 4);
    de = Math.max(1, ate - 4);

    let html = `<button data-pagina="${paginaAtual - 1}" ${paginaAtual === 1 ? 'disabled' : ''}>Anterior</button>`;
    for (let p = de; p <= ate; p++) {
        html += `<button data-pagina="${p}" class="${p === paginaAtual ? 'pagina-ativa' : ''}">${p}</button>`;
    }
    html += `<button data-pagina="${paginaAtual + 1}" ${paginaAtual === totalPaginas ? 'disabled' : ''}>Próxima</button>`;

    document.querySelector('.paginas').innerHTML = html;
}

function historicoDe(o) {
    return o.historico && o.historico.length
        ? o.historico
        : [{ status: 'Aberto', em: o.data, descricao: 'Ordem registrada' }];
}

function mudarStatus(id, novo) {
    if (!exigirPermissao('ordens')) return;
    let ordens;
    try {
        ordens = carregarOrdens();
    } catch (e) {
        aviso('Não foi possível carregar as ordens. Nenhum dado foi alterado.', 'erro');
        return;
    }
    const os = ordens.find(o => o.id === id);
    if (!os || os.status === novo || !STATUS.includes(novo)) return;

    const agora = new Date().toISOString();

    os.historico = historicoDe(os);
    os.historico.push({ status: novo, em: agora, descricao: `Status alterado de ${os.status} para ${novo}` });

    os.status = novo;
    os.finalizadaEm = novo === 'Concluído' ? agora : null;

    salvarOrdens(ordens);
}

function excluir(id) {
    if (!exigirPermissao('excluir')) return;
    if (!confirm(`Excluir a ${codigo(id)}?`)) return;
    let ordens;
    try {
        ordens = carregarOrdens();
    } catch (e) {
        aviso('Não foi possível carregar as ordens. Nenhum dado foi excluído.', 'erro');
        return;
    }
    if (salvarOrdens(ordens.filter(o => o.id !== id))) montarTabela();
}

function exportarBackup() {
    baixarBackup();
}

function recomecar() {
    paginaAtual = 1;
    montarTabela();
}

document.addEventListener('DOMContentLoaded', () => {
    if (!usuarioAtual() || !pode('ordens')) return;
    busca = document.querySelector('.search input');
    filtroStatus = document.querySelector('.filtro_finalizado select');
    filtroPrioridade = document.querySelector('.filtro_prioridade select');

    const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    document.querySelector('.data').textContent = '📅 ' + hoje;

    busca.addEventListener('input', recomecar);
    filtroStatus.addEventListener('change', recomecar);
    filtroPrioridade.addEventListener('change', recomecar);

    const tbody = document.querySelector('.ordens tbody');

    tbody.addEventListener('change', e => {
        if (!e.target.classList.contains('trocar-status')) return;
        const id = Number(e.target.closest('tr').dataset.id);
        mudarStatus(id, e.target.value);
        montarTabela();
    });

    tbody.addEventListener('click', e => {
        const linha = e.target.closest('tr[data-id]');
        if (!linha) return;
        const id = Number(linha.dataset.id);

        if (e.target.classList.contains('btn-excluir')) {
            excluir(id);
            return;
        }

        if (e.target.closest('select')) return;

        location.href = '../OmniOS%20-%20Detalhes/index.html?id=' + id;
    });

    document.getElementById('btn-exportar').addEventListener('click', exportarBackup);

    document.querySelector('.paginas').addEventListener('click', e => {
        const botao = e.target.closest('button');
        if (!botao || botao.disabled) return;
        paginaAtual = Number(botao.dataset.pagina);
        montarTabela();
    });

    montarTabela();
});
