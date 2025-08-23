import { ICredentialType, NodePropertyTypes } from "n8n-workflow";

export class CustomJsApi implements ICredentialType {
  name = "CustomJsApi";
  displayName = "CustomJS API";
  properties = [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string" as NodePropertyTypes,
      default: "",
      description: "You can get API Key for CustomJS from https://www.customjs.space/"
    },
  ];
}
