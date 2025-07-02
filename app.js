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
const db = firebase.firestore();
let utilisateur = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginBtn').addEventListener('click', login);

    auth.onAuthStateChanged(user => {
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

function login() {
    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        alert("Veuillez remplir les deux champs.");
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            utilisateur = auth.currentUser;
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('ecuriesSection').style.display = 'block';
            chargerEcuries();
        })
        .catch(error => {
            if (error.code === "auth/user-not-found") {
                alert("Compte inexistant. Crée-le dans la console Firebase.");
            } else if (error.code === "auth/wrong-password") {
                alert("Mot de passe incorrect.");
            } else {
                alert(error.message);
            }
        });
}

function chargerEcuries() {
    db.collection("ecuries").onSnapshot(snapshot => {
        const ecuries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        afficherEcuries(ecuries);
    });
}

function afficherEcuries(ecuries) {
    console.log("Données reçues :", ecuries); // Vérifie que ecuries est bien un tableau

    const conteneur = document.getElementById('listeEcuries');
    conteneur.innerHTML = '';

    if (!ecuries || !Array.isArray(ecuries)) {
        console.error("Erreur : ecuries n'est pas un tableau");
        return;
    }

    ecuries.forEach(ecurie => {
        console.log("Écurie :", ecurie);      // Vérifie chaque objet ecurie
        console.log("Nom de l'écurie :", ecurie.nom);

        const placesRestantes = ecurie.max - ecurie.membres.length;

        const div = document.createElement('div');
        div.className = 'ecurie';
        div.innerHTML = `
            <h3>${ecurie.nom}</h3>
            <p>Places restantes : ${placesRestantes}</p>
            <p>Membres : ${ecurie.membres.join(', ') || 'Aucun'}</p>
            <button ${placesRestantes <= 0 ? 'disabled' : ''} onclick="rejoindreEcurie('${ecurie.id}')">Rejoindre</button>
        `;
        conteneur.appendChild(div);
    });
}



function rejoindrePlace(ecurieId, placeNum) {
    if (!utilisateur) return alert("Connectez-vous");

    const ref = db.collection("Ecuries").doc(ecurieId);

    db.runTransaction(async (transaction) => {
        const doc = await transaction.get(ref);
        const data = doc.data();

        // Vérifier si utilisateur déjà dans une écurie
        const snapshot = await db.collection("ecuries").get();
        const dejaPris = snapshot.docs.some(doc => 
            doc.data().membres.some(m => m.uid === utilisateur.uid)
        );
        if (dejaPris) throw "Vous êtes déjà inscrit dans une écurie";

        // Vérifier si place libre
        const occupant = data.membres.find(m => m.place === placeNum);
        if (occupant) throw "Cette place est déjà prise";

        // Ajouter utilisateur à la place choisie
        const nouveauxMembres = [...data.membres, { place: placeNum, uid: utilisateur.uid }];
        transaction.update(ref, { membres: nouveauxMembres });
    })
    .then(() => {
        alert("Place réservée !");
    })
    .catch(e => alert(e));
}

