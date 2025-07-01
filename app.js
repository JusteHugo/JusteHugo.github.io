const utilisateursAutorises = [
    { identifiant: "alice", motdepasse: "pass123" },
    { identifiant: "bob", motdepasse: "secret" },
    { identifiant: "charlie", motdepasse: "qwerty" }
];

const ecuries = [
    { nom: "Écurie Rouge", max: 3, membres: [] },
    { nom: "Écurie Bleue", max: 5, membres: [] },
    { nom: "Écurie Noire", max: 2, membres: [] }
];

let utilisateur = "";

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginBtn').addEventListener('click', login);
});

function login() {
    const pseudo = document.getElementById('username').value.trim();
    const mdp = document.getElementById('password').value.trim();

    const utilisateurTrouve = utilisateursAutorises.find(u => u.identifiant === pseudo && u.motdepasse === mdp);

    if(utilisateurTrouve){
        utilisateur = pseudo;
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('ecuriesSection').style.display = 'block';
        afficherEcuries();
    } else {
        alert("Identifiant ou mot de passe incorrect.");
    }
}

function afficherEcuries() {
    const conteneur = document.getElementById('listeEcuries');
    conteneur.innerHTML = '';

    ecuries.forEach((ecurie, index) => {
        const bloque = document.createElement('div');
        bloque.className = 'ecurie';

        bloque.innerHTML = `
            <h3>${ecurie.nom}</h3>
            <p>Places restantes : ${ecurie.max - ecurie.membres.length}</p>
            <button ${ecurie.membres.length >= ecurie.max ? 'disabled' : ''} onclick="rejoindreEcurie(${index})">Rejoindre</button>
            <div class="membres">Membres : ${ecurie.membres.join(', ') || 'Aucun'}</div>
        `;

        conteneur.appendChild(bloque);
    });
}

function rejoindreEcurie(index) {
    const dejaDansUneEquipe = ecuries.some(ecurie => ecurie.membres.includes(utilisateur));

    if(dejaDansUneEquipe){
        alert("Vous êtes déjà dans une écurie.");
        return;
    }

    if(ecuries[index].membres.length < ecuries[index].max){
        ecuries[index].membres.push(utilisateur);
        afficherEcuries();
        alert(`Vous avez rejoint ${ecuries[index].nom} !`);
    }
}