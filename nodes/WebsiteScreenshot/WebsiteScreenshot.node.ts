
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  NodeConnectionType,
} from "n8n-workflow";

export class WebsiteScreenshot implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Website Screenshot (Deprecated) (CustomJS)",
    name: "websiteScreenshot",
    icon: "file:customJs.svg",
    group: ["transform"],
    version: 1,
    description: "Take a screenshot of a website",
    defaults: {
      name: "Take a screenshot of a website",
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [
      {
        name: "customJsApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Take Website Screenshot',
            value: 'websiteScreenshot',
            action: 'Take Website Screenshot',
          },
        ],
        default: 'websiteScreenshot',
      },
      {
        displayName: "Website Url",
        name: "urlInput",
        type: "string",
        default: "",
        description: "The url for taking screenshot",
        required: true,
      },
      {
        displayName: "Output Filename",
        name: "outputFilename",
        type: "string",
        default: "output.png",
        description: "Name for the generated PNG file (include .png extension)",
        required: false,
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const credentials = await this.getCredentials("customJsApi");
        const urlInput = this.getNodeParameter("urlInput", i) as string;

        const options = {
          url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
          method: 'POST' as const,
          headers: {
            "customjs-origin": "n8n/screenshot",
          },
          body: {
            input: urlInput,
            code: "const { SCREENSHOT } = require('./utils'); return SCREENSHOT(input);",
            returnBinary: "true",
          },
          encoding: 'arraybuffer' as const,
          json: true,
        };

        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'customJsApi', options);
        if (!response || (Buffer.isBuffer(response) && response.length === 0)) {
          // No binary data returned; emit only JSON without a binary property
          returnData.push({
            json: items[i].json,
            pairedItem: {
              item: i,
            },
          });
          continue;
        }

        const outputFilename = this.getNodeParameter("outputFilename", i, "output.png") as string;
        const binaryData = await this.helpers.prepareBinaryData(
          response,
          outputFilename
        );

        returnData.push({
          json: items[i].json,
          binary: {
            data: binaryData,
          },
          pairedItem: {
            item: i,
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: errorMessage,
            },
            pairedItem: {
              item: i,
            },
          });
          continue;
        }
        throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
      }
    }

    return [returnData];
  }
}
