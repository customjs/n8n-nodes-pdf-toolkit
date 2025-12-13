import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
    NodeConnectionType,
} from "n8n-workflow";

export class JsonToToon implements INodeType {
    description: INodeTypeDescription = {
        displayName: "JSON to TOON Converter (CustomJS)",
        name: "jsonToToon",
        icon: "file:customJs.svg",
        group: ["transform"],
        version: 1,
        description: "Converts standard JSON objects together with a schema into the compact TOON String for cost-efficient input to LLM Prompts.",
        defaults: {
            name: "JSON to TOON",
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
                        name: 'Convert to TOON',
                        value: 'convertToToon',
                        action: 'Convert to TOON',
                    },
                ],
                default: 'convertToToon',
            },
            {
                displayName: "JSON Data",
                name: "jsonData",
                type: "json",
                typeOptions: {
                    rows: 10,
                },
                default: "",
                description: "The JSON content to convert to TOON",
                required: true,
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            try {
                const credentials = await this.getCredentials("customJsApi");
                const jsonData = this.getNodeParameter("jsonData", i);

                const options = {
                    url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
                    method: 'POST' as const,
                    headers: {
                        "customjs-origin": "make/jsonToToon",
                    },
                    body: {
                        input: jsonData,
                        code: "const toon = require('./utils/toon-cjs'); const data = typeof input === 'string' ? JSON.parse(input) : input; const encoded = await toon.encode(data); return encoded;",
                        returnBinary: "false",
                    },
                    json: true,
                };

                const response = await this.helpers.httpRequestWithAuthentication.call(this, 'customJsApi', options);

                returnData.push({
                    json: {
                        toon: response,
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
