// ========================================
// DSA QUEST - GAME SETTINGS
// ========================================

let currentLevel = 1;
let score = 0;
let streak = 0;
let selectedAnswer = null;
let answered = false;
let completedLevels = [];
let currentQuestion = null;

// ========================================
// GET HTML ELEMENTS
// ========================================

const scoreElement = document.getElementById("score");
const streakElement = document.getElementById("streak");
const levelElement = document.getElementById("level");
const currentLevelElement = document.getElementById("currentLevel");
const difficultyElement = document.getElementById("difficulty");
const questionElement = document.getElementById("question");
const inputElement = document.getElementById("input");
const optionsElement = document.getElementById("options");
const checkButton = document.getElementById("checkBtn");
const nextButton = document.getElementById("nextBtn");
const resultElement = document.getElementById("result");
const resultTitle = document.getElementById("resultTitle");
const userAnswerElement = document.getElementById("userAnswer");
const correctAnswerElement = document.getElementById("correctAnswer");
const progressBar = document.getElementById("progressBar");
const levelsElement = document.getElementById("levels");

// ========================================
// LOAD QUESTION
// ========================================

async function loadQuestion() {
    selectedAnswer = null;
    answered = false;
    currentQuestion = null;

    checkButton.disabled = false;
    checkButton.classList.remove("hidden");
    nextButton.classList.add("hidden");
    resultElement.classList.add("hidden");

    questionElement.textContent = "Loading question...";
    optionsElement.innerHTML = "";

    try {
        const response = await fetch("/api/question?level=" + currentLevel);

        if (!response.ok) {
            throw new Error("Could not load question. Status: " + response.status);
        }

        const question = await response.json();

        if (!question.question || !Array.isArray(question.options) ||
            question.options.length !== 4) {
            throw new Error("The question must contain four options.");
        }

        currentQuestion = question;

        questionElement.textContent = question.question;
        inputElement.textContent = question.input || "No input provided";
        difficultyElement.textContent = question.difficulty || "Easy";
        levelElement.textContent = currentLevel;
        currentLevelElement.textContent = currentLevel;
        progressBar.style.width = currentLevel + "%";

        displayOptions(question.options);
        renderLevels();

    } catch (error) {
        questionElement.textContent = "Unable to load the question.";
        console.error("Question loading error:", error);
    }
}

// ========================================
// DISPLAY OPTIONS
// ========================================

function displayOptions(options) {
    optionsElement.innerHTML = "";

    options.forEach(function (option, index) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "option";
        button.textContent = String.fromCharCode(65 + index) + ". " + option;

        button.addEventListener("click", function () {
            if (answered) {
                return;
            }

            document.querySelectorAll(".option").forEach(function (item) {
                item.classList.remove("selected");
            });

            button.classList.add("selected");
            selectedAnswer = option;
        });

        optionsElement.appendChild(button);
    });
}

// ========================================
// CHECK ANSWER
// ========================================

checkButton.addEventListener("click", async function () {
    if (selectedAnswer === null) {
        alert("Please select an answer first!");
        return;
    }

    if (answered || !currentQuestion) {
        return;
    }

    checkButton.disabled = true;

    try {
        const response = await fetch("/api/check-answer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                level: currentLevel,
                answer: selectedAnswer
            })
        });

        if (!response.ok) {
            throw new Error("Could not check answer. Status: " + response.status);
        }

        const result = await response.json();

        resultElement.classList.remove("hidden");
        userAnswerElement.textContent = selectedAnswer;

        if (result.correct) {
            answered = true;

            resultTitle.textContent = "Correct! Next level unlocked!";
            correctAnswerElement.textContent =
                result.correctAnswer || selectedAnswer;

            if (!completedLevels.includes(currentLevel)) {
                completedLevels.push(currentLevel);
                score += 10;
                streak++;
            }

            document.querySelectorAll(".option").forEach(function (button) {
                button.disabled = true;
            });

            nextButton.textContent =
                currentLevel < 100 ? "Next Level →" : "Finish Game";

            nextButton.classList.remove("hidden");
            checkButton.disabled = true;

        } else {
            resultTitle.textContent = "Wrong answer! Try again.";
            correctAnswerElement.textContent =
                result.correctAnswer || "Please select another option.";

            streak = 0;
            checkButton.disabled = false;
        }

        scoreElement.textContent = score;
        streakElement.textContent = streak;

        renderLevels();

    } catch (error) {
        checkButton.disabled = false;
        console.error("Answer checking error:", error);
        alert("Unable to check your answer. Check the server terminal.");
    }
});

// ========================================
// NEXT LEVEL
// ========================================

nextButton.addEventListener("click", function () {
    if (!completedLevels.includes(currentLevel)) {
        return;
    }

    if (currentLevel < 100) {
        currentLevel++;
        loadQuestion();
    } else {
        questionElement.textContent =
            "Congratulations! You completed all 100 levels!";

        inputElement.textContent = "Game completed!";
        optionsElement.innerHTML = "";
        resultElement.classList.add("hidden");
        checkButton.classList.add("hidden");
        nextButton.classList.add("hidden");
        progressBar.style.width = "100%";

        alert(
            "Congratulations! You completed all 100 levels!\n" +
            "Final score: " + score + "/1000"
        );
    }
});

// ========================================
// DISPLAY LEVEL MAP
// ========================================

function renderLevels() {
    levelsElement.innerHTML = "";

    for (let i = 1; i <= 100; i++) {
        const levelBox = document.createElement("div");

        levelBox.className = "level";
        levelBox.textContent = i;

        if (i === currentLevel) {
            levelBox.classList.add("active");
        }

        if (completedLevels.includes(i)) {
            levelBox.classList.add("completed");
        }

        levelsElement.appendChild(levelBox);
    }
}

// ========================================
// START GAME
// ========================================

loadQuestion();