# Convert Structurizr Express JSON/YAML definition to Structurizr workspace JSON format

This repo will help you convert an existing Structurizr Express JSON/YAML diagram definition to a Structurizr workspace JSON definition, which can then be imported into the full (model based) version of Structurizr, using the UI or one of the [client libraries](https://structurizr.com/help/client-libraries) available for Java, .NET, PHP or TypeScript.

See ```example.js``` for an example of how to convert an Express definition into a workspace.

```
node example
```

## Notes:
- You will need to install the YAML module (```npm install yaml```) to convert YAML to JSON.
- This code is provided as-is, and will not be maintained.