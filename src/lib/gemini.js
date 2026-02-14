import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const workflowSchema = {
  description: "React Flow workflow with nodes and edges for sustainability recommendations",
  type: SchemaType.OBJECT,
  properties: {
    nodes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: "Unique node identifier" },
          data: {
            type: SchemaType.OBJECT,
            properties: {
              label: { type: SchemaType.STRING, description: "Node label/title" },
              details: { type: SchemaType.STRING, description: "Optional details" },
            },
            required: ["label"],
          },
          position: {
            type: SchemaType.OBJECT,
            properties: {
              x: { type: SchemaType.NUMBER },
              y: { type: SchemaType.NUMBER },
            },
            required: ["x", "y"],
          },
        },
        required: ["id", "data", "position"],
      },
      description: "Array of workflow nodes",
    },
    edges: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: "Unique edge identifier" },
          source: { type: SchemaType.STRING, description: "Source node ID" },
          target: { type: SchemaType.STRING, description: "Target node ID" },
          label: { type: SchemaType.STRING, description: "Optional edge label" },
        },
        required: ["id", "source", "target"],
      },
      description: "Array of edges connecting nodes",
    },
  },
  required: ["nodes", "edges"],
};

export async function callGemini(prompt, options = {}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not set");
  }

  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: workflowSchema,
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxTokens || 2048,
      },
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse structured response:", e);
      return { text: responseText };
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

/**
 * Build a strict instruction to ask Gemini to return React Flow nodes/edges JSON.
 */
export function buildPlanPrompt({ scope = "individual", context = {} }) {
  const header = `You are an expert sustainability advisor. Generate a structured React Flow workflow (nodes and edges) to solve sustainability problems.`;

  const requirements = `
Requirements:
- Create clear, actionable nodes (steps, actions, metrics, insights)
- Connect nodes with edges showing dependencies or relationships
- Use human-friendly labels with units where relevant (kWh, km, kg, gallons)
- Position nodes logically (left: problems, middle: actions, right: outcomes)
- For community scope: include both per-user and aggregate community actions
- Ensure all IDs and connections are valid and non-circular when possible
- Make position coordinates meaningful: x increases left-to-right, y increases top-to-bottom
`;

  const ctx = JSON.stringify(context || {}, null, 2);

  return `${header}\n\nScope: ${scope}\nContext: ${ctx}\n${requirements}`;
}

