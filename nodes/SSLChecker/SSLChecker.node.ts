import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

export class SSLChecker implements INodeType {
  description: INodeTypeDescription = {
    displayName: "SSL Checker (SSL Certificate) (CustomJS)",
    name: "sslChecker",
    icon: "file:customJs.svg",
    group: ["transform"],
    version: 1,
    description: "Gives you information about the expiration date of SSL certificates.",
    defaults: {
      name: "SSL Checker",
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
        displayName: "Domain",
        name: "domain",
        type: "string",
        default: "",
        description: "The domain to check (e.g. example.com)",
        required: true,
        modes: [
          {
            displayName: "By Domain",
            name: "domain",
            type: "string",
            placeholder: "example.com",
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const credentials = await this.getCredentials("customJsApi");
      const domain = this.getNodeParameter("domain", i) as string;

      const options = {
        url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
        method: 'POST' as const,
        headers: {
          "customjs-origin": "n8n/sslchecker",
        },
        body: {
          input: domain,
          code: "const checkCertExpiration = require('check-cert-expiration'); return checkCertExpiration(input);",
        },
        json: true,
      };

      const response = await this.helpers.requestWithAuthentication.call(this, 'customJsApi', options);

      returnData.push({
        json: {
          output: response,
        },
      });
    }

    return [returnData];
  }
}