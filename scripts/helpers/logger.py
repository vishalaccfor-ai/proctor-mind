from pathlib import Path
from datetime import datetime

from config import PROJECT_ROOT

# ==========================================================
# LOG DIRECTORY
# ==========================================================

LOG_DIR = PROJECT_ROOT / "scripts" / "logs"

LOG_DIR.mkdir(parents=True, exist_ok=True)

IMPORT_LOG = LOG_DIR / "import.log"

ERROR_LOG = LOG_DIR / "error.log"


# ==========================================================
# TIME
# ==========================================================

def now():

    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# ==========================================================
# LOG WRITER
# ==========================================================

def write(path: Path, message: str):

    with open(path, "a", encoding="utf-8") as f:

        f.write(message + "\n")


# ==========================================================
# INFO
# ==========================================================

def info(message: str):

    line = f"[{now()}] INFO : {message}"

    print(line)

    write(IMPORT_LOG, line)


# ==========================================================
# SUCCESS
# ==========================================================

def success(message: str):

    line = f"[{now()}] SUCCESS : {message}"

    print(line)

    write(IMPORT_LOG, line)


# ==========================================================
# WARNING
# ==========================================================

def warning(message: str):

    line = f"[{now()}] WARNING : {message}"

    print(line)

    write(IMPORT_LOG, line)


# ==========================================================
# ERROR
# ==========================================================

def error(message: str):

    line = f"[{now()}] ERROR : {message}"

    print(line)

    write(ERROR_LOG, line)


# ==========================================================
# IMPORT SUMMARY
# ==========================================================

class ImportSummary:

    def __init__(self):

        self.files = 0
        self.questions = 0

        self.imported = 0

        self.duplicates = 0

        self.failed = 0

        self.skipped = 0

    def print(self):

        print()

        print("=" * 70)

        print("IMPORT SUMMARY")

        print("=" * 70)

        print(f"Files       : {self.files}")
        print(f"Questions   : {self.questions}")
        print(f"Imported    : {self.imported}")
        print(f"Duplicates  : {self.duplicates}")
        print(f"Skipped     : {self.skipped}")
        print(f"Failed      : {self.failed}")

        print("=" * 70)