![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# @custom-js/n8n-nodes-pdf-toolkit

This is an n8n community node. It lets interact with official API of [customJS API](https://www.customjs.space/)

This package contains nodes to help you generate PDF from HTML, merge multiple PDF files, and take a screenshot of specific website using URL.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

- [Installation](#installation)
- [Credentials](#credentials)
- [Usage](#usage)
- [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

Use the package at [here](https://www.npmjs.com/package/@custom-js/n8n-nodes-pdf-toolkit).

## Credentials

Add your Api Key and store securely

## Usage

### "HTML to PDF" node

- Add the HTML to PDF node to your workflow
- Configure your CustomJS API credentials
- Input your HTML content
- Execute the workflow to generate PDF

### "Merge PDFs" node

- Add the Merge PDFs node to your workflow
- Configure your CustomJS API credentials
- Only input binary data to this node.
- Execute the workflow to get merged PDF file.

### "Website Screenshot" node

- Add the Website Screenshot node to your workflow
- Configure your CustomJS API credentials
- Input your URL of website to take screenshot
- Execute the workflow to take a screenshot of that website
