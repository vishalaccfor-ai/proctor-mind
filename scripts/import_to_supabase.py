from tqdm import tqdm

from config import QUESTION_BANK

from helpers.json_reader import (
    find_json_files,
    load_json,
    validate_json,
    print_file_summary,
)

from helpers.logger import (
    ImportSummary,
    info,
    warning,
)

from helpers.question_importer import (
    import_file,
)

# ==========================================================
# CHANGE THIS
# ==========================================================

CREATED_BY = "b84874ce-04f4-4f7e-829c-a7ff72a52544"

# ==========================================================
# MAIN
# ==========================================================

def main():

    print()
    print("=" * 70)
    print("QUESTION BANK IMPORTER")
    print("=" * 70)

    summary = ImportSummary()

    json_files = find_json_files(QUESTION_BANK)

    summary.files = len(json_files)

    info(f"Found {len(json_files)} JSON files")

    if len(json_files) == 0:

        warning("No JSON files found.")

        return

    for json_file in tqdm(json_files):

        data = load_json(json_file)

        if data is None:

            summary.failed += 1

            continue

        valid, message = validate_json(data)

        if not valid:

            summary.skipped += 1

            warning(
                f"{json_file.name} : {message}"
            )

            continue

        print_file_summary(
            json_file,
            data,
        )

        import_file(
            data=data,
            created_by=CREATED_BY,
            summary=summary,
        )

    summary.print()


# ==========================================================
# ENTRY
# ==========================================================

if __name__ == "__main__":

    main()