const CHAVE = 'omnios_ordens';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const idDaUrl = Number(new URLSearchParams(location.search).get('id'));

let ordens = [];
let os = null;

function carregarOrdens() {
    return lerLista(CHAVE);
}

function persistir(alterar) {
    if (!exigirPermissao('ordens')) return false;
    try {
        const atuais = carregarOrdens();
        const atual = atuais.find(o => o.id === os.id);
        if (!atual) {
            aviso('Esta ordem foi excluída. Recarregue a página.', 'erro');
            return false;
        }
        alterar(atual);
        localStorage.setItem(CHAVE, JSON.stringify(atuais));
        ordens = atuais;
        os = atual;
        return true;
    } catch (e) {
        aviso('Não foi possível salvar no navegador. A alteração não foi gravada.', 'erro');
        return false;
    }
}

function esc(txt) {
    const div = document.createElement('div');
    div.textContent = txt;
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function normalizar(txt) {
    return String(txt).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function codigo(id) {
    return 'OS-' + String(id).padStart(4, '0');
}

function dinheiro(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dinheiroSinal(valor) {
    return (valor >= 0 ? '+' : '-') + dinheiro(Math.abs(valor));
}

// Valores monetários são arredondados para centavos.
function arredondar(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
}

function aviso(msg, tipo) {
    mostrarAviso(msg, tipo);
}

function classeStatus(status) {
    if (status === 'Aberto') return 'aberto';
    if (status === 'Em Andamento') return 'andamento';
    if (status === 'Concluído') return 'concluido';
    return 'cancelado';
}

function classePrioridade(prioridade) {
    return normalizar(prioridade || 'baixa');
}

function dataHora(iso) {
    const d = new Date(iso);
    const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${d.getDate()} ${MESES[d.getMonth()]}, ${hora}`;
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

// Ordens antigas recebem o evento de abertura ao mudar de status.
function historicoDe(o) {
    return o.historico && o.historico.length
        ? o.historico
        : [{ status: 'Aberto', em: o.data, descricao: 'Ordem registrada' }];
}

function aplicarStatus(o, novo) {
    if (o.status === novo || !['Aberto', 'Em Andamento', 'Concluído', 'Cancelado'].includes(novo)) return false;

    const agora = new Date().toISOString();
    o.historico = historicoDe(o);
    o.historico.push({ status: novo, em: agora, descricao: `Status alterado de ${o.status} para ${novo}` });

    o.status = novo;
    o.finalizadaEm = novo === 'Concluído' ? agora : null;
    return true;
}

function texto(id, valor) {
    document.getElementById(id).textContent = valor;
}

function desenhar() {
    const codigoOS = codigo(os.id);
    document.title = 'OmniOS - ' + codigoOS;
    texto('crumb-os', codigoOS);
    texto('titulo-os', 'Ordem #' + codigoOS);

    const badge = document.getElementById('badge-status');
    badge.textContent = os.status;
    badge.className = 'status ' + classeStatus(os.status);

    const prio = document.getElementById('badge-prioridade');
    prio.textContent = os.prioridade || '';
    prio.className = 'prioridade ' + classePrioridade(os.prioridade);

    texto('d-cliente', os.cliente);
    texto('d-telefone', os.telefone || '—');
    texto('d-aparelho', os.aparelho);
    texto('d-tipo', os.tipo || '—');
    texto('d-tecnico', os.tecnico || '—');
    texto('d-previsao', os.previsaoEntrega ? formatarDataISO(os.previsaoEntrega) : '—');
    texto('d-problema', os.problema || '—');

    desenharPecas();
    desenharTempo();

    const fechada = os.status === 'Concluído' || os.status === 'Cancelado';
    const btn = document.getElementById('btn-encerrar');
    btn.disabled = fechada;
    btn.textContent = os.status === 'Concluído' ? 'OS Encerrada' : 'Encerrar OS';

    desenharFicha();
}

// Datas sem horário são formatadas sem conversão de fuso.
function formatarDataISO(iso) {
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
}

function desenharPecas() {
    const pecas = os.pecas || [];
    const lista = document.getElementById('lista-pecas');

    lista.innerHTML = pecas.length === 0
        ? '<div class="sem-pecas">Nenhuma peça lançada.</div>'
        : pecas.map(p => `
            <div class="peca" data-id="${p.id}">
                <span class="peca-nome">${esc(p.nome)}</span>
                <span class="peca-qtd" title="${dinheiro(p.valorUnit)} cada">${p.qtd} un</span>
                <span class="peca-valor">${dinheiro(arredondar(p.qtd * p.valorUnit))}</span>
                <button class="btn-remover-peca" title="Remover">✕</button>
            </div>
        `).join('');

    const resultado = lucro(os);
    texto('t-subtotal', dinheiro(custoPecas(os)));
    texto('t-valor', dinheiro(os.valor));

    const campoLucro = document.getElementById('t-lucro');
    campoLucro.textContent = dinheiroSinal(resultado);
    campoLucro.className = resultado >= 0 ? 'positivo' : 'negativo';
}

function desenharTempo() {
    const eventos = historicoDe(os);

    let html = eventos.map(e => `
        <li class="evento ${classeStatus(e.status)}">
            <span class="marcador">✓</span>
            <div class="evento-corpo">
                <div class="evento-topo">
                    <strong>${esc(e.status)}</strong>
                    <span class="evento-data">${dataHora(e.em)}</span>
                </div>
                <p>${esc(e.descricao || '')}</p>
            </div>
        </li>
    `).join('');

    if (os.status !== 'Concluído' && os.status !== 'Cancelado') {
        html += `
            <li class="evento pendente">
                <span class="marcador"></span>
                <div class="evento-corpo">
                    <div class="evento-topo">
                        <strong>Conclusão</strong>
                        <span class="evento-data">Aguardando</span>
                    </div>
                    <p>A ordem ainda não foi encerrada.</p>
                </div>
            </li>`;
    }

    document.getElementById('linha-tempo').innerHTML = html;
}

// A ficha do cliente omite os custos internos das peças.
function desenharFicha() {
    try {
        const configuracoes = configuracoesSalvas();
        document.getElementById('f-empresa').textContent = configuracoes.nome;
        document.getElementById('f-contato').textContent = [configuracoes.telefone, configuracoes.endereco].filter(Boolean).join(' · ');
    } catch (erro) { aviso('Não foi possível carregar os dados da assistência.', 'erro'); }
    texto('f-codigo', codigo(os.id));
    texto('f-abertura', new Date(os.data).toLocaleDateString('pt-BR'));
    texto('f-status', os.status);
    texto('f-prioridade', os.prioridade || '—');
    texto('f-cliente', os.cliente);
    texto('f-telefone', os.telefone || '—');
    texto('f-tipo', os.tipo || '—');
    texto('f-aparelho', os.aparelho);
    texto('f-tecnico', os.tecnico || '—');
    texto('f-previsao', os.previsaoEntrega ? formatarDataISO(os.previsaoEntrega) : '—');
    texto('f-problema', os.problema || '—');
    texto('f-total', dinheiro(os.valor));

    const pecas = os.pecas || [];
    document.getElementById('f-pecas').innerHTML = pecas.length === 0
        ? '<tr><td colspan="2">Nenhuma peça utilizada.</td></tr>'
        : pecas.map(p => `<tr><td>${esc(p.nome)}</td><td class="direita">${p.qtd} un</td></tr>`).join('');
}

function trocarStatus(novo) {
    if (!['Aberto', 'Em Andamento', 'Concluído', 'Cancelado'].includes(novo)) return;
    if (!persistir(atual => aplicarStatus(atual, novo))) return;
    desenhar();
    aviso(`Status atualizado para ${novo}.`, 'ok');
}

function abrirFormPeca(abrir) {
    document.getElementById('form-peca').hidden = !abrir;
    if (abrir) document.getElementById('peca-nome').focus();
    if (!abrir) {
        document.getElementById('peca-nome').value = '';
        document.getElementById('peca-qtd').value = '1';
        document.getElementById('peca-valor').value = '';
        document.querySelectorAll('#form-peca input').forEach(i => i.classList.remove('input-erro'));
    }
}

function adicionarPeca() {
    const campoNome = document.getElementById('peca-nome');
    const campoQtd = document.getElementById('peca-qtd');
    const campoValor = document.getElementById('peca-valor');

    const nome = campoNome.value.trim();
    const qtd = Number(campoQtd.value);
    const valorTxt = campoValor.value;
    const valorUnit = Number(valorTxt);

    const nomeRuim = nome === '';
    const qtdRuim = !Number.isSafeInteger(qtd) || qtd < 1;
    const valorRuim = valorTxt === '' || !Number.isFinite(valorUnit) || valorUnit < 0
        || !Number.isSafeInteger(Math.round(qtd * valorUnit * 100));

    campoNome.classList.toggle('input-erro', nomeRuim);
    campoQtd.classList.toggle('input-erro', qtdRuim);
    campoValor.classList.toggle('input-erro', valorRuim);

    if (nomeRuim || qtdRuim || valorRuim) {
        aviso('Informe o nome, uma quantidade inteira (mínimo 1) e o valor unitário.', 'erro');
        return;
    }

    if (!persistir(atual => {
        atual.pecas = atual.pecas || [];
        const proximoId = atual.pecas.reduce((maior, p) => Math.max(maior, p.id), 0) + 1;
        if (!Number.isSafeInteger(proximoId)) throw new Error('Limite de peças atingido.');
        atual.pecas.push({ id: proximoId, nome, qtd, valorUnit: arredondar(valorUnit) });
    })) return;

    abrirFormPeca(false);
    desenhar();
    aviso('Peça lançada.', 'ok');
}

function removerPeca(id) {
    const peca = (os.pecas || []).find(p => p.id === id);
    if (!peca) return;
    if (!confirm(`Remover "${peca.nome}"?`)) return;

    if (!persistir(atual => {
        atual.pecas = (atual.pecas || []).filter(p => p.id !== id);
    })) return;
    desenhar();
}

document.addEventListener('DOMContentLoaded', () => {
    if (!usuarioAtual() || !pode('ordens')) return;
    const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    document.querySelector('.data').textContent = '📅 ' + hoje;

    try {
        ordens = carregarOrdens();
    } catch (e) {
        aviso('Não foi possível carregar as ordens. Verifique o armazenamento do navegador.', 'erro');
        return;
    }
    os = ordens.find(o => Number(o.id) === idDaUrl);

    if (!os) {
        document.getElementById('nao-encontrada').hidden = false;
        texto('crumb-os', '—');
        return;
    }

    document.getElementById('conteudo-os').hidden = false;
    desenhar();

    document.getElementById('btn-imprimir').addEventListener('click', () => window.print());

    const select = document.getElementById('sel-status');
    select.addEventListener('change', () => {
        trocarStatus(select.value);
        select.selectedIndex = 0;
    });

    document.getElementById('btn-encerrar').addEventListener('click', () => {
        if (confirm(`Encerrar a ${codigo(os.id)}? O status passará para Concluído.`)) {
            trocarStatus('Concluído');
        }
    });

    document.getElementById('btn-lancar-peca').addEventListener('click', () => {
        abrirFormPeca(document.getElementById('form-peca').hidden);
    });
    document.getElementById('btn-cancelar-peca').addEventListener('click', () => abrirFormPeca(false));
    document.getElementById('btn-salvar-peca').addEventListener('click', adicionarPeca);

    document.getElementById('form-peca').addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.matches('input')) {
            e.preventDefault();
            adicionarPeca();
        }
    });

    document.getElementById('lista-pecas').addEventListener('click', e => {
        if (!e.target.classList.contains('btn-remover-peca')) return;
        removerPeca(Number(e.target.closest('.peca').dataset.id));
    });
});
