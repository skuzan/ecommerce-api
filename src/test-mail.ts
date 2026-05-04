import { resetPasswordTemplate, verifyEmailTemplate } from "./utils/emailTemplates.js";
import { sendMail } from "./utils/mailer.js";


await sendMail({
    to: "test@test.com",
    subject: "Test MAil 1",
    html: verifyEmailTemplate("a".repeat(64))
})

await sendMail({
    to: "test@test.com",
    subject: "Test MAil 1",
    html: resetPasswordTemplate("a".repeat(64))
})


console.log("Mailler gönderildi")