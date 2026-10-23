let perfilEditado = null;
const formularioPerfil = document.getElementById('form-perfil');
const mensagemPerfil = document.getElementById('mensagem-perfil');

function desenharPermissoes(permissoes) {
    const cargo = document.getElementById('perfil-cargo').value;
    document.getElementById('permissoes-perfil').innerHTML = Object.keys(PERMISSOES).map(chave => `
        <label class="opcao"><input type="checkbox" data-chave="${chave}"
            ${cargo === 'Administrador' || permissoes[chave] ? 'checked' : ''}
            ${cargo === 'Administrador' ? 'disabled' : ''}>${PERMISSOES[chave]}</label>
    `).join('');
}

function listarPerfis() {
    if (!exigirPermissao('perfis')) return;
    const usuarios = carregarUsuarios();
    document.getElementById('lista-perfis').innerHTML = usuarios.map(usuario => `
        <tr><td>${escaparHTML(usuario.nome)}</td><td>${escaparHTML(usuario.email)}</td>
        <td>${escaparHTML(usuario.cargo)}</td><td>${usuario.ativo ? 'Ativo' : 'Desativado'}</td>
        <td><div class="acoes-linha"><button type="button" class="botao secundario" data-editar="${usuario.id}">Editar</button>
        <button type="button" class="botao perigo" data-excluir="${usuario.id}" ${usuario.id === usuarioAtual().id ? 'disabled' : ''}>Excluir</button></div></td></tr>
    `).join('');
}

function limparPerfil() {
    perfilEditado = null;
    formularioPerfil.reset();
    document.getElementById('titulo-form-perfil').textContent = 'Adicionar perfil';
    document.getElementById('perfil-senha').required = true;
    document.getElementById('ajuda-senha').textContent = 'Mínimo de 8 caracteres.';
    document.getElementById('cancelar-perfil').textContent = 'Limpar';
    desenharPermissoes(permissoesDoCargo('Atendente'));
}

function editarPerfil(id) {
    if (!exigirPermissao('perfis')) return;
    const usuario = carregarUsuarios().find(item => item.id === id);
    if (!usuario) return;
    perfilEditado = id;
    document.getElementById('perfil-nome').value = usuario.nome;
    document.getElementById('perfil-email').value = usuario.email;
    document.getElementById('perfil-cargo').value = usuario.cargo;
    document.getElementById('perfil-ativo').checked = usuario.ativo;
    document.getElementById('perfil-senha').value = '';
    document.getElementById('perfil-senha').required = false;
    document.getElementById('ajuda-senha').textContent = 'Deixe em branco para manter a senha atual.';
    document.getElementById('titulo-form-perfil').textContent = 'Editar perfil';
    document.getElementById('cancelar-perfil').textContent = 'Cancelar edição';
    desenharPermissoes(usuario.permissoes);
    document.getElementById('perfil-nome').focus();
}

formularioPerfil.addEventListener('submit', async evento => {
    evento.preventDefault();
    const botao = formularioPerfil.querySelector('button[type="submit"]');
    botao.disabled = true;
    try {
        const permissoes = {};
        document.querySelectorAll('#permissoes-perfil input').forEach(campo => {
            permissoes[campo.dataset.chave] = campo.checked;
        });
        const salvou = await salvarPerfil({
            id: perfilEditado, nome: document.getElementById('perfil-nome').value,
            email: document.getElementById('perfil-email').value,
            senha: document.getElementById('perfil-senha').value,
            cargo: document.getElementById('perfil-cargo').value,
            ativo: document.getElementById('perfil-ativo').checked, permissoes
        });
        if (!salvou) return;
        limparPerfil();
        mensagemPerfil.className = 'sucesso';
        mensagemPerfil.textContent = 'Perfil salvo.';
        iniciarAcesso();
        if (pode('perfis')) listarPerfis();
    } catch (erro) {
        mensagemPerfil.className = 'erro';
        mensagemPerfil.textContent = erro.message;
    } finally {
        botao.disabled = false;
    }
});
document.getElementById('perfil-cargo').addEventListener('change', evento => {
    desenharPermissoes(permissoesDoCargo(evento.target.value));
});
document.getElementById('cancelar-perfil').addEventListener('click', limparPerfil);
document.getElementById('lista-perfis').addEventListener('click', evento => {
    try {
        if (evento.target.dataset.editar) editarPerfil(Number(evento.target.dataset.editar));
        if (evento.target.dataset.excluir && confirm('Excluir este perfil? Os registros de ordens e vendas serão mantidos.')) {
            if (removerPerfil(Number(evento.target.dataset.excluir))) {
                limparPerfil();
                listarPerfis();
            }
        }
    } catch (erro) {
        mensagemPerfil.className = 'erro';
        mensagemPerfil.textContent = erro.message;
    }
});
document.addEventListener('DOMContentLoaded', () => {
    if (!usuarioAtual() || !pode('perfis')) return;
    limparPerfil();
    listarPerfis();
});
