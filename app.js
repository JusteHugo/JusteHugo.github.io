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
let utilisateurNom = null;

document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('logoutBtn').addEventListener('click', logout);

auth.onAuthStateChanged(async user => {
  if (user) {
    utilisateur = user;
    // On récupère le nom dans users collection
    const userDoc = await db.collection('users').doc(user.uid).get();
    utilisateurNom = userDoc.exists ? userDoc.data().nom : user.email;

    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('ecuriesSection').style.display = 'block';
    chargerEcuries();
  } else {
    utilisateur = null;
    utilisateurNom = null;
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('ecuriesSection').style.display = 'none';
  }
});

function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!email || !password) {
    alert("Merci de remplir tous les champs.");
    return;
  }
  auth.signInWithEmailAndPassword(email, password)
    .catch(e => alert("Erreur connexion : " + e.message));
}

function logout() {
  auth.signOut();
}

function chargerEcuries() {
  db.collection("ecuries").onSnapshot(snapshot => {
    const ecuries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    afficherEcuries(ecuries);
  });
}

async function afficherEcuries(ecuries) {
  const conteneur = document.getElementById('listeEcuries');
  conteneur.innerHTML = '';

  // Trouver si utilisateur est déjà inscrit (dans quelle place)
  let maPlace = null;
  let ecurieIdDeMaPlace = null;
  ecuries.forEach(ecurie => {
    const index = ecurie.places.findIndex(uid => uid === utilisateur.uid);
    if (index !== -1) {
      maPlace = index;
      ecurieIdDeMaPlace = ecurie.id;
    }
  });

  for (const ecurie of ecuries) {
    const divEcurie = document.createElement('div');
    divEcurie.className = 'ecurie';
    divEcurie.innerHTML = `<h3>${ecurie.nom}</h3>`;

    const divPlaces = document.createElement('div');
    divPlaces.className = 'places';

    for (let i = 0; i < ecurie.places.length; i++) {
      const uid = ecurie.places[i];
      const placeDiv = document.createElement('div');
      placeDiv.className = 'place';

      if (!uid) {
        // place vide
        if (maPlace !== null) {
          // utilisateur déjà inscrit => pas cliquable
          placeDiv.textContent = "Vide";
          placeDiv.style.cursor = 'default';
          placeDiv.style.backgroundColor = '#eee';
        } else {
          placeDiv.textContent = "Vide";
          placeDiv.style.cursor = 'pointer';
          placeDiv.addEventListener('click', () => rejoindrePlace(ecurie.id, i));
        }
      } else if (uid === utilisateur.uid) {
        placeDiv.textContent = utilisateurNom;
        placeDiv.classList.add('me');
      } else {
        // récup user nom pour affichage
        const userDoc = await db.collection('users').doc(uid).get();
        const nomUser = userDoc.exists ? userDoc.data().nom : uid;
        placeDiv.textContent = nomUser;
        placeDiv.classList.add('taken');
        placeDiv.style.cursor = 'default';
      }
      divPlaces.appendChild(placeDiv);
    }
    divEcurie.appendChild(divPlaces);
    conteneur.appendChild(divEcurie);
  }
}

// Fonction pour rejoindre une place
async function rejoindrePlace(ecurieId, placeIndex) {
  if (!utilisateur) {
    alert("Connectez-vous d'abord !");
    return;
  }

  const ecurieRef = db.collection('ecuries').doc(ecurieId);

  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(ecurieRef);
      const ecurieData = doc.data();

      // Vérifier que la place est toujours libre
      if (ecurieData.places[placeIndex]) {
        throw "Place déjà prise !";
      }

      // Vérifier que l'utilisateur n'est pas déjà dans une autre place
      const snapshot = await db.collection('ecuries').get();
      const dejaInscrit = snapshot.docs.some(doc => doc.data().places.includes(utilisateur.uid));
      if (dejaInscrit) {
        throw "Vous êtes déjà inscrit dans une autre écurie.";
      }

      // Réserver la place
      const nouvellesPlaces = [...ecurieData.places];
      nouvellesPlaces[placeIndex] = utilisateur.uid;
      transaction.update(ecurieRef, { places: nouvellesPlaces });
    });
    alert("Place réservée !");
  } catch (e) {
    alert(e);
  }
}