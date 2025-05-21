import { config } from "dotenv";
import { generateEmbeddings } from "../utils/embeddings";

config({ path: ".env.local" });

async function testEmbedding() {
  try {
    const embedding = await generateEmbeddings(
      "Black t-shirt with logo for date night"
    );
    console.log("Embedding generated successfully!");
    console.log("First 5 values:", embedding.slice(0, 5));
    console.log("Embedding length:", embedding.length);
  } catch (error) {
    console.error("Error generating embeddings", error);
  }
}

testEmbedding();
