// as ordens ficam salvas no localStorage por enquanto (ainda nao tem backend)
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

function dataCurta(iso) {
    return new Date(iso).toLocaleDateString('pt-BR');
}

function mesmoDia(a, b) {
    return a.toDateString() === b.toDateString();
}

// evita que o nome do cliente quebre o html
function esc(txt) {
    const div = document.createElement('div');
    div.textContent = txt;
    return div.innerHTML;
}

function classeStatus(status) {
    if (status === 'Em aberto') return 'aberto';
    if (status === 'Em andamento') return 'andamento';
    if (status === 'Finalizado') return 'finalizado';
    return 'cancelado';
}


// ---------- cards ----------
function atualizarCards(ordens) {
    const hoje = new Date();
    const valores = document.querySelectorAll('.card strong');

    const abertas = ordens.filter(o => o.status === 'Em aberto').length;
    const execucao = ordens.filter(o => o.status === 'Em andamento').length;
    const concluidasHoje = ordens.filter(o =>
        o.status === 'Finalizado' && o.finalizadaEm && mesmoDia(new Date(o.finalizadaEm), hoje)
    ).length;

    let totalMes = 0;
    ordens.forEach(o => {
        const d = new Date(o.data);
        if (o.status !== 'Cancelado' && d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()) {
            totalMes += Number(o.valor);
        }
    });

    valores[0].textContent = abertas;
    valores[1].textContent = execucao;
    valores[2].textContent = concluidasHoje;
    valores[3].textContent = dinheiro(totalMes);
}


// ---------- tabela ----------
function montarTabela(ordens) {
    const tbody = document.querySelector('.ordens tbody');

    if (ordens.length === 0) {
        tbody.innerHTML = `
            <tr class="tabela-vazia">
                <td colspan="6">Nenhuma ordem de serviço cadastrada.</td>
            </tr>`;
        return;
    }

    // so as 5 mais novas
    const recentes = [...ordens].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);

    tbody.innerHTML = recentes.map(o => `
        <tr>
            <td>#${o.id}</td>
            <td>${esc(o.cliente)}</td>
            <td>${esc(o.aparelho)}</td>
            <td><span class="status ${classeStatus(o.status)}">${o.status}</span></td>
            <td>${dataCurta(o.data)}</td>
            <td>${dinheiro(o.valor)}</td>
        </tr>
    `).join('');
}


// ---------- grafico da semana ----------
function montarGrafico(ordens) {
    // depois do primeiro desenho a classe muda, entao pego pela posicao
    const area = document.querySelector('.volume > div');
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const contagem = [0, 0, 0, 0, 0, 0, 0];

    // conta so os ultimos 7 dias
    const limite = new Date();
    limite.setHours(0, 0, 0, 0);
    limite.setDate(limite.getDate() - 6);

    ordens.forEach(o => {
        const d = new Date(o.data);
        if (d >= limite) contagem[d.getDay()]++;
    });

    const maior = Math.max(...contagem);
    if (maior === 0) {
        area.className = 'grafico-vazio';
        area.innerHTML = '<span>Nenhum dado disponível</span>';
        return;
    }

    area.className = 'grafico';
    area.innerHTML = contagem.map((qtd, i) => `
        <div class="coluna">
            <span class="qtd">${qtd || ''}</span>
            <div class="barra" style="height: ${(qtd / maior) * 100}%"></div>
            <span class="dia">${dias[i]}</span>
        </div>
    `).join('');
}


// ---------- modal nova OS ----------
function abrirModal() {
    const fundo = document.createElement('div');
    fundo.className = 'modal-fundo';
    fundo.innerHTML = `
        <form class="modal">
            <h2>Nova Ordem de Serviço</h2>

            <label>Cliente
                <input name="cliente" required>
            </label>

            <label>Aparelho
                <input name="aparelho" placeholder="Ex: iPhone 11, Dell G15..." required>
            </label>

            <label>Tipo
                <select name="tipo">
                    <option>Celular</option>
                    <option>PC</option>
                    <option>Notebook</option>
                </select>
            </label>

            <label>Valor (R$)
                <input name="valor" type="number" min="0" step="0.01" value="0">
            </label>

            <div class="modal-botoes">
                <button type="button" class="btn-cancelar">Cancelar</button>
                <button type="submit" class="btn-salvar">Salvar</button>
            </div>
        </form>
    `;
    document.body.appendChild(fundo);
    fundo.querySelector('input').focus();

    const fechar = () => fundo.remove();

    fundo.querySelector('.btn-cancelar').addEventListener('click', fechar);
    fundo.addEventListener('click', e => {
        if (e.target === fundo) fechar();
    });

    fundo.querySelector('form').addEventListener('submit', e => {
        e.preventDefault();
        const campos = e.target.elements;
        const ordens = carregarOrdens();
        const ultimoId = ordens.reduce((max, o) => Math.max(max, o.id), 0);

        ordens.push({
            id: ultimoId + 1,
            cliente: campos.cliente.value.trim(),
            aparelho: campos.aparelho.value.trim(),
            tipo: campos.tipo.value,
            status: 'Em aberto',
            data: new Date().toISOString(),
            valor: parseFloat(campos.valor.value) || 0
        });

        salvarOrdens(ordens);
        fechar();
        atualizarTela();
        aviso('OS criada!');
    });
}

function aviso(msg) {
    const div = document.createElement('div');
    div.className = 'aviso';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2500);
}


function atualizarTela() {
    const ordens = carregarOrdens();
    atualizarCards(ordens);
    montarTabela(ordens);
    montarGrafico(ordens);
}

document.addEventListener('DOMContentLoaded', () => {
    const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    document.querySelector('.data').textContent = '📅 ' + hoje;

    document.querySelector('#btn-nova-os').addEventListener('click', e => {
        e.preventDefault();
        abrirModal();
    });

    document.querySelector('#btn-nova-venda').addEventListener('click', e => {
        e.preventDefault();
        aviso('Vendas ainda não está pronto');
    });

    atualizarTela();

    // veio do botao "Nova OS" da tela de ordens
    if (location.hash === '#nova-os') {
        history.replaceState(null, '', location.pathname);
        abrirModal();
    }
});
