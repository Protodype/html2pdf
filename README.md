# Html2PDF
Html2PDF is a ready-to-use service for generating beautiful PDF from HTML and CSS.
It is built using [puppeteer](https://github.com/GoogleChrome/puppeteer) project and uses headless Chromium to render pages and save them as PDF.

## Ready-to-use
The service is ready-to-use and can be deployed from prepared container that is hosted on Docker Hub.
Deploy it with:
```
# docker pull protodype/html2pdf:latest
```

## Use it
The container accepts `POST` requests on listening port to `/` URI.
Post data should be in JSON format and follow below structure:
```json
{
  "html": "string",
  "css": "string",
  "name": "string"
}
```
Where `html` is an HTML content of page to be rendered, `css` is a raw CSS styles to be used for provided HTML
and `name` is a filename to be inserted into headers (useful if you pass headers and response directly to client).

Response from service might be either success (HTTP code `200`) which would be followed by appropriate headers for browser download of PDF file,
or error (HTTP code `500`) which would be followed by error message. Be sure to handle those appropriately.

## Build yourself
You can use this code and provided Dockerfile to build the container yourself.
To do that simple pull the latest code and run docker build:
```
# git clone  https://github.com/Protodype/html2pdf.git
# cd html2pdf
# docker built -t html2pdf .
``` 

## Run it
The code in container accepts following ENV variables:
* `LISTEN_HOST` - which hostname should process listen on. Defaults to `0.0.0.0`
* `LISTEN_PORT` - port the process will bind to within container. Defaults to `3000`
* `CHROMIUM_BIN` - location of installed Chromium binary inside container. Defaults to `/usr/bin/chromium-browser` as default installation location in Alpine
* `CHROMIUM_ARGS` - arguments passed to Chromium on start. Defaults to `--headless --disable-gpu --no-sandbox`

## Understand
By default the code in container runs as `root` and `CHROMIUM_ARGS` default values include `--no-sandbox`.
This means that you should be well in control of HTML/JS passed to this service to mitigate any security issues.
The reason behind this decision is that the Chromium requires specific privileges to be able to run,
which in turn would require running container with specific key `--cap-add=SYS_ADMIN`,
in which case it makes no difference whether to sandbox the process inside container with unprivileged user or not.

## Contribute
This code is licensed under MIT license and welcomes all contributions.

## Acknowledgements
* Thanks to [html5-to-pdf](https://www.npmjs.com/package/html5-to-pdf) project for giving an idea how to build this service
* Thanks to [puppeteer](https://github.com/GoogleChrome/puppeteer) project for making it easy enough to generate nice looking PDFs with headless Chromium