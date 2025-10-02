import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Create the server instance
const server = new Server(
  {
    name: "my-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "calculate",
        description: "Performs basic math calculations (add, subtract, multiply, divide)",
        inputSchema: {
          type: "object",
          properties: {
            operation: {
              type: "string",
              enum: ["add", "subtract", "multiply", "divide"],
              description: "The math operation to perform",
            },
            a: {
              type: "number",
              description: "First number",
            },
            b: {
              type: "number",
              description: "Second number",
            },
          },
          required: ["operation", "a", "b"],
        },
      },
      {
        name: "generate_id",
        description: "Generates a random unique ID",
        inputSchema: {
          type: "object",
          properties: {
            prefix: {
              type: "string",
              description: "Optional prefix for the ID",
            },
          },
        },
      },
      {
        name: "reverse_text",
        description: "Reverses the given text string",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "The text to reverse",
            },
          },
          required: ["text"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "calculate": {
        const { operation, a, b } = args as { operation: string; a: number; b: number };
        let result: number;

        switch (operation) {
          case "add":
            result = a + b;
            break;
          case "subtract":
            result = a - b;
            break;
          case "multiply":
            result = a * b;
            break;
          case "divide":
            if (b === 0) {
              throw new Error("Cannot divide by zero");
            }
            result = a / b;
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        return {
          content: [
            {
              type: "text",
              text: `Result: ${a} ${operation} ${b} = ${result}`,
            },
          ],
        };
      }

      case "generate_id": {
        const { prefix } = args as { prefix?: string };
        const id = Math.random().toString(36).substring(2, 15);
        const fullId = prefix ? `${prefix}-${id}` : id;

        return {
          content: [
            {
              type: "text",
              text: `Generated ID: ${fullId}`,
            },
          ],
        };
      }

      case "reverse_text": {
        const { text } = args as { text: string };
        const reversed = text.split("").reverse().join("");

        return {
          content: [
            {
              type: "text",
              text: `Original: ${text}\nReversed: ${reversed}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
