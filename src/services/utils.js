function isValidCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, ""); // Remove non-digits
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  cpf = cpf.split("");

  const firstCheckDigit = cpf.slice(0, 9).reduce((acc, digit, index) => {
    return acc + parseInt(digit) * (10 - index);
  }, 0);
  let firstRemainder = (firstCheckDigit * 10) % 11;
  firstRemainder =
    firstRemainder === 10 || firstRemainder === 11 ? 0 : firstRemainder;

  const secondCheckDigit = cpf.slice(0, 10).reduce((acc, digit, index) => {
    return acc + parseInt(digit) * (11 - index);
  }, 0);
  let secondRemainder = (secondCheckDigit * 10) % 11;
  secondRemainder =
    secondRemainder === 10 || secondRemainder === 11 ? 0 : secondRemainder;

  return (
    firstRemainder === parseInt(cpf[9]) && secondRemainder === parseInt(cpf[10])
  );
}

function isValidCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]+/g, ""); // Remove non-digits

  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false;
  cnpj = cnpj.split("");

  let size = cnpj.length - 2;
  let numbers = cnpj.slice(0, size);
  const digits = cnpj.slice(size);

  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += numbers[size - i] * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  if (result != parseInt(digits[0])) return false;

  size = size + 1;
  numbers = cnpj.slice(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += numbers[size - i] * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  if (result != parseInt(digits[1])) return false;

  return true;
}

// REMOVE THIS FUNCTION:
// async function getAddressFromCEP(cep) { ... }

export { isValidCPF, isValidCNPJ };
