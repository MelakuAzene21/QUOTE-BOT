import axios from "axios";

// Get a random quote
export async function getRandomQuote() {
    try {
        const response = await axios.get("https://zenquotes.io/api/random");
        const { q: content, a: author } = response.data[0];
        return { content, author };
    } catch (error) {
        console.error("Error fetching quote:", error.message);
        return { content: "⚠️ Sorry, I couldn't fetch a quote.", author: "System" };
    }
}

