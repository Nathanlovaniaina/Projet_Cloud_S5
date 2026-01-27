param(
    [string]$Pbf = "madagascar-260123.osm.pbf",
    [string]$Out = "maps_data/antananarivo.mbtiles"
)

if (-not (Test-Path $Pbf)) {
    Write-Error "Fichier PBF introuvable: $Pbf. Placez-le à la racine du repo ou ajustez le paramètre."
    exit 1
}

Write-Host "Génération du MBTiles à partir de $Pbf → $Out (via Docker tilemaker)"

# Exécute tilemaker dans un conteneur Docker. Le répertoire courant sera monté en /data.
# Utilise une configuration minimale fournie dans ./scripts/tilemaker_conf pour éviter
# la nécessité de shapefiles coastline/landcover.
docker run --rm -v ${PWD}:/data stadtnavi/tilemaker /data/$Pbf --output /data/$Out --config /data/scripts/tilemaker_conf/config.json --process /data/scripts/tilemaker_conf/process.lua

if ($LASTEXITCODE -eq 0) {
    Write-Host "MBTiles généré: $Out"
} else {
    Write-Error "La génération a échoué. Vérifiez les logs du conteneur Docker."
}
