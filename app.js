// Config Firebase à personnaliser avec TES infos :
const firebaseConfig = {
    apiKey: "AIzaSyBaWatcA83qeeStPCwwq4HMOQ6UwGqBWIc",
    authDomain: "madmax2-20cb7.firebaseapp.com",
    projectId: "madmax2-20cb7",
    storageBucket: "madmax2-20cb7.appspot.com",
    messagingSenderId: "267124909744",
    appId: "1:267124909744:web:339a485c4599556e07bd75"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
// Initialisation Firebase (déjà fait dans ton code)
const db = firebase.firestore();
let utilisateur = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginBtn').addEventListener('click', login);

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            utilisateur = user;
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('ecuriesSection').style.display = 'block';
            chargerEcuries();
        } else {
            utilisateur = null;
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('ecuriesSection').style.display = 'none';
        }
    });
});

function chargerEcuries() {
    db.collection("ecuries").onSnapshot(snapshot => {
        const ecuries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        afficherEcuries(ecuries);
    });
}

function afficherEcuries(ecuries) {
    const conteneur = document.getElementById('listeEcuries');
    conteneur.innerHTML = '';

    const dejaDansUneEquipe = ecuries.some(e => e.membres.includes(utilisateur.uid));

    ecuries.forEach(ecurie => {
        const placesRestantes = ecurie.max - ecurie.membres.length;

        const div = document.createElement('div');
        div.className = 'ecurie';
        div.innerHTML = `
            <h3>${ecurie.nom}</h3>
            <p>Places restantes : ${placesRestantes}</p>
            <p>Membres : ${ecurie.membres.map(uid => uid).join(', ') || 'Aucun'}</p>
            <button ${placesRestantes <= 0 || dejaDansUneEquipe ? 'disabled' : ''} onclick="rejoindreEcurie('${ecurie.id}')">Rejoindre</button>
        `;
        conteneur.appendChild(div);
    });
}

function rejoindreEcurie(ecurieId) {
    if (!utilisateur) return alert("Connectez-vous");

    const ref = db.collection("ecuries").doc(ecurieId);

    db.runTransaction(async (transaction) => {
        const doc = await transaction.get(ref);
        const data = doc.data();

        if (data.membres.includes(utilisateur.uid)) throw "Vous êtes déjà dans cette écurie";
        if (data.membres.length >= data.max) throw "Écurie complète";

        // Vérifier que l'utilisateur n'est dans aucune autre écurie
        const snapshot = await db.collection("ecuries").get();
        const dejaPris = snapshot.docs.some(doc => doc.data().membres.includes(utilisateur.uid));
        if (dejaPris) throw "Vous êtes déjà inscrit dans une autre écurie";

        const nouveauxMembres = [...data.membres, utilisateur.uid];
        transaction.update(ref, { membres: nouveauxMembres });
    })
    .then(() => {
        alert("Vous avez rejoint une écurie !");
    })
    .catch(e => alert(e));
}


