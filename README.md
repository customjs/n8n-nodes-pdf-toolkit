![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# @custom-js/n8n-nodes-pdf-toolkit

This is an n8n community node. It lets interact with official API of [customJS API](https://www.customjs.space/)

This package contains nodes to help you generate PDF from HTML, merge multiple PDF files, take a screenshot of specific website using URL, convert PDF to PNG, convert PDF to Text and extract pages from PDF.

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
- Input PDF files as an array with the same field name to merge.
- If total size of files exceeds 6MB, pass it as an array of URL seperated by comma.
- Execute the workflow to get merged PDF file.

### "Website Screenshot" node

- Add the Website Screenshot node to your workflow
- Configure your CustomJS API credentials
- Input your URL of website to take screenshot
- Execute the workflow to take a screenshot of that website

### "Compress PDF" node

- Add the Compress PDF node to your workflow
- Configure your CustomJS API credentials
- Input Binary PDF file for compression to compress
- If size of the binary file exceeds 6MB, pass it as URL.
- Execute the workflow to get a compression of PDF file.

### "PDF To PNG" node

- Add the PDF To PNG node to your workflow
- Configure your CustomJS API credentials
- Input Binary PDF file for conversion
- If size of the binary file exceeds 6MB, pass it as URL.
- Execute the workflow to get converted PNG file.

### "PDF To Text" node

- Add the PDF To Text node to your workflow
- Configure your CustomJS API credentials
- Input Binary PDF file for conversion
- If size of the binary file exceeds 6MB, pass it as URL.
- Execute the workflow to get converted Text file.

### "Extract Pages From PDF" node

- Add the Extract Pages From PDF node to your workflow
- Configure your CustomJS API credentials
- Input Binary PDF file for conversion
- If size of the binary file exceeds 6MB, pass it as URL.
- Execute the workflow to get converted Pages from PDF file.
