export const fetchAddressByCep = async (cep: string) => {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();
    if (data.erro) return null;
    return {
      address: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
      zipCode: cep // Keep the formatted CEP
    };
  } catch (error) {
    console.error("Error fetching CEP:", error);
    return null;
  }
};
