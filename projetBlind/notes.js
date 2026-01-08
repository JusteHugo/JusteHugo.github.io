document.addEventListener('DOMContentLoaded', () => {
    const noteInputs = document.querySelectorAll('.note-input');
    
    noteInputs.forEach(input => {
        input.addEventListener('input', calculerMoyennes);
    });
});

function calculerMoyennes() {
    const ues = ['ue1', 'ue2', 'ue3', 'ue4', 'ue5', 'ue6'];
    // Correction : ACL(8), Algo(6), Logique(6), Réseau(6), Optim(6), Anglais(4)
    const coefficients = [8, 6, 6, 6, 6, 4]; // ACL, Algo, Logique, Réseau, Optim, Anglais
    const moyennesUE = [];
    
    ues.forEach((ue, index) => {
        let moyenneUE = null;
        
        switch(ue) {
            case 'ue1': // ACL
                moyenneUE = calculerMoyenneACL();
                break;
            case 'ue2': // Algorithmique
                moyenneUE = calculerMoyenneAlgo();
                break;
            case 'ue3': // Logique
                moyenneUE = calculerMoyenneLogique();
                break;
            case 'ue4': // Réseau
                moyenneUE = calculerMoyenneReseau();
                break;
            case 'ue5': // Optimisation Combinatoire
                moyenneUE = calculerMoyenneOptim();
                break;
            case 'ue6': // Anglais
                moyenneUE = calculerMoyenneAnglais();
                break;
        }
        
        if (moyenneUE !== null) {
            moyennesUE.push({
                moyenne: moyenneUE,
                coefficient: coefficients[index],
                matiere: ue
            });
            console.log(`${ue}: moyenne=${moyenneUE.toFixed(2)}, coef=${coefficients[index]}`); // Debug
        }
        
        afficherMoyenneUE(ue, moyenneUE);
    });
    
    // Calcul moyenne générale pondérée
    if (moyennesUE.length > 0) {
        let sommeNumerateur = 0;
        let sommeDenominateur = 0;
        
        moyennesUE.forEach(item => {
            sommeNumerateur += item.moyenne * item.coefficient;
            sommeDenominateur += item.coefficient;
        });
        
        console.log(`Numérateur: ${sommeNumerateur}, Dénominateur: ${sommeDenominateur}`); // Debug
        
        const moyenneGenerale = sommeNumerateur / sommeDenominateur;
        console.log(`Moyenne générale: ${moyenneGenerale.toFixed(2)}`); // Debug
        
        afficherMoyenneGenerale(moyenneGenerale);
        updateProgressBar(moyenneGenerale);
    } else {
        document.getElementById('moyenne-globale').innerHTML = '<span class="moyenne-value">--</span><span class="moyenne-label">/20</span>';
        document.getElementById('moyenne-globale').className = 'moyenne-result-global';
        updateProgressBar(0);
    }
}

// ACL : calculatrice(0.15) + rpg(0.15) + projet(0.21) + CT(0.49)
function calculerMoyenneACL() {
    const inputs = document.querySelectorAll('[data-ue="ue1"]');
    const notes = [];
    
    inputs.forEach(input => {
        const valeur = parseFloat(input.value);
        if (!isNaN(valeur) && valeur >= 0 && valeur <= 20) {
            notes.push(valeur);
        }
    });
    
    if (notes.length === 0) return null;
    
    // Si toutes les notes sont présentes
    if (notes.length === 4) {
        const calculatrice = notes[0] * 0.15;
        const rpg = notes[1] * 0.15;
        const projet = notes[2] * 0.21;
        const ct = notes[3] * 0.49;
        return calculatrice + rpg + projet + ct;
    }
    
    // Calcul partiel basé sur les notes disponibles
    return notes.reduce((sum, note) => sum + note, 0) / notes.length;
}

// Algorithmique : (note1 + note2 + note3)(0.3) + CT(0.7)
function calculerMoyenneAlgo() {
    const inputs = document.querySelectorAll('[data-ue="ue2"]');
    const notes = [];
    
    inputs.forEach(input => {
        const valeur = parseFloat(input.value);
        if (!isNaN(valeur) && valeur >= 0 && valeur <= 20) {
            notes.push(valeur);
        }
    });
    
    if (notes.length === 0) return null;
    
    // Si CT est présent (4ème note) et au moins une autre note
    if (notes.length >= 2 && notes[3] !== undefined) {
        const moyenneNotes123 = notes.slice(0, 3).reduce((sum, note) => sum + note, 0) / Math.min(3, notes.length - 1);
        const ct = notes[3];
        return (moyenneNotes123 * 0.3) + (ct * 0.7);
    }
    
    // Calcul simple si pas toutes les notes
    return notes.reduce((sum, note) => sum + note, 0) / notes.length;
}

// Logique : projet(0.3) + (CC1 + CT)(0.7)
function calculerMoyenneLogique() {
    const inputs = document.querySelectorAll('[data-ue="ue3"]');
    const notes = [];
    
    inputs.forEach(input => {
        const valeur = parseFloat(input.value);
        if (!isNaN(valeur) && valeur >= 0 && valeur <= 20) {
            notes.push(valeur);
        }
    });
    
    if (notes.length === 0) return null;
    
    // Si on a projet (1ère note) et CC1 + CT (2ème et 3ème notes)
    if (notes.length >= 3) {
        const projet = notes[0] * 0.3;
        const moyenneCC1_CT = ((notes[1] || 0) + (notes[2] || 0)) / 2;
        const cc1_ct_pondere = moyenneCC1_CT * 0.7;
        return projet + cc1_ct_pondere;
    }
    
    // Calcul simple si pas toutes les notes
    return notes.reduce((sum, note) => sum + note, 0) / notes.length;
}

// Réseau : CC(0.3) + CT(0.7)
function calculerMoyenneReseau() {
    const inputs = document.querySelectorAll('[data-ue="ue4"]');
    const notes = [];
    
    inputs.forEach(input => {
        const valeur = parseFloat(input.value);
        if (!isNaN(valeur) && valeur >= 0 && valeur <= 20) {
            notes.push(valeur);
        }
    });
    
    if (notes.length === 0) return null;
    
    // Si on a CC (1ère note) et CT (2ème note)
    if (notes.length >= 2) {
        const cc = notes[0] * 0.3;
        const ct = notes[1] * 0.7;
        return cc + ct;
    }
    
    // Calcul simple si une seule note
    return notes.reduce((sum, note) => sum + note, 0) / notes.length;
}

// Optimisation Combinatoire : TP(0.3) + CT(0.7)
function calculerMoyenneOptim() {
    const inputs = document.querySelectorAll('[data-ue="ue5"]');
    const notes = [];
    
    inputs.forEach(input => {
        const valeur = parseFloat(input.value);
        if (!isNaN(valeur) && valeur >= 0 && valeur <= 20) {
            notes.push(valeur);
        }
    });
    
    if (notes.length === 0) return null;
    
    // Si on a TP (1ère note) et CT (2ème note)
    if (notes.length >= 2) {
        const tp = notes[0] * 0.3;
        const ct = notes[1] * 0.7;
        return tp + ct;
    }
    
    // Calcul simple si une seule note
    return notes.reduce((sum, note) => sum + note, 0) / notes.length;
}

// Anglais : moyenne simple (pas de coefficients spécifiés)
function calculerMoyenneAnglais() {
    const inputs = document.querySelectorAll('[data-ue="ue6"]');
    const notes = [];
    
    inputs.forEach(input => {
        const valeur = parseFloat(input.value);
        if (!isNaN(valeur) && valeur >= 0 && valeur <= 20) {
            notes.push(valeur);
        }
    });
    
    if (notes.length === 0) return null;
    
    return notes.reduce((sum, note) => sum + note, 0) / notes.length;
}

function afficherMoyenneUE(ue, moyenne) {
    const element = document.getElementById(`moyenne-${ue}`);
    
    if (moyenne === null) {
        element.innerHTML = '<i class="fas fa-calculator"></i><span>Moyenne : --</span>';
        element.className = 'moyenne-result';
        return;
    }
    
    const moyenneArrondie = moyenne.toFixed(2);
    element.innerHTML = `<i class="fas fa-calculator"></i><span>Moyenne : ${moyenneArrondie}/20</span>`;
    
    // Application du code couleur
    let couleur = '';
    if (moyenne < 6) {
        couleur = 'rouge';
    } else if (moyenne < 10) {
        couleur = 'orange';
    } else {
        couleur = 'vert';
    }
    
    element.className = `moyenne-result ${couleur}`;
}

function afficherMoyenneGenerale(moyenne) {
    const element = document.getElementById('moyenne-globale');
    const moyenneArrondie = moyenne.toFixed(2);
    
    element.innerHTML = `<span class="moyenne-value">${moyenneArrondie}</span><span class="moyenne-label">/20</span>`;
    
    // Application du code couleur
    let couleur = '';
    if (moyenne < 6) {
        couleur = 'rouge';
    } else if (moyenne < 10) {
        couleur = 'orange';
    } else {
        couleur = 'vert';
    }
    
    element.className = `moyenne-result-global ${couleur}`;
}

function updateProgressBar(moyenne) {
    const progressFill = document.getElementById('progress-fill');
    const percentage = (moyenne / 20) * 100;
    progressFill.style.width = percentage + '%';
}