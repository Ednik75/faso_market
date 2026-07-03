#!/bin/bash
# Script de démarrage local de Market BF

echo ""
echo "🇧🇫 Démarrage de Market BF - Marketplace du Burkina Faso"
echo "=========================================================="

# Start backend
echo ""
echo "📦 Démarrage du backend (port 5000)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 2
echo "✅ Backend démarré (PID: $BACKEND_PID)"

# Start frontend
echo ""
echo "🌐 Démarrage du frontend (port 3000)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================================="
echo "✅ Market BF démarré !"
echo ""
echo "🌐 Frontend :   http://localhost:3000"
echo "🔌 API Backend: http://localhost:5000"
echo "💊 Health :     http://localhost:5000/api/health"
echo ""
echo "🇧🇫 Comptes de démonstration :"
echo "   Admin       : admin@marketbf.com      / Admin123!"
echo "   Commerçant 1: merchant1@marketbf.com  / Merchant1!"
echo "   Commerçant 2: merchant2@marketbf.com  / Merchant2!"
echo "   Client      : client@marketbf.com     / Client123!"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter"
echo "=========================================================="

trap "echo ''; echo 'Arrêt de Market BF...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
