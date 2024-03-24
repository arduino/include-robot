const STDOUT_SIZE = 50_000; // how many chars to show in the textarea

const tail = (str) => {
  return str ? str.slice(-1 * STDOUT_SIZE) : ''
}



export default tail