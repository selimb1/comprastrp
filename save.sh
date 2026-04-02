#!/bin/bash

# ============================================================
#  ComproScan — Guardar Proyecto en GitHub
#  Uso: ./save.sh [mensaje de commit opcional]
# ============================================================

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # Sin color

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  💾 ComproScan — Guardando proyecto en GitHub  ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Verificar que hay cambios para guardar
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo -e "${YELLOW}⚠️  No hay cambios nuevos para guardar.${NC}"
  exit 0
fi

# Mostrar archivos modificados
echo -e "\n${YELLOW}📄 Archivos con cambios:${NC}"
git status --short

# Mensaje de commit: usar argumento o generar automático con fecha
if [ -n "$1" ]; then
  COMMIT_MSG="$1"
else
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
  COMMIT_MSG="chore: guardar progreso — $TIMESTAMP"
fi

echo -e "\n${YELLOW}📝 Mensaje de commit:${NC} $COMMIT_MSG"

# Agregar todos los cambios
git add -A

# Hacer commit
git commit -m "$COMMIT_MSG"

# Push a GitHub
echo -e "\n${YELLOW}🚀 Subiendo a GitHub...${NC}"
git push origin main

echo -e "\n${GREEN}✅ Proyecto guardado exitosamente en GitHub!${NC}"
echo -e "${GREEN}   Repositorio: https://github.com/selimb1/comprastrp${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
