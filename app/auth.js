// app/auth.js
export const verifyTokenAndGetRole = async (token) => {
  if (!token) return null;

  try {
    const response = await fetch("http://localhost:8000/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Invalid token");
    }

    const userData = await response.json();
    return userData.role; // Le rôle est renvoyé par l'endpoint /users/me
  } catch (e) {
    console.error("Error verifying token:", e);
    return null;
  }
};

export const protectRoute = async (token, requiredRole) => {
  const role = await verifyTokenAndGetRole(token);
  if (!role) return false;
  return role === requiredRole;
};