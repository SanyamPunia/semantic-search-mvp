import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * convert text to embeddings
 * @param text - text to convert to embeddings
 * @returns embeddings (array of numbers)
 */
export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small", // small model
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embeddings", error);
    throw error;
  }
}

/**
 * prepares product text for embedding by combining relevant fields
 * @param product - product object
 * @returns a string combining important product details
 */
export function prepareTextForEmbedding(product: any): string {
  return [
    product.title,
    product.description,
    product.brand,
    product.category,
    product.subcategory,
    product.color ? JSON.stringify(product.colors) : "",
    product.gender || "",
  ]
    .filter(Boolean)
    .join(" ");
}
