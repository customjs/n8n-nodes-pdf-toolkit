import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

export class WebsiteScreenshot implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Website Screenshot",
    name: "websiteScreenshot",
    icon: "file:customJs.svg",
    group: ["transform"],
    version: 1,
    description: "Take a screenshot of a website",
    defaults: {
      name: "Take a screenshot of a website",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "customJsApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Website Url",
        name: "urlInput",
        type: "string",
        default: "",
        description: "The url for taking screenshot",
        required: true,
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const credentials = await this.getCredentials("customJsApi");
      const urlInput = this.getNodeParameter("urlInput", i) as string;

      const options = {
        url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
        method: "POST",
        headers: {
          "customjs-origin": "n8n/screenshot",
          "x-api-key": credentials.apiKey,
        },
        body: {
          input: urlInput,
          code: "const { SCREENSHOT } = require('./utils'); return SCREENSHOT(input);",
          returnBinary: "true",
        },
        encoding: null,
        json: true,
      };

      const response = await this.helpers.request(options);

      returnData.push({
        json: items[i].json,
        binary: {
          data: {
            data: response,
            mimeType: "image/png",
          },
        },
      });
    }

    return [returnData];
  }
}
