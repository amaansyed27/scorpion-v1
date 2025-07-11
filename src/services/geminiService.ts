

import { GoogleGenAI, Type } from "@google/genai";
import { Course, FileData, GroundingStrategy, Proficiency, QuizQuestion } from '../types';

const model = 'gemini-2.5-flash';

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        // This will be caught by the calling function's try/catch block
        throw new Error("API_KEY environment variable not found.");
    }
    return new GoogleGenAI({ apiKey });
}

const courseSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A concise, engaging title for the course. Should be based on the provided content." },
        description: { type: Type.STRING, description: "A brief, one-sentence description of what the course is about." },
        sections: {
            type: Type.ARRAY,
            description: "A list of logical sections that break down the main topic.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The title of this course section." },
                    lessons: {
                        type: Type.ARRAY,
                        description: "A list of lessons within this section.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING, description: "The title of this individual lesson." }
                            },
                            required: ["title"]
                        }
                    }
                },
                required: ["title", "lessons"]
            }
        }
    },
    required: ["title", "description", "sections"]
};

const addIdsToCourse = (parsedJson: any, sources: any[] = []) => {
    let isFirstLesson = true;
    const courseWithIds: Course = {
        ...parsedJson,
        id: `course-${Date.now()}`,
        sources: sources.map((s: any) => ({ uri: s.uri, title: s.title || s.uri })),
        sections: parsedJson.sections.map((section: any, sIdx: number) => ({
            ...section,
            id: `sec-${sIdx + 1}`,
            lessons: section.lessons.map((lesson: any, lIdx: number) => {
                const status = isFirstLesson ? 'unlocked' : 'locked';
                if (isFirstLesson) {
                    isFirstLesson = false;
                }
                return {
                    ...lesson,
                    id: `l-${sIdx + 1}-${lIdx + 1}`,
                    status: status,
                };
            }),
        })),
    };
    return courseWithIds;
}

export const generateCourseOutline = async (content: string | FileData, strategy: GroundingStrategy): Promise<Course> => {
    const ai = getClient();
    let prompt;
    let contents: any;

    if (typeof content === 'string') {
        prompt = `You are an expert instructional designer.
        ${strategy === GroundingStrategy.STRICT
                ? "Based *strictly* on the following content, create a structured learning course outline."
                : "Using the following content as a primary reference, and augmenting with your general knowledge on the topic, create a structured learning course outline."
            }
        Break the content down into logical sections, and each section into specific, actionable lesson topics. The structure should be easy to follow for a beginner.
        
        Content:
        ---
        ${content}
        ---
        
        Generate a course title, a short description, and the sections with their respective lesson titles.`;
        contents = prompt;
    } else { // FileData
        prompt = `You are an expert instructional designer.
        ${strategy === GroundingStrategy.STRICT
                ? "Based *strictly* on the attached document, create a structured learning course outline."
                : "Using the attached document as a primary reference, and augmenting with your general knowledge, create a structured learning course outline."
            }
        Analyze the document and break its content down into logical sections, and each section into specific, actionable lesson topics. The structure should be easy to follow for a beginner.
        Generate a course title, a short description, and the sections with their respective lesson titles.`;

        contents = {
            parts: [
                { text: prompt },
                { inlineData: { mimeType: content.mimeType, data: content.data } }
            ]
        };
    }

    if (strategy === GroundingStrategy.GROUNDED) {
        // The GROUNDED strategy expects a simple string prompt. We will use the text prompt for this.
        const groundedPrompt = typeof content === 'string' ? `You are an expert instructional designer tasked with creating a course outline.
Use Google Search to find up-to-date and relevant information based on the user's provided content.
The user's content is:
---
${content}
---
Based on your search results and the provided context, generate a course outline.` : `You are an expert instructional designer tasked with creating a course outline.
Use Google Search to find up-to-date and relevant information based on the topic of the attached document.
Based on your search results and an analysis of the document, generate a course outline.`;

        const finalGroundedContents = typeof content !== 'string'
            ? { parts: [{ text: groundedPrompt }, { inlineData: { mimeType: content.mimeType, data: content.data } }] }
            : groundedPrompt;


        const response = await ai.models.generateContent({
            model,
            contents: finalGroundedContents,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        if (!response.text) {
            console.error("AI response for GROUNDED is empty. Full response:", response);
            throw new Error("The AI returned an empty response for the grounded search.");
        }

        const rawText = response.text;
        const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
        if (!jsonMatch || !jsonMatch[1]) {
            console.error("Raw AI response for GROUNDED:", rawText);
            throw new Error("Failed to parse course structure from AI response. The response was not valid JSON.");
        }
        try {
            const parsedJson = JSON.parse(jsonMatch[1]);
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
                ?.map((chunk: any) => chunk.web)
                .filter((web: any) => web?.uri) || [];

            return addIdsToCourse(parsedJson, sources);
        } catch (e) {
            console.error("Failed to parse JSON from AI response for GROUNDED. Raw text:", jsonMatch[1]);
            throw new Error("The AI returned a response that was not valid JSON. Please try again.");
        }

    } else { // STRICT or GENERAL
        const response = await ai.models.generateContent({
            model,
            contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: courseSchema,
            },
        });

        if (!response.candidates || response.candidates.length === 0 || !response.text) {
            console.error("AI response was blocked or empty. Full response:", response);
            const blockReason = response.promptFeedback?.blockReason;
            const reason = blockReason ? `Reason: ${blockReason}.` : 'This may be due to content safety filters or an invalid request.';
            throw new Error(`The AI returned an empty or blocked response. ${reason}`);
        }

        const jsonText = response.text.trim();
        try {
            const parsedJson = JSON.parse(jsonText);
            return addIdsToCourse(parsedJson);
        } catch (e) {
            console.error("Failed to parse JSON from AI response. Raw text:", jsonText);
            throw new Error("The AI returned a response that was not valid JSON. Please try again.");
        }
    }
};

const lessonSchema = {
    type: Type.OBJECT,
    properties: {
        lessonPart: { type: Type.STRING, description: "The educational text for the lesson, between 150 and 250 words. It MUST include a concrete, real-world, applicative example of the concept." },
        quiz: {
            type: Type.ARRAY,
            description: "A list of 2 multiple-choice quiz questions designed to test the application of the lesson's concepts. At least one question should be based on the real-world example provided in the lessonPart.",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "The application-based question text." },
                    options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 4 possible answers." },
                    correctAnswer: { type: Type.STRING, description: "The correct answer from the options list." }
                },
                required: ["question", "options", "correctAnswer"]
            }
        }
    },
    required: ["lessonPart", "quiz"]
};

export const generateLessonContent = async (lessonTitle: string, courseTitle: string, proficiency: Proficiency): Promise<{ lessonPart: string; quiz: QuizQuestion[] }> => {
    const ai = getClient();
    const proficiencyInstruction = {
        'new': "The user is new to this topic. Explain it from the basics.",
        'struggling': "The user is struggling with this topic. Re-explain it simply, perhaps with a different analogy, and make the quiz questions slightly easier to build confidence.",
        'proficient': "The user is proficient. You can be a bit more concise and dive into more detail. The quiz can be a bit more challenging.",
        'mastered': "The user has mastered this. This is a review. Briefly summarize the key points."
    }[proficiency];

    const prompt = `You are an expert teacher creating content for a lesson titled "${lessonTitle}" within the course "${courseTitle}".
    The user's proficiency is: ${proficiency}. ${proficiencyInstruction}

    Your task is to generate a lesson part and a quiz.

    1.  **Lesson Content**: Explain the core concept of "${lessonTitle}". Your explanation MUST include a concrete, real-world or practical application example of the concept to help with understanding. Keep the total text between 150 and 250 words.

    2.  **Application-Based Quiz**: Create a quiz with 2 multiple-choice questions. These questions must test the user's ability to APPLY the concept, not just recall facts. At least one question should be directly based on the practical example you provided in the lesson content.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: lessonSchema,
        }
    });

    if (!response.text) {
        console.error("AI lesson generation failed. Full response:", response);
        throw new Error("The AI returned an empty response while generating the lesson.");
    }

    const jsonText = response.text.trim();
    try {
        const parsedJson = JSON.parse(jsonText);

        const isQuizValid =
            Array.isArray(parsedJson.quiz) &&
            parsedJson.quiz.length > 0 &&
            parsedJson.quiz.every((q: any) =>
                q &&
                typeof q.question === 'string' && q.question.length > 0 &&
                Array.isArray(q.options) && q.options.length > 1 &&
                typeof q.correctAnswer === 'string' && q.correctAnswer.length > 0 &&
                q.options.includes(q.correctAnswer)
            );

        if (!parsedJson.lessonPart || !isQuizValid) {
            console.error("AI lesson response is missing required fields or quiz is invalid. Raw JSON:", parsedJson);
            throw new Error("The AI returned an invalid lesson structure. It's missing content or a valid quiz.");
        }

        const quizWithIds = parsedJson.quiz.map((q: any, index: number) => ({
            ...q,
            id: `q-${Date.now()}-${index}`
        }));

        return { lessonPart: parsedJson.lessonPart, quiz: quizWithIds };
    } catch (e) {
        console.error("Failed to parse JSON from AI lesson response. Raw text:", jsonText, "Error:", e);
        if (e instanceof SyntaxError) {
            throw new Error("The AI returned a response that was not valid JSON.");
        }
        throw e; // rethrow other errors
    }
};

export const askQuestionAboutLesson = async (question: string, lessonContent: string): Promise<string> => {
    const ai = getClient();
    const prompt = `You are a helpful teaching assistant. A student is studying the following text:
    ---
    ${lessonContent}
    ---
    The student asked this question: "${question}"
    
    Answer the question based *only* on the provided text. If the answer is not in the text, say "I can't answer that based on the provided lesson material." Keep your answer concise and helpful.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 0 } // For faster response
        }
    });

    return response.text || '';
};