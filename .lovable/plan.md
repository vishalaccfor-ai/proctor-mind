

# Online Examination Platform — MVP Plan

## 1. App Layout & Navigation
- Create a clean app shell with sidebar navigation
- Pages: Home/Dashboard, Available Exams, Take Exam, Results, Analytics
- Neutral color theme with high readability

## 2. Demo Auth & Role System
- Mock login screen with role selection (Student / Admin)
- Store current user/role in React context
- Route guards: admin-only pages, student-only pages

## 3. Admin: Exam Builder
- Form to create exams with: title, description, duration, marking scheme (positive/negative marks)
- Add subjects and topics dynamically (not hardcoded)
- Add MCQ questions with: question text, 4 options, correct answer, difficulty level, subject/topic tags
- Store all exam data in local state (React context or Zustand)

## 4. Student: Exam List & Selection
- Browse available exams with key details (duration, total questions, subjects)
- Start exam button leading to the exam interface

## 5. Exam Engine (Core Feature)
- **Distraction-free fullscreen UI** with countdown timer
- **Question navigation panel** — numbered grid showing answered/unanswered/marked-for-review
- **Section-wise navigation** by subject
- **Mark for review** toggle on each question
- **Auto-submit on timeout**
- **Auto-save** answers to local storage every few seconds
- **Question & option shuffle** (configurable per exam)
- **Prevent right-click, copy, and refresh** with warning dialogs
- **Tab switch detection** with warning counter
- Clean, minimal interface — no distractions

## 6. Scoring & Instant Results
- Calculate score based on exam's marking scheme
- Results summary card showing:
  - Total score, percentage
  - Correct / Incorrect / Unattempted counts
  - Section-wise accuracy breakdown
  - Time spent per section and per question

## 7. Analytics Dashboard
- **Subject-wise bar chart** (accuracy per subject)
- **Strength/weakness summary** based on accuracy thresholds
- **Time efficiency indicators**
- Mock AI study plan section (placeholder text, ready for real AI later)
- All charts built with Recharts (already installed)

## 8. Sample Data
- Pre-load 2-3 sample exams with diverse subjects (e.g., General Knowledge, Reasoning, English) to demonstrate the platform works out of the box

