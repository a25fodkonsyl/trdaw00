const mysql = require('mysql2');

const dades = require('./back/preguntes.json');

const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'a25fodkonsyl_TRDAW0',
    password: ':&PE0d&tbWQS_E)-',
    database: 'a25fodkonsyl_TRDAW0'
});

connection.connect(function(err) {

    if (err) {
        console.log('Error connectant amb MySQL:', err);
        return;
    }

    console.log('Connectat a MySQL');

    let pendents = dades.preguntes.length;

    // Per cada pregunta del JSON: primer la pregunta, després les seves respostes
    dades.preguntes.forEach(function(p) {

        connection.query(
            'INSERT INTO preguntes (pregunta, imatge) VALUES (?, ?)',
            [p.pregunta, p.imatge],
            function(err, resultat) {

                if (err) {
                    console.log('Error inserint pregunta:', err);
                    return;
                }

                const valors = p.respostes.map((r, i) => [
                    resultat.insertId,
                    r,
                    i === p.correctAnswer ? 1 : 0
                ]);

                connection.query(
                    'INSERT INTO respostes (pregunta_id, resposta, correcta) VALUES ?',
                    [valors],
                    function(err2) {

                        if (err2) {
                            console.log('Error inserint respostes:', err2);
                            return;
                        }

                        pendents--;

                        if (pendents === 0) {
                            console.log('Migrades ' + dades.preguntes.length + ' preguntes');
                            connection.end();
                        }
                    }
                );
            }
        );
    });
});