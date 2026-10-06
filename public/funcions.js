let sessionId;

let estatDeLaPartida = {
    contadorPreguntes: 0,
    respostesUsuari: []
};

// ---------- ITERACIÓ 7: comptador de temps ----------
let segons = 0;
let intervalTemps = null;

function iniciarTemporitzador() {
    segons = 0;
    document.getElementById("temporitzador").innerHTML = "Temps: 0 s";

    // setInterval executa la funció cada 1000 ms (1 segon)
    intervalTemps = setInterval(function() {
        segons++;
        document.getElementById("temporitzador").innerHTML = "Temps: " + segons + " s";
    }, 1000);
}

// ---------- ITERACIÓ 6: nom de l'usuari amb localStorage ----------
function mostrarNom() {

    const nom = localStorage.getItem("nomUsuari");

    if (nom) {
        // Ja tenim el nom: saludem i amaguem el formulari
        document.getElementById("salutacio").textContent = "Hola, " + nom + "!";
        document.getElementById("formNom").classList.add("d-none");
        document.getElementById("btnEsborrarNom").classList.remove("d-none");
    } else {
        // No hi ha nom: mostrem el formulari
        document.getElementById("salutacio").textContent = "";
        document.getElementById("formNom").classList.remove("d-none");
        document.getElementById("btnEsborrarNom").classList.add("d-none");
    }
}

document.getElementById("formNom").addEventListener("submit", function(event) {

    event.preventDefault(); // evita que el formulari recarregui la pàgina

    const nom = document.getElementById("inputNom").value.trim();

    if (nom !== "") {
        localStorage.setItem("nomUsuari", nom);
        document.getElementById("inputNom").value = "";
        mostrarNom();
    }
});

document.getElementById("btnEsborrarNom").addEventListener("click", function() {
    localStorage.removeItem("nomUsuari");
    mostrarNom();
});

mostrarNom();

// ---------- Càrrega de les preguntes (fetch) ----------
fetch('/preguntes')
    .then(response => response.json())
    .then(data => {
        console.log("Dades carregades!", data);
        sessionId = data.sessionId;
        iniciarPartida(data.preguntes);
        iniciarTemporitzador();
        renderitzarMarcador();
    })
    .catch(err => {
        console.error(err);
        document.getElementById("marcador").textContent =
            "No s'han pogut carregar les preguntes.";
    });

// ---------- ITERACIÓ 5: addEventListener amb delegació d'esdeveniments ----------
function iniciarPartida(preguntes) {

    let htmlStr = "";

    for (let i = 0; i < preguntes.length; i++) {

        // Només mostrem la imatge si la pregunta en té
        let imatgeHtml = "";
        if (preguntes[i].imatge) {
            imatgeHtml = `<img width="150" class="img-fluid d-block mx-auto mb-3" src="${preguntes[i].imatge}">`;
        }

        // Els botons NO tenen onclick: només una classe i dos data-*
        htmlStr += `
            <div class="card mb-3">
                <div class="card-body text-center">
                    ${imatgeHtml}
                    <p class="fs-5">${preguntes[i].pregunta}</p>

                    <div class="row g-2">
                        <div class="col-6 col-md-3">
                            <button data-id-preg="${i}" data-id-resp="0" class="btnRespuesta btn btn-outline-primary w-100">${preguntes[i].respostes[0]}</button>
                        </div>
                        <div class="col-6 col-md-3">
                            <button data-id-preg="${i}" data-id-resp="1" class="btnRespuesta btn btn-outline-primary w-100">${preguntes[i].respostes[1]}</button>
                        </div>
                        <div class="col-6 col-md-3">
                            <button data-id-preg="${i}" data-id-resp="2" class="btnRespuesta btn btn-outline-primary w-100">${preguntes[i].respostes[2]}</button>
                        </div>
                        <div class="col-6 col-md-3">
                            <button data-id-preg="${i}" data-id-resp="3" class="btnRespuesta btn btn-outline-primary w-100">${preguntes[i].respostes[3]}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    document.getElementById("partida").innerHTML = htmlStr;

    // UN sol addEventListener, al pare (#partida)
    document.getElementById("partida").addEventListener("click", function(event) {

        console.log(event.target);

        // Només fem cas si l'element clicat és un botó de resposta
        if (event.target.classList.contains("btnRespuesta")) {

            botoPremut(
                event.target.dataset.idPreg,
                event.target.dataset.idResp
            );
        }
    });
}

function botoPremut(idPreg, idResp) {

    // Si aquesta pregunta ja estava respesta, no la tornem a comptar
    for (let i = 0; i < estatDeLaPartida.respostesUsuari.length; i++) {
        if (estatDeLaPartida.respostesUsuari[i].idPreg == idPreg) {
            return;
        }
    }

    estatDeLaPartida.respostesUsuari.push({
        idPreg: idPreg,
        idResp: idResp
    });

    estatDeLaPartida.contadorPreguntes++;

    console.log("Pregunta:", idPreg);
    console.log("Resposta:", idResp);

    renderitzarMarcador();
}

function renderitzarMarcador() {

    document.getElementById("marcador").innerHTML =
        "Preguntes respostes: " +
        estatDeLaPartida.contadorPreguntes +
        " de 10";

    if (estatDeLaPartida.contadorPreguntes == 10) {

        document.getElementById("enviarResultats").classList.remove("d-none");

        // ITERACIÓ 7: s'ha respost l'última pregunta, aturem el comptador
        clearInterval(intervalTemps);
        document.getElementById("temporitzador").innerHTML = "Temps final: " + segons + " s";
    }
}