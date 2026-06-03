-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT,
    "clerkId" TEXT,
    "role" TEXT DEFAULT 'user',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "text" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "timeLimitSeconds" INTEGER NOT NULL,
    "quizId" TEXT NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alternatives" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "questionId" UUID NOT NULL,

    CONSTRAINT "alternatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quizId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "startTime" TIMESTAMPTZ(6) NOT NULL,
    "endTime" TIMESTAMPTZ(6),
    "score" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "quiz_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_session_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "alternativeId" UUID,
    "isCorrect" BOOLEAN,
    "answeredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_session_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_clerkid" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_session_questions_sessionId_questionId_key" ON "quiz_session_questions"("sessionId", "questionId");

-- AddForeignKey
ALTER TABLE "alternatives" ADD CONSTRAINT "alternatives_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_session_questions" ADD CONSTRAINT "quiz_session_questions_alternativeId_fkey" FOREIGN KEY ("alternativeId") REFERENCES "alternatives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_session_questions" ADD CONSTRAINT "quiz_session_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_session_questions" ADD CONSTRAINT "quiz_session_questions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "quiz_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
