from config import supabase


# ==========================================================
# SUBJECTS
# ==========================================================

def get_or_create_subject(name: str):

    result = (
        supabase.table("subjects")
        .select("*")
        .eq("name", name)
        .limit(1)
        .execute()
    )

    if result.data:
        return result.data[0]

    created = (
        supabase.table("subjects")
        .insert(
            {
                "name": name
            }
        )
        .execute()
    )

    return created.data[0]


# ==========================================================
# CHAPTERS
# ==========================================================

def get_or_create_chapter(subject_id: str, chapter_name: str):

    result = (
        supabase.table("chapters")
        .select("*")
        .eq("subject_id", subject_id)
        .eq("name", chapter_name)
        .limit(1)
        .execute()
    )

    if result.data:
        return result.data[0]

    created = (
        supabase.table("chapters")
        .insert(
            {
                "subject_id": subject_id,
                "name": chapter_name,
                "sort_order": 0
            }
        )
        .execute()
    )

    return created.data[0]


# ==========================================================
# EXAMS
# ==========================================================

def get_or_create_exam(
    title: str,
    description: str,
    created_by: str,
):

    result = (
        supabase.table("exams")
        .select("*")
        .eq("title", title)
        .limit(1)
        .execute()
    )

    if result.data:
        return result.data[0]

    created = (
        supabase.table("exams")
        .insert(
            {
                "title": title,
                "description": description,
                "duration": 180,
                "marking_correct": 1,
                "marking_incorrect": 0,
                "marking_unattempted": 0,
                "shuffle_questions": True,
                "shuffle_options": True,
                "is_published": False,
                "created_by": created_by,
            }
        )
        .execute()
    )

    return created.data[0]


# ==========================================================
# DUPLICATE CHECK
# ==========================================================

def question_exists(exam_id: str, question_text: str):

    result = (
        supabase.table("questions")
        .select("id")
        .eq("exam_id", exam_id)
        .eq("text", question_text)
        .limit(1)
        .execute()
    )

    if result.data:
        return result.data[0]

    return None


# ==========================================================
# INSERT QUESTION
# ==========================================================

def insert_question(payload: dict):

    created = (
        supabase.table("questions")
        .insert(payload)
        .execute()
    )

    return created.data[0]


# ==========================================================
# MAP QUESTION
# ==========================================================

def map_question_to_exam(
    exam_id: str,
    question_id: str,
    sort_order: int,
):

    exists = (
        supabase.table("exam_questions")
        .select("id")
        .eq("exam_id", exam_id)
        .eq("question_id", question_id)
        .limit(1)
        .execute()
    )

    if exists.data:
        return

    (
        supabase.table("exam_questions")
        .insert(
            {
                "exam_id": exam_id,
                "question_id": question_id,
                "sort_order": sort_order,
            }
        )
        .execute()
    )