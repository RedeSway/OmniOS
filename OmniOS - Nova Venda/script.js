const CHAVE = 'omnios_vendas';
const formulario = document.getElementById('form-venda');
const telefone = document.getElementById('telefone');
const mensagem = document.getElementById('mensagem-venda');
const idVenda = Number(new URLSearchParams(location.search).get('id'));
let vendaSalva = false;

function informar(texto, erro = false) {
    mensagem.textContent = texto;
    mensagem.classList.toggle('erro', erro);
}

function salvarVenda(evento) {
    evento.preventDefault();
    if (!exigirPermissao('vendas') || vendaSalva) return;
    if (!formulario.reportValidity()) return;

    const campos = formulario.elements;
    const cliente = campos.namedItem('cliente').value.trim();
    const item = campos.namedItem('item').value.trim();
    const modelo = campos.namedItem('modelo').value.trim();
    const digitos = telefone.value.replace(/\D/g, '');
    const valor = Number(campos.namedItem('valor').value);

    if (!cliente || !item || !modelo || digitos.length < 10 || digitos.length > 11
        || !Number.isFinite(valor) || valor < 0.01 || !Number.isSafeInteger(Math.round(valor * 100))) {
        informar('Preencha os dados da venda, um telefone com DDD e um valor válido.', true);
        return;
    }

    let venda;
    try {
        const vendas = lerLista(CHAVE);
        const existente = idVenda ? vendas.find(item => item.id === idVenda) : null;
        if (idVenda && !existente) throw new Error('Venda não encontrada. Atualize a página.');
        const id = existente ? existente.id : proximoNumero(vendas);
        if (!Number.isSafeInteger(id)) throw new Error('Limite de registros atingido.');
        venda = {
            id,
            cliente,
            telefone: formatarTelefone(telefone.value),
            item,
            modelo,
            valor: Math.round(valor * 100) / 100,
            notas: campos.namedItem('notas').value.trim(),
            responsavel: campos.namedItem('responsavel').value,
            data: campos.namedItem('data').value,
            registradaEm: existente ? existente.registradaEm : new Date().toISOString(),
            status: existente ? (existente.status || 'Concluída') : 'Concluída'
        };
        if (existente) vendas[vendas.indexOf(existente)] = venda;
        else vendas.push(venda);
        validarLista(vendas, CHAVE);
        localStorage.setItem(CHAVE, JSON.stringify(vendas));
    } catch (e) {
        informar('Não foi possível salvar a venda. Verifique os dados e o armazenamento do navegador.', true);
        return;
    }

    vendaSalva = true;
    formulario.querySelector('button[type="submit"]').disabled = true;
    informar(`Venda #${String(venda.id).padStart(4, '0')} salva com sucesso.`);
    setTimeout(() => { location.href = '../OmniOS%20-%20Vendas/index.html'; }, 1000);
}

telefone.addEventListener('input', () => {
    telefone.value = formatarTelefone(telefone.value);
});

formulario.addEventListener('submit', salvarVenda);
formulario.addEventListener('reset', () => informar(''));

document.addEventListener('DOMContentLoaded', () => {
    if (!usuarioAtual() || !pode('vendas')) return;
    const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    document.querySelector('.data').textContent = '📅 ' + hoje;
    const data = document.getElementById('data-venda');
    data.defaultValue = new Date().toLocaleDateString('sv-SE');
    if (idVenda) {
        try {
            const venda = lerLista(CHAVE).find(item => item.id === idVenda);
            if (!venda) throw new Error('Venda não encontrada.');
            document.querySelector('h1').textContent = 'Editar venda';
            document.title = 'OmniOS - Editar venda';
            document.querySelector('.caminho').textContent = 'Vendas / Editar venda';
            document.querySelector('.final-painel h3').textContent = 'Edição da venda';
            for (const campo of ['cliente', 'telefone', 'item', 'modelo', 'valor', 'notas', 'responsavel', 'data']) {
                const input = formulario.elements.namedItem(campo);
                if (campo === 'responsavel' && !Array.from(input.options).some(opcao => opcao.value === venda[campo])) {
                    const opcao = document.createElement('option');
                    opcao.value = venda[campo];
                    opcao.textContent = venda[campo];
                    input.appendChild(opcao);
                }
                input.value = venda[campo] || '';
            }
            formulario.querySelector('.btn-cancelar').type = 'button';
            formulario.querySelector('.btn-cancelar').textContent = 'Voltar';
            formulario.querySelector('.btn-cancelar').addEventListener('click', () => {
                location.href = '../OmniOS%20-%20Vendas/index.html';
            });
        } catch (erro) {
            informar(erro.message, true);
            formulario.querySelector('button[type="submit"]').disabled = true;
        }
    }
});
