import { ICredentialType, NodePropertyTypes } from "n8n-workflow";

export class CustomJsApi implements ICredentialType {
  name = "customJsApi";
  displayName = "CustomJS API";
  properties = [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string" as NodePropertyTypes,
      default: "",
    },
  ];
}
