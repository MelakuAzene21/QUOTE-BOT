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

// Get category-based quote
export async function getCategoryQuote(category) {
    try {
        // For simplicity, we'll map categories to keywords
        const categoryMap = {
            life: "life",
            love: "love",
            wisdom: "wisdom",
        };

        const keyword = categoryMap[category.toLowerCase()];
        if (!keyword) {
            return { content: "Unknown category. Try: life, love, wisdom.", author: "System" };
        }

        const response = await axios.get(`https://zenquotes.io/api/quotes`);
        const quotes = response.data.filter((q) =>
            q.q.toLowerCase().includes(keyword)
        );

        if (quotes.length === 0) {
            return { content: "No quotes found for this category.", author: "System" };
        }

        const random = quotes[Math.floor(Math.random() * quotes.length)];
        return { content: random.q, author: random.a };
    } catch (error) {
        console.error("Error fetching category quote:", error.message);
        return { content: "⚠️ Sorry, I couldn't fetch category quotes.", author: "System" };
    }
}
