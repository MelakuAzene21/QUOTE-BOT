import { createCanvas, loadImage } from "@napi-rs/canvas";
import path from "path";
import { fileURLToPath } from "url";

// resolve dirname since we use ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateQuoteImage(content, author) {
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#1e293b"; // dark slate
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    // ctx.fillText("✨ Quote of the Day ✨", width / 2, 60);

    // Quote text (wrap words properly)
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    const maxWidth = width - 100;
    const lineHeight = 36;
    const words = content.split(" ");
    let line = "";
    let y = 150;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== "") {
            ctx.fillText(line, width / 2, y);
            line = words[n] + " ";
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, width / 2, y);

    // Author
    ctx.font = "italic 22px Arial";
    ctx.fillText(`— ${author}`, width / 2, y + 50);

    // Return image buffer
    return canvas.toBuffer("image/png");
}
