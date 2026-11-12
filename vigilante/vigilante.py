#!/usr/bin/env python3
"""Vigilante de PsicoApp: copia de seguridad diaria + comprobación de que la app y los datos están bien.
La service_role key se lee del Llavero del Mac (servicio «psicoapp-supabase-service»); nunca se guarda en archivos."""
import json, os, subprocess, sys, urllib.request, datetime, shutil

HOME = os.path.expanduser("~")
APP_DIR = os.path.join(HOME, "psico-app")
BACKUPS = os.path.join(HOME, "psico-app-backups")
LOG = os.path.join(APP_DIR, "vigilante", "registro.log")
APP_URL = "https://psico-app-bice.vercel.app"
JULIA = "1c862b4c-7da2-4649-bd00-68a695380148"
DIAS_A_GUARDAR = 30

def log(msg):
    linea = f"[{datetime.datetime.now():%Y-%m-%d %H:%M}] {msg}"
    print(linea)
    with open(LOG, "a") as f: f.write(linea + "\n")

def aviso(msg):
    log("AVISO: " + msg)
    subprocess.run([os.path.expanduser("~/bin/avisar"), "PsicoApp", msg])

def supabase_url():
    for l in open(os.path.join(APP_DIR, ".env.local")):
        if l.startswith("NEXT_PUBLIC_SUPABASE_URL="):
            return l.split("=", 1)[1].strip().strip('"')
    raise SystemExit("No encuentro NEXT_PUBLIC_SUPABASE_URL en .env.local")

def clave():
    r = subprocess.run(["security", "find-generic-password", "-s", "psicoapp-supabase-service", "-w"],
                       capture_output=True, text=True)
    if r.returncode != 0:
        aviso("Falta la clave de Supabase en el Llavero (psicoapp-supabase-service)")
        sys.exit(1)
    return r.stdout.strip()

def bajar(base, key, tabla):
    filas, desde, paso = [], 0, 1000
    while True:
        req = urllib.request.Request(f"{base}/rest/v1/{tabla}?select=*&order=id&offset={desde}&limit={paso}",
                                     headers={"apikey": key, "Authorization": f"Bearer {key}"})
        with urllib.request.urlopen(req, timeout=60) as r:
            lote = json.load(r)
        filas += lote
        if len(lote) < paso: return filas
        desde += paso

def main():
    os.makedirs(BACKUPS, exist_ok=True)
    # 1) ¿La web responde?
    try:
        with urllib.request.urlopen(APP_URL, timeout=30) as r:
            if r.status != 200: aviso(f"La web responde con código {r.status}")
    except Exception as e:
        aviso(f"La web no responde: {e}")

    # 2) Copia de seguridad
    base, key = supabase_url(), clave()
    datos = {t: bajar(base, key, t) for t in ("pacientes", "citas")}
    hoy = datetime.date.today().isoformat()
    destino = os.path.join(BACKUPS, hoy)
    os.makedirs(destino, exist_ok=True)
    for t, filas in datos.items():
        with open(os.path.join(destino, f"{t}.json"), "w") as f:
            json.dump(filas, f, ensure_ascii=False, indent=1)
    os.chmod(destino, 0o700)

    # 3) ¿Los datos de Julia siguen ahí? Compara con la copia anterior.
    pj = sum(1 for p in datos["pacientes"] if p.get("user_id") == JULIA)
    cj = sum(1 for c in datos["citas"] if c.get("user_id") == JULIA)
    log(f"Copia {hoy}: {len(datos['pacientes'])} pacientes y {len(datos['citas'])} citas en total; Julia: {pj} pacientes, {cj} citas")
    anteriores = sorted(d for d in os.listdir(BACKUPS) if d < hoy and os.path.isdir(os.path.join(BACKUPS, d)))
    if anteriores:
        prev = os.path.join(BACKUPS, anteriores[-1])
        try:
            ppj = sum(1 for p in json.load(open(os.path.join(prev, "pacientes.json"))) if p.get("user_id") == JULIA)
            pcj = sum(1 for c in json.load(open(os.path.join(prev, "citas.json"))) if c.get("user_id") == JULIA)
            if pj < ppj * 0.9 or cj < pcj * 0.8:
                aviso(f"Han bajado los datos de Julia: pacientes {ppj}→{pj}, citas {pcj}→{cj}. Hay copia del {anteriores[-1]}.")
        except Exception as e:
            log(f"No pude comparar con {anteriores[-1]}: {e}")
    if pj == 0:
        aviso("La cuenta de Julia tiene 0 pacientes")

    # 4) Borra copias de más de 30 días
    limite = (datetime.date.today() - datetime.timedelta(days=DIAS_A_GUARDAR)).isoformat()
    for d in anteriores:
        if d < limite: shutil.rmtree(os.path.join(BACKUPS, d), ignore_errors=True)

if __name__ == "__main__":
    main()
