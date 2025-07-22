const firebaseConfig = {
    apiKey: "AIzaSyBaWatcA83qeeStPCwwq4HMOQ6UwGqBWIc",
    authDomain: "madmax2-20cb7.firebaseapp.com",
    projectId: "madmax2-20cb7",
    storageBucket: "madmax2-20cb7.appspot.com",
    messagingSenderId: "267124909744",
    appId: "1:267124909744:web:339a485c4599556e07bd75"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/*
if (localStorage.getItem("auth") !== "CheckPoints") {
  window.location.href = "login.html"; // ou autre page de sécurité
}
*/

let chronoStart = null;

// Chrono affichage
function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function startChrono() {
  chronoStart = Date.now();
  setInterval(() => {
    document.getElementById("chrono").textContent = formatTime(Date.now() - chronoStart);
  }, 1000);
}

// Appelle ceci quand l’admin déclenche :
// startChrono();

function afficherEcurie(nomAffiche, id) {
  const container = document.getElementById("ecurie-noms");
  const div = document.createElement("div");
  div.className = "team";

  const titre = document.createElement("h2");
  titre.textContent = nomAffiche;

  const buttons = document.createElement("div");
  buttons.className = "buttons";

  const arriveBtn = document.createElement("button");
  arriveBtn.className = "arrived-btn";
  arriveBtn.textContent = "✔️ Arrivée";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "cancel-btn";
  cancelBtn.textContent = "❌ Annuler";

  const timeInfo = document.createElement("div");
  timeInfo.className = "time-stamp";

  // Index du checkpoint (ex: 2 pour checkpoint 3)
  const checkpointIndex = 0; // À adapter dynamiquement si besoin

  // Récupère la valeur déjà enregistrée (si elle existe)
  db.collection("Ecuries").doc(id).get().then(docSnap => {
    const arrivees = docSnap.data().arrivees || ["", "", "", "", ""];
    const val = arrivees[checkpointIndex];
    if (val) {
      try {
        const obj = JSON.parse(val);
        timeInfo.textContent = formatTime(obj.time);
      } catch {
        timeInfo.textContent = val;
      }
    } else {
      timeInfo.textContent = "---";
    }
  });

  arriveBtn.addEventListener("click", async () => {
    if (chronoGlobalStart) {
      const now = new Date();
      const ms = now - chronoGlobalStart;
      timeInfo.textContent = formatTime(ms);

      try {
        const docRef = db.collection("Ecuries").doc(id);
        const docSnap = await docRef.get();
        let arrivees = docSnap.data().arrivees || ["", "", "", "", ""];
        arrivees[checkpointIndex] = JSON.stringify({
          time: ms,
          horodatage: firebase.firestore.Timestamp.fromDate(now).toDate()
        });
        await docRef.update({ arrivees });
      } catch (e) {
        alert("Erreur enregistrement arrivée : " + e.message);
      }
    } else {
      timeInfo.textContent = "⏱️ Non démarré";
    }
  });

    cancelBtn.addEventListener("click", async () => {
    console.log("Annulation pour", id, "checkpoint", checkpointIndex);
    timeInfo.textContent = "---";

    try {
      const docRef = db.collection("Ecuries").doc(id);
      const docSnap = await docRef.get();

      let arrivees = docSnap.data().arrivees || ["", "", "", "", ""];

      // ⚠️ Remplace la valeur à l’index donné
      arrivees[checkpointIndex] = "";

      console.log("Tableau modifié :", arrivees);

      // 🔄 Utilise `set` avec `{ merge: true }` pour forcer Firestore à mettre à jour
      console.log("Valeur envoyée à Firestore :", JSON.stringify(arrivees));
      await docRef.set({ arrivees }, { merge: true });

      console.log("Suppression enregistrée.");

    } catch (e) {
      alert("Erreur lors de la suppression du chrono : " + e.message);
    }
  });




  buttons.appendChild(arriveBtn);
  buttons.appendChild(cancelBtn);

  

  div.appendChild(titre);
  div.appendChild(buttons);
  div.appendChild(timeInfo);

  container.appendChild(div);
}

function chargerEcuries() {
  db.collection("Ecuries").onSnapshot(snapshot => {
    const container = document.getElementById("ecurie-noms");
    container.innerHTML = ""; // Clear before redraw
    snapshot.forEach(doc => {
      const data = doc.data();
      const nom = data.nomAffiche || doc.id;
      afficherEcurie(nom, doc.id);
    });
  });
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

let chronoGlobalStart = null; // Ajoute cette variable globale

function afficherChronoGlobal() {
  const chronoDiv = document.getElementById("chrono");
  firebase.firestore().collection("Config").doc("chronoGlobal")
    .onSnapshot(doc => {
      const data = doc.data();
      if (data && data.start) {
        chronoGlobalStart = data.start.toDate(); // <-- Stocke la date de départ globale
        function majChrono() {
          const now = new Date();
          const diff = now - chronoGlobalStart;
          chronoDiv.textContent = formatTime(diff);
        }
        majChrono();
        if (window._chronoInterval) clearInterval(window._chronoInterval);
        window._chronoInterval = setInterval(majChrono, 1000);
      } else {
        chronoDiv.textContent = "00:00:00";
        chronoGlobalStart = null; // Pas de chrono global
        if (window._chronoInterval) clearInterval(window._chronoInterval);
      }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    afficherChronoGlobal();
  chargerEcuries();
});
