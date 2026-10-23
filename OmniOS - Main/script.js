const CHAVE = 'omnios_ordens';

function carregarOrdens() {
    return lerLista(CHAVE);
}

function dinheiro(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dataCurta(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function mesmoDia(a, b) {
    return a.toDateString() === b.toDateString();
}

function codigo(id) {
    return 'OS-' + String(id).padStart(4, '0');
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

function esc(txt) {
    const div = document.createElement('div');
    div.textContent = txt;
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function classeStatus(status) {
    if (status === 'Aberto') return 'aberto';
    if (status === 'Em Andamento') return 'andamento';
    if (status === 'Concluído') return 'concluido';
    return 'cancelado';
}

function atualizarCards(ordens) {
    const hoje = new Date();
    const valores = document.querySelectorAll('.card strong');

    const abertas = ordens.filter(o => o.status === 'Aberto').length;
    const execucao = ordens.filter(o => o.status === 'Em Andamento').length;
    const concluidasHoje = ordens.filter(o =>
        o.status === 'Concluído' && o.finalizadaEm && mesmoDia(new Date(o.finalizadaEm), hoje)
    ).length;

    let totalMes = 0;
    ordens.forEach(o => {
        const d = new Date(o.data);
        if (o.status !== 'Cancelado' && d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()) {
            totalMes += lucro(o);
        }
    });

    valores[0].textContent = abertas;
    valores[1].textContent = execucao;
    valores[2].textContent = concluidasHoje;
    valores[3].textContent = dinheiro(arredondar(totalMes));
}

function montarTabela(ordens) {
    const tbody = document.querySelector('.ordens tbody');

    if (ordens.length === 0) {
        tbody.innerHTML = `
            <tr class="tabela-vazia">
                <td colspan="6">Nenhuma ordem de serviço cadastrada.</td>
            </tr>`;
        return;
    }

    const recentes = [...ordens].sort((a, b) => b.id - a.id).slice(0, 5);

    tbody.innerHTML = recentes.map(o => `
        <tr data-id="${o.id}">
            <td>${codigo(o.id)}</td>
            <td>${esc(o.cliente)}</td>
            <td>${esc(o.aparelho)}</td>
            <td><span class="status ${classeStatus(o.status)}">${esc(o.status)}</span></td>
            <td>${dataCurta(o.data)}</td>
            <td>${dinheiro(o.valor)}${lucroHtml(o)}</td>
        </tr>
    `).join('');
}

function montarGrafico(ordens) {
    const area = document.querySelector('.volume > div');
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const totais = [0, 0, 0, 0, 0, 0, 0];

    const limite = new Date();
    limite.setHours(0, 0, 0, 0);
    limite.setDate(limite.getDate() - 6);

    ordens.forEach(o => {
        if (o.status === 'Cancelado') return;
        const d = new Date(o.data);
        if (d >= limite) totais[d.getDay()] += lucro(o);
    });

    const maior = Math.max(...totais);
    if (maior <= 0) {
        area.className = 'grafico-vazio';
        area.innerHTML = '<span>Nenhum dado disponível</span>';
        return;
    }

    area.className = 'grafico';
    area.innerHTML = totais.map((total, i) => `
        <div class="coluna" title="${dias[i]}: ${dinheiro(arredondar(total))}">
            <div class="barra-area">
                <div class="barra" style="height: ${total > 0 ? (total / maior) * 100 : 0}%"></div>
            </div>
            <span class="dia">${dias[i]}</span>
        </div>
    `).join('');
}

function atualizarTela() {
    if (!usuarioAtual()) return;
    if (!pode('ordens')) {
        document.querySelector('.cards').hidden = true;
        document.querySelector('.conteudo').hidden = true;
        return;
    }
    try {
        const ordens = carregarOrdens();
        atualizarCards(ordens);
        montarTabela(ordens);
        montarGrafico(ordens);
    } catch (e) {
        mostrarAviso('Não foi possível carregar as ordens. Verifique o armazenamento do navegador.', 'erro');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!usuarioAtual()) return;
    if (new URLSearchParams(location.search).get('acesso') === 'negado') {
        mostrarAviso('Seu perfil não tem acesso àquela página.', 'erro');
    }
    const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    document.querySelector('.data').textContent = '📅 ' + hoje;

    document.querySelector('.ordens tbody').addEventListener('click', e => {
        const linha = e.target.closest('tr[data-id]');
        if (!linha) return;
        location.href = '../OmniOS%20-%20Detalhes/index.html?id=' + linha.dataset.id;
    });

    atualizarTela();
});
