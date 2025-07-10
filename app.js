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



const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    firebase.auth().signOut().then(() => {
      document.getElementById('ecuriesSection').style.display = 'none';
      document.getElementById('loginSection').style.display = 'block';

      const track = document.getElementById('track');
      if (track) track.style.display = 'block';
    }).catch(error => {
      alert("Erreur lors de la déconnexion : " + error.message);
    });
  });
}

function modifierNomEcurie(ecurieId) {
  const input = document.getElementById(`editNom-${ecurieId}`);
  const nouveauNom = input.value.trim();

  if (!nouveauNom) {
    alert("Le nom ne peut pas être vide.");
    return;
  }

  db.collection('Ecuries').doc(ecurieId).update({
    nomAffiche: nouveauNom
  }).then(() => {
    alert("Nom d’écurie mis à jour !");
  }).catch((err) => {
    console.error("Erreur lors de la mise à jour :", err);
  });
}


function ecouterMisesAJour() {
  db.collection('Ecuries').onSnapshot(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const slots = data.slots || [];
      const ecurieId = doc.id;

      const ecurieDiv = document.querySelector(`.ecurie[data-id="${ecurieId}"]`);
      const nomAffiche = data.nomAffiche || ecurieId;
      const titre = ecurieDiv.querySelector('.ecurieNom');
      if (titre) {
        titre.textContent = nomAffiche;
      }

      if (!ecurieDiv) return;

      const pseudo = utilisateur?.email?.split('@')[0];

      slots.forEach((nom, index) => {
        const slot = ecurieDiv.querySelector(`.slot[data-index="${index}"]`);
        if (!slot) return;

        const ancienContenu = slot.innerHTML;
        let nouveauContenu;

        if (nom) {
          // 👤 Si c'est le pilote connecté
          if (nom === pseudo) {
            const imagePerso = localStorage.getItem('photoPerso');

            nouveauContenu = `
              <div class="slotContent">
                ${imagePerso ? `<img src="${imagePerso}" class="slotAvatar" />` : ''}
                <span>${nom}</span>
              </div>
            `;
            slot.innerHTML = nouveauContenu;
          } else {
            // 🧍 Autre pilote, simple nom
            slot.textContent = nom;
          }

          slot.classList.add('occupe');
        } else {
          // 🆓 Slot libre
          slot.textContent = `Place ${index + 1}`;
          slot.classList.remove('occupe');
        }

        // 🎯 Classe "moi"
        slot.classList.toggle('moi', nom === pseudo);

        // 💥 Animation flash si contenu modifié
        if (slot.innerHTML !== ancienContenu) {
          slot.classList.add('flash');
          setTimeout(() => slot.classList.remove('flash'), 600);
        }
      });

      const editBox = ecurieDiv.querySelector('.editEcurieNom');
      if (editBox) {
        const estPilote1 = slots[0] === pseudo;
        editBox.style.display = estPilote1 ? 'block' : 'none';
      }


      // 🏁 Écurie complète ? Affiche le drapeau animé
      const estComplete = slots.every(nom => !!nom);
      const flag = ecurieDiv.querySelector('.flag');
      if (flag) {
        flag.style.display = estComplete ? 'block' : 'none';
        if (estComplete) {
          flag.classList.remove('fadeBounce');
          void flag.offsetWidth;
          flag.classList.add('fadeBounce');
        }
      }
    });
  });
}
