import * as gptscript from '@gptscript-ai/gptscript';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import  { readFileSync, readdirSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// const contextDir = join(__dirname, '../tools/context');
// const contextFiles = readdirSync(contextDir);
// const contextContentMap = getDirFilesContent(contextDir, contextFiles);

const toolsDir = join(__dirname, '../tools');
const toolFiles = readdirSync(toolsDir);
const toolsContentMap = getDirFilesContent(toolsDir, toolFiles);

function getDirFilesContent(dir: string, files: string[]): { [key: string]: string } {
  let contentMap: { [key: string]: string } = {};

  files.forEach(file => {
    const filePath = join(dir, file);

    if ( statSync(filePath).isDirectory() ) {
      console.warn(`Skipping directory: ${filePath}`);
      return;
    }

    const fileContent = readFileSync(filePath, 'utf-8');
    const fileNameWithoutExt = file.replace(/\.[^/.]+$/, ""); // Remove file extension
    contentMap[fileNameWithoutExt] = fileContent;
  });

  return contentMap;
}

export const mainTool: gptscript.ToolDef = {
  name: "main",
  description: "main tool for running scripts",
  maxTokens: 1000,
  modelName: "",
  modelProvider: true,
  jsonResponse: false,
  temperature: 0.7,
  chat: true,
  internalPrompt: false,
  arguments: {
    type: "object",
    properties: {
      script: {
        type: "string",
        description: "the script to run"
      }
    }
  },
  tools: ["sys.exec"],
  globalTools: [],
  context: [],
  export: [],
  blocking: true,
  instructions: toolsContentMap['main']
};

export const kubectlTool: gptscript.ToolDef = {
  name: "kubectl",
  description: "use kubectl command to manage k8s resources",
  maxTokens: 1000,
  modelName: "",
  modelProvider: true,
  jsonResponse: false,
  temperature: 0.7,
  chat: true,
  internalPrompt: false,
  arguments: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "the command kubectl needs to run"
      }
    }
  },
  tools: ["sys.exec"],
  globalTools: [],
  context: [],
  export: [],
  blocking: true,
  instructions: toolsContentMap['kubectl']
};

export const helmTool: gptscript.ToolDef = {
  name: "helm",
  description: "use helm command to manage k8s charts",
  maxTokens: 1000,
  modelName: "",
  modelProvider: true,
  jsonResponse: false,
  temperature: 0.7,
  chat: true,
  internalPrompt: false,
  arguments: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "the command helm needs to run"
      }
    }
  },
  tools: ["sys.exec"],
  globalTools: [],
  context: [],
  export: [],
  blocking: true,
  instructions: toolsContentMap['helm']
};