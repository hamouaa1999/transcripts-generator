const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require("path");
const cors = require('cors');
const multer = require("multer");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();
const openai = new OpenAI({ apiKey: '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' });

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define your routes
app.get('/', (req, res) => {
    return res.json({ name: "Hamou" });
});

app.get("/vision", async (req, res) => {
    res.status(200).json({ name: "Hamou Ait Abderrahim" });
});

app.post("/generate-transcript", upload.single("file"), async (req, res) => {
    const uploadDir = path.join(__dirname, "uploads");
    const uploadPath = path.join(uploadDir, req.file.originalname);

    try {
        // Ensure the directory exists
        await fs.promises.mkdir(uploadDir, { recursive: true });

        // Save the file to the file system
        await fs.promises.writeFile(uploadPath, req.file.buffer);
        console.log("File saved at:", uploadPath);

        // Process the file with OpenAI API
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(uploadPath),
            model: "whisper-1",
        });

        console.log(transcription.text);

        // Delete the file after processing
        await fs.promises.unlink(uploadPath);
        console.log("File deleted:", uploadPath);

        // Send the response back to the client
        res.json({ transcript: transcription.text });

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: "An error occurred during the process" });
    }
});

// Load SSL certificate and key
const sslOptions = {
    key: fs.readFileSync('./private.key'),
    cert: fs.readFileSync('./certificate.crt')
};

// Start HTTPS server
https.createServer(sslOptions, app).listen(3005, () => {
    console.log('HTTPS Server listening on port 3005');
});
