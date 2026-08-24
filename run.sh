#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Setup JDK 21 Home
if [ -d "$DIR/backend/.jdk" ]; then
  JDK_DIR=$(find "$DIR/backend/.jdk" -name "Home" -type d | head -1)
  if [ -n "$JDK_DIR" ]; then
    export JAVA_HOME="$JDK_DIR"
    export PATH="$JAVA_HOME/bin:$PATH"
  fi
fi

# Setup Maven
if [ -d "$DIR/backend/apache-maven-3.9.6" ]; then
  export PATH="$DIR/backend/apache-maven-3.9.6/bin:$PATH"
fi

echo "=================================================="
echo " Starting Healthcare Appointment & Follow-up Manager"
echo "=================================================="
echo "Using Java: $(java -version 2>&1 | head -1)"
echo "Using Maven: $(mvn -version 2>&1 | head -1)"
echo ""

# Start Backend in background
echo "-> Starting Spring Boot Backend on http://localhost:8080..."
cd "$DIR/backend"
mvn spring-boot:run &
BACKEND_PID=$!

# Start Frontend
echo "-> Starting Frontend Vite Server on http://localhost:5173..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

echo ""
echo "App is ready:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8080"
echo "  Swagger:  http://localhost:8080/swagger-ui.html"
echo ""

wait
