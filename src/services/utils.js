import axios from "axios";

function isValidCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, ""); // Remove non-digits
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false; //checks if the length is different from 11 or if all digits are the same
  cpf = cpf.split(""); //Transforms the string into an array

  // Calculate the first check digit
  const firstCheckDigit = cpf.slice(0, 9).reduce((acc, digit, index) => {
    return acc + parseInt(digit) * (10 - index);
  }, 0);
  let firstRemainder = (firstCheckDigit * 10) % 11;
  firstRemainder =
    firstRemainder === 10 || firstRemainder === 11 ? 0 : firstRemainder;

  // Calculate the second check digit
  const secondCheckDigit = cpf.slice(0, 10).reduce((acc, digit, index) => {
    return acc + parseInt(digit) * (11 - index);
  }, 0);
  let secondRemainder = (secondCheckDigit * 10) % 11;
  secondRemainder =
    secondRemainder === 10 || secondRemainder === 11 ? 0 : secondRemainder;

  return (
    firstRemainder === parseInt(cpf[9]) && secondRemainder === parseInt(cpf[10])
  ); // Check if calculated check digits match the provided ones
}

function isValidCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]+/g, ""); // Remove non-digits

  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false; //checks if the length is different from 14 or if all digits are the same
  cnpj = cnpj.split(""); //Transforms the string into an array

  let size = cnpj.length - 2;
  let numbers = cnpj.slice(0, size);
  const digits = cnpj.slice(size); //get the check digits

  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += numbers[size - i] * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11); // Calculate the first check digit

  if (result != parseInt(digits[0])) return false;

  size = size + 1;
  numbers = cnpj.slice(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += numbers[size - i] * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11); // Calculate the second check digit

  if (result != parseInt(digits[1])) return false; // Check if calculated check digits match the provided ones

  return true;
}

async function getAddressFromCEP(cep) {
  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    if (response.data.erro) {
      return null; // Indicate that the CEP was not found
    }
    return response.data; // Return the address data
  } catch (error) {
    console.error("Error fetching address from ViaCEP:", error);
    return null; // Handle network or other errors
  }
}

export { isValidCPF, isValidCNPJ, getAddressFromCEP };
