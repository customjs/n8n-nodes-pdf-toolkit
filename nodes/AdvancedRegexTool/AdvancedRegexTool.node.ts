import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} from "n8n-workflow";

export class AdvancedRegexTool implements INodeType {
    description: INodeTypeDescription = {
        displayName: "Advanced RegEx Tool",
        name: "advancedRegexTool",
        icon: "file:customJs.svg",
        group: ["transform"],
        version: 1,
        description: "Performs powerful Regex pattern extraction, search-and-replace, and validation on unstructured text data (e.g., emails, logs, web scraping output).",
        defaults: {
            name: "Advanced RegEx Tool",
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
                displayName: "Input Text",
                name: "textData",
                type: "string",
                default: "",
                description: "The text to process",
                required: true,
            },
            {
                displayName: "Regex Pattern",
                name: "regexPattern",
                type: "string",
                default: "",
                description: "The regular expression pattern",
                required: true,
            },
            {
                displayName: "Regex Flags",
                name: "regexFlags",
                type: "string",
                default: "g",
                description: "Flags for the regular expression (e.g., g, i, m)",
                required: true,
            },
            {
                displayName: "Type",
                name: "operation",
                type: "options",
                options: [
                    {
                        name: "Extract",
                        value: "extract",
                    },
                    {
                        name: "Replace",
                        value: "replace",
                    },
                    {
                        name: "Test",
                        value: "test",
                    },
                    {
                        name: "Split",
                        value: "split",
                    },
                ],
                default: "extract",
                description: "The operation to perform",
                required: true,
            },
            {
                displayName: "Replacement",
                name: "replacement",
                type: "string",
                default: "",
                displayOptions: {
                    show: {
                        operation: ["replace"],
                    },
                },
                description: "The replacement text",
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            try {
                const credentials = await this.getCredentials("customJsApi");
                const textData = this.getNodeParameter("textData", i) as string;
                const regexPattern = this.getNodeParameter("regexPattern", i) as string;
                const regexFlags = this.getNodeParameter("regexFlags", i) as string;
                const operation = this.getNodeParameter("operation", i) as string;
                const replacement = this.getNodeParameter("replacement", i, "") as string;

                const options = {
                    url: `https://e.customjs.io/__js1-${credentials.apiKey}`,
                    method: 'POST' as const,
                    headers: {
                        "customjs-origin": "make/regexTool",
                    },
                    body: {
                        input: {
                            textData,
                            regexPattern,
                            regexFlags,
                            operation,
                            replacement,
                        },
                        code: "const pattern = input.regexPattern.trim().replace(/^['\"]+|['\"]+$/g, ''); return REGEX({ operation: input.operation, inputText: input.textData, pattern: pattern, flags: input.regexFlags, replacement: input.replacement });",
                        returnBinary: "false",
                    },
                };

                const response = await this.helpers.requestWithAuthentication.call(this, 'customJsApi', options);

                returnData.push({
                    json: {
                        result: response,
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
