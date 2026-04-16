@echo off
setlocal

for /f "delims=" %%a in ('node -p "require('./package.json').name"') do set PACKAGE_NAME=%%a

if "%PACKAGE_NAME%"=="" (
  echo Error: Could not read package name from package.json
  exit /b 1
)

echo Deploying %PACKAGE_NAME%...

echo Building the node...
call npm run build
if %errorlevel% neq 0 (
  echo Build failed!
  exit /b %errorlevel%
)

echo Copying files to Docker volume dashboard_n8n_data...
docker run --rm -v dashboard_n8n_data:/n8n_data -v "%cd%":/source alpine sh -c "rm -rf /n8n_data/nodes/node_modules/%PACKAGE_NAME% && mkdir -p /n8n_data/nodes/node_modules/%PACKAGE_NAME% && cp -a /source/dist /n8n_data/nodes/node_modules/%PACKAGE_NAME%/ && cp -a /source/icons /n8n_data/nodes/node_modules/%PACKAGE_NAME%/ && cp /source/package.json /n8n_data/nodes/node_modules/%PACKAGE_NAME%/ && rm -rf /n8n_data/node_modules/%PACKAGE_NAME% && mkdir -p /n8n_data/node_modules/%PACKAGE_NAME% && cp -a /source/dist /n8n_data/node_modules/%PACKAGE_NAME%/ && cp -a /source/icons /n8n_data/node_modules/%PACKAGE_NAME%/ && cp /source/package.json /n8n_data/node_modules/%PACKAGE_NAME%/"

echo Deployment completed successfully.

echo Restarting n8n container...
docker container restart n8n

echo Tailing logs...
docker logs -f n8n --tail 100
