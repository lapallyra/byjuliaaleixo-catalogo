import express from "express";
import http from "node:http";

const app = express();

// Set up the catch-all route as defined in server.ts
app.get('*all', (req, res) => {
  res.send("HTML_CONTENT_SERVED");
});

const server = app.listen(0, "127.0.0.1", () => {
  const address = server.address() as any;
  const port = address.port;
  console.log(`Test server running on port ${port}`);

  const testPath = (path: string) => {
    return new Promise<void>((resolve) => {
      http.get(`http://127.0.0.1:${port}${path}`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          console.log(`Path: ${path} -> Status: ${res.statusCode}, Body: ${data}`);
          resolve();
        });
      }).on('error', (err) => {
        console.error(`Error requesting ${path}:`, err.message);
        resolve();
      });
    });
  };

  Promise.all([
    testPath('/'),
    testPath('/admin'),
    testPath('/admin/login'),
    testPath('/some/nested/deep/path')
  ]).then(() => {
    server.close();
  });
});
