const VENDAS_POR_PAGINA = 6;
let paginaVendas = 1;

function filtrarVendas(vendas) {
    const termo = document.getElementById('busca-venda').value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const status = document.getElementById('filtro-status').value;
    const periodo = document.getElementById('filtro-periodo').value;
    const hoje = new Date();
    return vendas.filter(venda => {
        const texto = `VD-${String(venda.id).padStart(4, '0')} ${venda.cliente} ${venda.item} ${venda.modelo} ${venda.responsavel}`
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (termo && !texto.includes(termo)) return false;
        if (status !== 'Todos' && (venda.status || 'Concluída') !== status) return false;
        if (periodo === 'Hoje' && venda.data !== hoje.toLocaleDateString('sv-SE')) return false;
        if (periodo === 'Mes' && (!venda.data || venda.data.slice(0, 7) !== hoje.toLocaleDateString('sv-SE').slice(0, 7))) return false;
        return true;
    });
}

function listarVendas() {
    if (!exigirPermissao('vendas')) return;
    const corpo = document.getElementById('lista-vendas');
    try {
        const vendas = filtrarVendas(lerLista('omnios_vendas')).sort((a, b) => b.id - a.id);
        const paginas = Math.max(1, Math.ceil(vendas.length / VENDAS_POR_PAGINA));
        paginaVendas = Math.min(paginaVendas, paginas);
        const inicio = (paginaVendas - 1) * VENDAS_POR_PAGINA;
        const visiveis = vendas.slice(inicio, inicio + VENDAS_POR_PAGINA);
        corpo.innerHTML = visiveis.length === 0 ? '<tr><td colspan="7">Nenhuma venda encontrada.</td></tr>' : visiveis.map(venda => `
            <tr data-id="${venda.id}" class="linha-venda"><td>VD-${String(venda.id).padStart(4, '0')}</td>
            <td>${escaparHTML(venda.cliente)}</td>
            <td>${escaparHTML(venda.item)}<small>${escaparHTML(venda.modelo)}</small></td>
            <td>${escaparHTML(venda.responsavel)}</td>
            <td>${venda.status === 'Cancelada' ? 'Cancelada' : 'Concluída'}</td>
            <td>${venda.data.split('-').reverse().join('/')}</td>
            <td>${formatarDinheiro(venda.valor)}</td></tr>
        `).join('');
        document.getElementById('contagem-vendas').textContent = `Mostrando ${visiveis.length} de ${vendas.length} vendas · Página ${paginaVendas} de ${paginas}`;
        document.getElementById('paginas-vendas').innerHTML = `<button type="button" data-pagina="${paginaVendas - 1}" ${paginaVendas === 1 ? 'disabled' : ''}>Anterior</button><button type="button" data-pagina="${paginaVendas + 1}" ${paginaVendas === paginas ? 'disabled' : ''}>Próxima</button>`;
    } catch (erro) {
        corpo.innerHTML = '<tr><td colspan="7">Não foi possível listar as vendas.</td></tr>';
        document.getElementById('contagem-vendas').textContent = '';
        document.getElementById('paginas-vendas').innerHTML = '';
        mostrarAviso(erro.message, 'erro');
    }
}

function alterarVenda(id, excluir) {
    if (!exigirPermissao(excluir ? 'excluir' : 'vendas')) return;
    try {
        const vendas = lerLista('omnios_vendas');
        const venda = vendas.find(item => item.id === id);
        if (!venda) throw new Error('Venda não encontrada. Atualize a lista.');
        const novo = venda.status === 'Cancelada' ? 'Concluída' : 'Cancelada';
        const pergunta = excluir ? `Excluir definitivamente a venda VD-${String(id).padStart(4, '0')}?`
            : `Mudar o status desta venda para ${novo}?`;
        if (!confirm(pergunta)) return;
        if (excluir) vendas.splice(vendas.indexOf(venda), 1);
        else venda.status = novo;
        localStorage.setItem('omnios_vendas', JSON.stringify(vendas));
        listarVendas();
        mostrarAviso(excluir ? 'Venda excluída.' : 'Status da venda atualizado.', 'ok');
    } catch (erro) { mostrarAviso('Não foi possível salvar a alteração: ' + erro.message, 'erro'); }
}

document.getElementById('lista-vendas').addEventListener('click', evento => {
    const linha = evento.target.closest('tr[data-id]');
    if (linha) location.href = '../OmniOS%20-%20Detalhes%20Venda/index.html?id=' + linha.dataset.id;
});
for (const id of ['busca-venda', 'filtro-status', 'filtro-periodo']) {
    document.getElementById(id).addEventListener('input', () => { paginaVendas = 1; listarVendas(); });
}
document.getElementById('paginas-vendas').addEventListener('click', evento => {
    if (!evento.target.dataset.pagina || evento.target.disabled) return;
    paginaVendas = Number(evento.target.dataset.pagina);
    listarVendas();
});
document.getElementById('btn-exportar').addEventListener('click', baixarBackup);
document.addEventListener('DOMContentLoaded', () => { if (usuarioAtual() && pode('vendas')) listarVendas(); });
window.addEventListener('storage', evento => {
    if (evento.key === 'omnios_vendas' && usuarioAtual() && pode('vendas')) listarVendas();
});
