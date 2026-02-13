@echo off
setlocal
set NODE_ENV=production
set DATABASE_URL=postgresql://carrerzone_user:WjhkOSs3qwIfxntDun5bFZaXsdcyBoPN@dpg-d5ted0lactks73a5tcb0-a.virginia-postgres.render.com/carrerzone
node "%~dp0prod-db-check.js"
endlocal
