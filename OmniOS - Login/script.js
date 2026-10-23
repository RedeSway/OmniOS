const mensagemAcesso = document.getElementById('mensagem-acesso');

function mostrarFormulario(registro) {
    document.getElementById('form-entrar').hidden = registro;
    document.getElementById('form-registrar').hidden = !registro;
    document.getElementById('aba-entrar').setAttribute('aria-pressed', String(!registro));
    document.getElementById('aba-registrar').setAttribute('aria-pressed', String(registro));
    mensagemAcesso.textContent = '';
    if (registro) {
        try {
            document.getElementById('aviso-cadastro').textContent = carregarUsuarios().length === 0
                ? 'A primeira conta será a administradora do sistema.'
                : 'Sua conta será criada como Atendente. Um administrador pode ajustar suas permissões.';
        } catch (erro) {
            mensagemAcesso.textContent = 'Não foi possível ler as contas salvas neste navegador.';
        }
    }
}

async function enviarAcesso(evento, registro) {
    evento.preventDefault();
    const botao = evento.target.querySelector('button[type="submit"]');
    botao.disabled = true;
    mensagemAcesso.className = '';
    mensagemAcesso.textContent = 'Aguarde...';
    try {
        if (registro) {
            const senha = document.getElementById('registro-senha').value;
            if (senha !== document.getElementById('registro-confirmacao').value) {
                throw new Error('As senhas não coincidem.');
            }
            await registrarUsuario(document.getElementById('registro-nome').value,
                document.getElementById('registro-email').value, senha);
            await entrar(document.getElementById('registro-email').value, senha);
        } else {
            await entrar(document.getElementById('login-email').value, document.getElementById('login-senha').value);
        }
        location.href = '../OmniOS%20-%20Main/index.html';
    } catch (erro) {
        mensagemAcesso.className = 'erro';
        mensagemAcesso.textContent = erro.message || 'Não foi possível acessar o sistema.';
    } finally {
        botao.disabled = false;
    }
}

document.getElementById('aba-entrar').addEventListener('click', () => mostrarFormulario(false));
document.getElementById('aba-registrar').addEventListener('click', () => mostrarFormulario(true));
document.getElementById('form-entrar').addEventListener('submit', evento => enviarAcesso(evento, false));
document.getElementById('form-registrar').addEventListener('submit', evento => enviarAcesso(evento, true));
try {
    if (usuarioAtual()) location.replace('../OmniOS%20-%20Main/index.html');
} catch (erro) {
    mensagemAcesso.textContent = 'Não foi possível ler as contas. Verifique o armazenamento do navegador.';
}
