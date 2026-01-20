#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..");

/**
 * MCP Server for Playwright Test Automation - OSMOS Product
 * Provides tools for managing and running Playwright tests
 */
class PlaywrightMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "osmos-playwright-automation",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "run_playwright_test",
          description: "Run Playwright tests with various options (smoke, regression, debug, headed mode)",
          inputSchema: {
            type: "object",
            properties: {
              testType: {
                type: "string",
                enum: ["all", "smoke", "regression", "specific"],
                description: "Type of test to run",
              },
              testPath: {
                type: "string",
                description: "Specific test file path (relative to tests folder)",
              },
              headed: {
                type: "boolean",
                description: "Run tests in headed mode",
                default: false,
              },
              debug: {
                type: "boolean",
                description: "Run tests in debug mode",
                default: false,
              },
            },
            required: ["testType"],
          },
        },
        {
          name: "get_test_results",
          description: "Get the latest test execution results from allure-results or test-results",
          inputSchema: {
            type: "object",
            properties: {
              resultType: {
                type: "string",
                enum: ["allure", "playwright"],
                description: "Type of results to retrieve",
                default: "allure",
              },
            },
          },
        },
        {
          name: "list_test_files",
          description: "List all test files in the project",
          inputSchema: {
            type: "object",
            properties: {
              folder: {
                type: "string",
                description: "Specific folder to list (e.g., 'login', 'smoke')",
              },
            },
          },
        },
        {
          name: "get_test_config",
          description: "Get Playwright configuration details",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "generate_allure_report",
          description: "Generate and view Allure test report",
          inputSchema: {
            type: "object",
            properties: {
              open: {
                type: "boolean",
                description: "Open the report in browser after generation",
                default: true,
              },
            },
          },
        },
        {
          name: "get_page_objects",
          description: "List all page object files",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "analyze_test_logs",
          description: "Analyze test execution logs for errors and failures",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Number of recent log entries to analyze",
                default: 50,
              },
            },
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "run_playwright_test":
            return await this.runPlaywrightTest(args);
          case "get_test_results":
            return await this.getTestResults(args);
          case "list_test_files":
            return await this.listTestFiles(args);
          case "get_test_config":
            return await this.getTestConfig();
          case "generate_allure_report":
            return await this.generateAllureReport(args);
          case "get_page_objects":
            return await this.getPageObjects();
          case "analyze_test_logs":
            return await this.analyzeTestLogs(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async runPlaywrightTest(args) {
    const { testType, testPath, headed, debug } = args;
    let command = "npm run ";

    if (debug) {
      command += "test:debug";
    } else if (testType === "smoke") {
      command += "test:smoke";
    } else if (testType === "regression") {
      command += "test:regression";
    } else if (testType === "specific" && testPath) {
      command = `npx playwright test ${testPath}`;
    } else {
      command += headed ? "test:headed" : "test";
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: PROJECT_ROOT,
        maxBuffer: 10 * 1024 * 1024,
      });

      return {
        content: [
          {
            type: "text",
            text: `Test execution completed!\n\nOutput:\n${stdout}\n${stderr ? `Errors:\n${stderr}` : ""}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Test execution failed:\n${error.stdout}\n${error.stderr}`,
          },
        ],
      };
    }
  }

  async getTestResults(args) {
    const { resultType = "allure" } = args;
    const resultsPath =
      resultType === "allure"
        ? path.join(PROJECT_ROOT, "reports", "allure-results")
        : path.join(PROJECT_ROOT, "test-results");

    try {
      const files = await fs.readdir(resultsPath);
      const jsonFiles = files.filter(
        (f) => f.endsWith(".json") || f.endsWith("result.json")
      );

      let summary = `Found ${jsonFiles.length} result files in ${resultType} results:\n\n`;

      // Read and parse result files
      for (const file of jsonFiles.slice(0, 10)) {
        // Limit to recent 10
        const filePath = path.join(resultsPath, file);
        try {
          const content = await fs.readFile(filePath, "utf-8");
          const data = JSON.parse(content);
          summary += `📄 ${file}\n`;
          if (data.name) summary += `   Name: ${data.name}\n`;
          if (data.status) summary += `   Status: ${data.status}\n`;
          if (data.stage) summary += `   Stage: ${data.stage}\n`;
          summary += "\n";
        } catch (e) {
          // Skip files that can't be parsed
        }
      }

      return {
        content: [
          {
            type: "text",
            text: summary,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error reading test results: ${error.message}`,
          },
        ],
      };
    }
  }

  async listTestFiles(args) {
    const { folder } = args || {};
    const testsPath = path.join(PROJECT_ROOT, "tests", folder || "");

    try {
      const files = await this.readDirRecursive(testsPath);
      const testFiles = files.filter(
        (f) => f.endsWith(".spec.js") || f.endsWith(".test.js")
      );

      return {
        content: [
          {
            type: "text",
            text: `Test files found:\n\n${testFiles.map((f) => `📝 ${f}`).join("\n")}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing test files: ${error.message}`,
          },
        ],
      };
    }
  }

  async readDirRecursive(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          return this.readDirRecursive(fullPath);
        } else {
          return fullPath.replace(PROJECT_ROOT, "");
        }
      })
    );
    return files.flat();
  }

  async getTestConfig() {
    const configPath = path.join(PROJECT_ROOT, "playwright.config.js");

    try {
      const content = await fs.readFile(configPath, "utf-8");
      return {
        content: [
          {
            type: "text",
            text: `Playwright Configuration:\n\n${content}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error reading config: ${error.message}`,
          },
        ],
      };
    }
  }

  async generateAllureReport(args) {
    const { open = true } = args || {};
    const command = open ? "npm run allure:report" : "npm run allure:generate";

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: PROJECT_ROOT,
      });

      return {
        content: [
          {
            type: "text",
            text: `Allure report generated successfully!\n\n${stdout}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error generating Allure report: ${error.message}`,
          },
        ],
      };
    }
  }

  async getPageObjects() {
    const pagesPath = path.join(PROJECT_ROOT, "pages");

    try {
      const files = await this.readDirRecursive(pagesPath);
      const pageFiles = files.filter((f) => f.endsWith(".js"));

      return {
        content: [
          {
            type: "text",
            text: `Page Object files:\n\n${pageFiles.map((f) => `📄 ${f}`).join("\n")}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing page objects: ${error.message}`,
          },
        ],
      };
    }
  }

  async analyzeTestLogs(args) {
    const { limit = 50 } = args || {};
    const logsPath = path.join(PROJECT_ROOT, "logs");

    try {
      const files = await fs.readdir(logsPath);
      const logFiles = files.filter((f) => f.endsWith(".log"));

      if (logFiles.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No log files found.",
            },
          ],
        };
      }

      // Read the most recent log file
      const recentLog = logFiles.sort().reverse()[0];
      const logPath = path.join(logsPath, recentLog);
      const content = await fs.readFile(logPath, "utf-8");
      const lines = content.split("\n").slice(-limit);

      return {
        content: [
          {
            type: "text",
            text: `Recent ${limit} log entries from ${recentLog}:\n\n${lines.join("\n")}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing logs: ${error.message}`,
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("OSMOS Playwright MCP Server running on stdio");
  }
}

// Start the server
const server = new PlaywrightMCPServer();
server.run().catch(console.error);
