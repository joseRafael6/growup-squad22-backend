-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "quiz_sessions" ADD COLUMN     "company_quiz_id" UUID,
ADD COLUMN     "ranking_scope" TEXT NOT NULL DEFAULT 'global';

-- CreateTable
CREATE TABLE "company_quizzes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_quiz_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_quiz_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,

    CONSTRAINT "company_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_quiz_questions_company_quiz_id_question_id_key" ON "company_quiz_questions"("company_quiz_id", "question_id");

-- AddForeignKey
ALTER TABLE "company_quizzes" ADD CONSTRAINT "company_quizzes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_quiz_questions" ADD CONSTRAINT "company_quiz_questions_company_quiz_id_fkey" FOREIGN KEY ("company_quiz_id") REFERENCES "company_quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_quiz_questions" ADD CONSTRAINT "company_quiz_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_company_quiz_id_fkey" FOREIGN KEY ("company_quiz_id") REFERENCES "company_quizzes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
