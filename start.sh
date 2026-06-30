#!/bin/sh
# Tight JVM flags so six JVMs fit in as little RAM as possible.
JAVA_OPTS="-XX:TieredStopAtLevel=1 -XX:+UseSerialGC -Xss512k -Xmx96m -Xms32m"

echo "Starting API gateway on port ${PORT:-8089} first to satisfy Render port scan..."
java -XX:TieredStopAtLevel=1 -XX:+UseSerialGC -Xss512k -Xmx128m -Xms48m \
  -jar api-gateway.jar --server.port=${PORT:-8089} &

# Give the gateway a 5 second head-start to bind the port
sleep 5

echo "Starting backend microservices..."
java $JAVA_OPTS -jar auth-service.jar     --server.port=8081 &
java $JAVA_OPTS -jar product-service.jar  --server.port=8082 &
java $JAVA_OPTS -jar cart-service.jar     --server.port=8083 &
java $JAVA_OPTS -jar order-service.jar    --server.port=8084 &

# Start the last service in the foreground (exec) so the container stays alive
echo "Starting payment-service..."
exec java $JAVA_OPTS -jar payment-service.jar  --server.port=8085
