import requests
import time

TARGETS = {
    "Localhost": "http://localhost:8000/health",
    "Render (Producao)": "https://sharkrank-api.onrender.com/health"
}

def check_status():
    print(f"\n--- SharkRank Health Check ({time.strftime('%H:%M:%S')}) ---")
    for name, url in TARGETS.items():
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"[ONLINE] {name}: ({url})")
            else:
                print(f"[ERRO {response.status_code}] {name}: ({url})")
        except requests.exceptions.ConnectionError:
            print(f"[OFFLINE] {name}: (Conexao Recusada)")
        except Exception as e:
            print(f"[FALHA] {name}: ({str(e)})")

if __name__ == "__main__":
    check_status()
