const API_URL = "http://localhost:3000";

let utilisateur = "";

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginBtn').addEventListener('click', login);
});

function login() {
    const pseudo = document.getElementById('username').value.trim();
    const mdp = document.getElementById('password').value.trim();

    fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiant: pseudo, motdepasse: mdp })
    })
    .then(res => {
        if (res.ok) return res.json();
        throw new Error("Identifiants incorrects");
    })
    .then(() => {
        utilisateur = pseudo;
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('ecuriesSection').style.display = 'block';
        chargerEcuries();
    })
    .catch(err => alert(err.message));
}

function chargerEcuries() {
    fetch(`${API_URL}/ecuries`)
        .then(res => res.json())
        .then(data => afficherEcuries(data));
}

function afficherEcuries(ecuries) {
    const conteneur = document.getElementById('listeEcuries');
    conteneur.innerHTML = '';

    ecuries.forEach((ecurie, index) => {
        const dejaDansUneEquipe = ecuries.some(e => e.membres.includes(utilisateur));

        const bloque = document.createElement('div');
        bloque.className = 'ecurie';

        bloque.innerHTML = `
            <h3>${ecurie.nom}</h3>
            <p>Places restantes : ${ecurie.max - ecurie.membres.length}</p>
            <button ${ecurie.membres.length >= ecurie.max || dejaDansUneEquipe ? 'disabled' : ''} onclick="rejoindreEcurie(${index})">Rejoindre</button>
            <div class="membres">Membres : ${ecurie.membres.join(', ') || 'Aucun'}</div>
        `;

        conteneur.appendChild(bloque);
    });
}

function rejoindreEcurie(index) {
    fetch(`${API_URL}/ecuries/rejoindre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utilisateur, index })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Vous avez rejoint une écurie !");
            chargerEcuries();
        } else {
            alert(data.message);
        }
    });
}