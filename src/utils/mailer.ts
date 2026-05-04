import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import type { MailOptions } from "../types/authTypes.js";

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
})

export const sendMail = async (opts: MailOptions) => {
    const info = await transporter.sendMail({
        from: env.SMTP_FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text
    })
    console.log("Email Gönderildi")
    return info
}

export const safeSendEmail = async ( opts:MailOptions) => {
    try {
        return await sendMail(opts)
    } catch (error) {
        console.error("Email Gönderme hatası", error)
        return null
    }
}