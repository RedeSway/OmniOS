const PERMISSOES = {
    ordens: 'Ordens de serviço', vendas: 'Vendas', excluir: 'Excluir registros',
    exportar: 'Exportar dados', importar: 'Importar dados',
    perfis: 'Gerenciar perfis', configuracoes: 'Alterar configurações'
};

function permissoesDoCargo(cargo) {
    const permissoes = {};
    for (const chave of Object.keys(PERMISSOES)) {
        permissoes[chave] = cargo === 'Administrador';
    }
    if (cargo === 'Técnico' || cargo === 'Atendente') permissoes.ordens = true;
    if (cargo === 'Atendente') permissoes.vendas = true;
    return permissoes;
}

function carregarUsuarios() {
    return lerLista('omnios_usuarios');
}

function usuarioAtual() {
    const id = Number(sessionStorage.getItem('omnios_sessao'));
    if (!id) return null;
    return carregarUsuarios().find(usuario => usuario.id === id && usuario.ativo) || null;
}

function pode(permissao) {
    const usuario = usuarioAtual();
    if (!usuario) return false;
    return usuario.cargo === 'Administrador' || usuario.permissoes[permissao] === true;
}

function exigirPermissao(permissao) {
    try {
        if (pode(permissao)) return true;
        mostrarAviso('Seu perfil não tem permissão para esta ação.', 'erro');
    } catch (erro) {
        mostrarAviso('Não foi possível verificar seu acesso. Entre novamente.', 'erro');
    }
    return false;
}

// A senha é guardada como resumo com salt, nunca como texto.
async function resumoSenha(senha, salt) {
    if (!crypto.subtle) throw new Error('Abra o sistema por HTTPS ou localhost para usar o login.');
    const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
    const bytes = await crypto.subtle.deriveBits({
        name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 120000, hash: 'SHA-256'
    }, chave, 256);
    return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function prepararSenha(senha) {
    if (senha.length < 8) throw new Error('Use uma senha com pelo menos 8 caracteres.');
    if (!crypto.subtle) throw new Error('Abra o sistema por HTTPS ou localhost para cadastrar senhas.');
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
    return { salt, senhaHash: await resumoSenha(senha, salt) };
}

function validarUsuario(nome, email, usuarios, id) {
    if (!nome.trim()) throw new Error('Informe o nome do usuário.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe um e-mail válido.');
    if (usuarios.some(usuario => usuario.email === email && usuario.id !== id)) {
        throw new Error('Já existe um perfil com este e-mail.');
    }
}

async function registrarUsuario(nome, email, senha) {
    email = email.trim().toLowerCase();
    let usuarios = carregarUsuarios();
    validarUsuario(nome, email, usuarios);
    const credencial = await prepararSenha(senha);
    // Relê a lista depois do cálculo da senha para preservar cadastros de outra aba.
    usuarios = carregarUsuarios();
    validarUsuario(nome, email, usuarios);
    const cargo = usuarios.length === 0 ? 'Administrador' : 'Atendente';
    const usuario = {
        id: proximoNumero(usuarios), nome: nome.trim(), email, cargo,
        ativo: true, permissoes: permissoesDoCargo(cargo), ...credencial
    };
    usuarios.push(usuario);
    localStorage.setItem('omnios_usuarios', JSON.stringify(usuarios));
    return usuario;
}

async function entrar(email, senha) {
    const usuario = carregarUsuarios().find(item => item.email === email.trim().toLowerCase() && item.ativo);
    if (!usuario || await resumoSenha(senha, usuario.salt) !== usuario.senhaHash) {
        throw new Error('E-mail ou senha incorretos, ou perfil desativado.');
    }
    const atual = carregarUsuarios().find(item => item.id === usuario.id && item.ativo);
    if (!atual || atual.senhaHash !== usuario.senhaHash) throw new Error('O perfil foi alterado. Tente novamente.');
    sessionStorage.setItem('omnios_sessao', String(usuario.id));
    return usuario;
}

function sair() {
    sessionStorage.removeItem('omnios_sessao');
    location.href = '../OmniOS%20-%20Login/index.html';
}

function iniciarAcesso() {
    if (document.body.dataset.publica === 'sim') return;
    try {
        const usuario = usuarioAtual();
        if (!usuario) {
            document.documentElement.hidden = true;
            location.replace('../OmniOS%20-%20Login/index.html');
            return;
        }
        const acesso = document.body.dataset.acesso;
        if (acesso && !pode(acesso)) {
            document.documentElement.hidden = true;
            location.replace('../OmniOS%20-%20Main/index.html?acesso=negado');
            return;
        }
        document.querySelector('.nomeperfil').textContent = usuario.nome;
        document.querySelector('.funcao-perfil').textContent = usuario.cargo;
        document.querySelector('.perfil-logo').alt = usuario.nome;
        if (usuario.foto) document.querySelector('.perfil-logo').src = usuario.foto;
        document.querySelectorAll('[data-permissao]').forEach(elemento => {
            elemento.hidden = !pode(elemento.dataset.permissao);
        });
        const botaoSair = document.getElementById('btn-sair');
        if (botaoSair) botaoSair.onclick = sair;
        preencherResponsaveis();
    } catch (erro) {
        document.documentElement.hidden = true;
        location.replace('../OmniOS%20-%20Login/index.html');
    }
}

function preencherResponsaveis() {
    const tecnicos = document.querySelector('.input-tecnico');
    if (!tecnicos) return;
    const acesso = document.body.dataset.acesso;
    const usuarios = carregarUsuarios().filter(usuario => usuario.ativo && (
        usuario.cargo === 'Administrador' || usuario.permissoes[acesso] === true
    ));
    tecnicos.innerHTML = '<option value="" disabled selected>Selecione o responsável</option>';
    for (const usuario of usuarios) {
        const opcao = document.createElement('option');
        opcao.value = usuario.nome;
        opcao.textContent = usuario.nome;
        tecnicos.appendChild(opcao);
    }
}

document.addEventListener('DOMContentLoaded', iniciarAcesso);

function verificarAdministradores(usuarios) {
    if (!usuarios.some(usuario => usuario.ativo && usuario.cargo === 'Administrador')) {
        throw new Error('Mantenha pelo menos um administrador ativo.');
    }
}

async function salvarPerfil(dados) {
    if (!exigirPermissao('perfis')) return false;
    if (!['Administrador', 'Atendente', 'Técnico'].includes(dados.cargo)) throw new Error('Cargo inválido.');
    const senha = dados.senha ? await prepararSenha(dados.senha) : null;
    if (!exigirPermissao('perfis')) return false;
    const usuarios = carregarUsuarios();
    const email = dados.email.trim().toLowerCase();
    validarUsuario(dados.nome, email, usuarios, dados.id);
    let usuario = usuarios.find(item => item.id === dados.id);
    if (dados.id && !usuario) throw new Error('O perfil foi excluído. Atualize a página.');
    if (!usuario) {
        if (!senha) throw new Error('Informe uma senha para o novo perfil.');
        usuario = { id: proximoNumero(usuarios) };
        usuarios.push(usuario);
    }
    if (usuario.id === usuarioAtual().id && !dados.ativo) {
        throw new Error('Você não pode desativar a própria conta.');
    }
    usuario.nome = dados.nome.trim();
    usuario.email = email;
    usuario.cargo = dados.cargo;
    usuario.ativo = dados.ativo;
    if (dados.foto) usuario.foto = dados.foto;
    usuario.permissoes = {};
    for (const chave of Object.keys(PERMISSOES)) {
        usuario.permissoes[chave] = dados.cargo === 'Administrador' || dados.permissoes[chave] === true;
    }
    if (senha) Object.assign(usuario, senha);
    verificarAdministradores(usuarios);
    localStorage.setItem('omnios_usuarios', JSON.stringify(usuarios));
    return true;
}

function removerPerfil(id) {
    if (!exigirPermissao('perfis')) return false;
    if (id === usuarioAtual().id) throw new Error('Você não pode excluir a própria conta.');
    const usuarios = carregarUsuarios().filter(usuario => usuario.id !== id);
    verificarAdministradores(usuarios);
    localStorage.setItem('omnios_usuarios', JSON.stringify(usuarios));
    return true;
}

async function atualizarMinhaConta(nome, email, senhaAtual, novaSenha) {
    const usuario = usuarioAtual();
    if (!usuario) throw new Error('Entre novamente para atualizar sua conta.');
    if (await resumoSenha(senhaAtual, usuario.salt) !== usuario.senhaHash) {
        throw new Error('A senha atual está incorreta.');
    }
    const credencial = novaSenha ? await prepararSenha(novaSenha) : null;
    const usuarios = carregarUsuarios();
    const atual = usuarios.find(item => item.id === usuario.id && item.ativo);
    if (!atual || atual.senhaHash !== usuario.senhaHash) throw new Error('Sua conta foi alterada. Entre novamente.');
    email = email.trim().toLowerCase();
    validarUsuario(nome, email, usuarios, usuario.id);
    atual.nome = nome.trim();
    atual.email = email;
    if (credencial) Object.assign(atual, credencial);
    localStorage.setItem('omnios_usuarios', JSON.stringify(usuarios));
}

window.addEventListener('storage', evento => {
    if (evento.key === 'omnios_usuarios') iniciarAcesso();
});
