import http from "./http";

export const adminLogin = async ({ phone, password }) => {
  const { data } = await http.post("/auth/admin-login", { phone, password });
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await http.put("/auth/update-profile", payload);
  return data;
};
