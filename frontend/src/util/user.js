export const getUser = async () => {
  try {
    const response = await fetch("/api/users/me", {
      method: "GET",
      credentials: "include",
    });
    const data = response.json();
    console.log(data);
    
    return data;
  } catch (error) {
    console.error(error);
  }
};
