const puppeteer = require("puppeteer-core");
const http = require("http");
const tmp = require("tmp");
const fs = require("fs");
const Validator = require("jsonschema").Validator;

const HOSTNAME = process.env.LISTEN_HOST || "0.0.0.0";
const PORT = process.env.LISTEN_PORT || 3000;
const CHROMIUM_BIN = process.env.CHROMIUM_BIN || '/usr/bin/chromium-browser';
const CHROMIUM_ARGS = process.env.CHROMIUM_ARGS || '--headless --disable-gpu --no-sandbox';

const JSON_REQ_SCHEMA = {
    "type": "object",
    "properties": {
        "html": {"type": "string"},
        "css": {"type": "string"},
        "name": {"type": "string"}
    },
    "required": ["html", "css", "name"]
};
let v = new Validator();

// Start browser
(async () => {
    const browser = await puppeteer.launch({
        executablePath: CHROMIUM_BIN,
        args: CHROMIUM_ARGS.split(" ")
    });

    const requestHandler = (request, response) => {
        if (request.method === 'POST' && request.url === "/") {
            request.on('data', function (data) {
                (async () => {
                    let page;
                    let reqData;
                    try {
                        // Parse data
                        reqData = await JSON.parse(data.toString());

                        // Validate data
                        let validationResult = await v.validate(reqData, JSON_REQ_SCHEMA);
                        if (!validationResult.valid) {
                            throw validationResult.errors[0];
                        }

                        // Open new page
                        page = await browser.newPage();
                        await page.setContent(reqData.html);
                        await page.addStyleTag({content: reqData.css});
                    } catch (e) {
                        response.writeHead(500);
                        response.end(e.toString());

                        if (page !== undefined) {
                            page.close();
                        }

                        return
                    }
                    // Create tmp file to write PDF into (because puppeteer does not offer loading contents directly)
                    tmp.file(function (err, path, fd, cleanupCallback) {
                        (async () => {
                            if (err) {
                                response.writeHead(500);
                                response.end(err.toString());
                                page.close();

                                return
                            }

                            // Generate PDF and write to file
                            await page.pdf({
                                path: path,
                                printBackground: true,
                                format: 'A4'
                            });

                            // Read file and reply it to client
                            fs.readFile(path, function (err, content) {
                                if (err) {
                                    response.writeHead(500);
                                    response.end(err.toString());
                                    page.close();
                                    cleanupCallback();

                                    return
                                }
                                response.writeHead(200, {
                                    'Content-Type': 'application/pdf',
                                    'Content-Length': Buffer.byteLength(content),
                                    'Content-Disposition': `attachment;filename=${reqData.name}`
                                });
                                response.end(content);

                                // Cleanup tmp file
                                cleanupCallback();
                                page.close();
                            })
                        })();
                    })
                })();
            })
        } else {
            response.writeHead(500);
            response.end("invalid request");
        }
    };

    // Define server
    const server = http.createServer(requestHandler);

    // Start listening on server
    server.listen(PORT, HOSTNAME, (err) => {
        if (err) {
            return console.log(err);
        }

        console.log(`server is listening on ${HOSTNAME}:${PORT}`);
    });
})();
