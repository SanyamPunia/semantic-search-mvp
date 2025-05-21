import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * extracts structured attributes from a natural language query
 * @param query - user query
 * @returns structured attributes
 */
export async function extractQueryAttributes(query: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Extract structured fashion attributes from the query. Return a JSON object with these fields if present: category, subcategory, color, pattern, material, occasion, gender, priceRange, brand, style.",
        },
        {
          role: "user",
          content: query,
        },
      ],
      response_format: { type: "json_object" },
    });

    // parse json response
    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : {};
  } catch (error) {
    console.error("Error extracting query attributes", error);
    return {};
  }
}

/**
 * enhances search query with additional context
 * @param query - original search query
 * @returns enhanced query with additional context
 */
export async function enhanceQuery(query: string) {
  try {
    const attributes = await extractQueryAttributes(query);

    let enhancedQuery = query;

    if (attributes.occasion) {
      enhancedQuery += ` suitable for ${attributes.occasion}`;
    }

    if (attributes.style && !query.includes(attributes.style)) {
      enhancedQuery += ` ${attributes.style} style`;
    }

    return enhancedQuery;
  } catch (error) {
    console.error("Error enhancing query", error);
    return query;
  }
}
