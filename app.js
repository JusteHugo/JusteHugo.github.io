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



function afficherBoutonAdmin() {
  const pseudo = localStorage.getItem("auth");
  const role = localStorage.getItem("role");
  const btn = document.getElementById("btnDemarrerChrono");

  if (role === "admin") {
    btn.style.display = "inline-block";
  }
}


document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear(); // 🔄 Efface toutes les infos (auth, rôle, etc.)
  location.reload();     // 🔃 Recharge la page pour repartir propre
});


// 🚦 Création dynamique du bouton si "auth" = "jules"
const utilisateur = localStorage.getItem("auth");

if (utilisateur === "Jules") {
  console.log("🚦 Chrono démarré !");
  if (!document.getElementById("btnDemarrerChrono")) {
    const btn = document.createElement("button");
    btn.textContent = "🚦 Démarrer la course";
    btn.id = "btnDemarrerChrono";
    btn.style.marginTop = "20px";
    btn.style.display = "inline-block";

    btn.addEventListener("click", () => {
      console.log("🚦 Chrono démarré !");
      const now = firebase.firestore.Timestamp.now();
      firebase.firestore().collection("Config").doc("chronoGlobal").update({ start: firebase.firestore.Timestamp.now() });
    });

    document.getElementById("aideBox").appendChild(btn);
  }
}

const btn = document.getElementById("btnDemarrerChrono");
if (btn) {
  btn.addEventListener("click", () => {
    console.log("Re-cliquer sur le bouton");
    const now = firebase.firestore.Timestamp.now();
    firebase.firestore().collection("Config").doc("chronoGlobal").set({ start: now });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn").addEventListener("click", async () => {

    const mdp = document.getElementById("mdp").value.trim();

    demarrerCompteRebours();

    if (!mdp) {
      alert("Entre un mot de passe.");
      return;
    }

    try {
      const comptes = await db.collection("Comptes").get();

      let accèsValidé = false;
      let utilisateurConnecté = null;
      let roleUtilisateur = null;

      comptes.forEach(doc => {
        const data = doc.data();

        if (data.Mdp === mdp) {
          utilisateurConnecté = doc.id;
          roleUtilisateur = data.role || "participant";
          localStorage.setItem("auth", utilisateurConnecté);
          localStorage.setItem("role", roleUtilisateur);
          accèsValidé = true;
        }
      });

      if (accèsValidé) {

        // 💥 Redirection spécifique pour CheckPoints
        if (utilisateurConnecté === "CheckPoints") {
          setTimeout(() => {
            window.location.href = "checkpoint/checkpoint1.html";
          }, 100); // ⏱️ délai court pour garantir le stockage
          return;
        }

        // 🏁 Redirection classique
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("ecuriesSection").style.display = "block";
        initialiserSlots();
        ecouterMisesAJour();

        if (roleUtilisateur === "admin") {
          afficherBoutonAdmin(utilisateurConnecté);
          demarrerCompteRebours();
        }

        if (roleUtilisateur === "spectateur") {
          activerModeSpectateur();
          
        }

      } else {
        console.warn("❌ Mot de passe invalide");
        alert("Mot de passe invalide.");
      }

    } catch (e) {
      console.error("💥 Erreur de connexion :", e.message);
      alert("Erreur de connexion : " + e.message);
    }
  });
});


document.addEventListener("DOMContentLoaded", () => {
  // Déjà présent : ton login "normal"

  // 🎯 Nouveau : accès spectateur
  document.getElementById("spectateurLoginBtn").addEventListener("click", () => {


    // Stocker le mode spectateur
    localStorage.setItem("auth", "spectateur");
    localStorage.setItem("role", "spectateur");

    // Masquer la section login et afficher le reste
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("ecuriesSection").style.display = "block";

    // Activer le mode spectateur
    activerModeSpectateur();
    demarrerCompteRebours();

    // Lancer l'écoute et affichage (lecture uniquement)
    ecouterMisesAJour();
  });
});



function activerModeSpectateur() {
  document.querySelectorAll('.slot').forEach(slot => {
    slot.style.pointerEvents = "none";
    slot.style.opacity = "0.6"; // effet visuel
  });

  const upload = document.getElementById('photoUpload');
  const retirerBtn = document.getElementById('retirerPlaceBtn');
  const adminPanel = document.getElementById('adminPanel');

  if (upload) upload.style.display = "none";
  if (retirerBtn) retirerBtn.style.display = "none";
  if (adminPanel) adminPanel.style.display = "none";

  if (!document.querySelector('.spectateurBadge')) {
  const badge = document.createElement('div');
  badge.textContent = "👀 Mode spectateur activé";
  badge.classList.add('spectateurBadge');
  document.getElementById('ecuriesSection').prepend(badge);
}
}


function initialiserSlots() {
  document.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const pseudo = localStorage.getItem("auth"); // 🔐 pseudo = nom du compte connecté
      if (!pseudo) return alert("Connectez-vous");

      const ecurieId = slot.closest('.ecurie').dataset.id;
      const index = slot.dataset.index;

      changerDePlace(ecurieId, index, pseudo);
    });
  });
}

async function changerDePlace(nouvelleEcurieId, nouveauSlotIndex, pseudo) {
  const batch = db.batch();
  const role = localStorage.getItem("role");
  if (role === "spectateur") return alert("Le mode spectateur ne permet pas cette action.");


  let slotDejaPris = false;
  let refNouvelleEcurie = null;
  let slotsNouvelle = [];

  const snapshot = await db.collection('Ecuries').get();

  snapshot.forEach(doc => {
    const ref = db.collection('Ecuries').doc(doc.id);
    const data = doc.data();
    const slots = [...(data.slots || [])]; // clone défensif

    // 🔄 Libérer l’ancienne place
    slots.forEach((nom, index) => {
      if (nom === pseudo) {
        slots[index] = "";
      }
    });

    // 📦 Capture nouvelle écurie
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

  // ✅ Réserve le slot
  slotsNouvelle[nouveauSlotIndex] = pseudo;
  batch.update(refNouvelleEcurie, { slots: slotsNouvelle });

  try {
    await batch.commit();
  } catch (e) {
    alert("Erreur : " + e.message);
  }
}



document.querySelectorAll('.slot').forEach(slot => {
  slot.addEventListener('contextmenu', async (e) => {
    e.preventDefault();

    const nomDansSlot = slot.textContent;
    const pseudo = localStorage.getItem("auth"); // 👈 récupère le nom du compte

    if (nomDansSlot !== pseudo) return; // ne supprime que sa propre place

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
      }
    } catch (err) {
      alert("Erreur suppression : " + err.message);
    }
  });
});


document.getElementById('retirerPlaceBtn').addEventListener('click', async () => {
  const pseudo = localStorage.getItem("auth"); // 👈 nom du compte connecté
  const role = localStorage.getItem("role");
  if (role === "spectateur") return alert("Le mode spectateur ne permet pas cette action.");


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

function demarrerCompteRebours() {
  const cible = new Date("2025-08-09T14:00:00"); // 9 août à 14h

  const chronoDiv = document.getElementById("compteRebours");
  if (!chronoDiv) return;

  function majChrono() {
    const maintenant = new Date();
    const diff = cible - maintenant;

    if (diff <= 0) {
      chronoDiv.textContent = "🚦 La course a commencé !";
      clearInterval(timer);
      return;
    }

    const jours = Math.floor(diff / (1000 * 60 * 60 * 24));
    const heures = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const secondes = Math.floor((diff / 1000) % 60);

    chronoDiv.textContent = `⏳ Départ dans : ${jours}j ${heures}h ${minutes}m ${secondes}s`;
  }

  majChrono(); // première mise à jour instantanée
  const timer = setInterval(majChrono, 1000); // mise à jour toutes les secondes
}

/*
function afficherBoutonChronoSiAdmin() {
  const pseudo = localStorage.getItem("auth");
  const role = localStorage.getItem("role");
  const btn = document.getElementById("demarrerChronoBtn");

  if (btn && pseudo === "jules" && role === "admin") {
    btn.style.display = "inline-block";
  }
}
*/


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

      const pseudo = localStorage.getItem("auth");


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
