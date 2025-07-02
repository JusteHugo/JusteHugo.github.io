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
    const pseudo = utilisateur.email.split('@')[0];
    const batch = db.batch();

    const snapshot = await db.collection('Ecuries').get();

    let slotDejaPris = false;

    snapshot.forEach(doc => {
        const ref = db.collection('Ecuries').doc(doc.id);
        const data = doc.data();
        const slots = data.slots || [];

        // Si quelqu'un occupe déjà le slot ciblé et ce n'est pas moi
        if (doc.id === nouvelleEcurieId && slots[nouveauSlotIndex] && slots[nouveauSlotIndex] !== pseudo) {
            slotDejaPris = true;
        }

        // Libérer mon ancienne place, dans n'importe quelle écurie
        slots.forEach((nom, index) => {
            if (nom === pseudo) {
                slots[index] = "";
            }
        });

        batch.update(ref, { slots });
    });

    if (slotDejaPris) {
        return alert("Cette place est déjà prise !");
    }

    // Maintenant, je me positionne dans le nouveau slot
    const refNouvelleEcurie = db.collection('Ecuries').doc(nouvelleEcurieId);
    const docNouvelle = await refNouvelleEcurie.get();
    const dataNouvelle = docNouvelle.data();
    const slotsNouvelle = dataNouvelle.slots || [];

    slotsNouvelle[nouveauSlotIndex] = pseudo;
    batch.update(refNouvelleEcurie, { slots: slotsNouvelle });

    try {
        await batch.commit();
        console.log("Place modifiée avec succès !");
    } catch (e) {
        alert("Erreur : " + e.message);
    }
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
