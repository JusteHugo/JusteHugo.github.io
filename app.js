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

    // Bouton de connexion
    document.getElementById('loginBtn').addEventListener('click', () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) return alert("Remplis tous les champs.");

        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                utilisateur = auth.currentUser;
                document.getElementById('loginSection').style.display = 'none';
                document.getElementById('ecuriesSection').style.display = 'block';
                initialiserSlots();
                ecouterMisesAJour();
            })
            .catch(e => alert(e.message));
    });

    // Vérifie connexion persistante
    auth.onAuthStateChanged(user => {
        if (user) {
            utilisateur = user;
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('ecuriesSection').style.display = 'block';
            initialiserSlots();
            ecouterMisesAJour();
        }
    });
});

function initialiserSlots() {
    document.querySelectorAll('.slot').forEach(slot => {
        slot.addEventListener('click', () => {
            if (!utilisateur) return alert("Connectez-vous");

            const ecurieId = slot.closest('.ecurie').dataset.id;
            const index = slot.dataset.index;

            changerDePlace(ecurieId, index);
        });
    });
}

async function changerDePlace(nouvelleEcurieId, nouveauSlotIndex) {
    if (!nouvelleEcurieId) {
        return alert("Erreur : écurie inconnue !");
    }

    const pseudo = utilisateur.email.split('@')[0];
    const refEcurie = db.collection('Ecuries').doc(nouvelleEcurieId);
    const doc = await refEcurie.get();

    if (!doc.exists) {
        return alert("Écurie introuvable !");
    }

    const data = doc.data();
    const slots = data.slots || [];

    // Chercher si l'utilisateur est déjà dans un slot de cette écurie
    let ancienIndex = slots.findIndex(nom => nom === pseudo);

    // Si le nouveau slot est déjà pris par quelqu'un d'autre (différent de l'utilisateur)
    if (slots[nouveauSlotIndex] && slots[nouveauSlotIndex] !== pseudo) {
        return alert("Cette place est déjà prise !");
    }

    // Si l'utilisateur est déjà sur un autre slot dans cette écurie, on libère ce slot
    if (ancienIndex !== -1 && ancienIndex !== parseInt(nouveauSlotIndex)) {
        slots[ancienIndex] = "";
    }

    // On place l'utilisateur dans le nouveau slot
    slots[nouveauSlotIndex] = pseudo;

    // Met à jour la base
    await refEcurie.update({ slots });

    console.log("Place modifiée avec succès");
}




function ecouterMisesAJour() {
    db.collection('Ecuries').onSnapshot(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            const slots = data.slots || [];
            const ecurieId = doc.id;

            const ecurieDiv = document.querySelector(`.ecurie[data-id="${ecurieId}"]`);
            if (!ecurieDiv) return;

            slots.forEach((nom, index) => {
                const slot = ecurieDiv.querySelector(`.slot[data-index="${index}"]`);
                if (slot) {
                    slot.textContent = nom ? nom : `Place ${parseInt(index) + 1}`;
                    if (nom) {
                        slot.classList.add('occupe');
                    } else {
                        slot.classList.remove('occupe');
                    }
                }
            });
        });
    });
}
