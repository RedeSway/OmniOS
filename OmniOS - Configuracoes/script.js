function mensagemConfiguracao(id, texto, erro = false) {
    const elemento = document.getElementById(id);
    elemento.textContent = texto;
    elemento.className = erro ? 'erro' : 'sucesso';
}

document.getElementById('form-conta').addEventListener('submit', async evento => {
    evento.preventDefault();
    const botao = evento.target.querySelector('button[type="submit"]');
    botao.disabled = true;
    try {
        await atualizarMinhaConta(document.getElementById('conta-nome').value,
            document.getElementById('conta-email').value,
            document.getElementById('conta-senha-atual').value,
            document.getElementById('conta-nova-senha').value);
        document.getElementById('conta-senha-atual').value = '';
        document.getElementById('conta-nova-senha').value = '';
        iniciarAcesso();
        mensagemConfiguracao('mensagem-conta', 'Sua conta foi atualizada.');
    } catch (erro) {
        mensagemConfiguracao('mensagem-conta', erro.message, true);
    } finally { botao.disabled = false; }
});
document.getElementById('form-configuracoes').addEventListener('submit', evento => {
    evento.preventDefault();
    if (!exigirPermissao('configuracoes')) return;
    try {
        const nome = document.getElementById('empresa-nome').value.trim();
        if (!nome) throw new Error('Informe o nome da assistência.');
        localStorage.setItem('omnios_configuracoes', JSON.stringify({
            nome, telefone: document.getElementById('empresa-telefone').value,
            endereco: document.getElementById('empresa-endereco').value.trim()
        }));
        mensagemConfiguracao('mensagem-configuracoes', 'Configurações salvas.');
    } catch (erro) {
        mensagemConfiguracao('mensagem-configuracoes', erro.message || 'Não foi possível salvar.', true);
    }
});
document.getElementById('empresa-telefone').addEventListener('input', evento => {
    evento.target.value = formatarTelefone(evento.target.value);
});
document.getElementById('exportar-tudo').addEventListener('click', baixarBackup);
document.getElementById('form-importar').addEventListener('submit', async evento => {
    evento.preventDefault();
    if (!exigirPermissao('importar')) return;
    const botao = evento.target.querySelector('button[type="submit"]');
    botao.disabled = true;
    try {
        const arquivo = document.getElementById('arquivo-backup').files[0];
        if (!arquivo) throw new Error('Selecione um arquivo JSON.');
        if (arquivo.size > 5 * 1024 * 1024) throw new Error('O arquivo deve ter até 5 MB.');
        const backup = JSON.parse(await arquivo.text());
        const modo = document.getElementById('modo-importar').value;
        const plano = prepararImportacao(backup, modo);
        const resumo = modo === 'substituir'
            ? `Substituir os dados presentes no arquivo por ${plano.adicionados} registros? Os demais dados serão mantidos.`
            : `Adicionar ${plano.adicionados} registros? ${plano.ignorados} números existentes serão ignorados.`;
        if (!confirm(resumo)) return;
        if (!gravarImportacao(plano)) return;
        mensagemConfiguracao('mensagem-importar', `Importação concluída. ${plano.adicionados} registros importados; ${plano.ignorados} ignorados.`);
        evento.target.reset();
    } catch (erro) {
        mensagemConfiguracao('mensagem-importar', 'Falha na importação: ' + erro.message, true);
    } finally { botao.disabled = false; }
});
document.addEventListener('DOMContentLoaded', () => {
    const usuario = usuarioAtual();
    if (!usuario) return;
    document.getElementById('conta-nome').value = usuario.nome;
    document.getElementById('conta-email').value = usuario.email;
    try {
        const dados = configuracoesSalvas();
        document.getElementById('empresa-nome').value = dados.nome;
        document.getElementById('empresa-telefone').value = dados.telefone;
        document.getElementById('empresa-endereco').value = dados.endereco;
    } catch (erro) {
        mensagemConfiguracao('mensagem-configuracoes', erro.message, true);
    }
});
