import { Command } from 'commander';
import { createReadStream, createWriteStream } from 'node:fs';
import Stream from "stream"
const program = new Command();
program
  .option('-s, --shift <type>', 'a shift',)
  .option('-i, --input <type>', 'an input file',)
  .option('-o, --output <type>', 'an output file',)
  .option('-a, --action <type>', 'an action encode/decode')

program.parse();

if (!program.opts().action || !program.opts().shift) {
  process.stderr.write("Action(-a) and shift(-s) is required");
  process.exit(1);
}

Stream.pipeline(
  program.opts().input ? createReadStream(program.opts().input, { encoding: "utf-8" }) : process.stdin,
  //Как добавить обработчик
  program.opts().output ? createWriteStream(program.opts().output) : process.stdout,
  (err) => {
    if (err) {
      process.stderr("Faild to read or write")
      process.exit(1);
    }
  }
)
let r=`Ctrl + C to exit`