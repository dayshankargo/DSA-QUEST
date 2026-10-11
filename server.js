const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

const dataPath = path.join(__dirname, "data", "questions.json");
const publicPath = path.join(__dirname, "public");

let questions = [];

try {
    const fileData = fs.readFileSync(dataPath, "utf8");
    questions = JSON.parse(fileData);
    console.log("Questions loaded successfully!");
} catch (error) {
    console.error("Error loading questions.json:", error.message);
    process.exit(1);
}

const server = http.createServer((req, res) => {
    console.log("Request:", req.method, req.url);

    // Get a question
    if (req.method === "GET" && req.url.startsWith("/api/question")) {
        const url = new URL(req.url, "http://localhost:3000");
        const level = Number(url.searchParams.get("level"));

        const question = questions.find(q => Number(q.level) === level);

        if (!question) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Question not found" }));
            return;
        }

        const safeQuestion = {
            level: question.level,
            question: question.question,
            input: question.input,
            options: question.options,
            difficulty: question.difficulty
        };

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(safeQuestion));
        return;
    }

    // Check the submitted answer
    if (req.method === "POST" && req.url === "/api/check-answer") {
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            try {
                const submitted = JSON.parse(body);
                const level = Number(submitted.level);
                const userAnswer = String(submitted.answer).trim();

                const question = questions.find(
                    q => Number(q.level) === level
                );

                if (!question) {
                    res.writeHead(404, {
                        "Content-Type": "application/json"
                    });
                    res.end(JSON.stringify({
                        error: "Question not found"
                    }));
                    return;
                }

                const correctAnswer = String(question.answer).trim();
                const isCorrect = userAnswer === correctAnswer;

                res.writeHead(200, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    correct: isCorrect,
                    message: isCorrect
                        ? "Correct answer! Well done!"
                        : "Wrong answer! Try again!",
                    correctAnswer: isCorrect ? correctAnswer : null,
                    nextLevel: isCorrect ? level + 1 : level
                }));

            } catch (error) {
                res.writeHead(400, {
                    "Content-Type": "application/json"
                });
                res.end(JSON.stringify({
                    error: "Invalid request data"
                }));
            }
        });

        return;
    }

    // Display the website
    let requestedPath = new URL(
        req.url,
        "http://localhost:3000"
    ).pathname;

    if (requestedPath === "/") {
        requestedPath = "/index.html";
    }

    const filePath = path.resolve(
        publicPath,
        "." + decodeURIComponent(requestedPath)
    );

    if (!filePath.startsWith(publicPath + path.sep)) {
        res.writeHead(403);
        res.end("Access denied");
        return;
    }

    const extension = path.extname(filePath).toLowerCase();

    const contentTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon"
    };

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("File not found: " + requestedPath);
            return;
        }

        res.writeHead(200, {
            "Content-Type": contentTypes[extension] ||
                "application/octet-stream"
        });

        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log("DSA Quest server is running!");
    console.log("Open: http://localhost:" + PORT);
});