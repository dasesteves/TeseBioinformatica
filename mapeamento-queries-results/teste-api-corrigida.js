async function testarAPICorrigida() {
  try {
    console.log('🔍 Testando API corrigida...');
    
    const response = await fetch('http://10.21.101.246:3000/api/cirurgia/protocolos/IDT189/medicamentos');
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ API respondeu com sucesso!');
      console.log('📋 Protocolo:', data.protocolo);
      console.log(`💊 Total de medicamentos: ${data.medicamentos?.length || 0}`);
      
      if (data.medicamentos && data.medicamentos.length > 0) {
        console.log('\n🔍 Medicamentos encontrados:');
        data.medicamentos.forEach((med, index) => {
          console.log(`\n   ${index + 1}. ${med.codigo}`);
          console.log(`      Descrição: ${med.descricao}`);
          console.log(`      Quantidade: ${med.quantidade} ${med.unidade}`);
          console.log(`      SOS: ${med.sos ? 'Sim' : 'Não'}`);
          console.log(`      Alto Risco: ${med.altoRisco ? 'Sim' : 'Não'}`);
          console.log(`      É Medicamento: ${med.isMedicamento ? 'Sim' : 'Não'}`);
          if (med.observacoes) {
            console.log(`      Observações: ${med.observacoes}`);
          }
          if (med.horarios) {
            console.log(`      Horários: ${med.horarios}`);
          }
          if (med.duracao) {
            console.log(`      Duração: ${med.duracao} ${med.unidadeDuracao}`);
          }
        });
      }
      
      console.log(`\n📦 Medicamentos suspensos: ${data.medicamentosSuspensos?.length || 0}`);
      console.log('\n📊 Estatísticas:', data.estatisticas);
      
    } else {
      console.error('❌ Erro na API:', response.status, response.statusText);
      const error = await response.text();
      console.error('Detalhes:', error);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testarAPICorrigida();