function criarBackup() {
    return {
        sistema: 'OmniOS', versao: 2, exportadoEm: new Date().toISOString(),
        ordens: lerLista('omnios_ordens'), vendas: lerLista('omnios_vendas')
    };
}

function baixarBackup() {
    if (!exigirPermissao('exportar')) return;
    try {
        const backup = criarBackup();
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'omnios-backup-' + new Date().toLocaleDateString('sv-SE') + '.json';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        mostrarAviso('Backup de ordens e vendas exportado.', 'ok');
    } catch (erro) {
        mostrarAviso('Não foi possível exportar. Verifique os dados salvos.', 'erro');
    }
}

function validarBackup(backup) {
    if (!backup || backup.sistema !== 'OmniOS' || (backup.ordens == null && backup.vendas == null)) {
        throw new Error('Selecione um backup válido do OmniOS.');
    }
    if (backup.versao != null && backup.versao !== 1 && backup.versao !== 2) {
        throw new Error('A versão deste backup não é compatível.');
    }
    if (backup.ordens != null) validarLista(backup.ordens, 'omnios_ordens');
    if (backup.vendas != null) validarLista(backup.vendas, 'omnios_vendas');
}

function prepararImportacao(backup, modo) {
    validarBackup(backup);
    if (!['mesclar', 'substituir'].includes(modo)) throw new Error('Modo de importação inválido.');
    const plano = { dados: {}, anteriores: {}, adicionados: 0, ignorados: 0 };
    for (const tipo of ['ordens', 'vendas']) {
        if (backup[tipo] == null) continue;
        const chave = 'omnios_' + tipo;
        plano.anteriores[chave] = localStorage.getItem(chave);
        if (modo === 'substituir') {
            plano.dados[chave] = backup[tipo];
            plano.adicionados += backup[tipo].length;
        } else {
            const atuais = lerLista(chave);
            for (const registro of backup[tipo]) {
                if (atuais.some(atual => atual.id === registro.id)) plano.ignorados++;
                else {
                    atuais.push(registro);
                    plano.adicionados++;
                }
            }
            plano.dados[chave] = atuais;
        }
    }
    return plano;
}

function gravarImportacao(plano) {
    if (!exigirPermissao('importar')) return false;
    const anteriores = {};
    const gravadas = [];
    for (const chave of Object.keys(plano.dados)) {
        if (!['omnios_ordens', 'omnios_vendas'].includes(chave)) throw new Error('Tipo de dado inválido.');
        validarLista(plano.dados[chave], chave);
        anteriores[chave] = localStorage.getItem(chave);
        if (anteriores[chave] !== plano.anteriores[chave]) {
            throw new Error('Os dados mudaram em outra aba. Leia o arquivo novamente antes de importar.');
        }
    }
    try {
        for (const chave of Object.keys(plano.dados)) {
            localStorage.setItem(chave, JSON.stringify(plano.dados[chave]));
            gravadas.push(chave);
        }
    } catch (erro) {
        for (const chave of gravadas.reverse()) {
            if (anteriores[chave] === null) localStorage.removeItem(chave);
            else localStorage.setItem(chave, anteriores[chave]);
        }
        throw new Error('Não foi possível importar. Os dados anteriores foram mantidos.');
    }
    return true;
}
