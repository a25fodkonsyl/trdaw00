const db = require('./db');
const dades = require('./back/preguntes.json');

async function migrar() {
  for (const p of dades.preguntes) {
    const [res] = await db.query(
      'INSERT INTO preguntes (pregunta, imatge) VALUES (?, ?)',
      [p.pregunta, p.imatge]
    );

    for (let i = 0; i < p.respostes.length; i++) {
      await db.query(
        'INSERT INTO respostes (pregunta_id, resposta, correcta) VALUES (?, ?, ?)',
        [res.insertId, p.respostes[i], i === p.correctAnswer ? 1 : 0]
      );
    }
  }
  console.log('Migrades ' + dades.preguntes.length + ' preguntes');
  process.exit();
}

migrar().catch(err => {
  console.error('Error migrant:', err);
  process.exit(1);
});
