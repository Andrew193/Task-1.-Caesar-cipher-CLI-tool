import { Command } from 'commander';
import { createReadStream, createWriteStream } from 'node:fs';
import Stream, { Transform } from "stream"
import { StringDecoder } from 'string_decoder';

process.stdin.setRawMode(true)
process.stdin.resume()

const program = new Command();
program.option('-s, --shift <type>', 'a shift',)
  .option('-i, --input <type>', 'an input file',)
  .option('-o, --output <type>', 'an output file',)
  .option('-a, --action <type>', 'an action encode/decode')

program.parse();

if (!program.opts().action || !program.opts().shift) {
  process.stderr.write("Action(-a) and shift(-s) is required");
  process.exit(1);
}

class UppercaseCharacters extends Transform {
  constructor(options) {
    super(options)
    this.message = []
    // The stream will have Buffer chunks. The
    // decoder converts these to String instances.
    this._decoder = new StringDecoder('utf-8')
  }

  _transform(chunk, encoding, callback) {
    // Convert the Buffer chunks to String.
    if (encoding === 'buffer') {
      chunk = this._decoder.write(chunk)
    }

    // Exit on CTRL + C.
    if (chunk === '\u0003') {
      process.stdout.write(this.message.join(""))
      process.exit()
    }

    // Uppercase lowercase letters.
    if (program.opts().action === "encode") {
      if (chunk >= 'A' && chunk <= 'Z') {
        chunk = String.fromCharCode(chunk.charCodeAt(0) + 1);
        (chunk >= '[') && (chunk = String.fromCharCode(64 + (chunk.charCodeAt(0) - 90)))
      }
      if (chunk >= 'a' && chunk <= 'z') {
        chunk = String.fromCharCode(chunk.charCodeAt(0) + 1);
        (chunk >= '{') && (chunk = String.fromCharCode(97 + (chunk.charCodeAt(0) - 122)))
      }
    } else if(program.opts().action === "decode"){
      if (chunk >= 'A' && chunk <= 'Z') {
        chunk = String.fromCharCode(chunk.charCodeAt(0) - 1);
        (chunk <= '@') && (chunk = String.fromCharCode(90 - (64-chunk.charCodeAt(0))))
      }
      if (chunk >= 'a' && chunk <= 'z') {
        chunk = String.fromCharCode(chunk.charCodeAt(0) - 1);
        (chunk <= '`') && (chunk = String.fromCharCode(122 - (97-chunk.charCodeAt(0))+1))
      }
    }
    this.message.push(chunk)
    console.log(this.message.join(""));
    // Pass the chunk on.
    callback(null, chunk)
  }
}

Stream.pipeline(
  program.opts().input ? createReadStream(program.opts().input, { encoding: "utf-8" }) : process.stdin,
  new UppercaseCharacters(),
  program.opts().output ? createWriteStream(program.opts().output) : process.stdout,
  (err) => {
    if (err) {
      process.stderr("Faild to read or write")
      process.exit(1);
    }
  }
)
let r = `Ctrl + C to exit`


