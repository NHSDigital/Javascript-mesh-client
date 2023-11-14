import axios from "axios";
import log from "loglevel";
import generateHeaders from "./generate_headers.js";
import zlib from "zlib";
import fs from "fs";
import stream from "stream";
import util from "util";
let pipeline = util.promisify(stream.pipeline);

let CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB
let currentSize = 0;
let fileIndex = 1;

class CsvChunker extends stream.Transform {
  constructor(options) {
    super(options);
    this.currentSize = 0;
    this.writeStream = null;
  }

  _transform(chunk, encoding, callback) {
    if (this.currentSize + chunk.length > CHUNK_SIZE || !this.writeStream) {
      if (this.writeStream) {
        this.writeStream.end();
      }
      this.writeStream = fs.createWriteStream(`output/chunk_${fileIndex}.csv`);
      fileIndex++;
      this.currentSize = 0;
    }
    this.currentSize += chunk.length;
    this.writeStream.write(chunk, encoding, callback);
  }

  _final(callback) {
    if (this.writeStream) {
      this.writeStream.end(callback);
    } else {
      callback();
    }
  }
}

async function splitAndZipCsv(filePath) {
  let csvChunker = new CsvChunker();
  let count = 0;

  await pipeline(fs.createReadStream(filePath), csvChunker);

  log.debug("CSV file has been split into smaller chunks.");

  for (let i = 1; i < fileIndex; i++) {
    await gzipFile(i);
    count += 1;
  }
  return count;
}

async function gzipFile(chunkIndex) {
  let sourceFile = `output/chunk_${chunkIndex}.csv`;
  let destinationFile = `output/chunk_${chunkIndex}.gzip`;

  return pipeline(
    fs.createReadStream(sourceFile),
    zlib.createGzip(),
    fs.createWriteStream(destinationFile)
  )
    .then(() => console.log(`Chunk ${chunkIndex} has been gzipped.`))
    .catch((err) => console.error("An error occurred:", err));
}

async function sendMessageChunks({
  url,
  mailboxID,
  mailboxPassword,
  mailboxTarget,
  tlsEnabled,
  agent,
}) {
  let fileCount = 0;
  let messageID;
  let fullUrl;
  await splitAndZipCsv(
    "/home/acleveland/repo/scripts/csv_to_json/test_data_female.csv"
  )
    .then((count) => {
      log.debug("CSV splitting and zipping completed");
      fileCount = count;
    })
    .catch((err) => {
      console.error("An error occurred:", err);
    });

  log.info(fileCount + " chunks were created");
  let axiosResponse;

  for (let chunk = 1; chunk <= fileCount; chunk++) {
    if (messageID) {
      fullUrl = `${url}/messageexchange/${mailboxID}/outbox/${messageID}/${chunk}`;
    } else {
      fullUrl = `${url}/messageexchange/${mailboxID}/outbox`;
    }

    let headers = await generateHeaders(
      mailboxID,
      mailboxPassword,
      mailboxTarget
    );
    headers["mex-chunk-range"] = `${chunk}:${fileCount}`;
    headers["content-encoding"] = "gzip";
    log.debug(headers);

    let config = { headers: headers };
    if (tlsEnabled) {
      config.httpsAgent = agent;
    }

    let chunkedFilePath = `output/chunk_${chunk}.gzip`;
    let fileContent = fs.readFileSync(chunkedFilePath);
    // log.debug(chunkedFilePath);

    let response = await axios.post(fullUrl, fileContent, config);
    try {
      if (response.status === 202) {
        // log.debug(`Create chunk ${chunk} successful: ${response.status}`);
        // log.debug(response);
        log.info("Chunk created successfully");
        if (messageID) {
        } else {
          messageID = response.data["message_id"];
          response = response.data;
        }
      } else {
        console.error(
          "ERROR: Request 'sendMessageChunks' completed but responded with incorrect status: " +
            response.status
        );
        process.exit(1);
      }
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
  return axiosResponse;
}

export default sendMessageChunks;
