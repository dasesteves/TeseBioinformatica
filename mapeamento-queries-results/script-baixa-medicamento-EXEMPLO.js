const axios = require('axios');

// =====================================================
// SCRIPT EXEMPLO - BAIXA DE MEDICAMENTO NO SCMVV
// =====================================================
// ATENÇÃO: Este script está pronto mas precisa da SÉRIE correta
// Contacte o suporte SCMVV para obter a série válida

const CONFIG = {
    API_URL: 'http://10.21.105.31/SCMVV',
    
    // ⚠️ SUBSTITUIR COM VALORES CORRETOS FORNECIDOS PELO SUPORTE
    SERIE_DOCUMENTO: '???',        // Ex: 'CONSUMO', 'INT', etc.
    TIPO_DOCUMENTO: 'GS',         // Pode ser outro: 'CI', 'CS', etc.
    ARMAZEM_PADRAO: 'A1',         // Confirmar armazém correto
    
    // Dados do artigo (confirmados como corretos)
    ARTIGO: {
        Codigo: 'FA10040790',
        Descricao: 'Macrogol 10000 mg Pó sol oral Saq',
        Unidade: 'UNID',
        PrecoMedio: 0.35795,
        TaxaIVA: 8
    }
};

/**
 * Função para dar baixa de medicamento
 * @param {number} quantidade - Quantidade a dar baixa
 * @param {string} observacoes - Observações do consumo
 * @returns {Promise<Object>} Resultado da operação
 */
async function darBaixaMedicamento(quantidade = 1, observacoes = '') {
    console.log('========================================');
    console.log('BAIXA DE MEDICAMENTO - SCMVV');
    console.log('========================================\n');
    
    // 1. Verificar stock atual
    console.log('1. Verificando stock atual...');
    try {
        const stockResponse = await axios.get(`${CONFIG.API_URL}/api/Artigos/Edita`, {
            params: { codigo: CONFIG.ARTIGO.Codigo }
        });
        
        const stockAtual = stockResponse.data.StkActual;
        console.log(`✓ Stock atual: ${stockAtual} ${CONFIG.ARTIGO.Unidade}`);
        
        if (stockAtual < quantidade) {
            console.log('❌ ERRO: Stock insuficiente!');
            return { sucesso: false, erro: 'Stock insuficiente' };
        }
    } catch (error) {
        console.log('⚠️ Não foi possível verificar stock, continuando...');
    }
    
    // 2. Criar documento de consumo
    console.log('\n2. Criando documento de consumo...');
    
    const documento = {
        // Cabeçalho do documento
        TipoDoc: CONFIG.TIPO_DOCUMENTO,
        Serie: CONFIG.SERIE_DOCUMENTO,
        Data: new Date().toISOString().split('T')[0],
        
        // Entidade (consumo interno)
        Entidade: 'CONSUMO_INTERNO',
        Nome: 'Consumo Interno - Farmácia',
        TipoEntidade: 'I',
        
        // Dados fiscais genéricos
        NumContribuinte: '999999990',
        Morada: 'Hospital',
        CodPostal: '0000-000',
        Localidade: 'Local',
        
        // Observações
        Observacoes: observacoes || `Consumo de medicamento - ${new Date().toLocaleString('pt-PT')}`,
        
        // Linha do documento
        Linhas: [{
            NumLinha: 1,
            Artigo: CONFIG.ARTIGO.Codigo,
            Descricao: CONFIG.ARTIGO.Descricao,
            Quantidade: quantidade,
            Unidade: CONFIG.ARTIGO.Unidade,
            PrecoUnitario: CONFIG.ARTIGO.PrecoMedio,
            TaxaIva: CONFIG.ARTIGO.TaxaIVA,
            Armazem: CONFIG.ARMAZEM_PADRAO,
            
            // Flags importantes
            MovimentaStock: true,
            CalculaImposto: false
        }]
    };
    
    console.log('Documento a enviar:');
    console.log(JSON.stringify(documento, null, 2));
    
    try {
        const response = await axios.post(
            `${CONFIG.API_URL}/api/DocumentosInternos/Actualiza`,
            documento
        );
        
        if (response.data && response.data.ID) {
            console.log('\n✅ SUCESSO! Documento criado');
            console.log(`ID do documento: ${response.data.ID}`);
            console.log(`Número: ${response.data.Numero || 'N/A'}`);
            
            // 3. Verificar stock após movimento
            console.log('\n3. Verificando stock após movimento...');
            try {
                const stockPosResponse = await axios.get(`${CONFIG.API_URL}/api/Artigos/Edita`, {
                    params: { codigo: CONFIG.ARTIGO.Codigo }
                });
                console.log(`✓ Novo stock: ${stockPosResponse.data.StkActual} ${CONFIG.ARTIGO.Unidade}`);
            } catch (error) {
                console.log('⚠️ Não foi possível verificar stock final');
            }
            
            return {
                sucesso: true,
                documento: response.data
            };
        } else if (response.data && response.data.Mensagem) {
            console.log('\n❌ ERRO:', response.data.Mensagem);
            return {
                sucesso: false,
                erro: response.data.Mensagem
            };
        }
    } catch (error) {
        console.log('\n❌ ERRO ao criar documento:', error.response?.data || error.message);
        return {
            sucesso: false,
            erro: error.response?.data || error.message
        };
    }
}

// =====================================================
// EXEMPLO DE USO
// =====================================================

// Verificar se temos a série configurada
if (CONFIG.SERIE_DOCUMENTO === '???') {
    console.log('⚠️  ATENÇÃO: Este script precisa ser configurado!');
    console.log('\nAntes de usar, você precisa:');
    console.log('1. Contactar o suporte SCMVV');
    console.log('2. Obter a SÉRIE correta para documentos de consumo');
    console.log('3. Confirmar o TIPO DE DOCUMENTO correto');
    console.log('4. Verificar o ARMAZÉM padrão');
    console.log('\nDepois, atualize as variáveis em CONFIG e execute novamente.\n');
    
    console.log('Informações do artigo confirmadas:');
    console.log(`- Código: ${CONFIG.ARTIGO.Codigo}`);
    console.log(`- Descrição: ${CONFIG.ARTIGO.Descricao}`);
    console.log(`- Stock atual: 516 unidades`);
} else {
    // Exemplo de uso quando configurado
    console.log('Para dar baixa de 1 unidade:');
    console.log('darBaixaMedicamento(1, "Consumo paciente João Silva");');
    
    // DESCOMENTE A LINHA ABAIXO PARA EXECUTAR
    // darBaixaMedicamento(1, "Teste de baixa");
}

// Exportar para uso em outros scripts
module.exports = {
    darBaixaMedicamento,
    CONFIG
}; 