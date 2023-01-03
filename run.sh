cd webChat-login-api
docker-compose build
docker-compose up -d
cd ..

cd webChat-management-api
docker-compose build
docker-compose up -d
cd ..

cd webChat-production-server
docker-compose build
docker-compose up -d
cd ..

cd webChat-server
docker-compose build
docker-compose up -d
cd ..