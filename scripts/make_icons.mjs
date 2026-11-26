import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public', { recursive: true })

// Fondo índigo a sangre completa y dibujo dentro de la zona segura (80 % central),
// así sirve para ícono normal y para ícono "maskable" de Android.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#4f46e5"/>
  <rect x="146" y="170" width="220" height="196" rx="28" fill="#ffffff"/>
  <rect x="146" y="170" width="220" height="56" rx="28" fill="#e0e7ff"/>
  <rect x="146" y="198" width="220" height="28" fill="#e0e7ff"/>
  <rect x="198" y="140" width="24" height="52" rx="12" fill="#ffffff"/>
  <rect x="290" y="140" width="24" height="52" rx="12" fill="#ffffff"/>
  <path d="M206 292 l36 36 l68 -70" fill="none" stroke="#4f46e5" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

const targets = [
  ['pwa-192.png', 192],
  ['pwa-512.png', 512],
  ['apple-touch-icon.png', 180],
]

for (const [name, size] of targets) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/${name}`)
  console.log('creado public/' + name)
}