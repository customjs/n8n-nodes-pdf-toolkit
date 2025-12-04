FROM n8nio/n8n:latest

USER root

RUN mkdir -p /home/node/.n8n/nodes

WORKDIR /home/node/.n8n/nodes

RUN npm install --omit=dev @custom-js/n8n-nodes-pdf-toolkit
RUN npm install -g cheerio

RUN chown -R node:node /home/node/.n8n

USER node
