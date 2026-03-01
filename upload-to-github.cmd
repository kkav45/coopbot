@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   🤖 BotBuilder - Загрузка на GitHub
echo ========================================
echo.

:: Проверяем наличие git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git не найден! Установите Git: https://git-scm.com/
    pause
    exit /b 1
)

echo ✅ Git найден
echo.

:: Инициализация репозитория если нужно
if not exist ".git" (
    echo 📦 Инициализация git репозитория...
    git init
    echo.
)

:: Настройка пользователя
git config user.email "kkav45@example.com" >nul 2>&1
git config user.name "kkav45" >nul 2>&1

:: Добавление всех файлов
echo 📝 Добавление файлов...
git add .
echo.

:: Коммит
echo 💾 Создание коммита...
git commit -m "🤖 BotBuilder: No-Code конструктор Telegram ботов" >nul 2>&1 || echo   (коммит не создан - файлы уже закоммичены)
echo.

:: Переименование ветки
git branch -M main >nul 2>&1

:: Проверка remote
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔗 Добавление удалённого репозитория...
    git remote add origin https://github.com/kkav45/coopbot.git
)
echo.

echo ========================================
echo   ⚠️ ВНИМАНИЕ: Требуется токен GitHub
echo ========================================
echo.
echo 1. Откройте: https://github.com/settings/tokens
echo 2. Создайте токен с правами: repo
echo 3. Скопируйте токен
echo.

set /p GITHUB_TOKEN="Вставьте ваш GitHub токен: "

if "%GITHUB_TOKEN%"=="" (
    echo.
    echo ❌ Токен не введён!
    pause
    exit /b 1
)

echo.
echo 🚀 Загрузка на GitHub...
echo.

:: Создаём URL с токеном для push
set PUSH_URL=https://kkav45:%GITHUB_TOKEN%@github.com/kkav45/coopbot.git

:: Push
git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   ✅ УСПЕШНО! Файлы загружены на GitHub
    echo ========================================
    echo.
    echo 📁 Репозиторий: https://github.com/kkav45/coopbot
    echo.
    echo 📌 СЛЕДУЮЩИЙ ШАГ:
    echo    Добавьте секрет GH_PAT в GitHub:
    echo    https://github.com/kkav45/coopbot/settings/secrets/actions
    echo.
) else (
    echo.
    echo ========================================
    echo   ❌ ОШИБКА при загрузке
    echo ========================================
    echo.
    echo Проверьте:
    echo   - Токен действителен
    echo   - Репозиторий существует
    echo   - У токена есть права repo
    echo.
)

:: Очищаем токен из переменных
set GITHUB_TOKEN=
set PUSH_URL=

pause
