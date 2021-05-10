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
      process.stdout.write("Text: "+this.message.join(""))
      process.exit()
    }

    let temp=""
    // Uppercase lowercase letters.
    const shift=+program.opts().shift;
    for (let i = 0; i <chunk.length; i++) {
      if (program.opts().action === "encode") {
        if (chunk[i] >= 'A' && chunk[i] <= 'Z') {
          temp = String.fromCharCode(chunk[i].charCodeAt(0) + shift);
          (temp >= '[') && (temp = String.fromCharCode(64 + (temp.charCodeAt(0) - 90)))
        }
        if (chunk[i] >= 'a' && chunk[i] <= 'z') {
          temp = String.fromCharCode(chunk[i].charCodeAt(0) + shift);
          (temp >= '{') && (temp = String.fromCharCode(97 + (temp.charCodeAt(0) - 122)))
        }
      } else if(program.opts().action === "decode"){
        if (chunk[i] >= 'A' && chunk[i] <= 'Z') {
          temp = String.fromCharCode(chunk[i].charCodeAt(0) - shift);
          (temp <= '@') && (temp = String.fromCharCode(90 - (64-temp.charCodeAt(0))))
        }
        if (chunk[i] >= 'a' && chunk[i] <= 'z') {
          temp = String.fromCharCode(chunk[i].charCodeAt(0) - shift);
          (temp <= '`') && (temp = String.fromCharCode(122 - (97-temp.charCodeAt(0))+1))
        }
      }
      this.message.push(temp)
    }
    // Pass the chunk on.
    callback(null, '')
  }
}

Stream.pipeline(
  program.opts().input ? createReadStream(program.opts().input, { encoding: "utf-8" }) : process.stdin,
  new UppercaseCharacters(),
  program.opts().output ? createWriteStream(program.opts().output) : process.stdout,
  (err) => {
    if (err) {
      process.stderr.write("Failed to write or read")
      process.exit(1);
    }
  }
)



