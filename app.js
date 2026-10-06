const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = Number(process.argv[2]) || 20201;

const sessions = new Map();

app.use(express.json());
app.use(express.static('../public_html'));

// ---------- Imatges (multer) ----------
// Els fitxers es guarden dins de public_html/images i express.static ja els serveix a /images/...
fs.mkdirSync('../public_html/images', { recursive: true });

const emmagatzematge = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, '../public_html/images');
    },
    filename: function(req, file, cb) {
        cb(null, "pregunta" + Date.now() + path.extname(file.originalname).toLowerCase());
    }
});

const upload = multer({
    storage: emmagatzematge,
    fileFilter: function(req, file, cb) {
        const extensio = path.extname(file.originalname).toLowerCase();
        cb(null, ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extensio));
    }
});

const con = mysql.createPool({
    host: "localhost",
    user: "a25fodkonsyl_TRDAW0",
    password: ":&PE0d&tbWQS_E)-",
    database: "a25fodkonsyl_TRDAW0",
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});

// Una fila per cada resposta: pregunta + resposta + si és la correcta
const SQL_PREGUNTES = `
    SELECT p.id, p.pregunta, p.imatge, r.resposta, r.correcta
    FROM preguntes p
    JOIN respostes r ON r.pregunta_id = p.id
`;

// Base de dades -> consulta SQL -> result -> transformació -> JSON que ja coneix el client
function transformar(files) {
    const preguntes = [];
    let actual = null;

    for (let i = 0; i < files.length; i++) {
        const f = files[i];

        if (actual === null || actual.id !== f.id) {
            actual = {
                id: f.id,
                pregunta: f.pregunta,
                respostes: [],
                correctAnswer: 0,
                imatge: f.imatge
            };
            preguntes.push(actual);
        }

        if (f.correcta == 1) {
            actual.correctAnswer = actual.respostes.length;
        }
        actual.respostes.push(f.resposta);
    }

    return preguntes;
}

function errorBD(res, err) {
    console.log("Error amb la base de dades:", err);
    res.status(500).json({ error: "Error amb la base de dades" });
}

// Amb multipart/form-data tot arriba com a text a req.body:
// "respostes" arriba com a text JSON i "correctAnswer" com a text
function llegirDades(req) {
    try {
        return {
            pregunta: req.body.pregunta,
            respostes: JSON.parse(req.body.respostes),
            correctAnswer: parseInt(req.body.correctAnswer)
        };
    } catch (e) {
        return null;
    }
}

function dadesValides(d) {
    return d !== null && d.pregunta && Array.isArray(d.respostes) && d.respostes.length >= 2 &&
        d.respostes.every(r => typeof r === 'string' && r.trim() !== '') &&
        Number.isInteger(d.correctAnswer) &&
        d.correctAnswer >= 0 && d.correctAnswer < d.respostes.length;
}

// ---------- QUIZ ----------
app.get('/preguntes', function(req, res) {

    con.query(SQL_PREGUNTES + " ORDER BY p.id, r.id", function(err, files) {

        if (err) {
            errorBD(res, err);
            return;
        }

        const preguntes = transformar(files);

        preguntes.sort(() => Math.random() - 0.5);
        const preguntesSeleccionades = preguntes.slice(0, 10);

        const sessionId = uuidv4();

        sessions.set(sessionId, {
            questions: preguntesSeleccionades
        });

        const clientQuestions = preguntesSeleccionades.map(pregunta => ({
            id: pregunta.id,
            pregunta: pregunta.pregunta,
            respostes: pregunta.respostes,
            imatge: pregunta.imatge
        }));

        res.json({
            sessionId: sessionId,
            preguntes: clientQuestions
        });
    });
});

// ---------- CRUD ----------

// Consultar totes
app.get('/crud/preguntes', function(req, res) {

    con.query(SQL_PREGUNTES + " ORDER BY p.id, r.id", function(err, files) {

        if (err) {
            errorBD(res, err);
            return;
        }

        res.json(transformar(files));
    });
});

// Consultar una
app.get('/crud/preguntes/:id', function(req, res) {

    con.query(
        SQL_PREGUNTES + " WHERE p.id = ? ORDER BY r.id",
        [req.params.id],
        function(err, files) {

            if (err) {
                errorBD(res, err);
                return;
            }

            if (files.length === 0) {
                res.status(404).json({ error: "Pregunta no trobada" });
                return;
            }

            res.json(transformar(files)[0]);
        }
    );
});

// Afegir (multipart/form-data: camps de text + fitxer "imatge")
app.post('/crud/preguntes', upload.single('imatge'), function(req, res) {

    const dades = llegirDades(req);

    if (!dadesValides(dades)) {
        res.status(400).json({ error: "Dades invàlides" });
        return;
    }

    // Només guardem el path a la base de dades, el fitxer queda al disc
    const imatge = req.file ? "/images/" + req.file.filename : null;

    con.query(
        "INSERT INTO preguntes (pregunta, imatge) VALUES (?, ?)",
        [dades.pregunta, imatge],
        function(err, resultat) {

            if (err) {
                errorBD(res, err);
                return;
            }

            const id = resultat.insertId;
            const valors = dades.respostes.map((r, i) => [id, r, i === dades.correctAnswer ? 1 : 0]);

            con.query(
                "INSERT INTO respostes (pregunta_id, resposta, correcta) VALUES ?",
                [valors],
                function(err2) {

                    if (err2) {
                        errorBD(res, err2);
                        return;
                    }

                    res.status(201).json({ mensaje: "Pregunta creada", id: id });
                }
            );
        }
    );
});

// Modificar
app.put('/crud/preguntes/:id', upload.single('imatge'), function(req, res) {

    const dades = llegirDades(req);

    if (!dadesValides(dades)) {
        res.status(400).json({ error: "Dades invàlides" });
        return;
    }

    const id = req.params.id;

    // Si es puja una imatge nova, canviem el path; si no, es manté l'anterior
    const imatge = req.file ? "/images/" + req.file.filename : (req.body.imatgeActual || null);

    con.query(
        "UPDATE preguntes SET pregunta = ?, imatge = ? WHERE id = ?",
        [dades.pregunta, imatge, id],
        function(err, resultat) {

            if (err) {
                errorBD(res, err);
                return;
            }

            if (resultat.affectedRows === 0) {
                res.status(404).json({ error: "Pregunta no trobada" });
                return;
            }

            con.query(
                "DELETE FROM respostes WHERE pregunta_id = ?",
                [id],
                function(err2) {

                    if (err2) {
                        errorBD(res, err2);
                        return;
                    }

                    const valors = dades.respostes.map((r, i) => [id, r, i === dades.correctAnswer ? 1 : 0]);

                    con.query(
                        "INSERT INTO respostes (pregunta_id, resposta, correcta) VALUES ?",
                        [valors],
                        function(err3) {

                            if (err3) {
                                errorBD(res, err3);
                                return;
                            }

                            res.json({ mensaje: "Pregunta modificada" });
                        }
                    );
                }
            );
        }
    );
});

// Eliminar (les respostes s'esborren soles per ON DELETE CASCADE)
app.delete('/crud/preguntes/:id', function(req, res) {

    con.query(
        "DELETE FROM preguntes WHERE id = ?",
        [req.params.id],
        function(err, resultat) {

            if (err) {
                errorBD(res, err);
                return;
            }

            if (resultat.affectedRows === 0) {
                res.status(404).json({ error: "Pregunta no trobada" });
                return;
            }

            res.json({ mensaje: "Pregunta eliminada" });
        }
    );
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});