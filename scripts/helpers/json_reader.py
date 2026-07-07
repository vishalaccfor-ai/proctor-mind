import json
from pathlib import Path


SUPPORTED_EXTENSIONS = [".json"]


def find_json_files(question_bank: Path) -> list[Path]:
    """
    Recursively find all JSON files.
    """

    files = []

    for ext in SUPPORTED_EXTENSIONS:
        files.extend(question_bank.rglob(f"*{ext}"))

    files = sorted(files)

    return files


def load_json(path: Path) -> dict | None:
    """
    Safely load JSON file.
    Returns None if file is invalid.
    """

    try:

        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    except Exception as e:

        print(f"\nERROR : {path}")
        print(e)

        return None


def get_subject(data: dict) -> str:
    """
    Physics
    Chemistry
    Mathematics
    Biology
    """

    return data.get("subject", "").strip()


def get_grade(data: dict) -> str:
    """
    Supports both old and new schema.
    """

    return (
        data.get("grade")
        or data.get("standard")
        or ""
    )


def get_chapter(data: dict) -> str:

    return data.get("chapter", "").strip()


def get_questions(data: dict) -> list:

    return data.get("questions", [])


def print_file_summary(path: Path, data: dict):

    print("\n" + "=" * 70)

    print(path.name)

    print("=" * 70)

    print(f"Subject   : {get_subject(data)}")
    print(f"Grade     : {get_grade(data)}")
    print(f"Chapter   : {get_chapter(data)}")
    print(f"Questions : {len(get_questions(data))}")


def validate_json(data: dict) -> tuple[bool, str]:
    """
    Basic validation before import.
    """

    if not data:
        return False, "Empty JSON"

    if "subject" not in data:
        return False, "Missing subject"

    if "chapter" not in data:
        return False, "Missing chapter"

    if "questions" not in data:
        return False, "Missing questions"

    if not isinstance(data["questions"], list):
        return False, "Questions must be list"

    if len(data["questions"]) == 0:
        return False, "No questions"

    return True, ""