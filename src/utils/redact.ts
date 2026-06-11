import fastRedact from "fast-redact";

const redact = fastRedact({
  paths: [
    "password",
    "newPassword",
    "confirmPassword",
    "token",
    "accessToken",
    "refreshToken",
    "currentPassword",
    "authorization",
    "*.password",
  ],
  censor: "**********",
});

export const maskSensitive = (data: unknown) => {
  if (!data || typeof data !== "object") return data;
  return JSON.parse(redact(data) as string);
};
