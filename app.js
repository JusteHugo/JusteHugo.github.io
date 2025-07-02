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
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            utilisateur = user;
            initialiserSlots();
            ecouterMisesAJour();
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
    const pseudo = utilisateur.email.split('@')[0];

    const snapshot = await db.collection('ecuries').get();

    const batch = db.batch();

    snapshot.forEach(doc => {
        const data = doc.data();
        const slots = data.slots || [];

        slots.forEach((nom, index) => {
            if (nom === pseudo) {
                const ref = db.collection('ecuries').doc(doc.id);
                slots[index] = "";
                batch.update(ref, { slots });
            }
        });
    });

    const refNouvelleEcurie = db.collection('ecuries').doc(nouvelleEcurieId);
    const docNouvelle = await refNouvelleEcurie.get();
    const dataNouvelle = docNouvelle.data();
    const slotsNouvelle = dataNouvelle.slots || [];

    if (slotsNouvelle[nouveauSlotIndex]) {
        return alert("Cette place est déjà prise !");
    }

    slotsNouvelle[nouveauSlotIndex] = pseudo;
    batch.update(refNouvelleEcurie, { slots: slotsNouvelle });

    batch.commit()
        .then(() => console.log("Place modifiée avec succès"))
        .catch(e => alert(e));
}

function ecouterMisesAJour() {
    db.collection('ecuries').onSnapshot(snapshot => {
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
