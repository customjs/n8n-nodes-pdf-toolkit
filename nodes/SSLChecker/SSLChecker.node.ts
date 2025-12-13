import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  NodeConnectionType,
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
            name: 'Check SSL',
            value: 'sslChecker',
            action: 'Check SSL',
          },
        ],
        default: 'sslChecker',
      },
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
      try {
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

        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'customJsApi', options);

        returnData.push({
          json: {
            output: response,
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