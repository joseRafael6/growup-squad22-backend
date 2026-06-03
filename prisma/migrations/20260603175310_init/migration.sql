-- DropForeignKey
ALTER TABLE "alternatives" DROP CONSTRAINT "alternatives_questionId_fkey";

-- DropForeignKey
ALTER TABLE "company_quiz_questions" DROP CONSTRAINT "company_quiz_questions_question_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz_session_questions" DROP CONSTRAINT "quiz_session_questions_questionId_fkey";

-- AddForeignKey
ALTER TABLE "company_quiz_questions" ADD CONSTRAINT "company_quiz_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alternatives" ADD CONSTRAINT "alternatives_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_session_questions" ADD CONSTRAINT "quiz_session_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
