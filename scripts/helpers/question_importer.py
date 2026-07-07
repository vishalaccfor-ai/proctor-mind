from helpers.database import (
    get_or_create_subject,
    get_or_create_chapter,
    get_or_create_exam,
    insert_question,
    question_exists,
    map_question_to_exam,
)

from helpers.logger import (
    info,
    success,
    warning,
    error,
)

from helpers.json_reader import (
    get_subject as json_subject,
    get_chapter as json_chapter,
    get_questions,
)


def convert_options(options: dict):

    return [
        {
            "id": key,
            "text": value,
        }
        for key, value in options.items()
    ]


def build_payload(
    question: dict,
    exam_id: str,
    subject_id: str,
    chapter_id: str,
):

   def build_payload(
    question: dict,
    exam_id: str,
    subject_id: str,
    chapter_id: str,
):

    difficulty = question.get(
        "difficulty",
        "Medium",
    ).strip().lower()

    difficulty_map = {
        "easy": "easy",
        "medium": "medium",
        "hard": "hard",
        "challenging": "hard",
    }

    difficulty = difficulty_map.get(
        difficulty,
        "medium",
    )

    return {
        "exam_id": exam_id,
        "subject_id": subject_id,
        "chapter_id": chapter_id,
        "topic_id": None,
        "text": question["question"],
        "options": convert_options(
            question["options"]
        ),
        "correct_option_id": question["correct_option"],
        "difficulty": difficulty,
        "sort_order": question["id"],
        "image_url": None,
        "explanation": question.get(
            "explanation"
        ),
        "incorrect_option_explanations": question.get(
            "incorrect_option_explanations",
            {},
        ),
        "concept": question.get(
            "concept"
        ),
        "estimated_time_seconds": question.get(
            "estimated_time_seconds",
            45,
        ),
        "question_type": question.get(
            "question_type",
            "Conceptual",
        ),
    }


def import_file(
    data: dict,
    created_by: str,
    summary,
):

    subject = get_or_create_subject(
        json_subject(data)
    )

    chapter = get_or_create_chapter(
        subject["id"],
        json_chapter(data),
    )

    exam = get_or_create_exam(
        title=f"{json_chapter(data)} Practice",
        description=f"{json_chapter(data)} Question Bank",
        created_by=created_by,
    )

    questions = get_questions(data)

    info(
        f"Importing {len(questions)} questions..."
    )

    summary.questions += len(questions)

    for question in questions:

        try:

            duplicate = question_exists(
                exam["id"],
                question["question"],
            )

            if duplicate:

                summary.duplicates += 1

                warning(
                    f"Duplicate skipped : Q{question['id']}"
                )

                continue

            payload = build_payload(
                question=question,
                exam_id=exam["id"],
                subject_id=subject["id"],
                chapter_id=chapter["id"],
            )

            created_question = insert_question(
                payload
            )

            map_question_to_exam(
                exam["id"],
                created_question["id"],
                question["id"],
            )

            summary.imported += 1

            success(
                f"Imported Q{question['id']}"
            )

        except Exception as ex:

            summary.failed += 1

            error(
                f"Q{question.get('id')} : {ex}"
            )

    info(
        f"Completed : {json_chapter(data)}"
    )