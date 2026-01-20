@echo off
echo Cleaning old Allure reports...
if exist reports\allure-results rmdir /s /q reports\allure-results
if exist reports\allure-report rmdir /s /q reports\allure-report

echo Running tests...
set TEST_ENV=qa
npx playwright test --headed

echo Generating Allure report...
allure generate reports/allure-results -o reports/allure-report --clean

echo Opening Allure report...
allure open reports/allure-report
