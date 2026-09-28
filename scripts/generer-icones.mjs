// Génère les icônes PNG de l'app (ligne ECG blanche sur fond violet), sans dépendance.
// Usage : node scripts/generer-icones.mjs  → écrit dans public/
import { writeFileSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';

const VIOLET = [0x6a, 0x55, 0xb5];
const BLANC = [0xff, 0xff, 0xff];
// Tracé ECG du canvas, dans une grille 24×24 : M3 12 h4 l2-5 l4 10 l2-5 h6
const ECG = [[3, 12], [7, 12], [9, 7], [13, 17], [15, 12], [21, 12]];

function distanceSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * @param taille  côté en pixels
 * @param echelle part du côté occupée par la grille 24×24 du tracé
 * @param rayon   rayon des coins du fond (fraction du côté) ; 0 = fond plein (icône « maskable »)
 */
function dessiner(taille, echelle, rayon) {
  const SS = 4; // sur-échantillonnage 4×4 pour l'anticrénelage
  const cote = taille * echelle, origine = (taille - cote) / 2, unite = cote / 24;
  const trait = 2.2 * unite; // épaisseur du trait
  const r = rayon * taille;
  const pixels = Buffer.alloc(taille * taille * 4);

  for (let y = 0; y < taille; y++) {
    for (let x = 0; x < taille; x++) {
      let fond = 0, ligne = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS, py = y + (sy + 0.5) / SS;
          // Fond : carré aux coins arrondis
          const cx = Math.max(r - px, 0, px - (taille - r)), cy = Math.max(r - py, 0, py - (taille - r));
          if (r === 0 || Math.hypot(cx, cy) <= r) fond++;
          else continue;
          // Tracé : distance au segment le plus proche (coins et extrémités arrondis)
          const gx = (px - origine) / unite, gy = (py - origine) / unite;
          let d = Infinity;
          for (let i = 0; i < ECG.length - 1; i++) d = Math.min(d, distanceSegment(gx, gy, ECG[i], ECG[i + 1]));
          if (d * unite <= trait / 2) ligne++;
        }
      }
      const n = SS * SS, a = fond / n, l = ligne / Math.max(fond, 1);
      const o = (y * taille + x) * 4;
      for (let c = 0; c < 3; c++) pixels[o + c] = Math.round(VIOLET[c] * (1 - l) + BLANC[c] * l);
      pixels[o + 3] = Math.round(a * 255);
    }
  }
  return png(taille, taille, pixels);
}

function bloc(type, donnees) {
  const longueur = Buffer.alloc(4);
  longueur.writeUInt32BE(donnees.length);
  const corps = Buffer.concat([Buffer.from(type, 'ascii'), donnees]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corps));
  return Buffer.concat([longueur, corps, crc]);
}

function png(largeur, hauteur, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largeur, 0);
  ihdr.writeUInt32BE(hauteur, 4);
  ihdr[8] = 8; // 8 bits par canal
  ihdr[9] = 6; // RGBA
  const lignes = Buffer.alloc((largeur * 4 + 1) * hauteur);
  for (let y = 0; y < hauteur; y++) rgba.copy(lignes, y * (largeur * 4 + 1) + 1, y * largeur * 4, (y + 1) * largeur * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloc('IHDR', ihdr),
    bloc('IDAT', deflateSync(lignes, { level: 9 })),
    bloc('IEND', Buffer.alloc(0)),
  ]);
}

const sortie = new URL('../public/', import.meta.url);
const icones = [
  ['pwa-192x192.png', 192, 0.62, 0.22],
  ['pwa-512x512.png', 512, 0.62, 0.22],
  ['maskable-512x512.png', 512, 0.5, 0], // zone de sécurité : tracé dans les 80 % centraux
  ['apple-touch-icon.png', 180, 0.56, 0], // iOS arrondit lui-même
  ['favicon.png', 64, 0.72, 0.22],
];
for (const [nom, taille, echelle, rayon] of icones) {
  writeFileSync(new URL(nom, sortie), dessiner(taille, echelle, rayon));
  console.log(`✓ public/${nom}`);
}
