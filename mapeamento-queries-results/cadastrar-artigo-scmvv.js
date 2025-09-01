const axios = require('axios');

// Configuração
const API_BASE_URL = 'http://10.21.105.31/SCMVV';
const ARTIGO_CODIGO = 'FA10040790';

// Dados do artigo para cadastro (AJUSTAR conforme dados reais)
const DADOS_ARTIGO = {
    Codigo: ARTIGO_CODIGO,
    Descricao: 'MEDICAMENTO FA10040790', // Ajustar com descrição real
    TipoArtigo: 'MEDICAMENTO', // Verificar código correto no sistema
    Unidade: 'UN', // Unidade de medida
    Ativo: true,
    ControlaStock: true,
    ControlaLote: true, // Se for medicamento, provavelmente sim
    ControlaValidade: true, // Se for medicamento, provavelmente sim
    
    // Adicionar outros campos conforme necessário:
    // Familia: '',
    // SubFamilia: '',
    // Marca: '',
    // Modelo: '',
    // PrecoUnitario: 0,
    // IVA: 23, // Taxa IVA aplicável
    // Observacoes: '',
    
    // Headers de autenticação se necessário
    // headers: {
    //     'Authorization': 'Bearer TOKEN',
    //     'Content-Type': 'application/json'
    // }
};

async function cadastrarArtigo() {
    console.log('========================================');
    console.log('CADASTRO DE ARTIGO NO SCMVV');
    console.log('========================================\n');
    
    console.log('Artigo:', ARTIGO_CODIGO);
    console.log('Dados para cadastro:', JSON.stringify(DADOS_ARTIGO, null, 2));
    
    try {
        // 1. Verificar se já existe
        console.log('\n1. Verificando se artigo já existe...');
        const existeResponse = await axios.get(
            `${API_BASE_URL}/api/Artigos/Existe`,
            {
                params: { codigo: ARTIGO_CODIGO }
            }
        );
        
        if (existeResponse.data === true) {
            console.log('⚠️  Artigo já existe no sistema!');
            
            // Buscar dados atuais
            const artigoAtual = await axios.get(
                `${API_BASE_URL}/api/Artigos/Edita`,
                {
                    params: { codigo: ARTIGO_CODIGO }
                }
            );
            
            console.log('Dados atuais:', JSON.stringify(artigoAtual.data, null, 2));
            return;
        }
        
        // 2. Cadastrar artigo
        console.log('\n2. Cadastrando artigo...');
        const cadastroResponse = await axios.post(
            `${API_BASE_URL}/api/Artigos/Actualiza`,
            DADOS_ARTIGO,
            {
                headers: {
                    'Content-Type': 'application/json'
                    // Adicionar autenticação se necessário
                }
            }
        );
        
        console.log('✅ Artigo cadastrado com sucesso!');
        console.log('Resposta:', JSON.stringify(cadastroResponse.data, null, 2));
        
        // 3. Confirmar cadastro
        console.log('\n3. Confirmando cadastro...');
        const confirmacao = await axios.get(
            `${API_BASE_URL}/api/Artigos/Existe`,
            {
                params: { codigo: ARTIGO_CODIGO }
            }
        );
        
        if (confirmacao.data === true) {
            console.log('✅ Cadastro confirmado! Artigo agora existe no sistema.');
            
            // Buscar dados cadastrados
            const artigoCadastrado = await axios.get(
                `${API_BASE_URL}/api/Artigos/Edita`,
                {
                    params: { codigo: ARTIGO_CODIGO }
                }
            );
            
            console.log('\nDados cadastrados:', JSON.stringify(artigoCadastrado.data, null, 2));
        } else {
            console.log('❌ Erro: Artigo não foi encontrado após cadastro.');
        }
        
    } catch (error) {
        console.error('\n❌ Erro ao cadastrar artigo:');
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Mensagem:', error.response.statusText);
            console.error('Detalhes:', JSON.stringify(error.response.data, null, 2));
            
            // Analisar erro
            if (error.response.status === 400) {
                console.log('\n⚠️  Erro de validação. Possíveis causas:');
                console.log('- Campos obrigatórios faltando');
                console.log('- Formato de dados incorreto');
                console.log('- Código de tipo de artigo inválido');
            } else if (error.response.status === 401) {
                console.log('\n⚠️  Erro de autenticação. É necessário adicionar token de autenticação.');
            }
        } else {
            console.error('Erro de conexão:', error.message);
        }
    }
}

// Menu de opções
console.log('========================================');
console.log('SCRIPT DE CADASTRO - ARTIGO FA10040790');
console.log('========================================\n');
console.log('ATENÇÃO: Este script é um EXEMPLO!');
console.log('Antes de executar:');
console.log('1. Confirme que o artigo existe no sistema local');
console.log('2. Obtenha os dados corretos do artigo (descrição, tipo, etc.)');
console.log('3. Verifique se é necessário autenticação na API');
console.log('4. Ajuste os campos em DADOS_ARTIGO conforme necessário\n');
console.log('Para executar o cadastro, descomente a linha abaixo:\n');

// DESCOMENTE A LINHA ABAIXO PARA EXECUTAR O CADASTRO
// cadastrarArtigo();

console.log('// cadastrarArtigo(); <- Descomente esta linha para executar\n');

// Exportar para uso em outros scripts
module.exports = {
    cadastrarArtigo,
    DADOS_ARTIGO
}; 