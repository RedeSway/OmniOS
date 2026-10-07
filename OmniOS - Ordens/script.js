// mesma chave da tela principal, assim as duas usam os mesmos dados
const CHAVE = 'omnios_ordens';

function carregarOrdens() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE)) || [];
    } catch (e) {
        return [];
    }
}

function salvarOrdens(lista) {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
}

function dinheiro(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function esc(txt) {
    const div = document.createElement('div');
    div.textContent = txt;
    return div.innerHTML;
}

// tira acento e deixa minusculo pra busca funcionar com "joao" e "João"
function normalizar(txt) {
    return String(txt).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const STATUS = ['Em aberto', 'Em andamento', 'Finalizado', 'Cancelado'];

let busca, filtroTipo, filtroStatus;


function filtrar(ordens) {
    const termo = normalizar(busca.value.trim());

    return ordens.filter(o => {
        if (filtroTipo.value !== 'Todos' && o.tipo !== filtroTipo.value) return false;
        if (filtroStatus.value !== 'Todos' && o.status !== filtroStatus.value) return false;

        if (termo) {
            const texto = normalizar(`${o.id} #${o.id} ${o.cliente} ${o.aparelho}`);
            if (!texto.includes(termo)) return false;
        }
        return true;
    });
}

function montarTabela() {
    const tbody = document.querySelector('.ordens tbody');
    const todas = carregarOrdens();
    const lista = filtrar(todas).sort((a, b) => b.id - a.id);

    if (lista.length === 0) {
        const msg = todas.length === 0
            ? 'Nenhuma ordem de serviço cadastrada.'
            : 'Nenhuma OS encontrada com esses filtros.';
        tbody.innerHTML = `<tr class="tabela-vazia"><td colspan="6">${msg}</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(o => `
        <tr data-id="${o.id}">
            <td>#${o.id}</td>
            <td>${esc(o.cliente)}</td>
            <td>${esc(o.aparelho)} <small>(${o.tipo})</small></td>
            <td>
                <select class="trocar-status">
                    ${STATUS.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </td>
            <td>${new Date(o.data).toLocaleDateString('pt-BR')}</td>
            <td>
                ${dinheiro(o.valor)}
                <button class="btn-excluir" title="Excluir">✕</button>
            </td>
        </tr>
    `).join('');
}

function mudarStatus(id, novo) {
    const ordens = carregarOrdens();
    const os = ordens.find(o => o.id === id);
    if (!os) return;

    os.status = novo;
    // guarda quando finalizou pro card "Concluídos Hoje"
    os.finalizadaEm = novo === 'Finalizado' ? new Date().toISOString() : null;

    salvarOrdens(ordens);
}

function excluir(id) {
    if (!confirm(`Excluir a OS #${id}?`)) return;
    salvarOrdens(carregarOrdens().filter(o => o.id !== id));
    montarTabela();
}


document.addEventListener('DOMContentLoaded', () => {
    busca = document.querySelector('.search input');
    filtroTipo = document.querySelector('.filtro_dispositivo select');
    filtroStatus = document.querySelector('.filtro_finalizado select');

    const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    document.querySelector('.data').textContent = '📅 ' + hoje;

    busca.addEventListener('input', montarTabela);
    filtroTipo.addEventListener('change', montarTabela);
    filtroStatus.addEventListener('change', montarTabela);

    // "Ver todas" limpa os filtros
    document.querySelector('.painel-cabecalho a').addEventListener('click', e => {
        e.preventDefault();
        busca.value = '';
        filtroTipo.value = 'Todos';
        filtroStatus.value = 'Todos';
        montarTabela();
    });

    // os botoes da tabela sao criados depois, entao escuto no tbody
    const tbody = document.querySelector('.ordens tbody');

    tbody.addEventListener('change', e => {
        if (!e.target.classList.contains('trocar-status')) return;
        const id = Number(e.target.closest('tr').dataset.id);
        mudarStatus(id, e.target.value);
        montarTabela();
    });

    tbody.addEventListener('click', e => {
        if (!e.target.classList.contains('btn-excluir')) return;
        excluir(Number(e.target.closest('tr').dataset.id));
    });

    document.querySelector('#btn-nova-venda').addEventListener('click', e => {
        e.preventDefault();
        const div = document.createElement('div');
        div.className = 'aviso';
        div.textContent = 'Vendas ainda não está pronto';
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2500);
    });

    montarTabela();
});
