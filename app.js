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

    let slotDejaPris = false;
    let refNouvelleEcurie = null;
    let slotsNouvelle = [];

    const snapshot = await db.collection('Ecuries').get();

    snapshot.forEach(doc => {
        const ref = db.collection('Ecuries').doc(doc.id);
        const data = doc.data();
        const slots = [...(data.slots || [])]; // on clone les slots pour éviter de muter l'original

        // Libérer l’ancienne place
        slots.forEach((nom, index) => {
            if (nom === pseudo) {
                slots[index] = "";
            }
        });

        // Capture la référence et slots de la nouvelle écurie
        if (doc.id === nouvelleEcurieId) {
            if (slots[nouveauSlotIndex] && slots[nouveauSlotIndex] !== pseudo) {
                slotDejaPris = true;
            }
            refNouvelleEcurie = ref;
            slotsNouvelle = slots;
        }

        batch.update(ref, { slots });
    });

    if (slotDejaPris) {
        return alert("Cette place est déjà prise !");
    }

    // Mettre à jour le slot choisi
    slotsNouvelle[nouveauSlotIndex] = pseudo;
    batch.update(refNouvelleEcurie, { slots: slotsNouvelle });

    try {
        await batch.commit();
        console.log("Slot mis à jour !");
    } catch (e) {
        alert("Erreur : " + e.message);
    }
}


document.querySelectorAll('.slot').forEach(slot => {
  slot.addEventListener('contextmenu', async (e) => {
    e.preventDefault();

    const nomDansSlot = slot.textContent;
    const pseudo = utilisateur?.email.split('@')[0];

    if (nomDansSlot !== pseudo) return; // ne supprime que si c'est son propre nom

    const ecurieId = slot.closest('.ecurie').dataset.id;
    const index = slot.dataset.index;

    try {
      const ref = db.collection('Ecuries').doc(ecurieId);
      const doc = await ref.get();
      const data = doc.data();
      const slots = data.slots || [];

      if (slots[index] === pseudo) {
        slots[index] = "";
        await ref.update({ slots });
        console.log("Place supprimée !");
      }
    } catch (err) {
      alert("Erreur suppression : " + err.message);
    }
  });
});

document.getElementById('retirerPlaceBtn').addEventListener('click', async () => {
  const pseudo = utilisateur?.email.split('@')[0];

  const snapshot = await db.collection('Ecuries').get();

  const batch = db.batch();
  let slotTrouve = false;

  snapshot.forEach(doc => {
    const ref = db.collection('Ecuries').doc(doc.id);
    const data = doc.data();
    const slots = data.slots || [];

    slots.forEach((nom, index) => {
      if (nom === pseudo) {
        slots[index] = "";
        slotTrouve = true;
      }
    });

    batch.update(ref, { slots });
  });

  if (slotTrouve) {
    await batch.commit();
    console.log("Place retirée !");
  } else {
    alert("Aucune place trouvée à retirer.");
  }
});






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
