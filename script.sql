DROP TABLE IF EXISTS respostes;
DROP TABLE IF EXISTS preguntes;

CREATE TABLE preguntes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pregunta TEXT NOT NULL,
    imatge VARCHAR(500)
);

CREATE TABLE respostes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pregunta_id INT NOT NULL,
    resposta VARCHAR(255) NOT NULL,
    correcta TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (pregunta_id) REFERENCES preguntes(id) ON DELETE CASCADE
);
