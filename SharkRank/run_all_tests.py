"""
SharkRank -- Script Master de Testes
=====================================
Roda TODA a suite de testes do sistema com um unico comando:

    python run_all_tests.py

Cobertura:
  1. Backend: Unitarios (Motor ELO) + API (Endpoints) + E2E (Happy Path)
  2. Interface: Testes visuais Playwright (requer Expo rodando em localhost:8081)

Diretriz: QAEngineer.md
"""

import subprocess
import sys


def run(label, cmd, cwd):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")
    result = subprocess.run(cmd, cwd=cwd, shell=True)
    if result.returncode != 0:
        print(f"\n  [FALHA] {label}")
        return False
    print(f"\n  [OK] {label}")
    return True


def main():
    results = {}

    # 1. Backend Tests
    results["Backend (26 testes)"] = run(
        "BACKEND: Unitarios + API + Happy Path",
        "pytest tests/ -v",
        r"C:\PROJETOS\SharkRank\backend"
    )

    # 2. Interface Tests (Playwright)
    results["Interface (Playwright)"] = run(
        "INTERFACE: Testes Visuais E2E (Playwright)",
        "pytest test_ui.py -v --headed",
        r"C:\PROJETOS\SharkRank\e2e"
    )

    # Resumo
    print(f"\n{'='*60}")
    print(f"  RESUMO FINAL")
    print(f"{'='*60}")
    all_passed = True
    for name, passed in results.items():
        status = "[OK]" if passed else "[FALHA]"
        print(f"  {status} {name}")
        if not passed:
            all_passed = False

    if all_passed:
        print(f"\n  [SHARK] Todos os testes passaram! Sistema blindado.")
    else:
        print(f"\n  [ALERTA] Alguns testes falharam. Revise acima.")
        sys.exit(1)


if __name__ == "__main__":
    main()
