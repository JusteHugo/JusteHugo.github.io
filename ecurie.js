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

function getLastCheckpointIndex(arrivees) {
  // Trouve le dernier index non vide
  for (let i = arrivees.length - 1; i >= 0; i--) {
    if (arrivees[i]) return i;
  }
  return -1; // Pas encore parti
}

function afficherIcônesEcuries() {
  db.collection("Ecuries").onSnapshot(snapshot => {
    const iconsDiv = document.getElementById("ecurie-icons");
    iconsDiv.innerHTML = "";

    const piles = [0, 0, 0, 0, 0];

    Array.from(snapshot.docs).forEach((doc, index) => {
      const data = doc.data();
      const nom = data.nomAffiche || doc.id;
      const arrivees = data.arrivees || ["", "", "", "", ""];

      const lastCp = getLastCheckpointIndex(arrivees);

      const iconeFile = `ecurie${index + 1}.jpg`;

      const icon = document.createElement("img");
      icon.src = "icons/" + iconeFile;
      icon.alt = nom;
      icon.title = nom;
      icon.className = "ecurie-icon";
      icon.style.position = "absolute";
      icon.style.height = "60px";

      const cpElem = document.getElementById(`cp${lastCp + 1}`) || document.getElementById("cp1");
      const pileIndex = Math.max(0, lastCp);
      const decalage = piles[pileIndex] * 45;
      piles[pileIndex]++;

      const trackRect = iconsDiv.parentElement.getBoundingClientRect();
      const cpRect = cpElem.getBoundingClientRect();
      icon.style.left = (cpRect.left - trackRect.left + (cpElem.offsetWidth / 2) - 20) + "px"; // 20 = moitié largeur icône
      icon.style.top = (50 + decalage) + "px";

      iconsDiv.appendChild(icon);
    });
    iconsDiv.style.position = "relative";
    iconsDiv.style.height = "300px";
  });
}

document.addEventListener("DOMContentLoaded", afficherIcônesEcuries);

function formatTime(ms) {
  if (!ms || isNaN(ms)) return "";
  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function afficherTableauEquipes() {
  db.collection("Ecuries").onSnapshot(snapshot => {
    const tbody = document.getElementById("team-table-body");
    tbody.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const nom = data.nomAffiche || doc.id;
      const arrivees = data.arrivees || ["", "", "", "", ""];

      const tr = document.createElement("tr");
      // Colonne équipe
      const tdNom = document.createElement("td");
      tdNom.textContent = nom;
      tr.appendChild(tdNom);

      // Colonnes checkpoints
      for (let i = 0; i < 5; i++) {
        const td = document.createElement("td");
        const val = arrivees[i];
        if (val) {
          try {
            const obj = JSON.parse(val);
            td.textContent = formatTime(obj.time);
          } catch {
            td.textContent = val;
          }
        } else {
          td.textContent = "-";
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
  });
}

document.addEventListener("DOMContentLoaded", afficherTableauEquipes);
