const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require("path");
const cors = require('cors');
const multer = require("multer");
const bodyParser = require("body-parser");
const OpenAI = require("openai");
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const openai = new OpenAI({ apiKey: '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' });

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const os = require('os');
const tempDir = os.tmpdir();

function detectSilence(audioFilePath, silenceThreshold = -50, callback) {
    const tempFilePath = path.join(tempDir, 'temp_output.wav');

    ffmpeg(audioFilePath)
        .audioFilters('volumedetect')
        .on('error', function(err) {
            console.log('Error: ' + err.message);
            callback(err, null);
        })
        .on('end', function(stdout, stderr) {
            const rmsMatch = stderr.match(/mean_volume: (-?\d+\.?\d*)/);
            if (rmsMatch && rmsMatch.length > 1) {
                const meanVolume = parseFloat(rmsMatch[1]);
                console.log(`Average volume (RMS): ${meanVolume} dB`);

                if (meanVolume < silenceThreshold) {
                    console.log("The audio is detected as silent or too quiet.");
                    callback(null, true);
                } else {
                    console.log("The audio is not silent.");
                    callback(null, false);
                }
            } else {
                callback(new Error('Could not detect RMS volume'), null);
            }
            // Delete the temporary file after processing
            fs.unlink(tempFilePath, (err) => {
                if (err) console.error("Error deleting temporary file:", err);
            });
        })
        .saveToFile(tempFilePath);
}



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

        detectSilence(uploadPath, -50, async (err, isSilent) => {
            if (err) {
                console.error('Error detecting silence:', err);
                // Send the response back to the client
        res.json({ transcript: '' });
            } else {
                if (isSilent) {
                    console.log('Audio is mostly silent.');
                    res.json({ transcript: '' });
                } else {
                    console.log('Audio has significant sound.');
                    // Process the file with OpenAI API
                    const transcription = await openai.audio.transcriptions.create({
                        file: fs.createReadStream(uploadPath),
                        model: "whisper-1",
                    });

                    console.log(transcription.text);

                    // Delete the file after processing
                    await fs.promises.unlink(uploadPath);
                    console.log("File deleted:", uploadPath);
                    res.json({ transcript: transcription.text });
                    
                }
            }
        });

        /*  */

        

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: "An error occurred during the process" });
    }
});

/* // Load SSL certificate and key
const sslOptions = {
    key: fs.readFileSync('./private.key'),
    cert: fs.readFileSync('./certificate.crt')
}; */

app.listen(3005, () => {
    console.log('HTTPS Server listening on port 3005');
})

/* // Start HTTPS server
https.createServer(sslOptions, app).listen(3005, () => {
    console.log('HTTPS Server listening on port 3005');
}); */
