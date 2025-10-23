# Proyecto SISEN PAS5

![CodeQL](https://github.com/Henrysp/sisen_pas5/actions/workflows/security-scan.yml/badge.svg)
![Gitleaks](https://github.com/Henrysp/sisen_pas5/actions/workflows/gitleaks.yml/badge.svg)
![Semgrep](https://github.com/Henrysp/sisen_pas5/actions/workflows/semgrep.yml/badge.svg)


# sisen_pas5
//PARA AGRAGAR ARCHIVO DE SEGURIDAD
//Crear la estructura
mkdir -p .github/workflows

//Crear el archivo del workflow
notepad .github/workflows/security-scan.yml

//Verifica que existe
ls .github/workflows
repuesta: security-scan.yml

//Agregar y subir a GitHub
git add .github/workflows/security-scan.yml
git commit -m "Agrego workflow de seguridad CodeQL"
git push origin main
