#!/bin/bash

# ComproScan AR - Startup Script Unificado
# Este script levanta simultáneamente el Frontend y Backend.

echo "========================================================"
echo "🚀 Iniciando ComproScan AR (MVP) en modo Local"
echo "========================================================"

# Función para cerrar ambos servidores cuando el usuario presiona Ctrl+C
trap 'echo "\n🛑 Deteniendo los servicios..."; kill $(jobs -p) 2>/dev/null; echo "✅ Apagado completo."; exit 0' SIGINT SIGTERM

echo "📦 1/2. Encendiendo Backend Intelligence (FastAPI + Pydantic)..."
cd backend || exit
# Activamos el entorno virtual e iniciamos uvicorn en segundo plano
source venv/bin/activate 
uvicorn main:app --host 127.0.0.1 --port 8000 &
cd ..

echo "🎨 2/2. Encendiendo Frontend Modern Corporate (React + Vite)..."
cd frontend || exit
# Iniciamos el entorno frontend en segundo plano
npm run dev -- --port 5173  > /dev/null &
cd ..

sleep 2 # Pequeña demora para asegurar que los puertos levanten

echo ""
echo "✅ ¡Todos los sistemas operando al 100%!"
echo "========================================================"
echo "🌐 Interfaz de Usuario (Subir Facturas): http://localhost:5173"
echo "⚙️  Motor API y Exportación:              http://localhost:8000"
echo "📘 Documentación API y Reglas (Swagger): http://localhost:8000/docs"
echo "========================================================"
echo "💡 TIP: Revisa haber modificado frontend/.env y backend/.env con tu API Key"
echo "Para cerrar todo el sistema de manera segura, presiona Ctrl + C"

# Mantener el script vivo escuchando los procesos de fondo
wait
