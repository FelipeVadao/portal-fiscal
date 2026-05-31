const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'IRPF_2026_Felipe.html'));
});

app.listen(PORT, () => {
  console.log('');
  console.log('✅ Servidor IRPF 2026 rodando em: http://localhost:' + PORT);
  console.log('');
  console.log('📤 Para gerar o link para o contador, abra outro terminal e execute:');
  console.log('   npx localtunnel --port ' + PORT);
  console.log('');
});
