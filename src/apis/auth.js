import http from "./http";

export const adminLogin = async ({ phone, password }) => {
  const { data } = await http.post("/auth/admin-login", { phone, password });
  return data;
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const { data } = await http.post("/admin/change-password", {
    currentPassword,
    newPassword,
  });
  return data;
};
