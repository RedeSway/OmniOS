const VENDAS_POR_PAGINA = 6;
let paginaVendas = 1;

function filtrarVendas(vendas) {
    const termo = document.getElementById('busca-venda').value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const status = document.getElementById('filtro-status').value;
    const inicio = document.getElementById('data-inicio').value;
    const fim = document.getElementById('data-fim').value;
    if (inicio && fim && inicio > fim) throw new Error('A data inicial deve ser anterior à data final.');
    return vendas.filter(venda => {
        const texto = `VD-${String(venda.id).padStart(4, '0')} ${venda.cliente} ${venda.item} ${venda.modelo} ${venda.responsavel}`
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (termo && !texto.includes(termo)) return false;
        if (status !== 'Todos' && (venda.status || 'Concluída') !== status) return false;
        if (inicio && venda.data < inicio) return false;
        if (fim && venda.data > fim) return false;
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
        const concluidas = vendas.filter(venda => venda.status !== 'Cancelada');
        const total = concluidas.reduce((soma, venda) => soma + Math.round(venda.valor * 100), 0) / 100;
        document.getElementById('total-vendas').textContent = vendas.length;
        document.getElementById('total-valor').textContent = formatarDinheiro(total);
        document.getElementById('total-canceladas').textContent = vendas.length - concluidas.length;
        corpo.innerHTML = visiveis.length === 0 ? '<tr><td colspan="8">Nenhuma venda encontrada.</td></tr>' : visiveis.map(venda => `
            <tr><td>VD-${String(venda.id).padStart(4, '0')}</td>
            <td>${escaparHTML(venda.cliente)}<small>${escaparHTML(venda.telefone || '')}</small></td>
            <td>${escaparHTML(venda.item)}<small>${escaparHTML(venda.modelo)}</small></td>
            <td>${escaparHTML(venda.responsavel)}</td><td>${venda.data.split('-').reverse().join('/')}</td>
            <td>${venda.status === 'Cancelada' ? 'Cancelada' : 'Concluída'}</td><td>${formatarDinheiro(venda.valor)}</td>
            <td><div class="acoes-linha"><a class="botao secundario" href="../OmniOS%20-%20Nova%20Venda/index.html?id=${venda.id}">Editar</a>
            <button type="button" class="botao secundario" data-status="${venda.id}">${venda.status === 'Cancelada' ? 'Concluir' : 'Cancelar'}</button>
            ${pode('excluir') ? `<button type="button" class="botao perigo" data-excluir="${venda.id}">Excluir</button>` : ''}</div></td></tr>
        `).join('');
        document.getElementById('contagem-vendas').textContent = `Mostrando ${visiveis.length} de ${vendas.length} vendas · Página ${paginaVendas} de ${paginas}`;
        document.getElementById('paginas-vendas').innerHTML = `<button type="button" data-pagina="${paginaVendas - 1}" ${paginaVendas === 1 ? 'disabled' : ''}>Anterior</button><button type="button" data-pagina="${paginaVendas + 1}" ${paginaVendas === paginas ? 'disabled' : ''}>Próxima</button>`;
    } catch (erro) {
        corpo.innerHTML = '<tr><td colspan="8">Não foi possível listar as vendas.</td></tr>';
        document.getElementById('contagem-vendas').textContent = '';
        document.getElementById('paginas-vendas').innerHTML = '';
        for (const id of ['total-vendas', 'total-valor', 'total-canceladas']) document.getElementById(id).textContent = '—';
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
    if (evento.target.dataset.status) alterarVenda(Number(evento.target.dataset.status), false);
    if (evento.target.dataset.excluir) alterarVenda(Number(evento.target.dataset.excluir), true);
});
for (const id of ['busca-venda', 'filtro-status', 'data-inicio', 'data-fim']) {
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
