export const encodeStringToBigInt = (str: string) => {
  let codeArr: string[] = [];
  let numChars = str.length > 31 ? 31 : str.length;
  for (let i = 0; i < numChars; i++) {
    let charCode = str.charCodeAt(i);
    if (charCode > 255) {
      console.error('string contains non-ascii characters');
      codeArr.push('00');
    } else {
      let hex = Number(charCode).toString(16);
      codeArr.push(hex);
    }
  }
  let hex = `0x${codeArr.join('')}`;
  return BigInt(hex);
};
