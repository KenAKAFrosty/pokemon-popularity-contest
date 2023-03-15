const sid = import.meta.env.VITE_TWILIO_ACCOUNT_SID || process.env.VITE_TWILIO_ACCOUNT_SID;
const token = import.meta.env.VITE_TWILIO_AUTH_TOKEN || process.env.VITE_TWILIO_AUTH_TOKEN;

const verificationServiceSid = "VAf7dd8eaf72cf9f5de9883cfdf85f5ee3"
const defaultHeaders = {
    "Authorization": `Basic ${btoa(`${sid}:${token}`)})`,
    "content-type": "application/x-www-form-urlencoded"
}

export async function sendToken(phoneNumber: string) {
    const url = new URL(`https://verify.twilio.com/v2/Services/${verificationServiceSid}/Verifications/`);
    const body = new URLSearchParams();
    body.append("To", phoneNumber);
    body.append("Channel", "sms");
    return await fetch(url.toString(), {
        headers: defaultHeaders,
        method: "POST",
        body
    }).then(raw => raw.json());
}

export async function checkToken(inputs: {
    phoneNumber: string,
    code: string
}) {
    const url = new URL("https://verify.twilio.com/v2/Services/VAf7dd8eaf72cf9f5de9883cfdf85f5ee3/VerificationCheck");
    const verificationBody = new URLSearchParams();
    verificationBody.append("To", inputs.phoneNumber);
    verificationBody.append("Code", inputs.code)
    return await fetch(url.toString(), {
        headers: defaultHeaders,
        method: "POST",
        body: verificationBody
    }).then(raw => raw.json());
}


