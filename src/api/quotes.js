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

// Get a quote by category using Quotable API tag mapping
export async function getQuoteByCategory(category) {
    const categoryToTags = {
        motivation: "inspirational|success",
        love: "love",
        life: "life",
        science: "science",
        funny: "humor"
    };

    try {
        if (!category) {
            return await getRandomQuote();
        }

        const key = String(category).trim().toLowerCase();
        const tags = categoryToTags[key];
        if (!tags) {
            return await getRandomQuote();
        }

        const { data } = await axios.get("https://api.quotable.io/random", {
            params: { tags }
        });

        const content = data.content || "";
        const author = data.author || "Unknown";
        if (!content) {
            return await getRandomQuote();
        }
        return { content, author };
    } catch (error) {
        console.error("Error fetching quote by category:", error.message);
        return await getRandomQuote();
    }
}

