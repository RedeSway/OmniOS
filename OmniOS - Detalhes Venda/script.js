const idVenda = Number(new URLSearchParams(location.search).get('id'));

function texto(id, valor) {
    document.getElementById(id).textContent = valor || '—';
}

function dinheiro(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function esc(txt) {
    const div = document.createElement('div');
    div.textContent = txt || '';
    return div.innerHTML;
}

function desenhar(venda) {
    const codigo = 'VD-' + String(venda.id).padStart(4, '0');
    const cancelada = venda.status === 'Cancelada';
    document.title = 'OmniOS - ' + codigo;
    texto('crumb-venda', codigo);
    texto('titulo-venda', 'Venda #' + codigo);
    const badge = document.getElementById('badge-status');
    badge.textContent = cancelada ? 'Cancelada' : 'Concluída';
    badge.className = 'status ' + (cancelada ? 'cancelado' : 'concluido');
    texto('d-cliente', venda.cliente);
    texto('d-item', venda.item);
    texto('d-modelo', venda.modelo);
    texto('d-responsavel', venda.responsavel);
    texto('d-data', venda.data ? venda.data.split('-').reverse().join('/') : '—');
    texto('d-notas', venda.notas);
    texto('t-valor', dinheiro(venda.valor));
    document.getElementById('btn-editar').href = '../OmniOS%20-%20Nova%20Venda/index.html?id=' + venda.id;
    const btnStatus = document.getElementById('btn-status');
    btnStatus.textContent = cancelada ? 'Concluir venda' : 'Cancelar venda';
    document.getElementById('linha-tempo').innerHTML = `<li class="evento ${cancelada ? 'cancelado' : 'concluido'}"><span class="marcador">✓</span><div class="evento-corpo"><div class="evento-topo"><strong>${cancelada ? 'Cancelada' : 'Concluída'}</strong><span class="evento-data">${venda.data ? venda.data.split('-').reverse().join('/') : '—'}</span></div><p>Venda registrada no sistema.</p></div></li>`;
}

function atualizarStatus() {
    if (!exigirPermissao('vendas')) return;
    const vendas = lerLista('omnios_vendas');
    const venda = vendas.find(item => item.id === idVenda);
    if (!venda) return;
    venda.status = venda.status === 'Cancelada' ? 'Concluída' : 'Cancelada';
    localStorage.setItem('omnios_vendas', JSON.stringify(vendas));
    desenhar(venda);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!usuarioAtual() || !pode('vendas')) return;
    const venda = lerLista('omnios_vendas').find(item => item.id === idVenda);
    if (!venda) {
        document.getElementById('nao-encontrada').hidden = false;
        return;
    }
    document.getElementById('conteudo-venda').hidden = false;
    desenhar(venda);
    document.getElementById('btn-status').addEventListener('click', atualizarStatus);
    document.getElementById('btn-excluir').addEventListener('click', () => {
        if (!exigirPermissao('excluir')) return;
        if (!confirm('Excluir definitivamente esta venda?')) return;
        const vendas = lerLista('omnios_vendas').filter(item => item.id !== idVenda);
        localStorage.setItem('omnios_vendas', JSON.stringify(vendas));
        location.href = '../OmniOS%20-%20Vendas/index.html';
    });
});
