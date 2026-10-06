const API = '/crud/preguntes';

let preguntes = [];

function mostrarMissatge(text) {
    document.getElementById("missatge").textContent = text;
}

// ---------- CONSULTAR (GET) ----------
function carregarPreguntes() {
    fetch(API)
        .then(response => {
            if (!response.ok) throw new Error("Error del servidor: " + response.status);
            return response.json();
        })
        .then(data => {
            preguntes = data;
            pintarLlista();
        })
        .catch(err => {
            console.error(err);
            mostrarMissatge("No s'han pogut carregar les preguntes.");
        });
}

function pintarLlista() {

    let htmlStr = "";

    for (let i = 0; i < preguntes.length; i++) {

        const p = preguntes[i];

        htmlStr += `
            <div class="card mb-3">
                <div class="card-body">
                    <h3 class="h6">${p.pregunta}</h3>
        `;

        if (p.imatge) {
            htmlStr += `<img src="${p.imatge}" width="100" class="img-thumbnail d-block mb-2">`;
        }

        htmlStr += '<ul class="mb-3">';
        for (let j = 0; j < p.respostes.length; j++) {
            if (j === p.correctAnswer) {
                htmlStr += '<li class="fw-bold text-success">' + p.respostes[j] + " (correcta)</li>";
            } else {
                htmlStr += "<li>" + p.respostes[j] + "</li>";
            }
        }
        htmlStr += "</ul>";

        htmlStr += `
                    <button data-id="${p.id}" class="btnEditar btn btn-sm btn-primary">Modificar</button>
                    <button data-id="${p.id}" class="btnEliminar btn btn-sm btn-danger">Eliminar</button>
                </div>
            </div>
        `;
    }

    document.getElementById("llista").innerHTML = htmlStr;
}

// Un sol addEventListener al pare (#llista): delegació d'esdeveniments
document.getElementById("llista").addEventListener("click", function(event) {

    if (event.target.classList.contains("btnEditar")) {
        editarPregunta(event.target.dataset.id);
    }

    if (event.target.classList.contains("btnEliminar")) {
        eliminarPregunta(event.target.dataset.id);
    }
});

// ---------- Formulari ----------
function netejarFormulari() {
    document.getElementById("formPregunta").reset();
    document.getElementById("inputId").value = "";
    document.getElementById("imatgeActual").value = "";
    document.getElementById("textImatgeActual").textContent = "";
    document.getElementById("titolFormulari").textContent = "Nova pregunta";
    document.getElementById("btnDesar").textContent = "Crear pregunta";
    document.getElementById("btnCancelar").classList.add("d-none");
}

document.getElementById("btnCancelar").addEventListener("click", function() {
    netejarFormulari();
    mostrarMissatge("");
});

// ---------- CREAR (POST) i MODIFICAR (PUT) ----------
document.getElementById("formPregunta").addEventListener("submit", function(event) {

    event.preventDefault(); // la pàgina no es recarrega

    const id = document.getElementById("inputId").value;

    const respostes = [];
    for (let i = 0; i < 4; i++) {
        respostes.push(document.getElementById("resposta" + i).value.trim());
    }

    const correcta = document.querySelector('input[name="correcta"]:checked').value;

    // multipart/form-data: és el que permet enviar el fitxer de la imatge
    const formData = new FormData();
    formData.append("pregunta", document.getElementById("inputPregunta").value.trim());
    formData.append("respostes", JSON.stringify(respostes));
    formData.append("correctAnswer", correcta);
    formData.append("imatgeActual", document.getElementById("imatgeActual").value);

    const fitxer = document.getElementById("inputImatge").files[0];
    if (fitxer) {
        formData.append("imatge", fitxer);
    }

    let url = API;
    let metode = "POST";

    if (id !== "") {
        url = API + "/" + id;
        metode = "PUT";
    }

    fetch(url, { method: metode, body: formData })
        .then(response => {
            if (!response.ok) throw new Error("Error del servidor: " + response.status);
            return response.json();
        })
        .then(data => {
            mostrarMissatge(data.mensaje);
            netejarFormulari();
            carregarPreguntes();
        })
        .catch(err => {
            console.error(err);
            mostrarMissatge("No s'ha pogut desar la pregunta.");
        });
});

// ---------- Omplir el formulari per MODIFICAR ----------
function editarPregunta(id) {

    let p = null;
    for (let i = 0; i < preguntes.length; i++) {
        if (preguntes[i].id == id) {
            p = preguntes[i];
        }
    }

    if (p === null) return;

    document.getElementById("inputId").value = p.id;
    document.getElementById("inputPregunta").value = p.pregunta;

    for (let i = 0; i < 4; i++) {
        document.getElementById("resposta" + i).value = p.respostes[i] || "";
    }

    document.getElementById("correcta" + p.correctAnswer).checked = true;

    document.getElementById("imatgeActual").value = p.imatge || "";
    document.getElementById("inputImatge").value = "";
    document.getElementById("textImatgeActual").textContent =
        p.imatge ? "Imatge actual: " + p.imatge : "";

    document.getElementById("titolFormulari").textContent = "Modificar pregunta " + p.id;
    document.getElementById("btnDesar").textContent = "Desar canvis";
    document.getElementById("btnCancelar").classList.remove("d-none");
}

// ---------- ELIMINAR (DELETE) ----------
function eliminarPregunta(id) {

    if (!confirm("Segur que vols eliminar aquesta pregunta?")) return;

    fetch(API + "/" + id, { method: "DELETE" })
        .then(response => {
            if (!response.ok) throw new Error("Error del servidor: " + response.status);
            return response.json();
        })
        .then(data => {
            mostrarMissatge(data.mensaje);
            carregarPreguntes();
        })
        .catch(err => {
            console.error(err);
            mostrarMissatge("No s'ha pogut eliminar la pregunta.");
        });
}

carregarPreguntes();