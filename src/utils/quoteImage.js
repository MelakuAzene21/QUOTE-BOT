import { createCanvas, loadImage } from "@napi-rs/canvas";
import path from "path";
import { fileURLToPath } from "url";

// resolve dirname since we use ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateQuoteImage(content, author) {
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#1e293b"); // dark slate
    gradient.addColorStop(0.5, "#334155"); // lighter slate
    gradient.addColorStop(1, "#1e293b"); // dark slate
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add decorative border
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Add quote marks decoration
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 80px Arial";
    ctx.textAlign = "center";
    ctx.fillText(""", width / 2 - 200, 120);
    ctx.fillText(""", width / 2 + 200, height - 80);

    // Quote text (wrap words properly with better styling)
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    const maxWidth = width - 120;
    const lineHeight = 40;
    const words = content.split(" ");
    let line = "";
    let y = 180;

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

    // Author with better styling
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "italic 24px Arial";
    ctx.fillText(`— ${author}`, width / 2, y + 60);

    // Add decorative line under author
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    const lineWidth = 200;
    const lineX = (width - lineWidth) / 2;
    ctx.beginPath();
    ctx.moveTo(lineX, y + 80);
    ctx.lineTo(lineX + lineWidth, y + 80);
    ctx.stroke();

    // Add subtle watermark
    ctx.fillStyle = "#475569";
    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    ctx.fillText("Quote Bot", width - 30, height - 20);

    // Return image buffer
    return canvas.toBuffer("image/png");
}
