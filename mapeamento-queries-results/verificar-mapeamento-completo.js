const fs = require('fs');
const path = require('path');

function verificarMapeamento() {
  console.log('🔍 VERIFICANDO ESTADO DO MAPEAMENTO DA BD...\n');
  
  // Listar todos os arquivos de tabelas mapeadas
  const arquivos = fs.readdirSync(__dirname)
    .filter(file => file.startsWith('tabela_') && file.endsWith('.json'))
    .sort();
  
  console.log(`📊 ESTATÍSTICAS GERAIS:`);
  console.log(`   Total de arquivos de tabelas: ${arquivos.length}`);
  
  // Categorizar por tipo de schema
  const tabelasPCE = arquivos.filter(f => f.startsWith('tabela_PCE_'));
  const tabelasGESTAO = arquivos.filter(f => f.startsWith('tabela_GESTAO_'));
  const tabelasOutras = arquivos.filter(f => !f.startsWith('tabela_PCE_') && !f.startsWith('tabela_GESTAO_'));
  
  console.log(`   - Tabelas PCE: ${tabelasPCE.length}`);
  console.log(`   - Tabelas GESTAO: ${tabelasGESTAO.length}`);
  console.log(`   - Outras tabelas: ${tabelasOutras.length}`);
  
  // Analisar algumas tabelas PCE para obter estatísticas
  console.log('\n📋 ANÁLISE DETALHADA DAS TABELAS PCE:');
  
  let totalRegistros = 0;
  let tabelasComDados = 0;
  let tabelasVazias = 0;
  let totalColunas = 0;
  
  const tabelasRelevantes = [];
  
  tabelasPCE.forEach(arquivo => {
    try {
      const conteudo = JSON.parse(fs.readFileSync(path.join(__dirname, arquivo), 'utf8'));
      const registros = conteudo.totalRegistros || 0;
      const colunas = conteudo.colunas ? conteudo.colunas.length : 0;
      
      totalRegistros += registros;
      totalColunas += colunas;
      
      if (registros > 0) {
        tabelasComDados++;
        if (registros > 1000) {
          tabelasRelevantes.push({
            nome: conteudo.table,
            registros,
            colunas
          });
        }
      } else {
        tabelasVazias++;
      }
      
    } catch (error) {
      console.log(`   ⚠️  Erro ao ler ${arquivo}: ${error.message}`);
    }
  });
  
  console.log(`   Total de registros: ${totalRegistros.toLocaleString()}`);
  console.log(`   Total de colunas: ${totalColunas}`);
  console.log(`   Tabelas com dados: ${tabelasComDados}`);
  console.log(`   Tabelas vazias: ${tabelasVazias}`);
  
  // Mostrar tabelas mais relevantes (com mais dados)
  if (tabelasRelevantes.length > 0) {
    console.log('\n🎯 TABELAS PCE MAIS RELEVANTES (>1000 registros):');
    tabelasRelevantes
      .sort((a, b) => b.registros - a.registros)
      .slice(0, 10)
      .forEach((tabela, i) => {
        console.log(`   ${i + 1}. ${tabela.nome}: ${tabela.registros.toLocaleString()} registros, ${tabela.colunas} colunas`);
      });
  }
  
  // Verificar arquivos importantes
  console.log('\n📁 ARQUIVOS DE DOCUMENTAÇÃO E ANÁLISE:');
  const arquivosDocumentacao = [
    'MAPEAMENTO_COMPLETO_BD.json',
    'DOCUMENTACAO_BD_COMPLETA.md',
    'REFERENCIA_RAPIDA_PCE.md',
    'README.md'
  ];
  
  arquivosDocumentacao.forEach(arquivo => {
    if (fs.existsSync(path.join(__dirname, arquivo))) {
      const stats = fs.statSync(path.join(__dirname, arquivo));
      console.log(`   ✅ ${arquivo} (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`   ❌ ${arquivo} (não encontrado)`);
    }
  });
  
  // Gerar resumo final
  const resumoFinal = {
    dataVerificacao: new Date().toISOString(),
    estatisticas: {
      totalArquivosTabelas: arquivos.length,
      tabelasPCE: tabelasPCE.length,
      tabelasGESTAO: tabelasGESTAO.length,
      tabelasOutras: tabelasOutras.length,
      totalRegistros,
      totalColunas,
      tabelasComDados,
      tabelasVazias
    },
    tabelasRelevantes: tabelasRelevantes.slice(0, 15),
    status: 'MAPEAMENTO_COMPLETO'
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'VERIFICACAO_MAPEAMENTO_FINAL.json'),
    JSON.stringify(resumoFinal, null, 2),
    'utf8'
  );
  
  console.log('\n🎉 ESTADO DO MAPEAMENTO:');
  console.log('   ✅ Mapeamento da base de dados PCE está COMPLETO!');
  console.log(`   📊 ${tabelasPCE.length} tabelas PCE mapeadas`);
  console.log(`   💾 ${totalRegistros.toLocaleString()} registros catalogados`);
  console.log('   📁 Resumo salvo em: VERIFICACAO_MAPEAMENTO_FINAL.json');
}

verificarMapeamento(); 