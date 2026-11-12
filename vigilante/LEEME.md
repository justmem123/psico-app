# Vigilante de PsicoApp

`vigilante.py` hace, cada día:
1. Comprueba que https://psico-app-bice.vercel.app responde.
2. Copia `pacientes` y `citas` de Supabase a `~/psico-app-backups/AAAA-MM-DD/` (se guardan 30 días; carpeta solo legible por Mourad).
3. Compara los datos de Julia con la copia anterior y avisa (notificación del Mac) si bajan de golpe o llegan a 0.

Registro: `vigilante/registro.log`. Copia manual: `python3 ~/psico-app/vigilante/vigilante.py`.

La service_role key NO está en ningún archivo: se guarda en el Llavero del Mac con el servicio
`psicoapp-supabase-service`. Para guardarla o cambiarla (en tu Terminal):
    security add-generic-password -U -a mourad -s psicoapp-supabase-service -w
(te pide la clave sin mostrarla; está en Supabase → Project Settings → API → service_role).
